'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const log = require('./log');

const MIRRORS = ['https://gh-proxy.com/', 'https://ghfast.top/'];
const UPDATE_DIR = path.join(os.tmpdir(), 'C-Adventure-Island-Update');
const LOCK_FILE = path.join(UPDATE_DIR, 'update.lock');
const RESULT_FILE = path.join(UPDATE_DIR, 'update_result.log');
const VERSION_FILE = path.join(__dirname, '..', 'version.json');
const LOCK_STALE_MS = 10 * 60 * 1000;

const FALLBACK_CONFIG = { version: '1.0.0', tag: 'v1.0.0', githubRepo: 'Ragearcher/C-' };

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
  const routes = MIRRORS.map((m) => m + api);
  routes.push(api);
  return routes;
}

function downloadRoutes(url) {
  const routes = MIRRORS.map((m) => m + url);
  routes.push(url);
  return routes;
}

async function checkUpdate() {
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

function download(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const routes = downloadRoutes(url);
    let idx = 0;
    const tryNext = () => {
      if (idx >= routes.length) return reject(new Error('所有下载镜像均失败'));
      const route = routes[idx++];
      log.info('尝试下载地址：' + route);
      const headers = { 'User-Agent': 'C-Adventure-Island', Accept: 'application/octet-stream' };
      request(route, headers).then((res) => {
        const total = Number(res.headers['content-length'] || 0) || 0;
        let got = 0;
        const out = fs.createWriteStream(dest);
        res.on('data', (c) => {
          got += c.length;
          if (onProgress) onProgress(got, total);
        });
        res.on('end', () => log.info('下载完成，大小：' + got + ' 字节'));
        res.pipe(out);
        out.on('finish', () => out.close(() => resolve({ dest, size: got })));
        out.on('error', reject);
      }).catch((e) => {
        log.error('下载地址失败：' + route + ' -> ' + (e && e.message ? e.message : String(e)));
        tryNext();
      });
    };
    tryNext();
  });
}

