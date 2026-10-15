'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');
const log = require('./log');

const MIRRORS = ['https://gh-proxy.com/', 'https://ghfast.top/'];
const DIRECT = 'direct';
const UPDATE_DIR = path.join(os.tmpdir(), 'C-Adventure-Island-Update');
const LOCK_FILE = path.join(UPDATE_DIR, 'update.lock');
const RESULT_FILE = path.join(UPDATE_DIR, 'update_result.log');
const MIRROR_FILE = path.join(UPDATE_DIR, 'mirror.txt');
const VERSION_FILE = path.join(__dirname, '..', 'version.json');
const LOCK_STALE_MS = 10 * 60 * 1000;
// 「检查更新」结果缓存时长：这段时间内重复点按钮不再发网络请求
const CHECK_TTL_MS = 5 * 60 * 1000;
// 下载停滞（多久没收到任何数据）就判定这条线路失败
const DOWNLOAD_IDLE_MS = 30 * 1000;

const FALLBACK_CONFIG = { version: '1.0.0', tag: 'v1.0.0', githubRepo: 'Ragearcher/C-' };

// ---------------------------------------------------------------------------
// 线路记忆：上次哪条线路（镜像 / 直连）成功，下次优先用它，
// 省掉「先试坏镜像、超时 15 秒、再换下一个」的等待。
// ---------------------------------------------------------------------------
function readPreferredRoute() {
  try {
    const v = fs.readFileSync(MIRROR_FILE, 'utf8').trim();
    return v || '';
  } catch (e) {
    return '';
  }
}

function rememberRoute(prefix) {
  try {
    if (readPreferredRoute() === prefix) return;
    fs.mkdirSync(UPDATE_DIR, { recursive: true });
    fs.writeFileSync(MIRROR_FILE, prefix, 'utf8');
    log.info('已记住可用线路：' + prefix);
  } catch (e) {}
}

function routePrefixes() {
  const all = MIRRORS.concat([DIRECT]);
  const pref = readPreferredRoute();
  const idx = all.indexOf(pref);
  if (idx > 0) {
    all.splice(idx, 1);
    all.unshift(pref);
  }
  return all;
}

function withPrefix(prefix, url) {
  return prefix === DIRECT ? url : prefix + url;
}


function readVersionFile() {
  try {
    const raw = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    if (!raw || !raw.tag) throw new Error('version.json 缺少 tag 字段');
    return raw;
  } catch (e) {
    log.error('读取 version.json 失败：' + (e && e.message ? e.message : String(e)));
    return Object.assign({}, FALLBACK_CONFIG);
  }
}

let _config = null;
function getConfig(forceReload) {
  if (forceReload || !_config) _config = readVersionFile();
  return _config;
}

function semverCompare(remote, current) {
  const parse = (v) => {
    const m = String(v || '').trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  };
  const r = parse(remote);
  const c = parse(current);
  if (!r || !c) return 0;
  for (let i = 0; i < 3; i++) if (r[i] !== c[i]) return r[i] > c[i] ? 1 : -1;
  return 0;
}

function sameTag(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function request(url, headers, redirects) {
  return new Promise((resolve, reject) => {
    redirects = redirects || 0;
    if (redirects > 5) return reject(new Error('下载地址跳转次数过多'));
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(request(res.headers.location, headers, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        const err = new Error('更新服务器返回 HTTP ' + res.statusCode);
        err.statusCode = res.statusCode;
        return reject(err);
      }
      resolve(res);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('更新请求超时')));
  });
}

async function readJson(res) {
  let data = '';
  res.on('data', (c) => { data += c; });
  await new Promise((resolve, reject) => { res.on('end', resolve); res.on('error', reject); });
  return JSON.parse(data);
}

function apiRoutes(config) {
  const api = `https://api.github.com/repos/${config.githubRepo}/releases/latest`;
  return routePrefixes().map((p) => withPrefix(p, api));
}

function downloadRoutes(url) {
  return routePrefixes().map((p) => withPrefix(p, url));
}

// 检查更新结果缓存，避免短时间内反复请求 GitHub（手动点按钮时用 force 绕过）
let _checkCache = null;

async function checkUpdate(force) {
  if (!force && _checkCache && Date.now() - _checkCache.at < CHECK_TTL_MS) {
    log.info('距离上次检查不到 5 分钟，直接复用缓存结果');
    return _checkCache.result;
  }
  const result = await checkUpdateRemote();
  // 网络失败不写缓存，否则刚断网就再也刷不出来
  if (!result.networkError) _checkCache = { at: Date.now(), result };
  return result;
}

