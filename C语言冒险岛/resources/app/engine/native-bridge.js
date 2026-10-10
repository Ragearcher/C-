/* ============================================================
   native-bridge.js
   桌面端「本机 Python」桥接层（Node 侧）

   职责有三件：
     1. probe()    找出本机可用的 Python（>= 3.8），拿不到就老实说拿不到
     2. prewarm()  提前起好一个待命的解释器进程
     3. run()      把一段代码交给它跑，取回判题结果

   为什么要「预热」：
     Windows 上 `python -c pass` 本身就要 ~300ms，这段开销和代码内容无关，
     纯粹是解释器加载 + 系统扫描。如果每次点「运行」都新起进程，
     连点几次的体验比内置 Pyodide（单次 13ms）还差 25 倍。
     所以让子进程提前起好、阻塞在 stdin 上等着，用户点击时只剩执行时间。

   为什么每个进程只服务一次请求就退出：
     预热能提速，但常驻进程会带来两个真问题 ——
     上一个程序留下的全局状态（改过的 sys.stdout、monkeypatch 过的模块）
     会污染下一个；用户写了 `while True` 的非守护线程，进程就永远退不掉。
     一进程一请求同时避开了这两点，代价只是空闲时多一个约 10MB 的进程。

   为什么单独成一个模块：Electron 主进程要用它，测试也要用它。
   测试直接 require 这个文件并当作 window.pqNative，跑的就是真桥接代码 ——
   而不是为了测试另写一份替身（那样测不出路径拼错、编码不对这类真问题）。
   ============================================================ */
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const RUNNER = path.join(__dirname, 'run_native.py');
const MIN_VERSION = [3, 8];

// 探测脚本：把解释器信息以 JSON 打到 stdout，拿不到就没法当引擎用
const PROBE_SNIPPET =
  'import sys, json;' +
  'print(json.dumps({"v": list(sys.version_info[:3]),' +
  ' "s": sys.version.split()[0],' +
  ' "exe": sys.executable,' +
  ' "bits": 64 if sys.maxsize > 2**32 else 32}))';

const CHILD_ENV = () => Object.assign({}, process.env, {
  PYTHONIOENCODING: 'utf-8',
  PYTHONUTF8: '1',
  PYTHONDONTWRITEBYTECODE: '1'
});

let cachedProbe = null;
let pyInfo = null;
let shuttingDown = false;
const POOL_SIZE = 2;                       // 连点「运行」时也不用等，留两个热的
const slots = [];                          // 唯一的一条池子队列，见 refill() 的注释
const liveDirs = new Set();

/* ---------- 工具 ---------- */

function isExecutableFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (e) {
    return false;
  }
}

function rmDir(dir) {
  if (!dir) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) { /* 临时目录清不掉不影响结果 */ }
  liveDirs.delete(dir);
}

/** 父进程退出时把还活着的子进程和临时目录都收掉，别留垃圾 */
function cleanupAll() {
  shuttingDown = true;
  const all = slots.map(e => e.slot);
  slots.length = 0;
  for (const s of all) {
    if (s && s.child && !s.exited) {
      try { s.child.kill(); } catch (e) { /* 已退出 */ }
    }
    rmDir(s && s.dir);
  }
  for (const d of Array.from(liveDirs)) rmDir(d);
  if (siteServer) {
    try { siteServer.close(); } catch (e) { /* 已关闭 */ }
    siteServer = null;
    siteUrl = null;
    siteStarting = null;
  }
}

/* ---------- 练习靶场（本地 HTTP 服务） ----------
   爬虫那一章需要真发 HTTP 请求。与其让学生去抓真实网站（网站一改版课程就烂掉、
   还可能被反爬挡住），不如在本地起一个靶场：请求是真的，内容是我们自己的。
   服务只监听 127.0.0.1、端口随机，外部访问不到。 */
const SITE_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

let siteServer = null;
let siteUrl = null;
let siteStarting = null;

function findSiteDir() {
  // 打包后（和同步资源后）在 app/website；开发时可能还没同步，直接用源码目录
  const candidates = [
    path.join(__dirname, '..', 'app', 'website'),
    path.join(__dirname, '..', '..', 'website')
  ];
  for (const d of candidates) {
    try {
      if (fs.statSync(path.join(d, 'manifest.json')).isFile()) return d;
    } catch (e) { /* 继续找下一个 */ }
  }
  return null;
}