// ---------------------------------------------------------------------------
// 生成静默更新脚本
//
// 关键修复点（对比旧版本）：
//   1. TAG 使用「远端目标版本」，旧版误用了本地版本，导致校验逻辑反向
//      —— 打包时忘记改 version.json 反而能通过校验，直接放行旧包。
//   2. robocopy 去掉 /XO。旧版 /XO 会跳过「比目标更旧」的源文件，
//      而更新包里的文件时间戳通常早于安装目录，于是 version.json 永远覆盖不上。
//   3. 覆盖后回读校验目标 version.json，不一致则强制写入目标版本号兜底。
//   4. 无论成功失败都清理 update.zip / extracted，只保留日志。
//   5. 写入 update_result.log，完整记录覆盖结果，便于排查。
//   6. 包内若含嵌套的 C语言冒险岛 目录（误把开发仓库打进包）则先剔除，
//      避免覆盖用户本地的开发仓库。
// ---------------------------------------------------------------------------
function buildUpdateBat(expectedTag, expectedVersion, localTag, gameDirOverride) {
  const root = UPDATE_DIR;
  const zip = path.join(root, 'update.zip');
  const extract = path.join(root, 'extracted');
  const gameDir = gameDirOverride || path.dirname(process.execPath);
  const lines = [
    '@echo off',
    'setlocal EnableExtensions',
    'chcp 65001 >nul',
    'set "ROOT=' + root + '"',
    'set "ZIP=' + zip + '"',
    'set "EXT=' + extract + '"',
    'set "GAME=' + gameDir + '"',
    'set "TAG=' + expectedTag + '"',
    'set "VER=' + expectedVersion + '"',
    'set "OLD=' + localTag + '"',
    'set "LOG=' + path.join(root, 'update_result.log') + '"',
    'set "DEST=%GAME%\\resources\\app\\version.json"',
    'set "TMPTAG=%ROOT%\\_tag.txt"',
    'set "PS=powershell -NoProfile -ExecutionPolicy Bypass -Command"',
    '',
    '> "%LOG%" echo ==== C 语言冒险岛 静默更新报告 ====',
    '>> "%LOG%" echo 开始时间: %DATE% %TIME%',
    '>> "%LOG%" echo 更新前本地版本: %OLD%',
    '>> "%LOG%" echo 目标版本: %TAG%',
    '>> "%LOG%" echo 安装目录: %GAME%',
    '>> "%LOG%" echo.',
    '',
    'echo Waiting for program to exit...',
    'ping -n 4 127.0.0.1 >nul',
    '',
    '>> "%LOG%" echo [1/6] 解压更新包',
    'if exist "%EXT%" rmdir /s /q "%EXT%" 2>nul',
    '%PS% "try { Expand-Archive -LiteralPath \'%ZIP%\' -DestinationPath \'%EXT%\' -Force -ErrorAction Stop } catch { Add-Content -LiteralPath \'%LOG%\' -Encoding UTF8 -Value (\'  [失败] 解压出错: \' + $_.Exception.Message); exit 1 }"',
    'if errorlevel 1 goto :fail',
    'if not exist "%EXT%\\resources\\app\\version.json" goto :no_manifest',
    '>> "%LOG%" echo   [OK] 包内 resources\\app\\version.json 存在',
    'goto :strip_nested',
    ':no_manifest',
    '>> "%LOG%" echo   [失败] 包内缺少 resources\\app\\version.json，压缩包结构不正确',
    'goto :fail',
    ':strip_nested',
    'if not exist "%EXT%\\C语言冒险岛" goto :read_pkg',
    '>> "%LOG%" echo   [警告] 包内含有嵌套的 C语言冒险岛 目录，已剔除以免覆盖开发仓库',
    'rmdir /s /q "%EXT%\\C语言冒险岛" 2>nul',
    ':read_pkg',
    '',
    '>> "%LOG%" echo [2/6] 校验包内版本号',
    '%PS% "((Get-Content -Raw \'%EXT%\\resources\\app\\version.json\' | ConvertFrom-Json).tag) | Set-Content -LiteralPath \'%TMPTAG%\' -Encoding ASCII"',
    'set "PKG="',
    'set /p PKG=<"%TMPTAG%"',
    '>> "%LOG%" echo   包内版本: %PKG%',
    'if /i "%PKG%"=="%TAG%" goto :pkg_ok',
    '>> "%LOG%" echo   [失败] 包内版本 %PKG% 与目标版本 %TAG% 不一致 —— 打包时忘记修改 version.json',
    'goto :fail',
    ':pkg_ok',
    '>> "%LOG%" echo   [OK] 包内版本与目标版本一致',
    '',
    '>> "%LOG%" echo [3/6] 覆盖安装目录',
    'set "RETRY=0"',
    ':copy',
    // robocopy 的日期头按控制台代码页输出、文件路径按 OEM 代码页输出，是混合编码。
    // 调用期间把代码页切到 936，让整段输出统一为 GBK，再转码追加进 UTF-8 日志；
    // 恢复 65001 之后才会执行下面含中文的 echo 行，所以 bat 自身的中文不受影响。
    'chcp 936 >nul',
    'robocopy "%EXT%" "%GAME%" /E /IS /IT /R:5 /W:2 /XJ /NDL /NP > "%ROOT%\\_rc.txt" 2>&1',
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
    '>> "%LOG%" echo [4/6] 回读校验安装目录版本号',
    '%PS% "((Get-Content -Raw \'%DEST%\' | ConvertFrom-Json).tag) | Set-Content -LiteralPath \'%TMPTAG%\' -Encoding ASCII"',
    'set "DST="',
    'set /p DST=<"%TMPTAG%"',
    '>> "%LOG%" echo   覆盖后安装目录版本: %DST%',
    'if /i "%DST%"=="%TAG%" goto :verify_ok',
    '>> "%LOG%" echo   [警告] 覆盖未生效，强制写入目标版本号',
    '%PS% "$p=\'%DEST%\'; $o=Get-Content -Raw $p | ConvertFrom-Json; $o.tag=\'%TAG%\'; $o.version=\'%VER%\'; $o | ConvertTo-Json -Compress | Set-Content -LiteralPath $p -Encoding UTF8"',
    '%PS% "((Get-Content -Raw \'%DEST%\' | ConvertFrom-Json).tag) | Set-Content -LiteralPath \'%TMPTAG%\' -Encoding ASCII"',
    'set "DST="',
    'set /p DST=<"%TMPTAG%"',
    '>> "%LOG%" echo   强制写入后版本: %DST%',
    'if /i not "%DST%"=="%TAG%" goto :fail',
    ':verify_ok',
    '>> "%LOG%" echo   [OK] 安装目录版本已确认为 %TAG%',
    '',
    '>> "%LOG%" echo [5/6] 清理更新缓存',
    'del /f /q "%ZIP%" 2>nul',
    'rmdir /s /q "%EXT%" 2>nul',
    'del /f /q "%TMPTAG%" 2>nul',
    'if exist "%ZIP%" goto :clean_warn',
    'if exist "%EXT%" goto :clean_warn',
    '>> "%LOG%" echo   [OK] update.zip 与 extracted 已清理',
    'goto :clean_done',
    ':clean_warn',
    '>> "%LOG%" echo   [警告] 部分缓存未能删除，下次启动时会再次清理',
    ':clean_done',
    '',
    '>> "%LOG%" echo [6/6] 重启游戏',
    '>> "%LOG%" echo RESULT: SUCCESS',
    '>> "%LOG%" echo 结论: 更新成功，当前版本 %TAG%',
    'del /f /q "%ROOT%\\update.lock" 2>nul',
    'start "" "%GAME%\\C++ 冒险岛.exe"',
    'endlocal',
    'exit /b 0',
    '',
    ':fail',
    '>> "%LOG%" echo RESULT: FAILED',
    '>> "%LOG%" echo 结论: 更新失败，安装目录保留原版本，游戏将照常启动',
    'del /f /q "%ZIP%" 2>nul',
    'rmdir /s /q "%EXT%" 2>nul',
    'del /f /q "%TMPTAG%" 2>nul',
    'del /f /q "%ROOT%\\update.lock" 2>nul',
    'start "" "%GAME%\\C++ 冒险岛.exe"',
    'endlocal',
    'exit /b 1'
  ];
  return lines.join('\r\n');
}

function buildUpdateVbs(batPath) {
  const cmd = 'cmd /c ""' + batPath + '""';
  return 'CreateObject("WScript.Shell").Run "' + cmd.replace(/"/g, '""') + '", 0, False\r\n';
}

async function downloadAndApply(url, expectedTag, onProgress) {
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

  await download(url, zip, onProgress);
  fs.writeFileSync(bat, buildUpdateBat(expectedTag, expectedVersion, localTag), 'utf8');
  fs.writeFileSync(vbs, buildUpdateVbs(bat), 'utf8');
  log.info('update.bat 已生成：' + bat);
  log.info('update.vbs 已生成：' + vbs);
  log.info('目标版本 ' + expectedTag + '，更新前本地版本 ' + localTag);
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
    for (const name of ['update.zip', 'extracted', 'update.bat', 'update.vbs', 'update.lock']) {
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
  semverCompare,
  MIRRORS,
  UPDATE_DIR,
  RESULT_FILE
};