async function checkUpdateRemote() {
  // 每次都重新读取本地 version.json，避免进程内缓存掩盖上一次更新写入的新版本号
  const config = getConfig(true);
  const localTag = config.tag;
  log.info('本地读取版本：' + localTag);
  let lastError = null;
  for (const api of apiRoutes(config)) {
    log.info('尝试更新地址：' + api);
    try {
      const res = await request(api, { 'User-Agent': 'C-Adventure-Island', Accept: 'application/vnd.github+json' });
      const release = await readJson(res);
      log.info('API 返回版本：' + release.tag_name);
      const tag = release.tag_name;
      const assets = release.assets || [];
      const asset = assets.find((a) => a && a.browser_download_url) || assets[0];
      if (!asset || !asset.browser_download_url) {
        return { needsUpdate: false, localTag, current: localTag, error: '这个 Release 没有可下载的更新包' };
      }
      // 兜底一：tag 完全相同 -> 绝不下发更新
      const identical = sameTag(tag, localTag);
      if (identical) log.info('本地版本与远端一致，不提示更新');
      return {
        needsUpdate: !identical && semverCompare(tag, localTag) > 0,
        localTag,
        current: localTag,
        latest: tag,
        url: asset.browser_download_url,
        size: asset.size || 0,
        notes: release.body || release.name || ''
      };
    } catch (e) {
      lastError = e;
      log.error('地址失败：' + api + ' -> ' + (e && e.message ? e.message : String(e)));
    }
  }
  log.error('所有更新地址均失败：' + (lastError && lastError.message ? lastError.message : String(lastError)));
  return { needsUpdate: false, localTag, current: localTag, error: lastError && lastError.message ? lastError.message : '网络请求失败', networkError: true };
}

// 下载单条线路。除了字节数，还要盯「停滞」：30 秒没有任何数据就判定这条线路废了，
// 否则一条卡死的连接会让更新界面永远停在某个百分比上。
function downloadOnce(route, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'C-Adventure-Island', Accept: 'application/octet-stream' };
    request(route, headers).then((res) => {
      const total = Number(res.headers['content-length'] || 0) || 0;
      let got = 0;
      let idle = null;
      let settled = false;
      const out = fs.createWriteStream(dest);
      const fail = (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(idle);
        try { res.destroy(); } catch (e) {}
        try { out.destroy(); } catch (e) {}
        reject(err);
      };
      const arm = () => {
        clearTimeout(idle);
        idle = setTimeout(() => fail(new Error('下载停滞超过 ' + Math.round(DOWNLOAD_IDLE_MS / 1000) + ' 秒')), DOWNLOAD_IDLE_MS);
      };
      arm();
      res.on('data', (c) => {
        got += c.length;
        arm();
        if (onProgress) onProgress(got, total);
      });
      res.on('error', (e) => fail(e));
      res.on('aborted', () => fail(new Error('连接被中断')));
      out.on('error', (e) => fail(e));
      out.on('finish', () => {
        if (settled) return;
        settled = true;
        clearTimeout(idle);
        out.close(() => resolve({ dest, size: got, total }));
      });
      res.pipe(out);
    }).catch(reject);
  });
}

async function download(url, dest, onProgress, expectedSize) {
  const routes = downloadRoutes(url);
  let lastError = null;
  for (const route of routes) {
    log.info('尝试下载地址：' + route);
    try {
      const r = await downloadOnce(route, dest, onProgress);
      // 完整性校验：下载到的字节数必须和服务器声明、以及线上 Release 记录一致。
      // 少一个字节都会让解压出来的包不完整，进而演变成「覆盖失败 → 反复提示更新」。
      if (r.total > 0 && r.size !== r.total) {
        throw new Error(`下载不完整：收到 ${r.size} 字节，服务器声明 ${r.total} 字节`);
      }
      if (expectedSize > 0 && r.size !== expectedSize) {
        throw new Error(`下载大小与线上记录不符：${r.size} 字节，应为 ${expectedSize} 字节`);
      }
      rememberRoute(routePrefixOf(route, url));
      log.info('下载完成，大小：' + r.size + ' 字节');
      return r;
    } catch (e) {
      lastError = e;
      log.error('下载地址失败：' + route + ' -> ' + (e && e.message ? e.message : String(e)));
    }
  }
  throw new Error('所有下载线路均失败：' + (lastError && lastError.message ? lastError.message : '未知错误'));
}

