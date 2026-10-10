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

function normalizeOutput(text) {
  return String(text || '').replace(/\r\n/g, '\n');
}

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

    const args = ['-std=c11', '-O2', '-Wall', '-Wextra', srcPath, '-o', exePath];
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

async function checkCode(code, stdin, check) {
  const checkType = check && check.type;

  if (checkType === 'harness') {
    const source = `${code}\n\n${check.harness || ''}`;
    const result = await executeCpp(source, stdin);
    return {
      ...result,
      pass: result.ok,
      stdout: normalizeOutput(result.stdout),
      stderr: normalizeOutput(result.stderr)
    };
  }

  const result = await executeCpp(code, stdin);
  const stdout = normalizeOutput(result.stdout);
  if (checkType === 'output') {
    const expect = normalizeOutput(check.expect || '');
    result.pass = result.ok && stdout.trim() === expect.trim();
  } else if (checkType === 'contains') {
    result.pass = result.ok && stdout.includes(check.expect || '');
  } else {
    result.pass = result.ok;
  }
  result.stdout = stdout;
  result.stderr = normalizeOutput(result.stderr);
  return result;
}

module.exports = { CPP_COMPILER, executeCpp, checkCode, normalizeOutput };