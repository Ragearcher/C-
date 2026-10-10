/* ============================================================
   update-check.js —— Python 冒险岛 轻量自动更新模块（纯 Node，可独立测试）

   职责：
     1. checkUpdate(url)    读取并校验远端更新清单（latest.json）
     2. isNewer(remote, cur) 判断远端版本是否比当前新（语义化版本）
     3. download(url, dest) 流式下载安装包，带进度回调
     4. sha256File(file)    计算本地文件 sha256，用于完整性校验

   设计约束：
     - 不依赖 Electron：main.js 之外，测试脚本也能直接 require 它，
       所以「版本判断、清单校验、下载、哈希」这些真逻辑都能无 GUI 验证。
     - 清单只信白名单字段，杜绝把服务器上的任意 JSON 透传给页面。
     - 生产必须用 https + sha256 双重把关；http 只允许出现在
       明确开启的本地测试（PQ_UPDATE_URL=http://127.0.0.1:...）里。
   ============================================================ */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { URL } = require('url');

const DEFAULT_TIMEOUT_MS = 10000;      // 连不上 / 太慢都算失败，不干等
const MAX_MANIFEST_BYTES = 64 * 1024;  // 清单不该超过 64KB，防撑爆内存
const MAX_REDIRECTS = 5;               // 跳转最多跟 5 跳（GitHub 只用 1 跳）
const STALL_TIMEOUT_MS = 30000;        // 下载时 30 秒没有新数据就认定卡住

/* ---------------- 版本比较 ---------------- */

