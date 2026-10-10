/* ============================================================
   highlight.js —— 极简 Python 语法高亮
   给编辑器背后的 <pre class="hl"> 生成着色后的 HTML
   ============================================================ */

const PyHighlight = (() => {

  const KEYWORDS = new Set(('False None True and as assert async await break class continue def del elif else '
    + 'except finally for from global if import in is lambda nonlocal not or pass raise return try while '
    + 'with yield match case').split(' '));

  const BUILTINS = new Set(('print len range input int str float bool list dict set tuple sum min max abs round '
    + 'sorted enumerate zip map filter open type isinstance reversed any all divmod pow format repr hash id ord chr '
    + 'iter next super staticmethod classmethod property object help dir vars callable getattr setattr hasattr delattr '
    + 'eval exec compile slice frozenset bytes bytearray complex bin hex oct ascii breakpoint memoryview sum '
    + 'Exception ValueError TypeError KeyError IndexError ZeroDivisionError AssertionError RuntimeError EOFError '
    + 'FileNotFoundError NotImplementedError AttributeError NameError ImportError ModuleNotFoundError OverflowError '
    + 'RecursionError SyntaxError StopIteration BaseException SystemExit').split(' '));

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  const esc = s => s.replace(/[&<>]/g, c => ESC[c]);

  const TOKEN_RE = new RegExp([
    '(#[^\\n]*)',                                                  // 1 注释
    '("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\')',                    // 2 三引号字符串
    '((?:[rRbBfFuU]{0,2})(?:"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'))', // 3 普通字符串
    '(\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b|\\.\\d+)',     // 4 数字
    '([A-Za-z_]\\w*)',                                             // 5 标识符
    '(\\s+)',                                                      // 6 空白
    '([\\s\\S])'                                                   // 7 其他
  ].join('|'), 'g');

  function highlight(code) {
    let out = '';
    let prevWord = '';
    let afterDecorator = false;
    let m;
    TOKEN_RE.lastIndex = 0;

    while ((m = TOKEN_RE.exec(code)) !== null) {
      const [raw, comment, triple, str, num, word, ws, other] = m;

      if (comment) {
        out += '<span class="tok-com">' + esc(comment) + '</span>';
        prevWord = '';
      } else if (triple || str) {
        out += '<span class="tok-str">' + esc(raw) + '</span>';
        prevWord = '';
      } else if (num) {
        out += '<span class="tok-num">' + esc(num) + '</span>';
        prevWord = '';
      } else if (word) {
        let cls = '';
        if (afterDecorator) { cls = 'tok-dec'; afterDecorator = false; }
        else if (KEYWORDS.has(word)) { cls = 'tok-kw'; prevWord = word; out += '<span class="tok-kw">' + esc(word) + '</span>'; continue; }
        else if (prevWord === 'def' || prevWord === 'class') cls = 'tok-def';
        else if (BUILTINS.has(word)) cls = 'tok-bi';
        else if (code[TOKEN_RE.lastIndex] === '(') cls = 'tok-fn';
        out += cls ? '<span class="' + cls + '">' + esc(word) + '</span>' : esc(word);
        prevWord = word;
      } else if (ws) {
        out += ws;
        if (ws.includes('\n')) prevWord = '';
      } else {
        if (other === '@') afterDecorator = true;
        out += '<span class="tok-op">' + esc(other) + '</span>';
        if (other !== '@') prevWord = '';
      }
    }
    return out + '\n';
  }

  return { highlight };
})();
