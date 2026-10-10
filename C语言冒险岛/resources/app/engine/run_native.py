# -*- coding: utf-8 -*-
"""Python 冒险岛 —— 原生 CPython 一次性执行器（桌面端专用）

它做的事和在浏览器里跑 Pyodide 完全一样：执行用户代码、喂 input()、
跑隐藏测试、把结果整理成 {out, err, pass, msg}。

关键设计：**判题外壳不在这里**。
外壳源码由 Electron 主进程从网页端 js/pyodide-runner.js 里取出来，
随请求一起传进来（req["harness"]）。这样「网页里怎么判、桌面里就怎么判」
是同一份代码保证的，而不是靠人肉同步两份实现。
换来的好处很实在：任何判题规则的修正，两个平台自动同时生效。

协议（刻意不用 stdout 传结果）：
    # 一次性模式：请求与结果都走文件
    python run_native.py <请求.json> <结果.json>

    # 待命模式：进程先起好，等一行 JSON 请求，执行完写结果文件后立刻退出
    python run_native.py --stdin-once <结果.json>

为什么不用 stdout：用户的代码可能直接写文件描述符 1（os.write(1, ...)），
那会混进我们的结果里把 JSON 弄坏。写到独立文件就完全不受影响。

待命模式是性能上的关键：Windows 上 `python -c pass` 本身就要 ~300ms
（解释器加载 + 系统扫描），这段开销和代码内容无关。所以让子进程提前起好、
等在那里，用户点击时只剩执行时间（十几毫秒）。每个进程只服务一次请求就退出，
这样既有预热的好处，又不会让上一个程序的全局状态 / 残留线程污染下一个。

请求 JSON：
    { "code": str, "stdin": str, "test": str, "harness": str,
      "stepLimit": int, "timeLimit": float, "outCap": int }

结果 JSON：
    { "ok": bool, "out": str, "err": str, "pass": bool|null, "msg": str,
      "engineError": str }
"""
import json
import os
import sys

# 别在课程目录里撒 __pycache__，用户看到会困惑
sys.dont_write_bytecode = True


def _read_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def _write_json(path, payload):
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    with open(path, 'wb') as f:
        f.write(data)


def execute(req):
    """在真 CPython 里跑一遍外壳，返回结果字典。

    外壳源码原样来自网页端，此处不做任何改写 —— 一旦这里开始「顺手优化」，
    两个平台的判题行为就会悄悄分叉。
    """
    harness = req.get('harness') or ''
    if not harness.strip():
        return {'ok': False, 'out': '', 'err': '', 'pass': None, 'msg': '',
                'engineError': '没有收到判题外壳（harness 为空）'}

    preload = {}
    site = req.get('site')
    if site:
        # 网络那一章要用它拼出游戏靶场的地址，课程代码统一写 SITE + "/news.html"
        preload['SITE'] = site

    test_src = req.get('test') or ''
    g = {
        # 判题时用户代码不作为主程序运行，只当模块检查（理由见 run_native.py 顶部说明）
        '__name__': '__main__' if not test_src.strip() else '__judge__',
        '__USER_SRC__': req.get('code') or '',
        '__STDIN_TEXT__': req.get('stdin') or '',
        '__TEST_SRC__': test_src,
        # 课程预置常量。桌面版不传 __HTTP_CACHE__ —— 它真发 HTTP 请求，
        # 外壳里的 urlopen shim 因此不会生效（那套是给浏览器用的）。
        '__PRELOAD__': preload,
        # 三道可选的护栏。网页端不传这些键，外壳里的默认值就是原行为。
        '__STEP_LIMIT__': int(req.get('stepLimit') or 0) or 4000000,
        '__TIME_LIMIT__': float(req.get('timeLimit') or 0),
        '__OUT_CAP__': int(req.get('outCap') or 0),
    }

    try:
        exec(compile(harness, '<harness>', 'exec'), g)
    except BaseException as e:
        # 外壳自己炸了 —— 这属于我们的 bug，不是用户代码的问题，要区分清楚
        return {'ok': False, 'out': '', 'err': '', 'pass': None, 'msg': '',
                'engineError': '%s: %s' % (type(e).__name__, e)}

    return {
        'ok': True,
        'out': g.get('__RESULT_OUT__') or '',
        'err': g.get('__RESULT_ERR__') or '',
        'pass': g.get('__RESULT_PASS__', None),
        'msg': g.get('__RESULT_MSG__') or '',
        'engineError': '',
    }


def _emit(res_path, result):
    """写结果文件。写不出去也不能让进程带着半截结果退出。"""
    try:
        _write_json(res_path, result)
        return True
    except BaseException:
        return False


def serve_once(res_path):
    """待命模式：报告就绪 -> 从 stdin 读一行请求 -> 执行 -> 写结果 -> 立刻退出。

    读 stdin 用的是一次性读，读完就不再用 —— 用户代码的 input() 由外壳
    从请求里的 stdin 字段模拟，跟这个真实 stdin 没有任何关系。
    """
    # 向父进程报「解释器已经起来了，可以派活」。
    # 这行必须在任何用户代码之前写出：父进程只认第一行，之后的 stdout 全部丢弃。
    # 有了这个握手，父进程才敢把代码交给它 —— 否则进程刚 fork 出来、
    # Python 还在加载，用户点击仍要白等那 300ms。
    sys.stdout.write('READY' + chr(10))
    sys.stdout.flush()

    raw = sys.stdin.buffer.readline()
    if not raw:
        return 2                      # 父进程没给请求就关了管道
    try:
        req = json.loads(raw.decode('utf-8'))
    except BaseException as e:
        _emit(res_path, {'ok': False, 'out': '', 'err': '', 'pass': None, 'msg': '',
                         'engineError': '请求不是合法 JSON：%s' % e})
        return 1

    result = execute_safe(req)
    _emit(res_path, result)

    # 必须用 _exit：用户代码可能起了非守护线程（比如一个 while True 的线程），
    # 正常退出会一直等它，进程就永远不结束、用户界面一直转圈。
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)


def execute_safe(req):
    """把 execute() 兜住 —— 执行器自己出问题也要产出一份结果，别让父进程干等。"""
    try:
        return execute(req)
    except BaseException as e:
        return {'ok': False, 'out': '', 'err': '', 'pass': None, 'msg': '',
                'engineError': '执行器异常：%s: %s' % (type(e).__name__, e)}


def main():
    argv = sys.argv[1:]

    if argv and argv[0] == '--stdin-once':
        if len(argv) < 2:
            sys.stderr.write('用法: python run_native.py --stdin-once <结果.json>\n')
            return 2
        return serve_once(argv[1])

    if len(argv) < 2:
        sys.stderr.write('用法: python run_native.py <请求.json> <结果.json>\n'
                         '      python run_native.py --stdin-once <结果.json>\n')
        return 2

    req_path, res_path = argv[0], argv[1]
    try:
        req = _read_json(req_path)
    except BaseException as e:
        _emit(res_path, {'ok': False, 'out': '', 'err': '', 'pass': None,
                         'msg': '', 'engineError': '读取请求失败：%s' % e})
        return 1

    if not _emit(res_path, execute_safe(req)):
        sys.stderr.write('写入结果失败\n')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
