#!/usr/bin/env node
'use strict';

/**
 * C语言冒险岛 · 本地一键发布到 GitHub
 *
 * 做四件事：
 *   1. 读 resources/app/version.json（可选自动递增版本号并写回）
 *   2. 纯 Node 流式打 zip -> C.v{version}.zip（零依赖，不需要 Python / 7-Zip）
 *   3. 回读断言压缩包内容，确认包内 version.json 版本号正确且没有多套一层文件夹
 *   4. 调 GitHub API 建 Release + 上传 Asset（带进度条），支持覆盖同名 Asset
 *
 * 用法（直接双击 ..\..\发布新版本.bat 也可以）：
 *   node publish.js                     发布 version.json 里的版本
 *   node publish.js --bump patch        先把补丁号 +1 再发布（minor / major 同理）
 *   node publish.js --dry-run           只打包和校验，不碰 GitHub
 *   node publish.js --no-git            跳过同步仓库 / 提交 / push
 *   node publish.js --notes a.md        用指定文件作为 Release 更新日志
 *   node publish.js --help
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const https = require('https');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { Transform } = require('stream');

// ---------------------------------------------------------------------------
// 路径
// ---------------------------------------------------------------------------
const HERE = __dirname;
const REPO_ROOT = path.resolve(HERE, '..');
const DEFAULT_INSTALL_ROOT = path.resolve(HERE, '..', '..');
const REPO_SLUG = 'Ragearcher/C-';
const EXE_NAME = 'C++ 冒险岛.exe';
const MANIFEST_REL = 'resources/app/version.json';
const NOTES_FILE = path.join(HERE, 'release-notes.md');

// 不进压缩包的顶层条目（与 pack-release.py 的规则保持一致）
const EXCLUDE_TOP = new Set([
  'C语言冒险岛', 'tools', 'desktop.ini', 'Thumbs.db',
  '发布新版本.bat', 'publish-config.json', 'publish-config.json.example', '.env'
]);
const EXCLUDE_SUFFIX = ['.zip', '.lnk', '.tmp', '.log'];

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m',
  green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m'
};
const say = (...a) => console.log(...a);
const ok = (m) => say(`${C.green}  [通过]${C.reset} ${m}`);
const bad = (m) => say(`${C.red}  [失败]${C.reset} ${m}`);
const warn = (m) => say(`${C.yellow}  [警告]${C.reset} ${m}`);
const step = (m) => say(`\n${C.bold}${m}${C.reset}`);
const human = (n) => {
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return n.toFixed(i === 0 ? 0 : 1) + ' ' + u[i];
};

class Fail extends Error {}

// ---------------------------------------------------------------------------
// 参数
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const a = {
    bump: null, dryRun: false, noGit: false, notes: null,
    root: DEFAULT_INSTALL_ROOT, rootExplicit: false, force: false, skipBuild: false,
    set: null, syncVersion: false, allowRepublish: false
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--bump') a.bump = String(argv[++i] || '').toLowerCase();
    else if (t === '--set') a.set = String(argv[++i] || '').replace(/^v/i, '');
    else if (t === '--notes') a.notes = argv[++i];
    else if (t === '--root') { a.root = path.resolve(argv[++i]); a.rootExplicit = true; }
    else if (t === '--dry-run') a.dryRun = true;
    else if (t === '--no-git') a.noGit = true;
    else if (t === '--yes' || t === '-y') a.force = true;
    else if (t === '--sync-version') a.syncVersion = true;
    else if (t === '--allow-republish') a.allowRepublish = true;
    else if (t === '--help' || t === '-h') { usage(); process.exit(0); }
    else if (t === '--no-build') a.skipBuild = true;
    else { bad('未知参数：' + t); usage(); process.exit(2); }
  }
  if (a.bump && !['patch', 'minor', 'major'].includes(a.bump)) {
    bad('--bump 只支持 patch / minor / major');
    process.exit(2);
  }
  if (a.set && !/^\d+\.\d+\.\d+$/.test(a.set)) {
    bad('--set 需要 x.y.z 形式的版本号');
    process.exit(2);
  }
  if (a.set && a.bump) { bad('--set 和 --bump 不能同时用'); process.exit(2); }
  return a;
}

function usage() {
  say(`
${C.bold}C语言冒险岛 · 一键发布${C.reset}

  node publish.js              不带参数时进入交互菜单（双击 .bat 就是这个）
  node publish.js [选项]

  --bump patch|minor|major  先把版本号递增并写回 version.json 再发布
  --set x.y.z               只把版本号写成指定值后退出（用于把本地改回测试基线）
  --sync-version            把本地版本号对齐线上最新 Release 后退出
  --allow-republish         允许发布一个线上已经存在的版本号（只覆盖 asset）
  --dry-run                 只打包 + 校验，不调 GitHub API
  --no-git                  跳过同步仓库 / 提交 / push
  --no-build                复用已有 zip，不重新打包
  --notes <文件>            用该文件内容作为 Release 更新日志
  --root <目录>             指定游戏根目录（默认自动推断）
  -y, --yes                 同名 Asset 直接覆盖，不再询问
  -h, --help                显示本帮助

Token 配置（按优先级，取第一个命中的）：
  1) 环境变量 GITHUB_TOKEN
  2) ${path.join(DEFAULT_INSTALL_ROOT, 'publish-config.json')}
  3) ${path.join(DEFAULT_INSTALL_ROOT, '.env')}
`);
}

// ---------------------------------------------------------------------------
// 版本号
// ---------------------------------------------------------------------------
function readManifest(root) {
  const p = path.join(root, MANIFEST_REL);
  if (!fs.existsSync(p)) throw new Fail('找不到 ' + p);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!j.version || !j.tag) throw new Fail('version.json 缺少 version 或 tag 字段');
  return { file: p, data: j };
}

// 顺手把 resources/app/package.json 的 version 也对齐，避免以后分不清手上这份是哪一版
function writePackageVersion(root, version) {
  const p = path.join(root, 'resources', 'app', 'package.json');
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (j.version === version) return;
    j.version = version;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
    ok('已把 resources/app/package.json 版本同步为 ' + version);
  } catch (e) {
    warn('同步 package.json 版本失败（不影响发布）：' + (e && e.message ? e.message : String(e)));
  }
}

function bumpVersion(v, kind) {  const m = String(v).replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) throw new Fail('版本号格式不是 x.y.z：' + v);
  let [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (kind === 'major') { maj++; min = 0; pat = 0; }
  else if (kind === 'minor') { min++; pat = 0; }
  else { pat++; }
  return `${maj}.${min}.${pat}`;
}

// a < b ？
function semverLess(a, b) {
  const p = (v) => {
    const m = String(v || '').replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  };
  const x = p(a), y = p(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
}

// ---------------------------------------------------------------------------
// ZIP 写入（流式，只用内置 zlib）
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf, crc = 0) {
  let c = ~crc;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function dosStamp(d) {
  const time = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff;
  const date = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
  return { time, date };
}

class ZipWriter {
  constructor(outPath) {
    this.out = fs.createWriteStream(outPath);
    this.pos = 0;
    this.entries = [];
    this.nameBuf = Buffer.alloc(0);
  }

  _write(buf) {
    this.pos += buf.length;
    if (!this.out.write(buf)) {
      return new Promise((r) => this.out.once('drain', r));
    }
    return Promise.resolve();
  }

  async addFile(name, absPath) {
    const st = fs.statSync(absPath);
    const { time, date } = dosStamp(st.mtime);
    const nameBuf = Buffer.from(name, 'utf8');
    const offset = this.pos;

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);          // version needed
    lh.writeUInt16LE(0x0808, 6);      // bit3 数据描述符 + bit11 UTF-8 文件名
    lh.writeUInt16LE(8, 8);           // deflate
    lh.writeUInt16LE(time, 10);
    lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(0, 14);          // crc 占位
    lh.writeUInt32LE(0, 18);          // csize 占位
    lh.writeUInt32LE(0, 22);          // usize 占位
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    await this._write(lh);
    await this._write(nameBuf);

    let crc = 0, usize = 0, csize = 0;
    const rs = fs.createReadStream(absPath, { highWaterMark: 1 << 20 });
    const c1 = new Transform({ transform: (c, _e, cb) => { crc = crc32(c, crc); usize += c.length; cb(null, c); } });
    const c2 = new Transform({ transform: (c, _e, cb) => { csize += c.length; cb(null, c); } });
    const def = zlib.createDeflateRaw({ level: 6 });
    await new Promise((resolve, reject) => {
      const fail = (e) => reject(e);
      rs.on('error', fail); def.on('error', fail); c1.on('error', fail); c2.on('error', fail);
      c2.on('end', resolve);
      rs.pipe(c1).pipe(def).pipe(c2).pipe(this.out, { end: false });
    });
    // 压缩后的数据是直接 pipe 进输出流的，绕过了 _write，必须手动计入偏移
    this.pos += csize;

    const dd = Buffer.alloc(16);
    dd.writeUInt32LE(0x08074b50, 0);
    dd.writeUInt32LE(crc, 4);
    dd.writeUInt32LE(csize, 8);
    dd.writeUInt32LE(usize, 12);
    await this._write(dd);

    this.entries.push({ name: nameBuf, crc, csize, usize, offset, time, date });
  }

  async addContent(name, content, mtime) {
    const tmp = path.join(os.tmpdir(), 'cai-pub-' + crypto.randomBytes(6).toString('hex'));
    fs.writeFileSync(tmp, content);
    try {
      const st = fs.statSync(tmp);
      if (mtime) fs.utimesSync(tmp, mtime, mtime);
      await this.addFile(name, tmp);
    } finally {
      try { fs.unlinkSync(tmp); } catch (e) {}
    }
  }

  async finish() {
    const cdStart = this.pos;
    for (const e of this.entries) {
      const h = Buffer.alloc(46);
      h.writeUInt32LE(0x02014b50, 0);
      h.writeUInt16LE(0x031e, 4);       // made by: unix + zip 3.0
      h.writeUInt16LE(20, 6);
      h.writeUInt16LE(0x0808, 8);
      h.writeUInt16LE(8, 10);
      h.writeUInt16LE(e.time, 12);
      h.writeUInt16LE(e.date, 14);
      h.writeUInt32LE(e.crc >>> 0, 16);
      h.writeUInt32LE(e.csize >>> 0, 20);
      h.writeUInt32LE(e.usize >>> 0, 24);
      h.writeUInt16LE(e.name.length, 28);
      h.writeUInt16LE(0, 30);
      h.writeUInt16LE(0, 32);
      h.writeUInt16LE(0, 34);
      h.writeUInt16LE(0, 36);
      // 注意 >>> 0：0o100644 << 16 会溢出成负数（int32），直接写会抛 ERR_OUT_OF_RANGE
      h.writeUInt32LE((0o100644 << 16) >>> 0, 38);
      h.writeUInt32LE(e.offset >>> 0, 42);
      await this._write(h);
      await this._write(e.name);
    }
    const cdSize = this.pos - cdStart;
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(this.entries.length, 8);
    eocd.writeUInt16LE(this.entries.length, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdStart, 16);
    eocd.writeUInt16LE(0, 20);
    await this._write(eocd);
    await new Promise((r, j) => this.out.end((e) => (e ? j(e) : r())));
    return { size: this.pos, count: this.entries.length };
  }
}

// ---------------------------------------------------------------------------
// ZIP 读取（只用于回读校验）
// ---------------------------------------------------------------------------
function readZip(zipPath) {
  const fd = fs.openSync(zipPath, 'r');
  let entries;
  try {
    const size = fs.fstatSync(fd).size;
    const tailLen = Math.min(size, 66000);
    const tail = Buffer.alloc(tailLen);
    fs.readSync(fd, tail, 0, tailLen, size - tailLen);
    let e = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50) { e = i; break; }
    }
    if (e < 0) throw new Fail('压缩包尾部找不到中央目录结束记录');
    const total = tail.readUInt16LE(e + 10);
    const cdSize = tail.readUInt32LE(e + 12);
    const cdOff = tail.readUInt32LE(e + 16);
    const cd = Buffer.alloc(cdSize);
    fs.readSync(fd, cd, 0, cdSize, cdOff);

    entries = [];
    let p = 0;
    for (let i = 0; i < total; i++) {
      if (cd.readUInt32LE(p) !== 0x02014b50) throw new Fail('中央目录第 ' + i + ' 项签名不对');
      const method = cd.readUInt16LE(p + 10);
      const crc = cd.readUInt32LE(p + 16);
      const csize = cd.readUInt32LE(p + 20);
      const usize = cd.readUInt32LE(p + 24);
      const nameLen = cd.readUInt16LE(p + 28);
      const extraLen = cd.readUInt16LE(p + 30);
      const cmtLen = cd.readUInt16LE(p + 32);
      const offset = cd.readUInt32LE(p + 42);
      const name = cd.slice(p + 46, p + 46 + nameLen).toString('utf8');
      entries.push({ name, method, crc, csize, usize, offset });
      p += 46 + nameLen + extraLen + cmtLen;
    }
  } finally {
    fs.closeSync(fd);
  }

  return {
    entries,
    names: entries.map((x) => x.name),
    // 每次读取单独开一个句柄，避免外层句柄已关闭
    read(name) {
      const it = entries.find((x) => x.name === name);
      if (!it) return null;
      const h = fs.openSync(zipPath, 'r');
      try {
        const lh = Buffer.alloc(30);
        fs.readSync(h, lh, 0, 30, it.offset);
        if (lh.readUInt32LE(0) !== 0x04034b50) throw new Fail(name + ' 的本地文件头签名不对');
        const nl = lh.readUInt16LE(26), el = lh.readUInt16LE(28);
        const raw = Buffer.alloc(it.csize);
        fs.readSync(h, raw, 0, it.csize, it.offset + 30 + nl + el);
        const data = it.method === 0 ? raw : zlib.inflateRawSync(raw);
        if (data.length !== it.usize) throw new Fail(name + ' 解压后长度不符');
        return data;
      } finally {
        fs.closeSync(h);
      }
    }
  };
}

// ---------------------------------------------------------------------------
// 打包
// ---------------------------------------------------------------------------
function collectFiles(root) {
  const files = [];
  const walk = (dir) => {
    const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const it of items) {
      const abs = path.join(dir, it.name);
      const rel = path.relative(root, abs).split(path.sep).join('/');
      if (it.isDirectory()) {
        if (rel.split('/').length === 1 && EXCLUDE_TOP.has(rel)) continue;
        walk(abs);
      } else {
        const top = rel.split('/')[0];
        if (EXCLUDE_TOP.has(top)) continue;
        if (EXCLUDE_TOP.has(it.name)) continue;
        if (EXCLUDE_SUFFIX.some((s) => it.name.toLowerCase().endsWith(s))) continue;
        files.push({ abs, rel });
      }
    }
  };
  walk(root);
  return files;
}

function manifestText(tag) {
  return JSON.stringify({
    version: String(tag).replace(/^v/i, ''),
    tag,
    githubRepo: REPO_SLUG
  });
}

async function buildZip(root, tag, outZip) {
  const files = collectFiles(root);
  let raw = 0;
  for (const f of files) raw += fs.statSync(f.abs).size;
  say(`    待打包 ${files.length} 个文件，原始 ${human(raw)}`);
  say(`    ${C.dim}排除：开发仓库目录 / .git / tools / 发布脚本 / 配置文件 / 已有 zip${C.reset}`);

  const zw = new ZipWriter(outZip);
  const t0 = Date.now();
  let done = 0;
  for (const f of files) {
    if (f.rel === MANIFEST_REL) {
      await zw.addContent(f.rel, manifestText(tag));
    } else {
      await zw.addFile(f.rel, f.abs);
    }
    done++;
    const pct = Math.round((done / files.length) * 100);
    process.stdout.write(`\r    打包中 ${String(pct).padStart(3)}%  ${String(done).padStart(4)}/${files.length}  ${C.dim}${f.rel.slice(0, 52)}${C.reset}   `);
  }
  const res = await zw.finish();
  process.stdout.write('\r' + ' '.repeat(90) + '\r');
  const secs = (Date.now() - t0) / 1000;
  say(`    压缩完成：${res.count} 个条目，${human(res.size)}，耗时 ${secs.toFixed(1)}s`);
  return res;
}

function verifyZip(zipPath, tag) {
  let good = true;
  const z = readZip(zipPath);

  if (z.names.includes(MANIFEST_REL)) ok('包内存在 ' + MANIFEST_REL);
  else { bad('包内缺少 ' + MANIFEST_REL); return false; }

  let m = null;
  try { m = JSON.parse(z.read(MANIFEST_REL).toString('utf8')); }
  catch (e) { bad('包内 version.json 无法解析：' + e.message); return false; }

  if (m.tag === tag) ok(`包内版本号 = ${m.tag}`);
  else { bad(`包内版本号 = ${m.tag}，目标 ${tag}`); good = false; }

  if (m.version === String(tag).replace(/^v/i, '')) ok(`包内 version = ${m.version}`);
  else { bad(`包内 version = ${m.version} 与 tag 不匹配`); good = false; }

  const nested = z.names.filter((n) => n.startsWith('C语言冒险岛/') || n.startsWith('C语言冒险岛\\'));
  if (nested.length) { bad(`包内多套了一层文件夹（${nested.length} 个条目），这正是之前更新失败的元凶`); good = false; }
  else ok('包内没有多套一层文件夹');

  if (z.names.includes(EXE_NAME)) ok(`包内存在 ${EXE_NAME}`); else { bad(`包内缺少 ${EXE_NAME}`); good = false; }
  if (z.names.some((n) => n.startsWith('resources/app/'))) ok('包内存在 resources/app/ 目录结构');
  else { bad('包内缺少 resources/app/ 目录结构'); good = false; }

  const junk = z.names.filter((n) => /(^|\/)\.git\//.test(n) || n.toLowerCase().endsWith('.zip'));
  if (junk.length) { bad(`包内混入了 ${junk.length} 个垃圾条目，例如 ${junk[0]}`); good = false; }
  else ok('包内没有 .git / 多余 zip');

  // 压平断言：exe 和 resources/app/version.json 都必须恰好出现一次、且位于包根目录。
  // 出现两次就说明压缩时把外层目录一起打进去了（「套娃」），解压后会覆盖到错误的位置。
  const exeHits = z.names.filter((n) => n === EXE_NAME || n.endsWith('/' + EXE_NAME));
  if (exeHits.length === 1 && exeHits[0] === EXE_NAME) ok(`${EXE_NAME} 恰好一份且位于包根目录`);
  else { bad(`包内 ${EXE_NAME} 出现 ${exeHits.length} 次：${JSON.stringify(exeHits)}`); good = false; }

  const manifestHits = z.names.filter((n) => n.endsWith('resources/app/version.json'));
  if (manifestHits.length === 1 && manifestHits[0] === MANIFEST_REL) ok('resources/app/version.json 恰好一份且位于包根目录');
  else { bad(`包内 version.json 出现 ${manifestHits.length} 次：${JSON.stringify(manifestHits)}`); good = false; }

  const deep = z.names.filter((n) => n.split('/').length > 5);
  if (deep.length) { bad(`包内存在过深层级（${deep.length} 个），例如 ${deep[0]}`); good = false; }
  else ok('包内层级正常，没有多余的嵌套目录');

  return good;
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------
function loadToken(root) {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) {
    return { token: process.env.GITHUB_TOKEN.trim(), from: '环境变量 GITHUB_TOKEN' };
  }
  const cfgPath = path.join(root, 'publish-config.json');
  if (fs.existsSync(cfgPath)) {
    try {
      const j = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      const t = (j.token || j.githubToken || '').trim();
      if (t) return { token: t, from: cfgPath };
    } catch (e) { warn('publish-config.json 解析失败：' + e.message); }
  }
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf8').match(/^\s*GITHUB_TOKEN\s*=\s*["']?([^"'\r\n]+)/m);
    if (m && m[1].trim()) return { token: m[1].trim(), from: envPath };
  }
  return null;
}

// ---------------------------------------------------------------------------
// GitHub API
// ---------------------------------------------------------------------------
function apiHeaders(token) {
  return {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'C-Adventure-Island-Publisher',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

// 统一用 https.request，不用全局 fetch：
// fetch 走 undici 连接池，进程退出时在 Windows 上会偶发 libuv 断言，很吵。
function httpsJson(method, urlStr, token, bodyObj) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = bodyObj === undefined ? null : Buffer.from(JSON.stringify(bodyObj), 'utf8');
    const headers = apiHeaders(token);
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = payload.length;
    }
    const req = https.request({
      method, hostname: u.hostname, port: 443, path: u.pathname + u.search, headers
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let body = null;
        try { body = data ? JSON.parse(data) : null; } catch (e) { body = data; }
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, body });
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('请求超时')));
    if (payload) req.write(payload);
    req.end();
  });
}

const brief = (b) => (typeof b === 'string' ? b : JSON.stringify(b));

async function ensureRelease(tag, token, notes) {
  const existing = await httpsJson('GET', `https://api.github.com/repos/${REPO_SLUG}/releases/tags/${tag}`, token);
  if (existing.status === 200) {
    const rel = existing.body;
    const wantName = `C语言冒险岛 ${tag}`;
    // 复用已有 Release 时也要把说明同步过去，否则更新日志永远不会生效
    const patch = {};
    if (notes && (rel.body || '') !== notes) patch.body = notes;
    if (rel.name !== wantName) patch.name = wantName;
    if (Object.keys(patch).length) {
      const up = await httpsJson('PATCH', `https://api.github.com/repos/${REPO_SLUG}/releases/${rel.id}`, token, patch);
      if (up.ok) { ok(`已更新 Release ${tag} 的说明`); return up.body; }
      warn(`更新 Release 说明失败：HTTP ${up.status} ${brief(up.body)}`);
    }
    ok(`Release ${tag} 已存在，将复用并覆盖同名 Asset`);
    return rel;
  }
  if (existing.status !== 404) {
    if (existing.status === 401) throw new Fail('Token 无效或已过期（HTTP 401），请重新生成一个 PAT');
    throw new Fail(`查询 Release 失败：HTTP ${existing.status} ${brief(existing.body)}`);
  }
  const created = await httpsJson('POST', `https://api.github.com/repos/${REPO_SLUG}/releases`, token, {
    tag_name: tag, name: `C语言冒险岛 ${tag}`, body: notes || '', draft: false, prerelease: false
  });
  if (!created.ok) {
    throw new Fail(`创建 Release 失败：HTTP ${created.status} ${brief(created.body)}`);
  }
  ok(`已创建 Release ${tag}`);
  return created.body;
}

async function deleteAsset(assetId, token) {
  const r = await httpsJson('DELETE', `https://api.github.com/repos/${REPO_SLUG}/releases/assets/${assetId}`, token);
  if (r.status !== 204 && r.status !== 200) {
    throw new Fail(`删除旧 Asset 失败：HTTP ${r.status} ${brief(r.body)}`);
  }
}

function uploadAsset(releaseId, token, filePath, assetName) {
  const size = fs.statSync(filePath).size;
  const url = `https://uploads.github.com/repos/${REPO_SLUG}/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`;
  const u = new URL(url);

  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      headers: Object.assign(apiHeaders(token), {
        'Content-Type': 'application/zip',
        'Content-Length': size
      })
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let body = null;
        try { body = JSON.parse(data); } catch (e) { body = data; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
        else reject(new Fail(`上传失败：HTTP ${res.statusCode} ${typeof body === 'string' ? body : JSON.stringify(body)}`));
      });
    });
    req.on('error', reject);
    req.setTimeout(0);

    const rs = fs.createReadStream(filePath, { highWaterMark: 1 << 20 });
    let sent = 0;
    const t0 = Date.now();
    let lastTick = 0;
    const counter = new Transform({
      transform: (c, _e, cb) => {
        sent += c.length;
        const now = Date.now();
        if (now - lastTick > 120 || sent === size) {
          lastTick = now;
          const pct = sent / size;
          const secs = Math.max(0.001, (now - t0) / 1000);
          const speed = sent / secs;
          const eta = speed > 0 ? (size - sent) / speed : 0;
          const bar = '█'.repeat(Math.round(pct * 28)).padEnd(28, '░');
          process.stdout.write(`\r    ${bar} ${String(Math.floor(pct * 100)).padStart(3)}%  ${human(sent)}/${human(size)}  ${human(speed)}/s  剩余 ${eta.toFixed(0)}s `);
        }
        cb(null, c);
      }
    });
    rs.on('error', reject);
    counter.on('error', reject);
    rs.pipe(counter).pipe(req);
    req.on('close', () => process.stdout.write('\n'));
  });
}

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------
function syncRepoPayload(root, tag) {
  const srcApp = path.join(root, 'resources', 'app');
  const dstApp = path.join(REPO_ROOT, 'C语言冒险岛', 'resources', 'app');
  const copyDir = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    for (const it of fs.readdirSync(from, { withFileTypes: true })) {
      const s = path.join(from, it.name), d = path.join(to, it.name);
      if (it.isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  };
  copyDir(srcApp, dstApp);
  fs.writeFileSync(path.join(dstApp, 'version.json'), manifestText(tag));
  const setup = path.join(root, 'setup.bat');
  if (fs.existsSync(setup)) fs.copyFileSync(setup, path.join(REPO_ROOT, 'C语言冒险岛', 'setup.bat'));
  ok('已把 resources/app 同步进仓库并写入版本 ' + tag);
}

function git(args, cwd) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 180000, windowsHide: true });
}

function gitFlow(tag) {
  const repo = REPO_ROOT;
  const st = git(['status', '--porcelain'], repo);
  if (st.status !== 0) { warn('git status 执行失败，跳过代码提交'); return false; }
  if (!st.stdout.trim()) { say('    仓库没有代码改动，跳过提交'); }
  else {
    const add = git(['add', '-A'], repo);
    if (add.status !== 0) { warn('git add 失败：' + add.stderr.trim()); return false; }
    const msg = `发布 ${tag}\n\n由 tools/publish.js 自动提交。\n`;
    const cm = git(['commit', '-m', msg], repo);
    if (cm.status !== 0) { warn('git commit 失败：' + (cm.stderr || cm.stdout).trim()); return false; }
    ok('已提交代码改动');
  }
  const ps = git(['push', 'origin', 'main'], repo);
  if (ps.status === 0) { ok('git push 成功'); return true; }
  warn('git push 失败（本机直连 github.com 不通，属预期）：');
  say('      ' + C.dim + (ps.stderr || ps.stdout || '').trim().split('\n').slice(-2).join('\n      ') + C.reset);
  say('      ' + C.dim + '可以在 GitHub Desktop 里点一下 Push，不影响 Release 发布。' + C.reset);
  return false;
}

// ---------------------------------------------------------------------------
// 游戏根目录解析
//
// 目录有嵌套（安装目录里放着 git 仓库，仓库里又跟踪了一份游戏副本），
// 所以绝不靠「猜」：按优先级取候选，逐个校验「同时含 exe 和 resources/app/version.json」，
// 第一个通过的才算数。全部不通过就直接报错，并告诉用户怎么显式配置。
// ---------------------------------------------------------------------------
function configInstallRoot() {
  const cfg = path.join(DEFAULT_INSTALL_ROOT, 'publish-config.json');
  try {
    const j = JSON.parse(fs.readFileSync(cfg, 'utf8'));
    const v = j.installRoot || j.gameRoot;
    return v ? path.resolve(v) : null;
  } catch (e) {
    return null;
  }
}

function looksLikeGameRoot(dir) {
  return fs.existsSync(path.join(dir, EXE_NAME)) && fs.existsSync(path.join(dir, MANIFEST_REL));
}

function resolveInstallRoot(args) {
  const cands = [];
  if (args.rootExplicit) cands.push({ from: '命令行 --root', dir: args.root });
  const cfgRoot = configInstallRoot();
  if (cfgRoot) cands.push({ from: 'publish-config.json 的 installRoot', dir: cfgRoot });
  cands.push({ from: '默认（仓库目录的上两级）', dir: DEFAULT_INSTALL_ROOT });

  const okOnes = cands.filter((c) => looksLikeGameRoot(c.dir));
  if (!okOnes.length) {
    say('');
    bad('找不到合法的游戏根目录。要求同时存在 ' + EXE_NAME + ' 和 ' + MANIFEST_REL + '，以下候选都不满足：');
    cands.forEach((c) => say('    - ' + c.dir + '   (' + c.from + ')'));
    say('');
    say('  请在下面这个文件里显式写死绝对路径（JSON 里反斜杠要写两个）：');
    say('    ' + path.join(DEFAULT_INSTALL_ROOT, 'publish-config.json'));
    say('    { "token": "...", "installRoot": "D:\\\\Tools\\\\C语言冒险岛" }');
    throw new Fail('游戏根目录未确定');
  }
  const picked = okOnes[0];
  if (okOnes.length > 1) {
    warn('有多个目录都像游戏根目录（存在嵌套），已按优先级选用最靠前的：');
    okOnes.forEach((c, i) => say('      ' + (i === 0 ? '-> ' : '   ') + c.dir + '   (' + c.from + ')'));
  }
  // 提醒：根目录里如果还嵌着同样结构的副本（安装目录里放 git 仓库的常见后果），
  // 明确说出来是哪个，避免误以为是「真正的游戏根目录」。
  const nested = [];
  const scan = (dir, depth) => {
    if (depth > 2) return;
    let items = [];
    try { items = fs.readdirSync(dir); } catch (e) { return; }
    for (const name of items) {
      const sub = path.join(dir, name);
      let isDir = false;
      try { isDir = fs.statSync(sub).isDirectory(); } catch (e) {}
      if (!isDir) continue;
      if (looksLikeGameRoot(sub)) nested.push(sub);
      else scan(sub, depth + 1);
    }
  };
  scan(picked.dir, 1);
  return { root: picked.dir, from: picked.from, nested };
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
async function interactiveMenu() {
  say('');
  say(`${C.bold}请选择要做什么：${C.reset}`);
  say('  ' + C.cyan + '1' + C.reset + ') 发布补丁版     版本号 +1 后发布（最常用）');
  say('  ' + C.cyan + '2' + C.reset + ') 发布当前版本   不改版本号，直接发布');
  say('  ' + C.cyan + '3' + C.reset + ') 只打包校验     不碰 GitHub');
  say('  ' + C.cyan + '4' + C.reset + ') 同步版本号     把本地版本号对齐线上最新版');
  say('  ' + C.cyan + '5' + C.reset + ') 还原测试基线   把本地版本号改回 1.0.0');
  say('  ' + C.cyan + '0' + C.reset + ') 退出');
  say('');
  const ans = (await ask('请输入序号后回车: ')).trim();
  if (ans === '1') return ['--bump', 'patch'];
  if (ans === '2') return [];
  if (ans === '3') return ['--dry-run'];
  if (ans === '4') return ['--sync-version'];
  if (ans === '5') return ['--set', '1.0.0'];
  if (ans === '0' || ans === '') return null;
  bad('无法识别的选项：' + ans);
  return null;
}

async function main(argv) {
  const args = parseArgs(argv);
  say(`${C.bold}C语言冒险岛 · 一键发布${C.reset}`);
  const rr = resolveInstallRoot(args);
  const root = rr.root;
  say('  游戏根目录: ' + root + C.dim + '   (' + rr.from + '，已校验)' + C.reset);
  say('  仓库目录  : ' + REPO_ROOT);
  if (rr.nested.length) {
    warn('注意：这个根目录里还嵌着一份同样结构的副本，打包时会自动排除：');
    rr.nested.forEach((n) => say('      ' + n));
    say('      ' + C.dim + '（这是 git 仓库跟踪的游戏副本，不是游戏真正运行的位置）' + C.reset);
  }

  // 1. 版本号
  step('[1/6] 读取版本号');
  const { file: vfile, data } = readManifest(root);
  let tag = data.tag;
  say(`    当前 version = ${data.version}，tag = ${tag}`);
  if (args.set) {
    data.version = args.set;
    data.tag = 'v' + args.set;
    fs.writeFileSync(vfile, JSON.stringify(data));
    writePackageVersion(root, args.set);
    ok(`已把版本号写成 ${data.tag}（${vfile}），未发布任何东西`);
    return;
  }
  // 先把「将要发布的版本号」算出来，但先不写回文件 ——
  // 万一后面的防重复校验拦下来，本地版本号不应该被改脏。
  let bumpPending = false;
  if (args.bump) {
    tag = 'v' + bumpVersion(data.version, args.bump);
    bumpPending = true;
    say(`    ${args.bump} 递增：${data.tag} -> ${tag}（校验通过后写回）`);
  }
  if (args.syncVersion) {
    const tk0 = loadToken(root);
    if (!tk0) throw new Fail('同步版本号需要 Token（要读线上最新 Release）');
    const r = await httpsJson('GET', `https://api.github.com/repos/${REPO_SLUG}/releases/latest`, tk0.token);
    if (!r.ok || !r.body || !r.body.tag_name) {
      throw new Fail(`读取线上最新 Release 失败：HTTP ${r.status} ${brief(r.body)}`);
    }
    const t = String(r.body.tag_name);
    data.version = t.replace(/^v/i, '');
    data.tag = t;
    fs.writeFileSync(vfile, JSON.stringify(data));
    writePackageVersion(root, data.version);
    ok(`本地版本号已同步成线上最新：${t}（${vfile}），未发布任何东西`);
    return;
  }
  const version = String(tag).replace(/^v/i, '');

  // 防重复发布：本地版本号如果落后于线上，bump 出来的可能是「已经发过的版本」，
  // 那样只会覆盖 asset，已经装过该版本的用户永远收不到更新提示。
  if (!args.dryRun && !args.allowRepublish) {
    const tk0 = loadToken(root);
    if (tk0) {
      const r = await httpsJson('GET', `https://api.github.com/repos/${REPO_SLUG}/releases/latest`, tk0.token);
      const latest = r.ok && r.body ? String(r.body.tag_name || '') : '';
      if (latest && latest.toLowerCase() === tag.toLowerCase()) {
        say('');
        warn(`线上最新已经是 ${tag}，再发同一个版本号没用：`);
        say('      ' + C.dim + '已经装过 ' + tag + ' 的用户，本地 version.json 已经是这个版本，');
        say('      更新器不会再提示他们，这次发布等于只换了 asset。' + C.reset);
        say('');
        say('      想推送给所有人，请任选一种：');
        say('        ' + C.cyan + '发布新版本.bat --bump patch' + C.reset + '   版本号 +1（推荐）');
        say('        ' + C.cyan + '发布新版本.bat --sync-version' + C.reset + '  先把本地版本号对齐线上最新，再改代码');
        say('      确实只想覆盖 asset（比如修好一个发坏的包），加 ' + C.cyan + '--allow-republish' + C.reset + '。');
        throw new Fail('检测到重复版本号，已中止（本地版本号没有被改动）');
      }
      if (latest && semverLess(tag, latest)) {
        warn(`注意：本地版本 ${tag} 低于线上最新 ${latest}，发布后线上仍会显示 ${latest}。`);
      }
    }
  }

  if (bumpPending) {
    if (args.dryRun) {
      say('    ' + C.dim + '（--dry-run 只演算版本号，不写回文件）' + C.reset);
    } else {
      data.version = String(tag).replace(/^v/i, '');
      data.tag = tag;
      fs.writeFileSync(vfile, JSON.stringify(data));
      writePackageVersion(root, data.version);
      ok(`已把 ${tag} 写回 ${vfile}`);
    }
  }

  // 2. 打包
  step('[2/6] 打包');
  const outZip = path.join(root, `C.v${version}.zip`);
  if (args.skipBuild && fs.existsSync(outZip)) {
    say('    复用已有 ' + outZip);
  } else {
    await buildZip(root, tag, outZip);
  }
  const zipSize = fs.statSync(outZip).size;
  say(`    输出：${outZip}（${human(zipSize)}）`);

  // 3. 回读校验
  step('[3/6] 回读校验压缩包');
  if (!verifyZip(outZip, tag)) {
    throw new Fail('压缩包校验未通过，已中止发布（不会上传任何东西）');
  }
  const sha = crypto.createHash('sha256').update(fs.readFileSync(outZip)).digest('hex');
  say('    sha256 ' + sha);

  // 4. git
  if (!args.noGit && !args.dryRun) {
    step('[4/6] 同步仓库并提交');
    syncRepoPayload(root, tag);
    gitFlow(tag);
  } else {
    step('[4/6] 跳过 git（' + (args.dryRun ? '--dry-run' : '--no-git') + '）');
  }

  if (args.dryRun) {
    step('[5/6] --dry-run：不调用 GitHub API');
    say(`\n${C.green}${C.bold}试运行通过。${C.reset}压缩包已生成：${outZip}`);
    return;
  }

  // 5. Token
  step('[5/6] 读取 GitHub Token');
  const tk = loadToken(root);
  if (!tk) {
    say('');
    bad('没有找到 GitHub Token，无法发布。请任选一种方式配置：');
    say(`
    ${C.bold}方式一（推荐，最安全）：环境变量${C.reset}
      setx GITHUB_TOKEN "ghp_你的token"      ${C.dim}# 之后需要重开一个终端/资源管理器${C.reset}

    ${C.bold}方式二：配置文件${C.reset} ${path.join(root, 'publish-config.json')}
      { "token": "ghp_你的token" }

    ${C.bold}方式三：.env 文件${C.reset} ${path.join(root, '.env')}
      GITHUB_TOKEN=ghp_你的token

    ${C.bold}Token 权限${C.reset}：Classic PAT 勾选 ${C.bold}repo${C.reset}；
    或 Fine-grained 勾选 ${C.bold}Contents: Read and write${C.reset} + ${C.bold}Metadata: Read${C.reset}。
    生成地址：https://github.com/settings/tokens
`);
    throw new Fail('缺少 GitHub Token');
  }
  say('    来源：' + tk.from);

  // 6. 发布
  step('[6/6] 创建 Release 并上传');
  const notesRaw = args.notes
    ? (fs.existsSync(args.notes) ? fs.readFileSync(args.notes, 'utf8') : args.notes)
    : (fs.existsSync(NOTES_FILE) ? fs.readFileSync(NOTES_FILE, 'utf8').trim() : '');
  const notes = notesRaw.replace(/\{tag\}/g, tag);
  if (notesRaw) say('    更新日志来自：' + (args.notes || NOTES_FILE));
  else say('    ' + C.dim + '没有更新日志（可在 tools/release-notes.md 里写）' + C.reset);

  const release = await ensureRelease(tag, tk.token, notes);
  const assetName = `C.v${version}.zip`;
  const dup = (release.assets || []).find((a) => a.name === assetName);
  if (dup) {
    if (!args.force) {
      say('');
      say(`    ${C.yellow}Release 里已经有同名 Asset：${assetName}（${human(dup.size)}，已被下载 ${dup.download_count} 次）${C.reset}`);
      say('    加 -y 参数可以直接覆盖，或回车取消。');
      const ans = await ask('    覆盖吗？[y/N] ');
      if (!/^y(es)?$/i.test(ans.trim())) throw new Fail('已取消，未改动线上任何东西');
    }
    await deleteAsset(dup.id, tk.token);
    ok('已删除旧 Asset ' + assetName);
  }
  say(`    正在上传 ${assetName}（${human(zipSize)}）...`);
  const uploaded = await uploadAsset(release.id, tk.token, outZip, assetName);
  ok('上传完成');
  say('    下载地址：' + (uploaded.browser_download_url || '(未返回)'));

  say('');
  say(`${C.green}${C.bold}发布成功${C.reset}`);
  say('  Release 页面：' + release.html_url);
  say('  本地压缩包  ：' + outZip);
  say('  sha256      ：' + sha);
}

function ask(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (d) => { process.stdin.pause(); resolve(d); });
  });
}

function cleanupStdin() {
  try { process.stdin.pause(); } catch (e) {}
}

async function run() {
  let argv = process.argv.slice(2);
  // 不带任何参数时给个菜单，方便直接双击 .bat 使用
  if (argv.length === 0) {
    const picked = await interactiveMenu();
    if (!picked) { say('已退出，没有改动任何东西。'); return; }
    argv = picked;
  }
  return main(argv);
}

run().then(cleanupStdin).catch((e) => {
  say('');
  if (e instanceof Fail) bad(e.message);
  else bad((e && e.stack) ? e.stack : String(e));
  process.exitCode = 1;
  cleanupStdin();
});