function startSiteServer() {
  if (siteServer) return Promise.resolve(siteUrl);
  if (siteStarting) return siteStarting;
  siteStarting = new Promise(resolve => {
    const dir = findSiteDir();
    if (!dir) {
      console.warn('[site] 没找到练习靶场目录，网络章节将无法运行');
      resolve(null);
      return;
    }
    const server = http.createServer((req, res) => {
      let rel;
      try {
        rel = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      } catch (e) {
        res.writeHead(400); res.end('bad url'); return;
      }
      if (rel.endsWith('/')) rel += 'index.html';

      // 防目录遍历：解析后必须仍落在靶场目录内
      const target = path.resolve(dir, '.' + rel);
      if (target !== dir && !target.startsWith(dir + path.sep)) {
        res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('forbidden');
        return;
      }

      fs.readFile(target, (err, buf) => {
        if (err) {
          // 找不到就返回真正的 404 —— 第 4 关正是要练这个
          fs.readFile(path.join(dir, '404.html'), (e2, body) => {
            res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
            res.end(e2 ? '404 Not Found' : body);
          });
          return;
        }
        const type = SITE_MIME[path.extname(target).toLowerCase()] || 'text/plain; charset=utf-8';
        res.writeHead(200, { 'content-type': type, 'x-pyquest-target': '1' });
        res.end(buf);
      });
    });
    server.on('error', e => {
      console.warn('[site] 靶场服务起不来：' + e.message);
      siteStarting = null;
      resolve(null);
    });
    server.listen(0, '127.0.0.1', () => {
      siteServer = server;
      siteUrl = 'http://127.0.0.1:' + server.address().port;
      console.log('[site] 练习靶场已就绪：' + siteUrl);
      resolve(siteUrl);
    });
  });
  return siteStarting;
}

/** 让某个可执行文件自报家门。不是 Python、版本太老、或跑不起来都返回 null。 */
function inspect(exe, baseArgs) {
  const args = (baseArgs || []).concat(['-c', PROBE_SNIPPET]);
  const r = spawnSync(exe, args, {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
    env: CHILD_ENV()
  });
  if (r.error || r.status !== 0 || !r.stdout) return null;
  let info;
  try {
    // stdout 可能混有别的输出，取最后一行 JSON
    const line = String(r.stdout).trim().split('\n').filter(Boolean).pop();
    info = JSON.parse(line);
  } catch (e) {
    return null;
  }
  if (!info || !Array.isArray(info.v)) return null;
  const major = info.v[0], minor = info.v[1];
  if (major < MIN_VERSION[0] ||
      (major === MIN_VERSION[0] && minor < MIN_VERSION[1])) return null;
  return {
    available: true,
    path: info.exe || exe,
    version: info.s,
    versionInfo: info.v,
    bits: info.bits,
    // 调用方式：某些入口要带额外参数
    launcher: exe,
    launcherArgs: baseArgs || []
  };
}

/** Windows 上列出 py 启动器注册的所有解释器（-0p 会打印 版本:路径） */
function listPyLauncher() {
  const out = [];
  if (process.platform !== 'win32') return out;
  const r = spawnSync('py', ['-0p'], {
    encoding: 'utf8', timeout: 15000, windowsHide: true
  });
  if (r.error || !r.stdout) return out;
  for (const line of String(r.stdout).split('\n')) {
    // 形如：  -V:3.14 *        C:\Users\xxx\AppData\Local\Programs\Python\Python314\python.exe
    const m = line.match(/([A-Za-z]:\\[^\s]*python(?:w)?\.exe)\s*$/i);
    if (m && isExecutableFile(m[1])) out.push(m[1]);
  }
  return out;
}

/** 常见安装位置兜底扫描（PATH 里没有、也没装 py 启动器时） */
function listCommonInstalls() {
  const out = [];
  if (process.platform !== 'win32') return out;
  const roots = [];
  const localApp = process.env.LOCALAPPDATA;
  if (localApp) roots.push(path.join(localApp, 'Programs', 'Python'));
  if (process.env.ProgramFiles) roots.push(process.env.ProgramFiles);
  if (process.env['ProgramFiles(x86)']) roots.push(process.env['ProgramFiles(x86)']);
  roots.push('C:\\');

  for (const root of roots) {
    let entries = [];
    try {
      entries = fs.readdirSync(root);
    } catch (e) {
      continue;
    }
    for (const name of entries) {
      if (!/^Python\s*3/i.test(name)) continue;
      const p = path.join(root, name, 'python.exe');
      if (isExecutableFile(p)) out.push(p);
    }
  }
  return out;
}

/* ---------- 探测 ---------- */

/**
 * 找出本机可用的 Python。
 * 顺序：PQ_PYTHON 环境变量 > py 启动器 > PATH > 常见安装位置。
 * 第一个能跑通的就用它 —— 不追求"最新"，够用就行。
 */
