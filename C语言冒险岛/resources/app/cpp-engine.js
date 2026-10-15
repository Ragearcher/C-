'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFile } = require('child_process');

const CPP_COMPILER = (
  process.env.C_COMPILER ||
  (fs.existsSync('D:\\Tools\\Dev-Cpp\\MinGW64\\bin\\gcc.exe')
    ? 'D:\\Tools\\Dev-Cpp\\MinGW64\\bin\\gcc.exe'
    : 'gcc')
);

// 编译参数：显式把源码字符集和运行期字符集都钉死成 UTF-8。
// 不钉死的话，不同 MinGW 发行版默认代码页不一样，中文答案会出现
// 「屏幕上看起来一模一样、判题却不过」的情况。
const COMPILE_ARGS = [
  '-std=c11', '-O2', '-Wall', '-Wextra',
  '-finput-charset=UTF-8', '-fexec-charset=UTF-8'
];

// ===========================================================================
// 判题比较器
//
// 总原则（来自需求）：**只要答案对就算过，过程/写法/格式一律不追究。**
//
// 下面这些差异全部按「不影响答案」处理：
//   1. 换行符 CRLF / CR / LF（Windows 下 printf 输出的是 \r\n）
//   2. 每行结尾多余的空格、制表符
//   3. 结尾多余的空行
//   4. 全角空格、全角标点（中文输入法打出来的 ，：（）等）
//   5. 行内连续空格、数字之间的空格数量
//   6. 缩进差异（仅当标准答案本身没有缩进时才放宽）
//   7. 中间多出来的空行（仅当标准答案本身没有空行时才放宽）
//   8. 小数写法差异：3.5 与 3.50、120 与 120.0
//   9. 程序退出码：答案对就对，不因为 return 1 或 void main 判错
//
// 同时刻意保留这些「不放宽」的边界，避免把错答案判成对：
//   - 标准答案本身带缩进（画图形题）时，缩进算内容，不放宽
//   - 数字个数必须一致（期望 9 时输出 9 8 不算过）
//   - 只有标准答案是单行时，才允许它作为输出中的一整行出现
// ===========================================================================

const LOOSE_MODES = {
  width: '已忽略全角半角差异',
  whitespace: '已忽略空白与换行差异',
  numeric: '已按数值等价判定',
  line: '答案出现在输出中'
};

function normalizeOutput(text) {
  return String(text === undefined || text === null ? '' : text)
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

// 全角 -> 半角（含全角空格、不间断空格）
function toHalfWidth(text) {
  return String(text)
    .replace(/\u3000/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
}

function stripTrailingSpace(text) {
  return text.replace(/[ \t]+$/gm, '');
}

function trimBlankEdges(text) {
  return text.replace(/^\n+/, '').replace(/\n+$/, '');
}

function tokens(text) {
  return String(text).split(/\s+/).filter(Boolean);
}

// 抹掉所有空白字符后的文本
function compact(text) {
  return String(text).replace(/\s+/g, '');
}

// 提取所有数字串（用于「抹空白」比较时的安全校验：
// 期望 "1 2 3" 而实际输出 "123" 不能算同一个答案）
function digitRuns(text) {
  return String(text).match(/\d+(?:\.\d+)?/g) || [];
}

function sameRuns(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function isWordChar(ch) {
  return !!ch && /[0-9A-Za-z._]/.test(ch);
}

// 抹掉空白后的包含判断，但要求匹配处不能在「单词/数字」中间。
// 这样 "你输入了 42" 能匹配 "你输入了42"，而 "19" 不会被当成包含 "9"。
function compactContains(actual, expect) {
  const a = compact(actual);
  const e = compact(expect);
  if (!e || e.length > a.length) return false;
  let from = 0;
  for (;;) {
    const i = a.indexOf(e, from);
    if (i < 0) return false;
    const before = i > 0 ? a[i - 1] : '';
    const after = i + e.length < a.length ? a[i + e.length] : '';
    const leftOk = !(isWordChar(e[0]) && isWordChar(before));
    const rightOk = !(isWordChar(e[e.length - 1]) && isWordChar(after));
    if (leftOk && rightOk) return true;
    from = i + 1;
  }
}

const NUMBER_RE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

function asNumbers(list) {
  if (!list || !list.length) return null;
  const out = [];
  for (const t of list) {
    if (!NUMBER_RE.test(t)) return null;
    out.push(Number(t));
  }
  return out;
}

function numericTokens(text) {
  return tokens(text).filter((t) => NUMBER_RE.test(t)).map(Number);
}

function sameNumber(a, b) {
  return Math.abs(a - b) <= 1e-9;
}

function seqEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function numSeqEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!sameNumber(a[i], b[i])) return false;
  return true;
}

// 期望序列是否作为「连续子序列」出现在实际序列里
function containsSeq(haystack, needle) {
  if (!needle.length) return false;
  if (needle.length > haystack.length) return false;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    let hit = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) { hit = false; break; }
    }
    if (hit) return true;
  }
  return false;
}

