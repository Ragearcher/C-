/* ============================================================
   pyodide-runner.js
   在浏览器里跑真·CPython（Pyodide / WebAssembly）
   在桌面端（Electron）里优先跑本机真·CPython，见下方「原生引擎」一节
   - 支持 input()：从页面上的「标准输入」框按行读取
   - 捕获 stdout / stderr / 异常
   - 死循环保护：sys.settrace 限制执行步数 / 时间
   - 自动判题：用户代码与隐藏测试跑在同一个命名空间
   ============================================================ */

const PyRunner = (() => {
  const PYODIDE_VERSION = 'v0.28.0';
  // 第一项是随包分发的本地副本（离线可用，APK 里走 assets）；
  // 本地取不到时（例如用 file:// 打开被 CORS 拦住）自动退到 CDN。
  const CDN_LIST = [
    'pyodide/',
    `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`,
    `https://unpkg.com/pyodide@${PYODIDE_VERSION.replace('v', '')}/`,
    `https://cdn.jsdelivr.net/npm/pyodide@${PYODIDE_VERSION.replace('v', '')}/`
  ];

  /* ---------- 原生引擎的开关 ----------
     桌面端由 preload 注入 window.pqNative。
     浏览器 / 安卓 WebView 里这个对象不存在，下面所有分支都不会走到，
     行为与加入本功能之前完全一致。 */
  const native = (typeof window !== 'undefined' && window.pqNative) || null;

  // 原生引擎的护栏参数。真 CPython 单步太快，靠步数要等很久才触发，
  // 所以把步数上限放宽，改由「墙钟 6 秒」来拦死循环。
  // 6 秒是怎么定的：Pyodide 那份实测 1.5 秒就拦下了死循环；6 秒已经比它宽松，
  // 而课程里最重的一题（零钱兑换的经典用例）实测不到 50ms，留了 100 倍余量。
  // 再长用户就要对着转圈干等了，再短则可能误伤正常程序。
  const NATIVE_STEP_LIMIT = 200000000;
  const NATIVE_TIME_LIMIT = 6;
  const NATIVE_OUT_CAP = 400000;

  /* ---------- 设备能力 ----------
     实战工坊里每个方向都会声明自己需要什么能力（见 data-tracks.js 的 needs），
     界面拿这份表对一遍，做不到的地方会明确标出来。
     这些不是猜的，是实测出来的：
       · 浏览器沙箱里 urllib 直接报 "TLS not supported"，socket 建不起来 -> net 没有
       · subprocess 报 "emscripten does not support processes"        -> process 没有
       · tkinter 模块根本不存在                                        -> gui 没有
       · micropip 只能装纯 Python 包，且要联网                          -> pkg 没有
     本机 CPython 这四项全都有。 */
  const PYODIDE_CAPS = { net: false, process: false, gui: false, pkg: false };
  const NATIVE_CAPS = { net: true, process: true, gui: true, pkg: true };

  let engine = native ? 'native' : 'pyodide';   // 实际以 init 的探测结果为准
  let nativeInfo = null;
  let pyodide = null;
  let ready = false;
  let loading = null;
  let sitePrefetch = null;      // 练习靶场的预取结果（网页版用）
  let preloadProxy = null;      // 上一轮注入的 PyProxy，要显式销毁免得泄内存

  /* ---------- 练习靶场预取（网页版） ----------
     浏览器沙箱里 urllib 用不了（TLS not supported），所以改成：
     先把整个靶场用 fetch 抓下来，把「状态码 + 响应头 + 正文」整表交给 Python，
     由判题外壳里的 shim 包装成一个和真 urllib 行为一致的 urlopen。
     桌面版走的是真 HTTP 服务，不会调用这里。 */
  async function prefetchSite() {
    if (sitePrefetch) return sitePrefetch;
    sitePrefetch = (async () => {
      try {
        const base = new URL('website/', (typeof document !== 'undefined' && document.baseURI) || location.href);
        const site = base.href.replace(/\/$/, '');
        const mf = await fetch(site + '/manifest.json', { cache: 'no-store' });
        if (!mf.ok) throw new Error('拿不到 manifest.json（HTTP ' + mf.status + '）');
        const list = (await mf.json()).files || [];
        const files = await Promise.all(list.map(async rel => {
          const r = await fetch(site + rel, { cache: 'no-store' });
          const headers = {};
          r.headers.forEach((v, k) => { headers[k] = v; });
          return {
            path: rel,
            status: r.status,
            reason: r.statusText || '',
            headers: headers,
            body: await r.text()
          };
        }));
        console.log('[PyRunner] 练习靶场已预取 ' + files.length + ' 个文件');
        return { site: site, files: files };
      } catch (e) {
        // 靶场拿不到不影响其它章节，只是网络那几关跑不了
        console.warn('[PyRunner] 靶场预取失败，网络章节将无法运行：', e);
        return null;
      }
    })();
    return sitePrefetch;
  }

  /* ---------- 装载 Pyodide ---------- */
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = () => reject(new Error('脚本加载失败: ' + url));
      document.head.appendChild(s);
    });
  }

  async function tryIndex(i) {
    if (i >= CDN_LIST.length) throw new Error('所有 CDN 都无法访问');
    const base = CDN_LIST[i];
    try {
      if (typeof window.loadPyodide === 'undefined') {
        await loadScript(base + 'pyodide.js');
      }
      return await window.loadPyodide({ indexURL: base });
    } catch (e) {
      console.warn('[PyRunner] CDN 失败，尝试下一个：', base, e);
      return tryIndex(i + 1);
    }
  }

  function initPyodide(onStatus) {
    onStatus && onStatus('正在加载 Python 运行时…（约 12MB，首次启动稍慢）');
    return tryIndex(0).then(py => {
      onStatus && onStatus('正在初始化解释器…');
      pyodide = py;
      engine = 'pyodide';
      ready = true;
      // 后台把练习靶场抓下来。不 await：它只影响网络那几关，
      // 没必要让整站就绪都等它。
      prefetchSite();
      onStatus && onStatus('Python 引擎就绪，可以开始写代码了', 'ok');
      return py;
    });
  }

  /* ---------- 原生引擎（桌面端） ---------- */
  function initNative(onStatus) {
    onStatus && onStatus('正在检测本机 Python…');
    return Promise.resolve(native.probe()).then(info => {
      if (!info || !info.available) {
        throw new Error((info && info.reason) || '本机没有可用的 Python');
      }
      nativeInfo = info;
      engine = 'native';
      ready = true;
      onStatus && onStatus('已接上本机 Python ' + info.version + ' —— 启动快，还能 import 第三方库', 'ok');
      return info;
    });
  }

  function init(onStatus) {
    if (ready) return Promise.resolve(pyodide);
    if (loading) return loading;
    loading = (async () => {
      if (native) {
        try {
          await initNative(onStatus);
          return null;              // 原生引擎不需要 Pyodide 实例
        } catch (e) {
          // 本机没 Python（或版本太老）时静默回落，课程内容照样能看
          console.warn('[PyRunner] 本机 Python 不可用，回落到内置引擎：', e);
          onStatus && onStatus('本机没找到 Python，改用内置引擎（首次启动会慢一些）…');
        }
      }
      return await initPyodide(onStatus);
    })().catch(err => {
      loading = null;
      onStatus && onStatus('Python 引擎加载失败：' + err.message + '。课程内容仍可正常阅读。', 'err');
      throw err;
    });
    return loading;
  }

  /* ---------- 执行外壳（Python 侧） ---------- */
  const HARNESS = `
import sys, io, builtins, traceback as __tb

__real_out = sys.stdout
__real_in  = builtins.input

# ---------- 输出缓冲 ----------
# 浏览器里不设上限（保持原样）；原生 CPython 跑得快得多，一段
# "while True: print(...)" 几十秒就能把内存吃爆，所以由调用方给一个上限。
__OUT_CAP = int(globals().get('__OUT_CAP__', 0) or 0)
if __OUT_CAP > 0:
    # 注意：上限走 self.limit 传进来，不能在 write() 里直接引用模块级的 __OUT_CAP。
    # 类体内部以双下划线开头的名字会被 Python 改名（__OUT_CAP -> _CapIO__OUT_CAP），
    # 结果就是每次 print 都抛 NameError —— 这个坑踩过一次，别改回去。
    class __CapIO(io.StringIO):
        truncated = False
        limit = 0
        def write(self, s):
            room = self.limit - self.tell()
            if room <= 0:
                self.truncated = True
                return len(s)
            if len(s) > room:
                self.truncated = True
                s = s[:room]
            return io.StringIO.write(self, s)
    __buf = __CapIO()
    __buf.limit = __OUT_CAP
else:
    __buf = io.StringIO()
sys.stdout = __buf
sys.stderr = __buf

# ---------- 模拟 input() ----------
__lines = list(__STDIN_TEXT__.splitlines())
__idx = [0]
def __input(prompt=""):
    if prompt:
        __buf.write(str(prompt))
    if __idx[0] >= len(__lines):
        raise EOFError("输入不够啦！请在下面的『标准输入』框里补充数据，每行一个。")
    v = __lines[__idx[0]]
    __idx[0] += 1
    return v
builtins.input = __input

# ---------- 死循环保护 ----------
# 两道护栏，按引擎各自的特点取用：
#   步数上限 —— 浏览器（Pyodide）里每步本来就慢，4M 步 ≈ 几秒，够用；
#   时间上限 —— 原生 CPython 单步极快，靠步数要跑很久才触发，
#              所以原生引擎传一个很大的步数上限 + 8 秒时间上限，两者都留。
import time as __time

__LIMIT = int(globals().get('__STEP_LIMIT__', 4000000) or 4000000)
__TIME_LIMIT = float(globals().get('__TIME_LIMIT__', 0) or 0)
__t0 = __time.monotonic()
__count = [0]

__LOOP_MSG = ("可能是死循环（已自动中断）。检查一下 while 的条件会不会永远为真？")

def __trace(frame, event, arg):
    if event == 'line':
        __count[0] += 1
        if __count[0] > __LIMIT:
            raise RuntimeError("代码跑了太多步，" + __LOOP_MSG)
        if __TIME_LIMIT and (__count[0] & 0x7FFF) == 0:
            if __time.monotonic() - __t0 > __TIME_LIMIT:
                raise RuntimeError("代码跑了太久，" + __LOOP_MSG)
    return __trace

__err = ""
__test_pass = None
__test_msg = ""
# 判题时用户代码不作为主程序运行 —— 只当成一个模块来检查。
# 这样「想自己看效果」用的 if __name__ == '__main__': 演示块在判题时不会执行：
# 否则 GUI 题目的 mainloop() 会把判题永远挂住（实测过：8 分钟没动静），
# 起服务、建临时目录这类演示副作用也不该在判题时发生。
__g = {"__name__": "__main__" if not __TEST_SRC__.strip() else "__judge__"}

# ---------- 课程预置常量 ----------
# 网络那一章需要知道练习靶场的地址（桌面版指向本地起的服务，网页版指向同源目录）。
# 其它章节不传，这里就是空字典，行为与加这个功能之前完全一致。
__PRELOAD__ = globals().get('__PRELOAD__', None) or {}
__g.update(__PRELOAD__)

# ---------- 网页版没有真 socket，用预取好的响应表顶上 ----------
# 浏览器沙箱里 urllib 走不了（TLS not supported），所以网页版改成：
# JS 侧先用 fetch 把整个靶场抓下来，把「状态码 + 响应头 + 正文」整表传进来，
# 这里再把它包装成一个和真 urllib 行为一致的 urlopen。
# 桌面版不传这个缓存（它真发 HTTP 请求），所以整段不会生效。
#
# 注意：下面类体内部引用模块级变量时用的是单下划线名（_io / _urlreq）。
# 类体里引用双下划线开头的模块级名字会被 Python 改名成 _类名__名字，
# 直接 NameError —— 这个坑在外壳的输出限流类上踩过一次，别再改回去。
__HTTP_CACHE__ = globals().get('__HTTP_CACHE__', None)
if __HTTP_CACHE__:
    import io as _io
    import email.message as _emailmsg
    import urllib.request as _urlreq
    import urllib.error as _urlerr

    _site = __PRELOAD__.get('SITE', '')
    _table = {}
    for _e in __HTTP_CACHE__:
        _table[_site + _e['path']] = _e

    # 真 urllib 返回的响应头是 email.message.Message，查键<strong>不区分大小写</strong>。
    # 用普通 dict 顶替的话，headers.get("Content-Type") 会拿到 None，
    # 和桌面版行为对不上 —— 保持一致比省事重要。
    def _pq_headers(src):
        _h = _emailmsg.Message()
        for _k in (src or {}):
            _h[_k] = src[_k]
        return _h

    def _pq_body(entry):
        return str((entry or {}).get('body', '')).encode('utf-8')

    _pq_404 = None
    for _e in __HTTP_CACHE__:
        if _e.get('path') == '/404.html':
            _pq_404 = _e

    class _PQResp(object):
        def __init__(self, url, status, headers, body):
            self.url = url
            self.status = status
            self.code = status
            self.reason = 'OK'
            self.headers = headers
            self._buf = _io.BytesIO(body)
        def read(self, size=-1):
            return self._buf.read(size)
        def getcode(self):
            return self.status
        def info(self):
            return self.headers
        def close(self):
            self._buf.close()
        def __enter__(self):
            return self
        def __exit__(self, *a):
            self.close()
            return False

    def _pq_urlopen(url, data=None, timeout=None, *a, **kw):
        if isinstance(url, _urlreq.Request):
            url = url.full_url
        url = str(url)
        # 访问靶场根目录等价于访问首页，跟真服务器一样
        if _site and url in (_site, _site + '/'):
            url = _site + '/index.html'
        if url in _table:
            _e = _table[url]
            _status = int(_e.get('status', 200))
            if _status >= 400:
                raise _urlerr.HTTPError(url, _status, _e.get('reason', 'Error'),
                                        _pq_headers(_e.get('headers')),
                                        _io.BytesIO(_pq_body(_e)))
            return _PQResp(url, _status, _pq_headers(_e.get('headers')), _pq_body(_e))
        # 靶场里没有这个文件。真服务器这时候就是 404，不是「连不上」——
        # 两者对初学者是两件事，别混。
        if _site and url.startswith(_site + '/'):
            raise _urlerr.HTTPError(url, 404, 'Not Found',
                                    _pq_headers((_pq_404 or {}).get('headers')),
                                    _io.BytesIO(_pq_body(_pq_404)))
        raise _urlerr.URLError(
            '网页版受浏览器沙箱限制，只能访问练习靶场：' + _site + chr(10)
            + '（桌面版没有这个限制，可以直接抓真实网站）')

    _urlreq.urlopen = _pq_urlopen

# ---------- 每次执行都在独立的临时目录里干活 ----------
# 两个原因，第二个是踩出来的：
#   1. 学生代码里 os.remove / open(...,'w') 是真会执行的。工作目录限在临时目录里，
#      误操作的影响范围就小得多（桌面版尤其重要，那里没有沙箱）。
#   2. 判题会跑两遍：先跑参考答案，再跑起始代码。参考答案写出的文件如果留在原地，
#      第二遍「什么都没写」的起始代码会直接读到它然后通过判题 ——
#      现象是「题目偏水」，真因是「测试没隔离」，两者长得一模一样，很难查。
__work = None
try:
    import os as _os_tmp
    import tempfile as _tempfile_tmp
    __work = _tempfile_tmp.mkdtemp(prefix='pq-run-')
    _os_tmp.chdir(__work)
except BaseException:
    __work = None          # 极端环境里建不出来就算了，不要因此让判题失败

try:
    sys.settrace(__trace)
    exec(compile(__USER_SRC__, "<你的代码>", "exec"), __g)
except SystemExit:
    pass
except BaseException as __e:
    # 只保留用户代码里的栈帧，别把外壳自己的 exec 帧露给初学者
    try:
        __frames = [f for f in __tb.extract_tb(__e.__traceback__)
                    if f.filename == "<你的代码>"] if __e.__traceback__ else []
        if __frames:
            # 注意：这里用 chr(10) 而不是转义换行 —— 外壳是 JS 模板字符串，
            # 反斜杠会被 JS 先吃掉，写成转义会在 Python 侧变成真换行导致语法错误。
            __err = ("Traceback (most recent call last):" + chr(10)
                     + "".join(__tb.format_list(__frames))
                     + "".join(__tb.format_exception_only(type(__e), __e)))
        else:
            # 语法错误等：format_exception_only 自带文件名、行号和插入符
            __err = "".join(__tb.format_exception_only(type(__e), __e))
    except BaseException:
        __err = __tb.format_exc()
finally:
    sys.settrace(None)

# ---------- 隐藏测试 ----------
if __err == "" and __TEST_SRC__.strip():
    __g["__OUTPUT__"] = __buf.getvalue()   # 让测试也能看到程序的输出
    # 也把用户源码交过去：有些题要检查「你到底写没写这些东西」
    # （比如「至少写 4 条断言」），光看运行结果判断不出来。
    __g["__SRC__"] = __USER_SRC__
    try:
        sys.settrace(__trace)
        exec(compile(__TEST_SRC__, "<自动测试>", "exec"), __g)
        __test_pass = True
    except AssertionError as __e:
        __test_pass = False
        __test_msg = str(__e) or "结果不符合要求"
    except BaseException as __e:
        __test_pass = False
        __test_msg = type(__e).__name__ + ": " + str(__e)
    finally:
        sys.settrace(None)

sys.stdout = __real_out
sys.stderr = __real_out
builtins.input = __real_in

# 收工：把临时工作目录连同里面的一切删掉。
# 放在最后是因为隐藏测试可能还要读用户代码写出来的文件。
if __work:
    try:
        import os as _os_cln
        import shutil as _shutil_cln
        import tempfile as _tempfile_cln
        _os_cln.chdir(_tempfile_cln.gettempdir())
        _shutil_cln.rmtree(__work, ignore_errors=True)
    except BaseException:
        pass

__RESULT_OUT__ = __buf.getvalue()
if getattr(__buf, 'truncated', False):
    __RESULT_OUT__ += chr(10) + chr(10) + "…（输出太长，后面还有内容没显示完）"
__RESULT_ERR__ = __err
__RESULT_PASS__ = __test_pass
__RESULT_MSG__ = __test_msg
`;

  /* ---------- 运行 ---------- */
  async function runNative(code, stdinText, testSrc) {
    let r;
    try {
      r = await native.run({
        code: code,
        stdin: stdinText || '',
        test: testSrc || '',
        // 判题外壳每次都从网页端带过去，桌面端不做自己的副本 ——
        // 这样两边判题规则永远同一份，不会出现「网页判过、桌面判不过」。
        harness: HARNESS,
        stepLimit: NATIVE_STEP_LIMIT,
        timeLimit: NATIVE_TIME_LIMIT,
        outCap: NATIVE_OUT_CAP
      });
    } catch (e) {
      // 引擎层出错（Python 崩了 / 进程被杀），按普通报错交给用户看
      return { out: '', err: 'Python 引擎出错：' + (e && e.message ? e.message : e),
               pass: null, msg: '' };
    }
    if (r && r.engineError) {
      return { out: '', err: 'Python 引擎出错：' + r.engineError, pass: null, msg: '' };
    }
    return {
      out: (r && r.out) || '',
      err: (r && r.err) || '',
      pass: r ? r.pass : null,
      msg: (r && r.msg) || ''
    };
  }

  async function run(code, stdinText, testSrc) {
    if (!ready) throw new Error('Python 引擎还没就绪');
    if (engine === 'native') return runNative(code, stdinText, testSrc);

    // 把靶场地址和预取好的响应表交给外壳。
    // 没有靶场的章节这里就是空字典 + None，外壳里的 shim 不会生效，
    // 与加网络功能之前的行为完全一致。
    const site = await prefetchSite();
    if (preloadProxy) {
      try { preloadProxy.destroy(); } catch (e) { /* 已经销毁过 */ }
      preloadProxy = null;
    }
    if (site) {
      preloadProxy = pyodide.toPy({ SITE: site.site });
      pyodide.globals.set('__PRELOAD__', preloadProxy);
      pyodide.globals.set('__HTTP_CACHE__', pyodide.toPy(site.files));
    } else {
      pyodide.globals.set('__PRELOAD__', pyodide.toPy({}));
      pyodide.globals.set('__HTTP_CACHE__', null);
    }

    pyodide.globals.set('__USER_SRC__', code);
    pyodide.globals.set('__STDIN_TEXT__', stdinText || '');
    pyodide.globals.set('__TEST_SRC__', testSrc || '');

    try {
      await pyodide.runPythonAsync(HARNESS);
      return {
        out: pyodide.globals.get('__RESULT_OUT__') || '',
        err: pyodide.globals.get('__RESULT_ERR__') || '',
        pass: pyodide.globals.get('__RESULT_PASS__'),
        msg: pyodide.globals.get('__RESULT_MSG__') || ''
      };
    } catch (e) {
      return { out: '', err: String(e && e.message ? e.message : e), pass: null, msg: '' };
    }
  }

  /* ---------- 判题 ---------- */

  /* 宽容比对用的「全角 → 半角」表。
     只收「在屏幕上看不出差别」的那几个标点：中文输入法下打 , : ; ? ! ( )
     出来的是全角，英文输入法下是半角，学生根本分不清自己打的是哪一种，
     但严格逐字符比对会直接判错、而且给的提示里两串字看着一模一样。
     刻意**不**收「。」和「、」—— 它们和 . / , 的视觉差别明显，
     不属于「看不见的差异」，有差别就该让学生看见。 */
  const FW2HW = {
    '\uFF01': '!', '\uFF0C': ',', '\uFF1A': ':', '\uFF1B': ';',
    '\uFF1F': '?', '\uFF08': '(', '\uFF09': ')'
  };
  const HW2FW = {};
  Object.keys(FW2HW).forEach(k => { HW2FW[FW2HW[k]] = k; });
  const PUNCT_NAME = {
    '!': '感叹号', ',': '逗号', ':': '冒号', ';': '分号', '?': '问号',
    '(': '左括号', ')': '右括号'
  };

  /* 宽容归一化：在 norm 之上，再把两类「看不见的差异」抹平 ——
       a) 全角标点 ↔ 半角标点
       b) 排版性的空格，只删这两种：
            · 紧邻汉字的空格（含全角空格）—— 中文本来就不用空格分词，
              课件的参考答案却在汉字和数字之间加了空格（「我今年 18 岁」），
              学生按自然写法不加，不该因此判错
            · 跟在分隔标点（: , ; 及其全角形式）后面的空格 ——
              「商: 3」「总分: 262」是书写习惯，写成「商:3」意思完全一样
     刻意**不**动的：行首缩进、ASCII 字符之间的空格（含连续多个）、换行结构。
     所以 ASCII 图形（金字塔）和靠空格对齐的表格仍然严格比对，不会放水。 */
  function loose(s) {
    let t = String(s == null ? '' : s).replace(/\r\n/g, '\n');
    t = t.replace(/[\uFF01\uFF0C\uFF1A\uFF1B\uFF1F\uFF08\uFF09]/g, ch => FW2HW[ch]);
    t = t.replace(/\u3000/g, ' ');
    // 连续删到不动为止：删掉一个空格可能让新的「紧邻汉字」关系出现
    let prev;
    do {
      prev = t;
      t = t.replace(/([\u3400-\u9fff:：,，;；]) +/g, '$1')
           .replace(/ +([\u3400-\u9fff])/g, '$1');
    } while (t !== prev);
    return t.split('\n')
      .map(l => l.replace(/\s+$/, ''))
      .filter(l => l.trim() !== '')
      .join('\n');
    // 这里**没有** .trim()：那会连首行的前导空格一起削掉，
    // 而金字塔题（期望 '    *' 开头）的缩进正是要验的东西。
    // （严格档的 norm 仍会 trim —— 那是既有的宽松，留着不动：
    //   改成不 trim 会让「输出行首多打了一个空格」变成误判错，
    //   而误判错正是这次要修的问题。）
  }

  /* 把单个字符说成人话。原来的提示直接贴两串文字，
     而「你好，小皮！」和「你好，小皮!」在屏幕上看着一模一样，
     新手根本不知道错在哪。 */
  function charName(ch) {
    if (ch === undefined) return '（到这里就没有了）';
    if (ch === '\n') return '换行';
    if (ch === ' ') return '空格';
    if (ch === '\u3000') return '全角空格（　）';
    if (FW2HW[ch]) return `全角${PUNCT_NAME[FW2HW[ch]]}（${ch}）`;
    if (HW2FW[ch]) return `半角${PUNCT_NAME[ch]}（${ch}）`;
    return `「${ch}」`;
  }

  /* 从头逐字比，描述第一处不一样的地方 */
  function diffOf(want, got) {
    const W = String(want == null ? '' : want);
    const G = String(got == null ? '' : got);
    const n = Math.min(W.length, G.length);
    let i = 0;
    while (i < n && W[i] === G[i]) i++;
    if (i === W.length && i === G.length) return '';
    return `第 ${i + 1} 个字符起不一样：期望是 ${charName(W[i])}，你的是 ${charName(G[i])}`;
  }

  /* contains 用的对齐版：学生输出常比期望多一截（input() 的提示语也会打印出来），
     直接从头比会整体错位。所以先在输出里找期望的最长前缀，从那里往后比。 */
  function diffInOutput(want, got) {
    const W = String(want == null ? '' : want);
    const G = String(got == null ? '' : got);
    let anchor = 0;
    for (let len = Math.min(W.length, 30); len >= 2; len--) {
      if (G.includes(W.slice(0, len))) { anchor = len; break; }
    }
    if (anchor === 0) return '';
    const at = G.indexOf(W.slice(0, anchor));
    return diffOf(W.slice(anchor), G.slice(at + anchor));
  }

  /* 「通过了，但你应该知道」。
     判过之后顺带说明差在哪 —— 学生这次不用改，但下次就知道
     屏幕上看着一样的两个字符其实是两个东西。 */
  function softNote(want, got) {
    const W = String(want == null ? '' : want);
    const G = String(got == null ? '' : got);
    for (const fw of Object.keys(FW2HW)) {
      const hw = FW2HW[fw];
      if (W.includes(fw) && !W.includes(hw) && G.includes(hw) && !G.includes(fw)) {
        return `标点：参考答案用的是全角${PUNCT_NAME[hw]}「${fw}」，你打的是半角「${hw}」。`
             + '屏幕上看不出区别，但确实不是同一个字符 —— 知道一下就好，这次算你过。';
      }
      if (W.includes(hw) && !W.includes(fw) && G.includes(fw) && !G.includes(hw)) {
        return `标点：参考答案用的是半角「${hw}」，你打的是全角${PUNCT_NAME[hw]}「${fw}」。`
             + '屏幕上看不出区别 —— 知道一下就好，这次算你过。';
      }
    }
    if (G.includes('\u3000') && !W.includes('\u3000')) {
      return '空格：你打的是全角空格（　），参考答案是普通空格。两者宽度不一样，'
           + '下次注意区分～这次算你过。';
    }
    if (hasFussySpace(W) && !hasFussySpace(G)) {
      return '空格：参考答案在汉字与数字/字母之间、或冒号逗号后面留了空格，你没留。'
           + '这属于排版习惯、不影响题意，这次算你过。';
    }
    return '通过了！你和参考答案之间只差一些看不见的字符（空格或全角/半角标点），这次算你过。';
  }

  /* 有没有「loose() 会删掉」的那种排版性空格。判定规则要和 loose() 保持一致，
     否则提示会说「差在空格」，可实际差的根本不是空格。 */
  function hasFussySpace(s) {
    return /[\u3400-\u9fff\u3000:：,，;；] +/.test(s)   // 汉字或分隔标点后面的空格
        || / +[\u3400-\u9fff]/.test(s);                // 汉字前面的空格
  }

  async function judge(code, stdinText, check) {
    if (!check) return { pass: true, detail: '', note: '', run: null };

    if (check.type === 'tests') {
      const r = await run(code, stdinText, check.code);
      if (r.err.trim()) return { pass: false, detail: '代码报错了，先把它修好～', note: '', run: r };
      if (r.pass === true) return { pass: true, detail: '', note: '', run: r };
      return {
        pass: false, note: '',
        detail: r.msg ? '还差一点：' + r.msg : '结果不符合要求，再想想～',
        run: r
      };
    }

    const r = await run(code, stdinText, '');
    if (r.err.trim()) return { pass: false, detail: '代码报错了，先把它修好～', note: '', run: r };

    return Object.assign(judgeOutput(r.out, check), { run: r });
  }

  /* 纯比对：拿「已经跑出来的输出」和 check 判定通过与否，不碰解释器。
     单独抽出来有两个好处 ——
       a) 能直接拿 (期望, 输出) 文本对做断言，不用每次都真跑代码；
       b) tests/judge-cases.json 里那张用例表可以被 JS 和 Python 两侧共用，
          两边各自对照同一张表，就不怕两套判题实现悄悄走岔。
     判定分两档：先严格比，严格不过再看是不是只差「看不见的字符」。 */
  function judgeOutput(out, check) {
    const raw = String(out == null ? '' : out);
    const got = norm(raw);
    const looseGot = loose(raw);

    if (check.type === 'output') {
      const want = norm(check.expect);
      if (got === want) return { pass: true, detail: '', note: '' };
      if (looseGot === loose(check.expect)) {
        return { pass: true, detail: '', note: softNote(check.expect, raw) };
      }
      const d = diffOf(want, got);
      return {
        pass: false, note: '',
        detail: `期望输出：\n${String(check.expect).trim()}\n\n你的输出：\n${raw.trim() || '（什么都没有输出）'}`
              + (d ? '\n\n' + d : '')
      };
    }

    if (check.type === 'contains') {
      const needles = Array.isArray(check.expect) ? check.expect : [check.expect];
      const missing = needles.filter(n => !got.includes(norm(n)));
      if (missing.length === 0) return { pass: true, detail: '', note: '' };
      const missingLoose = needles.filter(n => !looseGot.includes(loose(n)));
      if (missingLoose.length === 0) {
        return { pass: true, detail: '', note: softNote(missing[0], raw) };
      }
      const hint = diffInOutput(missingLoose[0], raw);
      return {
        pass: false, note: '',
        detail: `输出里没看到这些内容：\n${missingLoose.map(m => '· ' + String(m).trim()).join('\n')}`
              + `\n\n你的输出：\n${raw.trim() || '（什么都没有输出）'}`
              + (hint ? '\n\n' + hint : '')
      };
    }

    // 未知 check 类型：不拦，按旧行为放行
    return { pass: true, detail: '', note: '' };
  }

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(l => l.replace(/\s+$/, ''))
      .filter(l => l.trim() !== '')
      .join('\n')
      .trim();
  }

  return {
    init, run, judge, judgeOutput, norm, loose,
    // 暴露给测试用：这是「真正会被执行」的那份外壳源码。
    // 测试不要用正则从文件里抽，否则会拿到未经 JS 转义的原文，两者可能不一致。
    harness: HARNESS,
    get isReady() { return ready; },
    // 当前实际在用的引擎：'native'（本机 CPython）或 'pyodide'（内置 WebAssembly）
    get engine() { return engine; },
    get engineInfo() { return nativeInfo; },
    // 这台设备能做什么。引擎就绪前返回 null（还没探测完，别急着下结论）
    get caps() {
      if (!ready) return null;
      return engine === 'native' ? NATIVE_CAPS : PYODIDE_CAPS;
    },
    // 给测试用：原生引擎的护栏参数，避免测试里再抄一份数字
    nativeLimits: { stepLimit: NATIVE_STEP_LIMIT, timeLimit: NATIVE_TIME_LIMIT, outCap: NATIVE_OUT_CAP }
  };
})();