function probe() {
  if (cachedProbe) return cachedProbe;
  cachedProbe = Promise.resolve().then(() => {
    const tried = [];

    // 0. 显式指定（开发和测试用）
    const forced = process.env.PQ_PYTHON;
    if (forced) {
      const info = inspect(forced, []);
      if (info) { info.source = '环境变量 PQ_PYTHON'; return info; }
      tried.push(forced + '（PQ_PYTHON 指定，但不可用）');
    }

    // 1. py 启动器的注册表（比 PATH 可靠，且能拿到所有已装版本）
    for (const exe of listPyLauncher()) {
      const info = inspect(exe, []);
      if (info) { info.source = 'py 启动器'; return info; }
      tried.push(exe);
    }

    // 2. PATH 上的 python / python3
    for (const name of ['python', 'python3']) {
      const info = inspect(name, []);
      if (info) { info.source = 'PATH'; return info; }
      tried.push(name);
    }

    // 3. 常见安装目录
    for (const exe of listCommonInstalls()) {
      const info = inspect(exe, []);
      if (info) { info.source = '常见安装目录'; return info; }
      tried.push(exe);
    }

    return {
      available: false,
      reason: '本机没有找到 Python ' + MIN_VERSION.join('.') + ' 或更高版本',
      tried: tried
    };
  }).then(info => {
    // 探测成功就顺手把池子热起来：用户还在读题目的时候，
    // 解释器已经在后台起好了，第一次点「运行」就不用等。
    if (info && info.available) {
      pyInfo = info;
      refill();
    }
    return info;
  });
  return cachedProbe;
}

/* ---------- 预热池 ---------- */

function spawnWarm(info) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-warm-'));
  liveDirs.add(dir);
  const resPath = path.join(dir, 'res.json');

  const child = spawn(info.launcher,
    info.launcherArgs.concat([RUNNER, '--stdin-once', resPath]), {
      // stdout 留成管道只为收那行就绪握手，之后就只读不看了。
      // 用户代码里 os.write(1, ...) 之类的东西一样进不了结果通道 ——
      // 结果只走结果文件。
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: CHILD_ENV()
    });

  const slot = { child, dir, resPath, exited: false, exitInfo: null, stderr: '', booted: false };
  child.stderr.on('data', d => {
    if (slot.stderr.length < 4000) slot.stderr += d.toString('utf8');
  });

  slot.closed = new Promise(resolve => {
    child.on('error', e => { slot.exited = true; slot.exitInfo = { error: e }; resolve(slot.exitInfo); });
    child.on('close', (code, signal) => {
      slot.exited = true;
      slot.exitInfo = { code, signal };
      resolve(slot.exitInfo);
    });
  });

  // 就绪握手：解释器起来后会先吐一行 READY。收到它才算「真热」——
  // 只等 spawn 事件是不够的，那时 Python 还在加载，派活照样要等。
  slot.ready = new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Python 启动超时（15 秒）')), 15000);
    child.stdout.on('data', d => {
      if (slot.booted) return;              // 之后的 stdout 一概不看
      buf += d.toString('utf8');
      const nl = buf.indexOf('\n');
      if (nl === -1) return;
      slot.booted = true;
      clearTimeout(timer);
      if (buf.slice(0, nl).trim() === 'READY') resolve(slot);
      else reject(new Error('Python 没有按约定报就绪：' + buf.slice(0, 80)));
    });
    child.once('error', e => { clearTimeout(timer); reject(e); });
    child.once('close', () => {
      if (!slot.booted) { clearTimeout(timer); reject(new Error('Python 进程在就绪前就退出了')); }
    });
  });

  return slot;
}

/** 把池子补到目标大小。同步返回，填充在后台进行。
 *
 * 这里刻意只用**一条队列** slots，每个元素是 { slot, ready }。
 * 之前的写法把「就绪的槽位」和「正在启动的槽位」分成两个数组，
 * 结果同一个槽位会被登记两次：就绪时推进 readyPool，acquire 又直接 await
 * 那个 promise 拿走一份 —— 一个进程被交付给两次请求，第二次拿到的是
 * 已经跑完退出的死进程。表现就是零星的「进程异常退出（退出码 0）」，
 * 而且只在连点的时候才复现。一个队列就没有这种可能。
 */
function refill() {
  if (!pyInfo || shuttingDown) return;
  for (let i = slots.length; i < POOL_SIZE; i++) {
    const slot = spawnWarm(pyInfo);
    // ready 成功解析成槽位，失败解析成 null —— 永远不 reject，
    // 免得没人 catch 时把整个进程带崩
    const entry = { slot: slot, ready: slot.ready.then(() => slot).catch(() => null) };
    slots.push(entry);
  }
}