// 反推出这条完整地址用的是哪个线路前缀，用于「记住可用线路」
function routePrefixOf(route, rawUrl) {
  if (route === rawUrl) return DIRECT;
  for (const m of MIRRORS) if (route === m + rawUrl) return m;
  return '';
}

// ---------------------------------------------------------------------------
// 更新包预校验（在杀掉游戏之前做）
//
// 这是整条更新链路上最值钱的一道闸门：
// 以前是「下载 → 直接覆盖 → 回读发现不对 → 失败」，包本身坏了也要先覆盖一遍，
// 用户看到的就是「更新失败 → 重启 → 又提示更新」的死循环。
// 现在改成先只读地检查一遍压缩包（中央目录 + version.json + 主程序），
// 不合格就直接报错返回，游戏进程不退出、文件一个都不动。
// ---------------------------------------------------------------------------
function inspectZip(zipPath) {
  const fd = fs.openSync(zipPath, 'r');
  let entries = [];
  try {
    const size = fs.fstatSync(fd).size;
    if (size < 22) throw new Error('文件太小，不像是一个 zip');
    const tailLen = Math.min(size, 66000);
    const tail = Buffer.alloc(tailLen);
    fs.readSync(fd, tail, 0, tailLen, size - tailLen);
    let e = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50) { e = i; break; }
    }
    if (e < 0) throw new Error('压缩包尾部找不到中央目录记录，文件可能已损坏');
    const total = tail.readUInt16LE(e + 10);
    const cdSize = tail.readUInt32LE(e + 12);
    const cdOff = tail.readUInt32LE(e + 16);
    const cd = Buffer.alloc(cdSize);
    fs.readSync(fd, cd, 0, cdSize, cdOff);
    let p = 0;
    for (let i = 0; i < total; i++) {
      if (cd.readUInt32LE(p) !== 0x02014b50) throw new Error('中央目录第 ' + i + ' 项损坏');
      const method = cd.readUInt16LE(p + 10);
      const flag = cd.readUInt16LE(p + 8);
      const csize = cd.readUInt32LE(p + 20);
      const usize = cd.readUInt32LE(p + 24);
      const nameLen = cd.readUInt16LE(p + 28);
      const extraLen = cd.readUInt16LE(p + 30);
      const cmtLen = cd.readUInt16LE(p + 32);
      const offset = cd.readUInt32LE(p + 42);
      const rawName = cd.slice(p + 46, p + 46 + nameLen);
      const name = rawName.toString('utf8');
      entries.push({ name, rawName, flag, method, csize, usize, offset });
      p += 46 + nameLen + extraLen + cmtLen;
    }
  } finally {
    fs.closeSync(fd);
  }

  return {
    names: entries.map((x) => x.name),
    entries,
    // 包里有非 ASCII 文件名（比如「C++ 冒险岛.exe」）却没有置 UTF-8 标志位时，
    // Windows 自带的 Expand-Archive 会解出一堆乱码名、甚至直接报错，
    // 于是更新必然失败。这种情况必须在动文件之前就拦下来。
    nonUtf8Names() {
      return entries.filter((e) => !(e.flag & 0x800) && /[\x80-\xFF]/.test(e.rawName.toString('latin1')));
    },
    read(name) {
      const it = entries.find((x) => x.name === name);
      if (!it) return null;
      const h = fs.openSync(zipPath, 'r');
      try {
        const lh = Buffer.alloc(30);
        fs.readSync(h, lh, 0, 30, it.offset);
        if (lh.readUInt32LE(0) !== 0x04034b50) throw new Error(name + ' 的本地文件头损坏');
        const nl = lh.readUInt16LE(26), el = lh.readUInt16LE(28);
        const raw = Buffer.alloc(it.csize);
        fs.readSync(h, raw, 0, it.csize, it.offset + 30 + nl + el);
        return it.method === 0 ? raw : zlib.inflateRawSync(raw);
      } finally {
        fs.closeSync(h);
      }
    }
  };
}

const MANIFEST_IN_ZIP = 'resources/app/version.json';
const EXE_IN_ZIP = 'C++ 冒险岛.exe';

