const L = (id, title, xp, goal, body, starter, check, hint, solution, stdin) => ({
  id, title, xp, goal, body, starter, check, hint, solution, stdin
});

const LESSON_CHAPTERS = [
  {
    id: 'ch1', icon: '👋', title: '第一次见面', subtitle: 'printf 与程序结构',
    lessons: [
      L('l1-1', '你好，C 语言', 15, '用 printf 让电脑说第一句话。',
`<h3>printf 是 C 语言的嘴巴</h3><p>每个 C 程序都要先写 <code>#include &lt;stdio.h&gt;</code>，再写一个 <code>main</code> 函数。</p><pre><code>#include &lt;stdio.h&gt;\n\nint main() {\n    printf("你好，C 语言\\n");\n    return 0;\n}</code></pre><p>字符串结尾的 <code>\\n</code> 表示换行。不要漏掉每行结尾的分号。</p><div class="tip tip-fun"><span class="tip-ico">🎮</span><div>在右侧编辑器里补上 <code>printf</code> 那一行，让程序输出 <strong>你好，C 语言</strong>。</div></div>`,
'', { type: 'output', expect: '你好，C 语言' },
'printf 的括号里写双引号字符串，末尾加分号。',
`#include <stdio.h>\n\nint main() {\n    printf("你好，C 语言\\n");\n    return 0;\n}`),
      L('l1-2', '一次说两行', 15, '理解换行符和 printf。',
`<h3>\\n 会换行</h3><pre><code>printf("第一行\\n");\nprintf("第二行\\n");</code></pre><p>也可以写成一条：<code>printf("第一行\\n第二行\\n");</code></p>`,
'', { type: 'output', expect: '第一行\n第二行' },
'用两个 printf 分别输出，或者一个 printf 里用 \\n 分开。',
`#include <stdio.h>\n\nint main() {\n    printf("第一行\\n");\n    printf("第二行\\n");\n    return 0;\n}`),
      L('l1-3', '给程序写便签', 15, '认识单行注释和多行注释。',
`<h3>注释不会被执行</h3><pre><code>// 这是单行注释\n\n/*\n   这是多行注释\n   可以写很多行\n*/\n\nint main() {\n    printf("我会写注释了\\n");\n    return 0;\n}</code></pre><p>注释是写给以后自己和别人看的说明。</p>`,
'', { type: 'output', expect: '我会写注释了' },
'保留 printf，给它前面加一行 // 注释即可。',
`#include <stdio.h>\n\nint main() {\n    // 打印一句话\n    printf("我会写注释了\\n");\n    return 0;\n}`)
    ]
  },
  {
    id: 'ch2', icon: '📦', title: '变量与类型', subtitle: 'int / float / char',
    lessons: [
      L('l2-1', '整数变量', 20, '声明 int 变量并输出。',
`<h3>变量 = 贴了标签的盒子</h3><pre><code>int age = 18;\nprintf("我今年 %d 岁\\n", age);</code></pre><p><code>int</code> 表示整数，<code>%d</code> 是整数占位符。</p>`,
'', { type: 'output', expect: '我今年 18 岁' },
'用 printf 的 %d 把 age 放进去。',
`#include <stdio.h>\n\nint main() {\n    int age = 18;\n    printf("我今年 %d 岁\\n", age);\n    return 0;\n}`),
      L('l2-2', '小数变量', 20, '声明 float 并保留一位小数。',
`<h3>float 表示小数</h3><pre><code>float price = 3.5;\nprintf("价格 %.1f 元\\n", price);</code></pre><p><code>%.1f</code> 表示保留 1 位小数。</p>`,
'', { type: 'output', expect: '价格 3.5 元' },
'用 %.1f 输出 float。',
`#include <stdio.h>\n\nint main() {\n    float price = 3.5;\n    printf("价格 %.1f 元\\n", price);\n    return 0;\n}`),
      L('l2-3', '字符变量', 20, '声明 char 并输出。',
`<h3>char 表示一个字符</h3><pre><code>char ch = 'A';\nprintf("字符 %c\\n", ch);</code></pre><p>字符用单引号，字符串用双引号。两者不一样。</p>`,
'', { type: 'output', expect: '字符 A' },
'用 %c 输出 char。',
`#include <stdio.h>\n\nint main() {\n    char ch = 'A';\n    printf("字符 %c\\n", ch);\n    return 0;\n}`)
    ]
  },
  {
    id: 'ch3', icon: '⌨️', title: '程序会听话', subtitle: 'scanf 输入',
    lessons: [
      L('l3-1', '读一个整数', 25, '用 scanf 读取用户输入。',
`<h3>scanf 是程序的耳朵</h3><pre><code>int n;\nscanf("%d", &amp;n);\nprintf("你输入了 %d\\n", n);</code></pre><p>注意：变量前面要加 <code>&amp;</code>，意思是把输入放进这个变量的地址。</p>`,
'', { type: 'contains', expect: '你输入了 42' },
'先 int n，再 scanf("%d", &n)，最后 printf。',
`#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("你输入了 %d\\n", n);\n    return 0;\n}`, '42'),
      L('l3-2', '两个数相加', 25, '读取两个整数并求和。',
`<h3>scanf 可以一次读多个数</h3><pre><code>int a, b;\nscanf("%d %d", &amp;a, &amp;b);\nprintf("%d + %d = %d\\n", a, b, a + b);</code></pre>`,
'', { type: 'output', expect: '3 + 5 = 8' },
'声明两个 int，用 scanf 读取，再输出 a + b。',
`#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d + %d = %d\\n", a, b, a + b);\n    return 0;\n}`, '3 5'),
      L('l3-3', '读取名字', 25, '读取一个单词。',
`<h3>字符串 = 一串字符</h3><pre><code>char name[20];\nscanf("%s", name);\nprintf("你好，%s\\n", name);</code></pre><p><code>char name[20]</code> 是能装 20 个字符的小盒子。</p>`,
'', { type: 'contains', expect: '你好，小皮' },
'定义 char name[20]，用 %s 读取和输出。',
`#include <stdio.h>\n\nint main() {\n    char name[20];\n    scanf("%s", name);\n    printf("你好，%s\\n", name);\n    return 0;\n}`, '小皮')
    ]
  }
,
  {
    id: 'ch4', icon: '🧮', title: '算一算', subtitle: '运算符',
    lessons: [
      L('l4-1', '加减乘除', 25, '掌握 + - * /。',
`<h3>C 语言也是计算器</h3><pre><code>printf("%d\\n", 17 + 5);\nprintf("%d\\n", 17 - 5);\nprintf("%d\\n", 17 * 5);\nprintf("%d\\n", 17 / 5);</code></pre><p>两个整数相除，结果是整数，会舍掉小数部分。</p>`,
'', { type: 'output', expect: '22\n12\n85\n3' },
'按顺序输出 17+5、17-5、17*5、17/5。',
`#include <stdio.h>\n\nint main() {\n    printf("%d\\n", 17 + 5);\n    printf("%d\\n", 17 - 5);\n    printf("%d\\n", 17 * 5);\n    printf("%d\\n", 17 / 5);\n    return 0;\n}`),
      L('l4-2', '取余数', 25, '掌握 % 取余。',
`<h3>% 是取余</h3><pre><code>printf("%d\\n", 17 % 5);  // 2</code></pre><p>17 除以 5 商 3 余 2。取余在判断奇数偶数时很有用。</p>`,
'', { type: 'output', expect: '17 % 5 = 2' },
'printf 里要用 %% 来表示一个 %。',
`#include <stdio.h>\n\nint main() {\n    printf("17 %% 5 = %d\\n", 17 % 5);\n    return 0;\n}`),
      L('l4-3', '自增与自减', 25, '认识 ++ 和 --。',
`<h3>++ 表示加一，-- 表示减一</h3><pre><code>int n = 5;\nn++;\nprintf("%d\\n", n);  // 6\nn--;\nprintf("%d\\n", n);  // 5</code></pre>`,
'', { type: 'output', expect: '6\n5' },
'先 n++ 再输出，再 n-- 再输出。',
`#include <stdio.h>\n\nint main() {\n    int n = 5;\n    n++;\n    printf("%d\\n", n);\n    n--;\n    printf("%d\\n", n);\n    return 0;\n}`)
    ]
  },
  {
    id: 'ch5', icon: '🔀', title: '分岔路口', subtitle: 'if / else',
    lessons: [
      L('l5-1', '如果...', 25, '写出第一个 if。',
`<h3>条件成立才执行</h3><pre><code>int score = 85;\nif (score >= 60) {\n    printf("及格\\n");\n}</code></pre><p>条件用圆括号，代码块用大括号。</p>`,
'', { type: 'output', expect: '及格' },
'直接写出 if 判断并输出。',
`#include <stdio.h>\n\nint main() {\n    int score = 85;\n    if (score >= 60) {\n        printf("及格\\n");\n    }\n    return 0;\n}`),
      L('l5-2', '否则怎么办', 25, '用 else 处理另一种情况。',
`<h3>if / else 两条路</h3><pre><code>if (score >= 60) {\n    printf("及格\\n");\n} else {\n    printf("补考\\n");\n}</code></pre>`,
'', { type: 'output', expect: '补考' },
'本关 score = 55，走 else。',
`#include <stdio.h>\n\nint main() {\n    int score = 55;\n    if (score >= 60) {\n        printf("及格\\n");\n    } else {\n        printf("补考\\n");\n    }\n    return 0;\n}`),
      L('l5-3', '多个选择', 30, '用 else if 处理多个分支。',
`<h3>else if 还可以继续加</h3><pre><code>if (score >= 90) {\n    printf("优秀\\n");\n} else if (score >= 80) {\n    printf("良好\\n");\n} else if (score >= 60) {\n    printf("及格\\n");\n} else {\n    printf("不及格\\n");\n}</code></pre>`,
'', { type: 'output', expect: '良好' },
'从高到低判断，87 应该落到 80 分段。',
`#include <stdio.h>\n\nint main() {\n    int score = 87;\n    if (score >= 90) {\n        printf("优秀\\n");\n    } else if (score >= 80) {\n        printf("良好\\n");\n    } else if (score >= 60) {\n        printf("及格\\n");\n    } else {\n        printf("不及格\\n");\n    }\n    return 0;\n}`),
      L('l5-4', '组合条件', 35, '用 && || ! 组合判断。',
`<h3>逻辑三兄弟</h3><ul><li><code>&amp;&amp;</code> 并且</li><li><code>||</code> 或者</li><li><code>!</code> 不是</li></ul><p>闰年：能被 4 整除且不能被 100 整除，或者能被 400 整除。</p>`,
'', { type: 'output', expect: '2024 是闰年' },
'条件写成 (year%4==0 && year%100!=0) || year%400==0。',
`#include <stdio.h>\n\nint main() {\n    int year = 2024;\n    if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {\n        printf("%d 是闰年\\n", year);\n    } else {\n        printf("%d 不是闰年\\n", year);\n    }\n    return 0;\n}`)
    ]
  },
  {
    id: 'ch6', icon: '🌀', title: '重复做', subtitle: 'while / for',
    lessons: [
      L('l6-1', 'while 循环', 30, '条件为真就重复。',
`<h3>while 循环</h3><pre><code>int n = 1;\nwhile (n &lt;= 5) {\n    printf("%d\\n", n);\n    n++;\n}</code></pre><p>每次循环都要让 n 变化，否则会死循环。</p>`,
'', { type: 'output', expect: '1\n2\n3\n4\n5' },
'先 int n=1，while(n<=5) 里输出并 n++。',
`#include <stdio.h>\n\nint main() {\n    int n = 1;\n    while (n <= 5) {\n        printf("%d\\n", n);\n        n++;\n    }\n    return 0;\n}`),
      L('l6-2', 'for 循环', 30, '用 for 更简洁地重复。',
`<h3>for 循环三兄弟</h3><pre><code>for (int i = 1; i &lt;= 5; i++) {\n    printf("%d\\n", i);\n}</code></pre><p>三个部分：开始、条件、每次变化。</p>`,
'', { type: 'output', expect: '1\n2\n3\n4\n5' },
'用 for 输出 1 到 5。',
`#include <stdio.h>\n\nint main() {\n    for (int i = 1; i <= 5; i++) {\n        printf("%d\\n", i);\n    }\n    return 0;\n}`),
      L('l6-3', '累加器', 35, '用循环累加。',
`<h3>一个变量滚雪球</h3><pre><code>int total = 0;\nfor (int i = 1; i &lt;= 100; i++) {\n    total = total + i;\n}\nprintf("%d\\n", total);</code></pre>`,
'', { type: 'output', expect: '1 到 100 的和是 5050' },
'先 total=0，循环里 total += i，最后按格式输出。',
`#include <stdio.h>\n\nint main() {\n    int total = 0;\n    for (int i = 1; i <= 100; i++) {\n        total += i;\n    }\n    printf("1 到 100 的和是 %d\\n", total);\n    return 0;\n}`),
      L('l6-4', '跳出与跳过', 35, '掌握 break 和 continue。',
`<h3>两个控制开关</h3><ul><li><code>break</code>：结束整个循环</li><li><code>continue</code>：跳过本轮</li></ul><p>要求输出 1 3 5：到 7 停，偶数跳过。</p>`,
'', { type: 'output', expect: '1\n3\n5' },
'先判断 i==7 就 break，再判断偶数 continue。',
`#include <stdio.h>\n\nint main() {\n    for (int i = 1; i <= 10; i++) {\n        if (i == 7) break;\n        if (i % 2 == 0) continue;\n        printf("%d\\n", i);\n    }\n    return 0;\n}`)
    ]
  }
,
  {
    id: 'ch7', icon: '🧺', title: '数组入门', subtitle: '一组数据',
    lessons: [
      L('l7-1', '认识数组', 30, '声明一个整数数组。',
`<h3>数组是一排盒子</h3><pre><code>int nums[5] = {3, 1, 4, 1, 5};</code></pre><p>方括号里的 5 表示能放 5 个整数。下标从 0 开始。</p>`,
'', { type: 'contains', expect: '3 1 4 1 5' },
'定义数组后用 for 循环依次输出。',
`#include <stdio.h>\n\nint main() {\n    int nums[5] = {3, 1, 4, 1, 5};\n    for (int i = 0; i < 5; i++) {\n        printf("%d ", nums[i]);\n    }\n    printf("\\n");\n    return 0;\n}`),
      L('l7-2', '数组求和', 35, '把数组里的数字加在一起。',
`<h3>数组 + 循环 + 累加</h3><pre><code>int total = 0;\nfor (int i = 0; i < 5; i++) {\n    total += nums[i];\n}</code></pre>`,
'', { type: 'output', expect: '总和 14' },
'用 total 变量逐个累加数组元素。',
`#include <stdio.h>\n\nint main() {\n    int nums[5] = {3, 1, 4, 1, 5};\n    int total = 0;\n    for (int i = 0; i < 5; i++) total += nums[i];\n    printf("总和 %d\\n", total);\n    return 0;\n}`),
      L('l7-3', '找最大值', 35, '遍历数组找最大值。',
`<h3>先假设第一个最大</h3><pre><code>int max = nums[0];\nfor (int i = 1; i < 5; i++) {\n    if (nums[i] > max) max = nums[i];\n}</code></pre>`,
'', { type: 'output', expect: '9' },
'先让 max 等于第一个元素，再比较更新。',
`#include <stdio.h>\n\nint main() {\n    int nums[5] = {3, 9, 1, 7, 4};\n    int max = nums[0];\n    for (int i = 1; i < 5; i++) {\n        if (nums[i] > max) max = nums[i];\n    }\n    printf("%d\\n", max);\n    return 0;\n}`)
    ]
  },
  {
    id: 'ch8', icon: '🧰', title: '函数入门', subtitle: '把代码打包',
    lessons: [
      L('l8-1', '定义函数', 35, '写一个求和函数。',
`<h3>函数 = 可重复使用的代码包</h3><pre><code>int add(int a, int b) {\n    return a + b;\n}</code></pre>`,
'', { type: 'output', expect: '7' },
'定义 add 函数返回 a+b，并在 main 调用。',
`#include <stdio.h>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    printf("%d\\n", add(3, 4));\n    return 0;\n}`),
      L('l8-2', '带参数函数', 35, '写一个求最大值的函数。',
`<h3>参数是函数的原材料</h3><pre><code>int maxOf(int a, int b) {\n    return a > b ? a : b;\n}</code></pre>`,
'', { type: 'output', expect: '9' },
'定义 maxOf，比较两个参数后返回较大的。',
`#include <stdio.h>\n\nint maxOf(int a, int b) {\n    return a > b ? a : b;\n}\n\nint main() {\n    printf("%d\\n", maxOf(4, 9));\n    return 0;\n}`),
      L('l8-3', '函数与循环', 40, '把判断逻辑封装成函数。',
`<h3>给逻辑起个名字</h3><pre><code>int isEven(int n) {\n    return n % 2 == 0;\n}</code></pre>`,
'', { type: 'output', expect: '2\n4\n6\n8\n10' },
'定义 isEven，在循环里判断后输出偶数。',
`#include <stdio.h>\n\nint isEven(int n) {\n    return n % 2 == 0;\n}\n\nint main() {\n    for (int i = 1; i <= 10; i++) {\n        if (isEven(i)) printf("%d\\n", i);\n    }\n    return 0;\n}`)
    ]
  },
  {
    id: 'ch9', icon: '🔤', title: '字符串入门', subtitle: 'char 数组',
    lessons: [
      L('l9-1', '认识字符串', 35, '用 char 数组保存字符串。',
`<h3>C 语言用字符数组表示字符串</h3><pre><code>char name[] = "小皮";\nprintf("你好，%s\\n", name);</code></pre>`,
'', { type: 'output', expect: '你好，小皮' },
'定义 char name[] = "小皮"，用 %s 输出。',
`#include <stdio.h>\n\nint main() {\n    char name[] = "小皮";\n    printf("你好，%s\\n", name);\n    return 0;\n}`),
      L('l9-2', '读取字符串', 35, '用 scanf 读取单词。',
`<h3>%s 读取一个单词</h3><pre><code>char name[20];\nscanf("%s", name);\nprintf("你好，%s\\n", name);</code></pre>`,
'', { type: 'contains', expect: '你好，小皮' },
'定义 char name[20]，用 %s 读取和输出。',
`#include <stdio.h>\n\nint main() {\n    char name[20];\n    scanf("%s", name);\n    printf("你好，%s\\n", name);\n    return 0;\n}`, '小皮'),
      L('l9-3', '字符串长度', 40, '用 strlen 计算长度。',
`<h3>strlen 来自 string.h</h3><pre><code>#include &lt;string.h&gt;\nprintf("%d\\n", strlen("hello"));</code></pre>`,
'', { type: 'output', expect: '5' },
'包含 string.h，用 strlen 输出长度。',
`#include <stdio.h>\n#include <string.h>\n\nint main() {\n    printf("%d\\n", (int)strlen("hello"));\n    return 0;\n}`)
    ]
  }
,
  {
    id: 'ch10', icon: '📖', title: '期末复习', subtitle: 'C语言程序设计考点',
    lessons: [
      L('r1', '数据类型与表达式', 40, '复习基本类型、常量和运算符。',
`<h3>考点回顾</h3><p>C 语言基本类型包括 <code>int</code>、<code>float</code>、<code>double</code>、<code>char</code>。注意整数除法会舍去小数，取余用 <code>%</code>。</p><pre><code>printf("%d\\n", 17 / 5);  // 3\nprintf("%d\\n", 17 % 5);  // 2</code></pre>`,
'', { type: 'output', expect: '3\n2' },
'直接按顺序输出整数除法和取余结果。',
`#include <stdio.h>\n\nint main() {\n    printf("%d\\n", 17 / 5);\n    printf("%d\\n", 17 % 5);\n    return 0;\n}`),
      L('r2', '选择结构', 40, '复习 if、else if、switch。',
`<h3>选择结构考点</h3><pre><code>if (score >= 90) { A } else if (score >= 80) { B } else { C }</code></pre><p>switch 适合判断整数或字符。</p>`,
'', { type: 'output', expect: 'B' },
'score = 85，用 if 输出等级 B。',
`#include <stdio.h>\n\nint main() {\n    int score = 85;\n    if (score >= 90) printf("A\\n");\n    else if (score >= 80) printf("B\\n");\n    else printf("C\\n");\n    return 0;\n}`),
      L('r3', '循环结构', 40, '复习 for、while、do while。',
`<h3>循环结构考点</h3><p>for 适合知道次数，while 适合条件循环，do while 至少执行一次。</p>`,
'', { type: 'output', expect: '1\n2\n3' },
'用 for 输出 1 到 3。',
`#include <stdio.h>\n\nint main() {\n    for (int i = 1; i <= 3; i++) printf("%d\\n", i);\n    return 0;\n}`),
      L('r4', '数组与字符串', 45, '复习一维数组、二维数组和字符数组。',
`<h3>数组考点</h3><p>下标从 0 开始，字符串以 <code>\\0</code> 结尾。</p>`,
'', { type: 'output', expect: '20' },
'数组 {2,4,6,8} 求总和。',
`#include <stdio.h>\n\nint main() {\n    int a[4] = {2, 4, 6, 8};\n    int total = 0;\n    for (int i = 0; i < 4; i++) total += a[i];\n    printf("%d\\n", total);\n    return 0;\n}`),
      L('r5', '函数与指针', 50, '复习函数定义、调用和指针。',
`<h3>函数与指针考点</h3><p>函数通过参数传值，指针用于保存地址。</p>`,
'', { type: 'output', expect: '5 3' },
'用指针函数交换两个数。',
`#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int t = *a; *a = *b; *b = t;\n}\n\nint main() {\n    int x = 3, y = 5;\n    swap(&x, &y);\n    printf("%d %d\\n", x, y);\n    return 0;\n}`),
      L('r6', '结构体与文件', 50, '复习结构体和文件读写。',
`<h3>结构体与文件考点</h3><p>结构体用于组合不同类型；文件用 fopen 打开。</p>`,
'', { type: 'output', expect: '小皮 18' },
'定义 Student 结构体并输出。',
`#include <stdio.h>\n\nstruct Student {\n    char name[20];\n    int age;\n};\n\nint main() {\n    struct Student s = {"小皮", 18};\n    printf("%s %d\\n", s.name, s.age);\n    return 0;\n}`)
      ,
      L('r7', '格式占位符', 45, '搞懂 %d、%f、%6.2f。',
`<h3>格式化输出考点</h3><p><code>%d</code> 表示整数，<code>%f</code> 表示浮点数，<code>%6.2f</code> 表示总共至少 6 位宽、保留 2 位小数。</p>`,
'', { type: 'output', expect: '18\n3.50\n  3.50' },
'分别输出整数 18、保留 2 位小数、宽度 6 的 3.50。',
`#include <stdio.h>\n\nint main() {\n    printf("%d\\n", 18);\n    printf("%.2f\\n", 3.5);\n    printf("%6.2f\\n", 3.5);\n    return 0;\n}`),
      L('r8', '转义字符', 40, '掌握常用转义字符。',
`<h3>转义字符考点</h3><p><code>\\n</code> 换行，<code>\\t</code> 制表，<code>\\\\</code> 反斜杠，<code>%%</code> 百分号。</p>`,
'', { type: 'output', expect: 'A\tB\nC' },
'用 \\t 和 \\n 输出 A、B、C。',
`#include <stdio.h>\n\nint main() {\n    printf("A\\tB\\nC\\n");\n    return 0;\n}`),
      L('r9', '运算符优先级', 45, '复习运算符优先级。',
`<h3>运算顺序考点</h3><p>乘除优先于加减，括号最优先。例如 <code>2 + 3 * 4</code> 等于 14。</p>`,
'', { type: 'output', expect: '14' },
'输出 2 + 3 * 4。',
`#include <stdio.h>\n\nint main() {\n    printf("%d\\n", 2 + 3 * 4);\n    return 0;\n}`)
    ]
  }
];