/** 取一个已经热的槽位；一个都没有就现等一个起来。 */
async function acquire() {
  refill();
  // 上限是必须的：refill 每次都会补货，万一 Python 被卸载了、
  // 每个槽位都启动失败，没有上限这里就是个死循环。
  let tries = 0;
  const maxTries = POOL_SIZE * 3 + 4;
  while (slots.length && tries < maxTries) {
    tries++;
    const entry = slots.shift();
    refill();                       // 立刻补货，下一次点击也不用等
    const s = await entry.ready;
    if (s && !s.exited) return s;   // 拿到手时再确认一次活着
    rmDir(entry.slot.dir);
  }
  // 兜底：池子全军覆没（比如 Python 刚被卸载），现起一个
  const slot = spawnWarm(pyInfo);
  const ready = await slot.ready.then(() => slot).catch(() => null);
  if (!ready) throw new Error('无法启动本机 Python：' + (slot.stderr || '未知原因').slice(0, 200));
  return ready;
}

/* ---------- 执行 ---------- */

function killTree(pid) {
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'],
                { windowsHide: true, timeout: 10000 });
    } else {
      process.kill(pid, 'SIGKILL');
    }
  } catch (e) {
    /* 进程可能已经自己退了，忽略 */
  }
}

/**
 * 跑一段代码。
 * payload: { code, stdin, test, harness, stepLimit, timeLimit, outCap }
 * 返回:    { ok, out, err, pass, msg, engineError, ms, killed }
 */
async function run(payload) {
  const info = await probe();
  if (!info.available) {
    return { ok: false, out: '', err: '', pass: null, msg: '',
             engineError: info.reason || '本机没有可用的 Python' };
  }
  if (!isExecutableFile(RUNNER)) {
    return { ok: false, out: '', err: '', pass: null, msg: '',
             engineError: '缺少引擎文件 run_native.py：' + RUNNER };
  }

  const timeLimit = Number(payload.timeLimit) || 8;
  // 外壳自己会在 timeLimit 秒时抛「死循环」；这里多留 3 秒余量，
  // 用于兜住外壳拦不住的情况 —— time.sleep(600)、卡在网络请求、C 扩展里转圈。
  const hardMs = Math.round((timeLimit + 3) * 1000);

  const slot = await acquire();
  const t0 = Date.now();
  // 靶场服务是懒启动的：第一次跑代码时把它起好，之后一直复用
  const site = await startSiteServer();

  try {
    const reqLine = JSON.stringify({
      code: payload.code || '',
      stdin: payload.stdin || '',
      test: payload.test || '',
      harness: payload.harness || '',
      stepLimit: payload.stepLimit || 0,
      timeLimit: timeLimit,
      outCap: payload.outCap || 0,
      site: site || ''
    }) + '\n';

    let writeError = null;
    try {
      slot.child.stdin.end(reqLine, 'utf8');
    } catch (e) {
      writeError = e;
    }

    let killed = false;
    const timer = setTimeout(() => { killed = true; killTree(slot.child.pid); }, hardMs);
    const exitInfo = await slot.closed;
    clearTimeout(timer);
    const ms = Date.now() - t0;

    if (writeError) {
      return { ok: false, out: '', err: '', pass: null, msg: '', ms, killed,
               engineError: '无法把代码送给 Python 进程：' + writeError.message };
    }
    if (exitInfo && exitInfo.error) {
      return { ok: false, out: '', err: '', pass: null, msg: '', ms, killed,
               engineError: '启动 Python 失败：' + exitInfo.error.message };
    }

    if (fs.existsSync(slot.resPath)) {
      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(slot.resPath, 'utf8'));
      } catch (e) {
        return { ok: false, out: '', err: '', pass: null, msg: '', ms, killed,
                 engineError: '引擎返回的结果不是合法 JSON：' + e.message };
      }
      parsed.ms = ms;
      parsed.killed = killed;
      return parsed;
    }

    // 结果文件没生成 —— 进程被强杀了，或者 Python 起来就挂了
    if (killed) {
      return {
        ok: false, out: '', err: '', pass: null, msg: '', ms, killed: true,
        engineError: '程序跑了超过 ' + timeLimit + ' 秒仍没结束，已被强制中断。' +
                     '检查一下有没有停不下来的循环，或者 input() 有没有等到数据。'
      };
    }
    return {
      ok: false, out: '', err: '', pass: null, msg: '', ms, killed: false,
      engineError: 'Python 进程异常退出（退出码 ' + (exitInfo && exitInfo.code) + '）' +
                   (slot.stderr ? '：' + slot.stderr.trim().slice(0, 300) : '')
    };
  } finally {
    rmDir(slot.dir);
  }
}

module.exports = {
  probe, run, refill, cleanupAll, startSiteServer,
  MIN_VERSION, RUNNER, POOL_SIZE,
  // 给测试用
  _inspect: inspect,
  _spawnWarm: spawnWarm,
  _findSiteDir: findSiteDir,
  _poolState: () => ({ slots: slots.length }),
  _resetProbe() {
    cachedProbe = null; pyInfo = null; shuttingDown = false;
    slots.length = 0;
    if (siteServer) { try { siteServer.close(); } catch (e) {} }
    siteServer = null; siteUrl = null; siteStarting = null;
  }
};