/** "1.0.3" / "v1.0.3" → {major,minor,patch}；解析不了返回 null */
function parseVersion(v) {
  if (typeof v !== 'string') return null;
  const m = v.trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

/** remote 比 current 新才算 true；版本号不合法一律 false（宁可不更，不乱更） */
function isNewer(remote, current) {
  const r = parseVersion(remote);
  const c = parseVersion(current);
  if (!r || !c) return false;
  if (r.major !== c.major) return r.major > c.major;
  if (r.minor !== c.minor) return r.minor > c.minor;
  return r.patch > c.patch;
}

/* ---------------- 清单获取 ---------------- */

/**
 * 判断这次响应是不是一次跳转；是的话返回下一跳的 URL，不是则返回 null。
 *
 * 为什么必须跟跳转：把 GitHub Release 当更新源时，清单地址
 * `releases/latest/download/latest.json` 和安装包地址都**一定会 302**
 * 跳到 objects.githubusercontent.com。不跟跳转的话，接 GitHub 会直接
 * 死在「更新服务器返回 HTTP 302」上 —— 国内能用的托管方式里 GitHub 是
 * 最常见的选择，不跟跳转等于自己把路堵了。
 *
 * 三条安全约束，一条都不能省：
 *   1. 最多 MAX_REDIRECTS 跳，防重定向死循环把应用卡住
 *   2. 每跳都必须是 http / https
 *   3. **https 不许降级成 http** —— 否则中间人只要在首次请求上回一个
 *      302 指到明文地址，就能把清单和安装包整个换掉。sha256 虽然还能挡住
 *      篡改，但清单本身被换掉就等于 sha256 也一起被换掉了。
 */
function followRedirect(res, currentUrl, hop) {
  const code = res.statusCode;
  if (code < 300 || code >= 400) return null;
  const loc = res.headers.location;
  if (!loc) return null;               // 3xx 却没给 Location，交给状态码检查去报错
  res.resume();                        // 把响应体读掉，释放连接
  if (hop >= MAX_REDIRECTS) throw new Error('更新地址跳转次数过多（超过 ' + MAX_REDIRECTS + ' 次）');
  let next;
  try {
    next = new URL(loc, currentUrl);   // Location 可能是相对地址，要基于当前地址解析
  } catch (e) {
    throw new Error('跳转地址无效: ' + loc);
  }
  if (next.protocol !== 'https:' && next.protocol !== 'http:') {
    throw new Error('跳转到了不支持的协议: ' + next.protocol);
  }
  if (currentUrl.protocol === 'https:' && next.protocol !== 'https:') {
    throw new Error('跳转把 https 降级成了 ' + next.protocol + '，已拒绝');
  }
  return next;
}

function fetchJson(url, opts) {
  return new Promise((resolve, reject) => {
    let start;
    try { start = new URL(url); } catch (e) { return reject(new Error('更新地址无效: ' + url)); }

    // 一次请求可能因为跳转发生多次，旧请求迟到的 timeout / error 事件
    // 不能把后面那一跳的结果带偏 —— 所以只认第一次 settle。
    let settled = false;
    const ok = v => { if (!settled) { settled = true; resolve(v); } };
    const fail = e => { if (!settled) { settled = true; reject(e); } };

    function once(target, hop) {
      if (target.protocol !== 'https:' && target.protocol !== 'http:') {
        return fail(new Error('更新地址协议不支持: ' + target.protocol));
      }
      const lib = target.protocol === 'https:' ? https : http;
      const req = lib.get(target, {
        timeout: (opts && opts.timeoutMs) || DEFAULT_TIMEOUT_MS,
        headers: {
          'user-agent': (opts && opts.userAgent) || 'pyquest-updater/1.0',
          'accept': 'application/json'
        }
      }, res => {
        let next;
        try { next = followRedirect(res, target, hop); }
        catch (e) { return fail(e); }
        if (next) return once(next, hop + 1);

        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return fail(new Error('更新服务器返回 HTTP ' + res.statusCode));
        }
        const chunks = [];
        let size = 0;
        res.on('data', c => {
          size += c.length;
          if (size > ((opts && opts.maxBytes) || MAX_MANIFEST_BYTES)) {
            req.destroy();
            return fail(new Error('更新清单过大'));
          }
          chunks.push(c);
        });
        res.on('end', () => {
          try {
            ok(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch (e) {
            fail(new Error('更新清单不是合法 JSON'));
          }
        });
      });
      req.on('timeout', () => { req.destroy(); fail(new Error('连接更新服务器超时')); });
      req.on('error', e => fail(new Error('连接更新服务器失败: ' + e.message)));
    }

    once(start, 0);
  });
}

/** 只信任清单里这几个字段，其它一概丢弃 */
function normalizeManifest(m) {
  return {
    version: String(m.version),
    notes: String(m.notes || ''),
    url: String(m.url),
    sha256: m.sha256 ? String(m.sha256).toLowerCase() : ''
  };
}

/** 清单字段合法性检查；sha256 可缺省（但不建议，生产必须给） */
function validateManifest(m) {
  if (!m || typeof m !== 'object') return '清单为空';
  if (typeof m.version !== 'string' || !parseVersion(m.version)) return '版本号不合法: ' + m.version;
  if (typeof m.url !== 'string' || !/^https?:\/\//i.test(m.url)) return '安装包地址不合法';
  if (m.sha256 != null && !/^[0-9a-f]{64}$/i.test(String(m.sha256))) return 'sha256 格式不合法';
  return '';
}

/** 拉取并校验清单，返回 {version, notes, url, sha256} */
async function checkUpdate(manifestUrl, opts) {
  const raw = await fetchJson(manifestUrl, opts);
  const reason = validateManifest(raw);
  if (reason) throw new Error('更新清单无效: ' + reason);
  return normalizeManifest(raw);
}

/* ---------------- 下载与哈希 ---------------- */

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    const s = fs.createReadStream(file);
    s.on('error', reject);
    s.on('data', d => h.update(d));
    s.on('end', () => resolve(h.digest('hex')));
  });
}

/**
 * 流式下载到 destPath（先写 .part 再改名，半途失败不留半截文件）。
 * onProgress({received, total})：total 可能为 0（服务器没给 Content-Length）。
 */