function containsNumSeq(haystack, needle) {
  if (!needle.length || needle.length > haystack.length) return false;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    let hit = true;
    for (let j = 0; j < needle.length; j++) {
      if (!sameNumber(haystack[i + j], needle[j])) { hit = false; break; }
    }
    if (hit) return true;
  }
  return false;
}

// 标准答案里有没有「有意义」的排版（缩进 / 空行）。
// 有的话说明这些空白是答案的一部分（比如画三角形），后续不再放宽空白。
function expectHasLayout(halfWidthExpect) {
  return /^[ \t]/m.test(halfWidthExpect) || /\n[ \t]*\n/.test(halfWidthExpect);
}

/**
 * output 型判题：比较「实际输出」与「标准答案」。
 * @returns {{pass: boolean, mode: string}}
 */
function compareAnswer(actual, expect) {
  const A = normalizeOutput(actual);
  const E = normalizeOutput(expect);
  const Aw = toHalfWidth(A);
  const Ew = toHalfWidth(E);

  // 1) 精确：只忽略换行符和整体首尾空白
  if (A.trim() === E.trim()) return { pass: true, mode: 'exact' };

  // 2) 忽略每行行尾空白与结尾空行
  const a2 = trimBlankEdges(stripTrailingSpace(A));
  const e2 = trimBlankEdges(stripTrailingSpace(E));
  if (a2 === e2) return { pass: true, mode: 'trailing' };

  // 3) 全角转半角后重来（中文输入法最常见的坑）
  const a3 = trimBlankEdges(stripTrailingSpace(Aw));
  const e3 = trimBlankEdges(stripTrailingSpace(Ew));
  if (a3 === e3) return { pass: true, mode: 'width' };

  const hasLayout = expectHasLayout(Ew);

  if (!hasLayout) {
    const aT = tokens(a3);
    const eT = tokens(e3);

    // 4) 完全抹掉空白后相等（空格位置、换行位置不同都算同一个答案）。
    //    额外要求数字串一一对应，避免 "1 2 3" 与 "123" 被判成同一个答案。
    const aC = compact(a3);
    const eC = compact(e3);
    if (eC && aC === eC && sameRuns(digitRuns(a3), digitRuns(e3))) {
      return { pass: true, mode: 'whitespace' };
    }

    // 5) 按空白切成 token 后逐项相等
    if (eT.length && seqEqual(aT, eT)) return { pass: true, mode: 'whitespace' };

    // 6) 两边都是纯数字时按数值比较（3.50 == 3.5、120.0 == 120）
    if (numSeqEqual(asNumbers(aT), asNumbers(eT))) return { pass: true, mode: 'numeric' };
  }

  // 7) 标准答案是单行时，允许它作为输出里的一整行出现（容忍多余的提示文字）。
  //    必须是完整的一行，避免「期望 9、输出 9 8」这种被误判为通过。
  const eLines = e3.split('\n').map((l) => l.trim()).filter(Boolean);
  if (eLines.length === 1) {
    const aLines = a3.split('\n').map((l) => l.trim());
    if (aLines.includes(eLines[0])) return { pass: true, mode: 'line' };
  }

  return { pass: false, mode: 'mismatch' };
}

/**
 * contains 型判题：标准答案只要出现在输出里就算过。
 */
function compareContains(actual, expect) {
  const A = normalizeOutput(actual);
  const E = normalizeOutput(expect);
  if (!E.trim()) return { pass: true, mode: 'empty' };

  if (A.includes(E)) return { pass: true, mode: 'exact' };

  const a2 = stripTrailingSpace(toHalfWidth(A));
  const e2 = stripTrailingSpace(toHalfWidth(E));
  if (a2.includes(e2)) return { pass: true, mode: 'width' };

  // 抹掉空白后再判断包含（"你输入了 42" 匹配 "你输入了42"），
  // 但不允许落在数字/单词中间
  if (compactContains(a2, e2)) return { pass: true, mode: 'whitespace' };

  const aT = tokens(a2);
  const eT = tokens(e2);
  if (containsSeq(aT, eT)) return { pass: true, mode: 'whitespace' };

  const aN = numericTokens(a2);
  const eN = asNumbers(eT);
  if (eN && containsNumSeq(aN, eN)) return { pass: true, mode: 'numeric' };

  return { pass: false, mode: 'mismatch' };
}

// ===========================================================================
// 编译与执行
// ===========================================================================