function verifyUpdatePackage(zipPath, expectedTag) {
  const z = inspectZip(zipPath);

  const badNames = z.nonUtf8Names();
  if (badNames.length) {
    throw new Error('更新包里有 ' + badNames.length + ' 个中文文件名没有标记 UTF-8（例如 ' +
      badNames[0].name + '），Windows 解压会失败，已中止更新');
  }

  if (!z.names.includes(MANIFEST_IN_ZIP)) {
    throw new Error('更新包里找不到 ' + MANIFEST_IN_ZIP + '，压缩包结构不对（可能是套了一层文件夹）');
  }
  let manifest;
  try {
    manifest = JSON.parse(z.read(MANIFEST_IN_ZIP).toString('utf8'));
  } catch (e) {
    throw new Error('更新包里的 version.json 无法解析：' + (e && e.message ? e.message : String(e)));
  }
  if (!manifest || !manifest.tag) throw new Error('更新包里的 version.json 缺少 tag 字段');
  if (!sameTag(manifest.tag, expectedTag)) {
    throw new Error(`更新包内版本号是 ${manifest.tag}，与目标版本 ${expectedTag} 不一致，已中止更新`);
  }
  if (!z.names.includes(EXE_IN_ZIP)) {
    throw new Error('更新包里找不到主程序 ' + EXE_IN_ZIP + '，已中止更新');
  }
  const nested = z.names.filter((n) => n.startsWith('C语言冒险岛/'));
  if (nested.length) {
    throw new Error('更新包里多套了一层文件夹（' + nested.length + ' 个条目），已中止更新');
  }
  if (z.names.some((n) => /(^|\/)\.git\//.test(n))) {
    log.warn('更新包里混进了 .git 目录，覆盖时会自动跳过，不影响使用');
  }
  log.info('更新包预校验通过：包内版本 ' + manifest.tag + '，共 ' + z.names.length + ' 个条目');
  return manifest;
}

// ---------------------------------------------------------------------------
// 生成静默更新脚本
//
// 关键修复点（对比旧版本）：
//   1. TAG 使用「远端目标版本」，旧版误用了本地版本，导致校验逻辑反向
//      —— 打包时忘记改 version.json 反而能通过校验，直接放行旧包。
//   2. robocopy 去掉 /XO。旧版 /XO 会跳过「比目标更旧」的源文件，
//      而更新包里的文件时间戳通常早于安装目录，于是 version.json 永远覆盖不上。
//   3. 游戏根目录不再靠 path.dirname 盲猜，改为「候选路径 + 校验」：
//      只有真的含有 resources\app\version.json 的那一层才算数（见 resolveGameRoot）。
//   4. 解压后不盲目使用第一层目录，而是**动态探测**含
//      resources\app\version.json 的那一层作为真正的源目录，
//      多套一层目录也能自动纠正（见 [2/6]）。
//   5. 覆盖后回读游戏根目录的 version.json：版本号没变就判定「文件覆盖失败」，
//      写进日志并**终止重启**，避免陷入「更新→重启→仍提示更新」的死循环。
//      （旧版这里会强制改写 version.json 兜底，那会把「代码没覆盖成功」伪装成成功。）
//   6. 【新增】不再死等 4 秒，而是按主进程 PID 精确等待它退出（最多 30 秒），
//      超时再强杀。用 PID 判断，彻底避开中文进程名在 bat 里的编码坑。
//   7. 【新增】覆盖前先把 resources\app 备份一份，回读校验失败时自动回滚，
//      保证不管更新成功与否，游戏都还是能打开的那个游戏。
//   8. 无论成功失败都清理 update.zip / extracted / 备份，只保留日志。
// ---------------------------------------------------------------------------
function resolveGameRoot(override) {
  const cands = [];
  if (override) cands.push(override);
  if (process.execPath) cands.push(path.dirname(process.execPath));
  if (process.resourcesPath) cands.push(path.dirname(process.resourcesPath));
  const seen = new Set();
  const uniq = cands.filter((c) => c && !seen.has(c) && seen.add(c));
  const valid = uniq.filter((c) => fs.existsSync(path.join(c, 'resources', 'app', 'version.json')));
  if (valid.length > 1) {
    log.warn('检测到多个可能的游戏根目录（目录有嵌套），选用最外层：' + valid[0]);
    valid.forEach((v) => log.warn('  候选：' + v));
  }
  const picked = valid[0] || uniq[0] || process.cwd();
  log.info('游戏根目录解析为：' + picked + (valid.length ? '（含 resources/app/version.json，已校验）' : '（未找到 version.json，请检查安装）'));
  return picked;
}

function buildUpdateBat(expectedTag, expectedVersion, localTag, gameDirOverride, pid) {
  const root = UPDATE_DIR;
  const zip = path.join(root, 'update.zip');
  const extract = path.join(root, 'extracted');
  const backup = path.join(root, 'backup_app');
  const gameDir = resolveGameRoot(gameDirOverride);
  const lines = [
    '@echo off',
    'setlocal EnableExtensions',
    'chcp 65001 >nul',
    'set "ROOT=' + root + '"',
    'set "ZIP=' + zip + '"',
    'set "EXT=' + extract + '"',
    'set "BAK=' + backup + '"',
    'set "GAME=' + gameDir + '"',
    'set "TAG=' + expectedTag + '"',
    'set "VER=' + expectedVersion + '"',
    'set "OLD=' + localTag + '"',
    'set "PID=' + (pid || '') + '"',
    'set "LOG=' + path.join(root, 'update_result.log') + '"',
    'set "DEST=%GAME%\\resources\\app\\version.json"',
    'set "TMPTAG=%ROOT%\\_tag.txt"',
    'set "PS=powershell -NoProfile -ExecutionPolicy Bypass -Command"',
    '',
    '> "%LOG%" echo ==== C 语言冒险岛 静默更新报告 ====',
    '>> "%LOG%" echo 开始时间: %DATE% %TIME%',
    '>> "%LOG%" echo 更新前本地版本: %OLD%',
    '>> "%LOG%" echo 目标版本: %TAG%',
    '>> "%LOG%" echo 游戏根目录: %GAME%',
    '>> "%LOG%" echo.',
    '',
    'echo Waiting for program to exit...',
    // 按 PID 精确等待主进程退出（最多 30 秒），比死等固定 4 秒可靠得多；
    // 用 PID 判断可以完全避开中文进程名在 bat 里的编码问题。
    'if not defined PID goto :waited',
    '%PS% "for($i=0;$i -lt 60;$i++){ if(-not (Get-Process -Id %PID% -ErrorAction SilentlyContinue)){ exit 0 }; Start-Sleep -Milliseconds 500 } exit 1"',
    'if errorlevel 1 goto :force_kill',
    'goto :waited',
    ':force_kill',
    '>> "%LOG%" echo   [警告] 游戏主进程 30 秒后仍未退出，强制结束（PID %PID%）',
    '%PS% "try { Stop-Process -Id %PID% -Force -ErrorAction Stop } catch {}"',
    '%PS% "Start-Sleep -Milliseconds 1500"',
    ':waited',
    '>> "%LOG%" echo   [OK] 游戏进程已退出，开始覆盖文件',
    '',
    '>> "%LOG%" echo [1/6] 解压更新包',
    'if exist "%EXT%" rmdir /s /q "%EXT%" 2>nul',
    '%PS% "try { Expand-Archive -LiteralPath \'%ZIP%\' -DestinationPath \'%EXT%\' -Force -ErrorAction Stop } catch { Add-Content -LiteralPath \'%LOG%\' -Encoding UTF8 -Value (\'  [失败] 解压出错: \' + $_.Exception.Message); exit 1 }"',
    'if errorlevel 1 goto :fail',
    '>> "%LOG%" echo   [OK] 解压完成',
    '',
    '>> "%LOG%" echo [2/6] 探测真正的源目录（含 resources\\app\\version.json 的那一层）',
    // 用 bat 自己的 for /d 逐层找，不走临时文件：
    // 把路径写进文件再 set /p 读回来，会因为编码（ASCII/UTF-8/GBK）把中文目录名弄坏。
    'set "SRC="',
    'if exist "%EXT%\\resources\\app\\version.json" set "SRC=%EXT%"',
    'if defined SRC goto :src_found',
    'for /d %%D in ("%EXT%\\*") do if not defined SRC if exist "%%~fD\\resources\\app\\version.json" set "SRC=%%~fD"',
    'if defined SRC goto :src_found',
    'for /d %%D in ("%EXT%\\*") do for /d %%E in ("%%~fD\\*") do if not defined SRC if exist "%%~fE\\resources\\app\\version.json" set "SRC=%%~fE"',
    'if defined SRC goto :src_found',
    'for /d %%D in ("%EXT%\\*") do for /d %%E in ("%%~fD\\*") do for /d %%F in ("%%~fE\\*") do if not defined SRC if exist "%%~fF\\resources\\app\\version.json" set "SRC=%%~fF"',
    ':src_found',
    'if not defined SRC goto :no_source',
    'if /i "%SRC%"=="%EXT%" goto :src_flat',
    '>> "%LOG%" echo   [警告] 包内多套了一层目录，已自动定位到真正的源目录',
    'goto :src_ok',
    ':src_flat',
    '>> "%LOG%" echo   [OK] 包结构正确：resources 直接位于压缩包根目录',
    ':src_ok',
    '>> "%LOG%" echo   实际源目录: %SRC%',
    'goto :read_pkg',
    ':no_source',
    '>> "%LOG%" echo   [失败] 解压结果里找不到 resources\\app\\version.json，压缩包结构不正确',
    'goto :fail',
    ':read_pkg',
    '',
    '>> "%LOG%" echo [3/6] 校验包内版本号',
    '%PS% "((Get-Content -Raw \'%SRC%\\resources\\app\\version.json\' | ConvertFrom-Json).tag) | Set-Content -LiteralPath \'%TMPTAG%\' -Encoding ASCII"',
    'set "PKG="',
    'set /p PKG=<"%TMPTAG%"',
    '>> "%LOG%" echo   包内版本: %PKG%',
    'if /i "%PKG%"=="%TAG%" goto :pkg_ok',
    '>> "%LOG%" echo   [失败] 包内版本 %PKG% 与目标版本 %TAG% 不一致 —— 打包时忘记修改 version.json',
    'goto :fail',
    ':pkg_ok',
    '>> "%LOG%" echo   [OK] 包内版本与目标版本一致',
    '',
    '>> "%LOG%" echo [4/6] 备份并覆盖游戏根目录',
    // 覆盖前先备份 resources\app，回读校验失败时用它回滚，
    // 保证「更新失败」也不会把游戏弄成半新半旧的坏状态。
    'if exist "%BAK%" rmdir /s /q "%BAK%" 2>nul',
    'chcp 936 >nul',
    'robocopy "%GAME%\\resources\\app" "%BAK%" /E /R:2 /W:1 /XJ /XD .git /NFL /NDL /NP >nul 2>&1',
    'chcp 65001 >nul',
    'if not errorlevel 8 goto :backup_ok',
    '>> "%LOG%" echo   [警告] 备份失败，本次更新没有回滚保护',
    'goto :backup_done',
    ':backup_ok',
    '>> "%LOG%" echo   [OK] 已备份当前 resources\\app（失败时可回滚）',
    ':backup_done',
    'set "RETRY=0"',
    ':copy',
    // robocopy 的日期头按控制台代码页输出、文件路径按 OEM 代码页输出，是混合编码。
    // 调用期间把代码页切到 936，让整段输出统一为 GBK，再转码追加进 UTF-8 日志；
    // 恢复 65001 之后才会执行下面含中文的 echo 行，所以 bat 自身的中文不受影响。
    'chcp 936 >nul',
    // /XD .git 是最后一道保险：任何层级的 .git 目录都不复制，
    // 即使前面没能剔除掉误打包进来的开发仓库副本，也不会把 git 数据覆盖到本地仓库上。
    'robocopy "%SRC%" "%GAME%" /E /IS /IT /R:5 /W:2 /XJ /XD .git /NDL /NP > "%ROOT%\\_rc.txt" 2>&1',
    'set "RC=%ERRORLEVEL%"',
    'chcp 65001 >nul',
    '%PS% "Get-Content -LiteralPath \'%ROOT%\\_rc.txt\' -Encoding Default -ErrorAction SilentlyContinue | Add-Content -LiteralPath \'%LOG%\' -Encoding UTF8"',
    'del /f /q "%ROOT%\\_rc.txt" 2>nul',
    'if %RC% GEQ 8 goto :copy_retry',
    '>> "%LOG%" echo   [OK] robocopy 退出码 %RC%',
    'goto :verify',
    ':copy_retry',
    'set /a RETRY+=1',
    'if %RETRY% LSS 10 goto :copy_again',
    '>> "%LOG%" echo   [失败] 文件被占用，重试 10 次后仍失败，robocopy 退出码 %RC%',
    'goto :fail',
    ':copy_again',
    '>> "%LOG%" echo   [重试] 文件被占用，第 %RETRY% 次重试',
    'ping -n 3 127.0.0.1 >nul',
    'goto :copy',
    '',
    ':verify',
    '>> "%LOG%" echo [5/6] 回读校验游戏根目录版本号',
    '%PS% "((Get-Content -Raw \'%DEST%\' | ConvertFrom-Json).tag) | Set-Content -LiteralPath \'%TMPTAG%\' -Encoding ASCII"',
    'set "DST="',
    'set /p DST=<"%TMPTAG%"',
    '>> "%LOG%" echo   覆盖后游戏根目录版本: %DST%',
    'if /i "%DST%"=="%TAG%" goto :verify_ok',
    '>> "%LOG%" echo   [失败] 文件覆盖失败：游戏根目录的 version.json 仍是 %DST%，没有变成 %TAG%',
    '>> "%LOG%" echo   [失败] 常见原因：游戏进程没退干净导致文件被占用；或压缩包内容不完整',
    'if not exist "%BAK%\\version.json" goto :no_rollback',
    '>> "%LOG%" echo   [回滚] 正在用备份恢复 resources\\app ...',
    'chcp 936 >nul',
    'robocopy "%BAK%" "%GAME%\\resources\\app" /E /IS /IT /R:3 /W:1 /XJ /NFL /NDL /NP >nul 2>&1',
    'chcp 65001 >nul',
    '%PS% "((Get-Content -Raw \'%DEST%\' | ConvertFrom-Json).tag) | Set-Content -LiteralPath \'%TMPTAG%\' -Encoding ASCII"',
    'set "RB="',
    'set /p RB=<"%TMPTAG%"',
    '>> "%LOG%" echo   [回滚] 恢复完成，当前版本号: %RB%',
    'goto :fail',
    ':no_rollback',
    '>> "%LOG%" echo   [回滚] 没有可用备份，跳过回滚',
    '>> "%LOG%" echo   [失败] 已保留原版本，并且**不重启游戏**，避免陷入「更新→重启→仍提示更新」的死循环',
    'goto :fail',
    ':verify_ok',
    '>> "%LOG%" echo   [OK] 游戏根目录版本已确认为 %TAG%',
    '',
    '>> "%LOG%" echo [6/6] 清理更新缓存并重启游戏',
    '>> "%LOG%" echo RESULT: SUCCESS',
    '>> "%LOG%" echo 结论: 更新成功，当前版本 %TAG%',
    'del /f /q "%ZIP%" 2>nul',
    'rmdir /s /q "%EXT%" 2>nul',
    'rmdir /s /q "%BAK%" 2>nul',
    'del /f /q "%TMPTAG%" 2>nul',
    'del /f /q "%ROOT%\\update.lock" 2>nul',
    'start "" "%GAME%\\C++ 冒险岛.exe"',
    'endlocal',
    'exit /b 0',
    '',
    ':fail',
    '>> "%LOG%" echo RESULT: FAILED',
    '>> "%LOG%" echo 结论: 更新失败，游戏根目录保留原版本 %OLD%，且**没有重启游戏**',
    '>> "%LOG%" echo 处理建议: 手动双击游戏图标即可继续玩；游戏启动后会弹出上次失败的原因；要重试就再点一次「下载并更新」',
    'del /f /q "%ZIP%" 2>nul',
    'rmdir /s /q "%EXT%" 2>nul',
    'rmdir /s /q "%BAK%" 2>nul',
    'del /f /q "%TMPTAG%" 2>nul',
    'del /f /q "%ROOT%\\update.lock" 2>nul',
    'endlocal',
    'exit /b 1'
  ];
  return lines.join('\r\n');
}

function buildUpdateVbs(batPath) {
  const cmd = 'cmd /c ""' + batPath + '""';
  return 'CreateObject("WScript.Shell").Run "' + cmd.replace(/"/g, '""') + '", 0, False\r\n';
}

async function downloadAndApply(url, expectedTag, onProgress, expectedSize) {
  const config = getConfig(true);
  const localTag = config.tag;
  if (!expectedTag) throw new Error('缺少目标版本号，已取消更新');
  if (sameTag(expectedTag, localTag)) throw new Error('目标版本与本地版本相同，已取消更新');
  const expectedVersion = String(expectedTag).replace(/^v/i, '');

  log.info('开始下载更新包：' + url);
  fs.mkdirSync(UPDATE_DIR, { recursive: true });
  const zip = path.join(UPDATE_DIR, 'update.zip');
  const bat = path.join(UPDATE_DIR, 'update.bat');
  const vbs = path.join(UPDATE_DIR, 'update.vbs');

  // 锁：防止游戏重启后启动清理逻辑误删正在使用的更新缓存
  fs.writeFileSync(LOCK_FILE, new Date().toISOString(), 'utf8');

  // 进度回调顺带算出平均速度，界面上能显示 MB/s，卡住时一眼看得出来
  const t0 = Date.now();
  let lastEmit = 0;
  const progress = (got, total) => {
    if (!onProgress) return;
    const now = Date.now();
    const secs = Math.max(0.001, (now - t0) / 1000);
    if (now - lastEmit < 120 && got !== total) return;
    lastEmit = now;
    onProgress(got, total, got / secs);
  };

  try {
    await download(url, zip, progress, expectedSize);
    // 关键：在杀掉游戏之前先把包验一遍。不合格就直接抛错，
    // 游戏进程不退出、安装目录一个文件都不动，从根上掐掉「更新死循环」。
    verifyUpdatePackage(zip, expectedTag);
  } catch (e) {
    try { fs.rmSync(zip, { force: true }); } catch (err) {}
    try { fs.rmSync(LOCK_FILE, { force: true }); } catch (err) {}
    log.error('更新包准备失败：' + (e && e.message ? e.message : String(e)));
    throw e;
  }

  fs.writeFileSync(bat, buildUpdateBat(expectedTag, expectedVersion, localTag, undefined, process.pid), 'utf8');
  fs.writeFileSync(vbs, buildUpdateVbs(bat), 'utf8');
  log.info('update.bat 已生成：' + bat);
  log.info('update.vbs 已生成：' + vbs);
  log.info('目标版本 ' + expectedTag + '，更新前本地版本 ' + localTag + '，等待主进程 PID ' + process.pid + ' 退出');
  const child = spawn('wscript.exe', [vbs], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  return { ok: true, bat, vbs, from: localTag, to: expectedTag };
}

// 启动时清理上一次更新残留的缓存（update.zip / extracted）。
// 正在更新（存在未过期的 update.lock）时不动任何文件。
function cleanupStaleUpdate() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const st = fs.statSync(LOCK_FILE);
      if (Date.now() - st.mtimeMs < LOCK_STALE_MS) {
        log.info('检测到进行中的更新，跳过缓存清理');
        return;
      }
      log.warn('发现过期的 update.lock，按残留处理');
    }
    let cleaned = 0;
    for (const name of ['update.zip', 'extracted', 'backup_app', 'update.bat', 'update.vbs', 'update.lock', '_tag.txt', '_rc.txt']) {
      const p = path.join(UPDATE_DIR, name);
      if (fs.existsSync(p)) {
        try { fs.rmSync(p, { recursive: true, force: true }); cleaned++; } catch (e) {}
      }
    }
    if (cleaned) log.info('已清理更新缓存残留 ' + cleaned + ' 项');
  } catch (e) {
    log.warn('清理更新缓存失败：' + (e && e.message ? e.message : String(e)));
  }
}

// 读取上一次更新的结果，仅报告「失败」，报告后即消费掉，避免每次启动重复弹窗。
function readLastUpdateResult() {
  try {
    if (!fs.existsSync(RESULT_FILE)) return null;
    const txt = fs.readFileSync(RESULT_FILE, 'utf8');
    const failed = /RESULT:\s*FAILED/i.test(txt);
    const lines = txt.split(/\r?\n/).filter((l) => /\[失败\]|\[警告\]|RESULT:|结论:/.test(l)).slice(0, 8);
    try { fs.renameSync(RESULT_FILE, path.join(UPDATE_DIR, 'update_result.reported.log')); } catch (e) {}
    if (!failed) return null;
    return { ok: false, reason: lines.join('\n') };
  } catch (e) {
    return null;
  }
}

module.exports = {
  getConfig,
  checkUpdate,
  downloadAndApply,
  cleanupStaleUpdate,
  readLastUpdateResult,
  buildUpdateBat,
  buildUpdateVbs,
  semverCompare,
  inspectZip,
  verifyUpdatePackage,
  MIRRORS,
  UPDATE_DIR,
  RESULT_FILE
};