function download(url, destPath, opts) {
  const stallMs = (opts && opts.stallMs) || STALL_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    let start;
    try { start = new URL(url); } catch (e) { return reject(new Error('下载地址无效: ' + url)); }

    // 同 fetchJson：跳转会让旧请求的迟到事件和新请求赛跑，只认第一次 settle
    let settled = false;
    let stallTimer = null;
    const stopStall = () => { if (stallTimer) { clearInterval(stallTimer); stallTimer = null; } };
    const ok = v => { if (!settled) { settled = true; stopStall(); resolve(v); } };
    const fail = e => {
      if (settled) return;
      settled = true;
      stopStall();
      // 失败就把半截文件清掉：传到一半卡住时 .part 已经落盘了，
      // 不清理的话临时目录里会越攒越多（重试几次就一堆）
      try { fs.unlinkSync(destPath + '.part'); } catch (e2) { /* 本来就没有 */ }
      reject(e);
    };

    function once(target, hop) {
      if (target.protocol !== 'https:' && target.protocol !== 'http:') {
        return fail(new Error('下载协议不支持: ' + target.protocol));
      }
      const lib = target.protocol === 'https:' ? https : http;
      let lastActivity = Date.now();
      const touch = () => { lastActivity = Date.now(); };

      const req = lib.get(target, {
        timeout: (opts && opts.timeoutMs) || DEFAULT_TIMEOUT_MS,
        headers: { 'user-agent': (opts && opts.userAgent) || 'pyquest-updater/1.0' }
      }, res => {
        touch();
        let next;
        try { next = followRedirect(res, target, hop); }
        catch (e) { return fail(e); }
        if (next) return once(next, hop + 1);

        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return fail(new Error('下载失败: HTTP ' + res.statusCode));
        }
        const total = parseInt(res.headers['content-length'] || '0', 10) || 0;
        let got = 0;
        const hash = crypto.createHash('sha256');
        const tmp = destPath + '.part';
        const out = fs.createWriteStream(tmp);
        res.on('data', c => {
          touch();
          got += c.length;
          hash.update(c);
          if (opts && opts.onProgress) opts.onProgress({ received: got, total });
        });
        res.pipe(out);
        out.on('error', fail);
        out.on('finish', () => {
          out.close(() => {
            try {
              fs.renameSync(tmp, destPath);
              ok({ path: destPath, bytes: got, sha256: hash.digest('hex') });
            } catch (e) {
              fail(e);
            }
          });
        });
      });
      req.on('timeout', () => { req.destroy(); fail(new Error('下载超时')); });
      req.on('error', e => fail(new Error('下载失败: ' + e.message)));

      /* 停滞检测。
         为什么 socket 的 timeout 不够：那个只管「I/O 空闲」，实测在
         「TCP 连上了、但服务器一直不来数据」的情况下它并不触发 ——
         学生看到的现象是「下载中…」永远停在那里，没有报错也没有进度，
         只能去关进程重开。所以这里自己盯进度：超过 stallMs 没有新字节就判失败，
         界面上会变成可点的「重试下载」。 */
      stopStall();
      stallTimer = setInterval(() => {
        if (Date.now() - lastActivity > stallMs) {
          req.destroy();
          fail(new Error('下载卡住了（' + Math.round(stallMs / 1000) + ' 秒没有任何数据），像是网络问题，稍后重试'));
        }
      }, 2000);
      if (stallTimer.unref) stallTimer.unref();
    }

    once(start, 0);
  });
}

/* _followRedirect 是内部函数，导出来只为让测试能单独验那三条安全约束
   （尤其是「https 不许降级成 http」—— 用真实服务器测不了，得构造响应对象）。 */
module.exports = {
  parseVersion, isNewer, checkUpdate, download, sha256File,
  _followRedirect: followRedirect, _MAX_REDIRECTS: MAX_REDIRECTS
};