function compileSource(source) {
  return new Promise((resolve) => {
    let workDir;
    try {
      workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpp-quest-'));
    } catch (e) {
      resolve({ ok: false, compileError: true, message: '创建临时目录失败：' + e.message });
      return;
    }

    const srcPath = path.join(workDir, 'main.c');
    const exePath = path.join(workDir, 'main.exe');
    try {
      fs.writeFileSync(srcPath, source, 'utf8');
    } catch (e) {
      resolve({ ok: false, compileError: true, message: '写入源码失败：' + e.message });
      return;
    }

    const args = COMPILE_ARGS.concat([srcPath, '-o', exePath]);
    execFile(CPP_COMPILER, args, { timeout: 15000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        const message = (stderr || '').trim() || (stdout || '').trim() || err.message;
        try { fs.rmSync(workDir, { recursive: true, force: true }); } catch (e) {}
        resolve({ ok: false, compileError: true, message });
        return;
      }
      resolve({ ok: true, workDir, exePath });
    });
  });
}

function runBinary(workDir, exePath, stdin) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let finished = false;
    let child;

    try {
      child = spawn(exePath, [], {
        cwd: workDir,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (e) {
      resolve({ timedOut: false, stdout: '', stderr: '启动程序失败：' + e.message, exitCode: 1, signal: null });
      return;
    }

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch (e) {}
    }, 5000);

    child.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    child.stderr.on('data', (d) => { stderr += d.toString('utf8'); });
    child.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ timedOut, stdout, stderr: stderr || err.message, exitCode: 1, signal: null });
    });
    child.on('close', (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ timedOut, stdout, stderr, exitCode: code, signal });
    });

    child.stdin.on('error', () => {});
    if (stdin != null && stdin !== '') {
      child.stdin.write(String(stdin), 'utf8');
    }
    child.stdin.end();
  });
}

async function executeCpp(code, stdin) {
  if (typeof code !== 'string' || code.trim() === '') {
    return { ok: false, compileError: false, stage: 'run', stdout: '', stderr: '代码不能为空' };
  }

  const compiled = await compileSource(code);
  if (!compiled.ok) {
    return {
      ok: false,
      compileError: true,
      stage: 'compile',
      stdout: '',
      stderr: compiled.message
    };
  }

  const run = await runBinary(compiled.workDir, compiled.exePath, stdin);
  try { fs.rmSync(compiled.workDir, { recursive: true, force: true }); } catch (e) {}

  return {
    ok: run.exitCode === 0 && !run.timedOut,
    compileError: false,
    stage: 'run',
    stdout: run.stdout,
    stderr: run.stderr,
    exitCode: run.exitCode,
    signal: run.signal,
    timedOut: run.timedOut
  };
}

// ===========================================================================
// 判题入口
// ===========================================================================

async function checkCode(code, stdin, check) {
  const checkType = (check && check.type) || 'run';

  // harness：把测试代码拼在用户代码后面一起编译运行，靠断言退出码判定
  if (checkType === 'harness') {
    const source = `${code}\n\n${check.harness || ''}`;
    const result = await executeCpp(source, stdin);
    let pass = result.ok;
    // 断言失败但输出里出现了期望关键字时，也放行一次（兼容只看输出的 harness）
    if (!pass && !result.compileError && !result.timedOut && check.expect) {
      pass = compareContains(result.stdout, check.expect).pass;
    }
    return {
      ...result,
      pass,
      matchMode: pass ? 'harness' : 'mismatch',
      stdout: normalizeOutput(result.stdout),
      stderr: normalizeOutput(result.stderr)
    };
  }

  const result = await executeCpp(code, stdin);
  const stdout = normalizeOutput(result.stdout);
  const stderr = normalizeOutput(result.stderr);

  if (result.compileError) {
    return { ...result, pass: false, matchMode: 'compile-error', stdout, stderr };
  }
  if (result.timedOut) {
    return { ...result, pass: false, matchMode: 'timeout', stdout, stderr };
  }

  let verdict;
  if (checkType === 'project') {
    // 项目题没有标准答案：能编译、能跑完、并且确实产生了输出，就算完成。
    // 不再要求退出码为 0 —— 初学者写 void main() 时退出码本身是不确定的。
    const hasOutput = stdout.trim().length > 0 || stderr.trim().length > 0;
    verdict = { pass: hasOutput || result.exitCode === 0, mode: hasOutput ? 'ran-with-output' : 'ran' };
  } else if (checkType === 'contains') {
    verdict = compareContains(stdout, check.expect || '');
  } else if (checkType === 'output') {
    verdict = compareAnswer(stdout, check.expect || '');
  } else {
    verdict = { pass: true, mode: 'ran' };
  }

  return { ...result, pass: verdict.pass, matchMode: verdict.mode, stdout, stderr };
}

module.exports = {
  CPP_COMPILER,
  COMPILE_ARGS,
  executeCpp,
  checkCode,
  normalizeOutput,
  toHalfWidth,
  compareAnswer,
  compareContains,
  LOOSE_MODES
};
