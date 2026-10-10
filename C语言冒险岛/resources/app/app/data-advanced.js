const ADVANCED_CHAPTERS = [
  {
    id: 'a1', icon: '🧺', title: '数组与字符串', subtitle: '一组数据',
    lessons: [
      L('a1-1', '一维数组', 35, '认识数组并遍历。',
`<h3>数组是一排盒子</h3><pre><code>int nums[5] = {3, 1, 4, 1, 5};\nfor (int i = 0; i &lt; 5; i++) {\n    printf("%d ", nums[i]);\n}</code></pre><p>下标从 0 开始，最后一个下标是 4。</p>`,
'', { type: 'contains', expect: '3 1 4 1 5' },
'定义数组后用 for 遍历输出。',
`#include <stdio.h>\n\nint main() {\n    int nums[5] = {3, 1, 4, 1, 5};\n    for (int i = 0; i < 5; i++) {\n        printf("%d ", nums[i]);\n    }\n    printf("\\n");\n    return 0;\n}`),
      L('a1-2', '求数组总和', 40, '累加数组中的数字。',
`<h3>数组 + 循环 + 累加</h3><pre><code>int total = 0;\nfor (int i = 0; i &lt; 5; i++) {\n    total += nums[i];\n}\nprintf("%d\\n", total);</code></pre>`,
'', { type: 'output', expect: '总和 14' },
'遍历数组把每个元素加进 total。',
`#include <stdio.h>\n\nint main() {\n    int nums[5] = {3, 1, 4, 1, 5};\n    int total = 0;\n    for (int i = 0; i < 5; i++) {\n        total += nums[i];\n    }\n    printf("总和 %d\\n", total);\n    return 0;\n}`),
      L('a1-3', '字符串数组', 40, '认识 char 数组字符串。',
`<h3>字符串是一串字符</h3><pre><code>char name[] = "小皮";\nprintf("你好，%s\\n", name);</code></pre><p>C 语言没有单独的 string 类型，用 char 数组表示字符串。</p>`,
'', { type: 'output', expect: '你好，小皮' },
'定义 char name[] = "小皮"，用 %s 输出。',
`#include <stdio.h>\n\nint main() {\n    char name[] = "小皮";\n    printf("你好，%s\\n", name);\n    return 0;\n}`)
    ]
  },
  {
    id: 'a2', icon: '🧰', title: '函数', subtitle: '把代码打包',
    lessons: [
      L('a2-1', '定义函数', 40, '把重复代码写成一个函数。',
`<h3>函数 = 可重复使用的代码包</h3><pre><code>int add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    printf("%d\\n", add(3, 4));\n    return 0;\n}</code></pre>`,
'', { type: 'output', expect: '7' },
'定义 add 返回 a+b，在 main 里调用。',
`#include <stdio.h>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    printf("%d\\n", add(3, 4));\n    return 0;\n}`),
      L('a2-2', 'void 函数', 40, '认识没有返回值的函数。',
`<h3>void 表示不返回结果</h3><pre><code>void sayHi(char name[]) {\n    printf("你好，%s\\n", name);\n}</code></pre>`,
'', { type: 'output', expect: '你好，小皮' },
'定义 void sayHi，在里面 printf。',
`#include <stdio.h>\n\nvoid sayHi(char name[]) {\n    printf("你好，%s\\n", name);\n}\n\nint main() {\n    sayHi("小皮");\n    return 0;\n}`),
      L('a2-3', '函数与循环', 45, '把判断逻辑封装成函数。',
`<h3>给逻辑起个名字</h3><pre><code>int isEven(int n) {\n    return n % 2 == 0;\n}</code></pre>`,
'', { type: 'output', expect: '2\n4\n6\n8\n10' },
'定义 isEven，循环里 if 判断后输出偶数。',
`#include <stdio.h>\n\nint isEven(int n) {\n    return n % 2 == 0;\n}\n\nint main() {\n    for (int i = 1; i <= 10; i++) {\n        if (isEven(i)) printf("%d\\n", i);\n    }\n    return 0;\n}`)
    ]
  },
  {
    id: 'a3', icon: '📍', title: '指针', subtitle: '变量地址',
    lessons: [
      L('a3-1', '认识指针', 45, '用指针保存变量地址。',
`<h3>指针 = 保存地址的变量</h3><pre><code>int x = 5;\nint *p = &amp;x;\nprintf("%d\\n", *p);  // 5</code></pre><p><code>&amp;</code> 取地址，<code>*</code> 取地址里的值。</p>`,
'', { type: 'output', expect: '5' },
'先取地址存进指针，再用 *p 输出。',
`#include <stdio.h>\n\nint main() {\n    int x = 5;\n    int *p = &x;\n    printf("%d\\n", *p);\n    return 0;\n}`),
      L('a3-2', '指针与数组', 45, '用指针访问数组。',
`<h3>数组名可以当作地址</h3><pre><code>int nums[3] = {10, 20, 30};\nprintf("%d\\n", *(nums + 1));  // 20</code></pre>`,
'', { type: 'output', expect: '20' },
'数组名 nums 指向第一个元素，加 1 就指向第二个。',
`#include <stdio.h>\n\nint main() {\n    int nums[3] = {10, 20, 30};\n    printf("%d\\n", *(nums + 1));\n    return 0;\n}`),
      L('a3-3', '指针交换', 50, '用指针让函数真正改到原变量。',
`<h3>传地址，函数才能修改原值</h3><pre><code>void swap(int *a, int *b) {\n    int t = *a;\n    *a = *b;\n    *b = t;\n}</code></pre>`,
'', { type: 'output', expect: '5 3' },
'定义 swap 接收两个指针，调用时传 &x 和 &y。',
`#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int t = *a;\n    *a = *b;\n    *b = t;\n}\n\nint main() {\n    int x = 3, y = 5;\n    swap(&x, &y);\n    printf("%d %d\\n", x, y);\n    return 0;\n}`)
    ]
  },
  {
    id: 'a4', icon: '🗂️', title: '结构体与文件', subtitle: '整理复杂数据',
    lessons: [
      L('a4-1', '结构体', 45, '把不同类型的数据打包。',
`<h3>struct 是一张卡片</h3><pre><code>struct Student {\n    char name[20];\n    int age;\n};\n\nstruct Student s = {"小皮", 18};\nprintf("%s %d\\n", s.name, s.age);</code></pre>`,
'', { type: 'output', expect: '小皮 18' },
'定义 Student 结构体并输出 name 和 age。',
`#include <stdio.h>\n\nstruct Student {\n    char name[20];\n    int age;\n};\n\nint main() {\n    struct Student s = {"小皮", 18};\n    printf("%s %d\\n", s.name, s.age);\n    return 0;\n}`),
      L('a4-2', '写入文件', 45, '用 fopen 保存数据。',
`<h3>把数据存下来</h3><pre><code>FILE *f = fopen("note.txt", "w");\nfprintf(f, "第一行\\n");\nfclose(f);</code></pre>`,
'', { type: 'output', expect: '写入成功' },
'用 fopen 写文件，fprintf 写内容，fclose 关闭。',
`#include <stdio.h>\n\nint main() {\n    FILE *f = fopen("note.txt", "w");\n    if (f == NULL) {\n        printf("打开失败\\n");\n        return 1;\n    }\n    fprintf(f, "第一行\\n");\n    fclose(f);\n    printf("写入成功\\n");\n    return 0;\n}`),
      L('a4-3', '读取文件', 50, '把文件内容读出来。',
`<h3>从文件读取</h3><pre><code>char line[100];\nwhile (fgets(line, sizeof(line), f)) {\n    printf("%s", line);\n}</code></pre>`,
'', { type: 'output', expect: '第一行\n第二行' },
'写入两行后再用 fgets 逐行读出来。',
`#include <stdio.h>\n\nint main() {\n    FILE *f = fopen("note.txt", "w");\n    fprintf(f, "第一行\\n第二行\\n");\n    fclose(f);\n\n    f = fopen("note.txt", "r");\n    char line[100];\n    while (fgets(line, sizeof(line), f)) {\n        printf("%s", line);\n    }\n    fclose(f);\n    return 0;\n}`)
    ]
  }
,
  {
    id: 'a5', icon: '📚', title: '常用标准库', subtitle: 'math / string / stdlib',
    lessons: [
      L('a5-1', '数学函数', 45, '使用 math.h 计算。',
`<h3>math.h 常用函数</h3><pre><code>#include &lt;math.h&gt;\nsqrt(16)   // 4\npow(2, 3)  // 8\nfabs(-7.5) // 7.5</code></pre><p>编译时需要链接数学库，这里已自动处理。</p>`,
'', { type: 'output', expect: '4\n8' },
'包含 math.h，分别输出 sqrt(16) 和 pow(2,3)。',
`#include <stdio.h>\n#include <math.h>\n\nint main() {\n    printf("%d\\n", (int)sqrt(16));\n    printf("%d\\n", (int)pow(2, 3));\n    return 0;\n}`),
      L('a5-2', '字符串函数', 45, '使用 strcmp 比较字符串。',
`<h3>strcmp 比较两个字符串</h3><pre><code>strcmp("abc", "abd");  // 负数，abc 更小</code></pre>`,
'', { type: 'output', expect: '不相同' },
'用 strcmp 比较两个字符串，相等输出“相同”，否则“不相同”。',
`#include <stdio.h>\n#include <string.h>\n\nint main() {\n    if (strcmp("abc", "abd") == 0) printf("相同\\n");\n    else printf("不相同\\n");\n    return 0;\n}`),
      L('a5-3', '随机数', 45, '使用 rand 生成随机数。',
`<h3>rand() 生成随机数</h3><pre><code>int n = rand() % 10;  // 0 到 9</code></pre>`,
'', { type: 'contains', expect: '0 到 9 之间' },
'用 rand() % 10 生成 0 到 9 的随机数。',
`#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n = rand() % 10;\n    printf("0 到 9 之间：%d\\n", n);\n    return 0;\n}`)
    ]
  },
  {
    id: 'a6', icon: '🛠️', title: '综合小程序', subtitle: '把知识串起来',
    lessons: [
      L('a6-1', '菜单程序', 50, '用循环做一个选择菜单。',
`<h3>do-while 菜单</h3><pre><code>int choice;\ndo {\n    printf("1. 选项一\\n2. 退出\\n");\n    scanf("%d", &amp;choice);\n} while (choice != 2);</code></pre>`,
'', { type: 'contains', expect: '已退出' },
'用 do-while 循环，选择 2 时退出并输出“已退出”。',
`#include <stdio.h>\n\nint main() {\n    int choice = 2;\n    do {\n        printf("1. 选项一\\n2. 退出\\n");\n    } while (choice != 2);\n    printf("已退出\\n");\n    return 0;\n}`),
      L('a6-2', '学生成绩统计', 55, '用数组和循环统计成绩。',
`<h3>总分、平均分、最高分</h3><pre><code>int scores[5] = {88, 95, 79, 64, 91};</code></pre>`,
'', { type: 'contains', expect: '总分：417' },
'遍历数组求总分、平均分和最高分。',
`#include <stdio.h>\n\nint main() {\n    int scores[5] = {88, 95, 79, 64, 91};\n    int total = 0, max = scores[0];\n    for (int i = 0; i < 5; i++) {\n        total += scores[i];\n        if (scores[i] > max) max = scores[i];\n    }\n    printf("总分：%d\\n", total);\n    printf("平均分：%.1f\\n", total / 5.0);\n    printf("最高分：%d\\n", max);\n    return 0;\n}`),
      L('a6-3', '完善猜数字', 60, '用循环让玩家一直猜。',
`<h3>猜不中就一直猜</h3><pre><code>while (guess != answer) {\n    scanf("%d", &amp;guess);\n}</code></pre>`,
'', { type: 'output', expect: '猜对了' },
'用 while 循环，猜对后输出“猜对了”。',
`#include <stdio.h>\n\nint main() {\n    int answer = 42, guess = 42;\n    while (guess != answer) {\n        scanf("%d", &guess);\n    }\n    printf("猜对了\\n");\n    return 0;\n}`)
    ]
  }
,
  {
    id: 'a7', icon: '🧩', title: '项目预备', subtitle: '动态内存与链表',
    lessons: [
      L('a7-1', '动态内存 malloc', 55, '用 malloc 申请内存。',
`<h3>malloc 按需分配内存</h3><pre><code>int *p = (int*)malloc(sizeof(int));\n*p = 10;\nprintf("%d\\n", *p);\nfree(p);</code></pre>`,
'', { type: 'output', expect: '10' },
'包含 stdlib.h，用 malloc 和 free。',
`#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int *p = (int*)malloc(sizeof(int));\n    *p = 10;\n    printf("%d\\n", *p);\n    free(p);\n    return 0;\n}`),
      L('a7-2', '结构体数组', 55, '用数组保存多个结构体。',
`<h3>一张表存多个学生</h3><pre><code>struct Student {\n    char name[20];\n    int score;\n};\nstruct Student list[2] = {{"小皮", 88}, {"阿离", 95}};</code></pre>`,
'', { type: 'contains', expect: '阿离 95' },
'遍历结构体数组输出。',
`#include <stdio.h>\n\nstruct Student {\n    char name[20];\n    int score;\n};\n\nint main() {\n    struct Student list[2] = {{"小皮", 88}, {"阿离", 95}};\n    for (int i = 0; i < 2; i++) {\n        printf("%s %d\\n", list[i].name, list[i].score);\n    }\n    return 0;\n}`),
      L('a7-3', '链表节点', 60, '认识链表结构。',
`<h3>链表 = 一个个手拉手的节点</h3><pre><code>struct Node {\n    int value;\n    struct Node *next;\n};</code></pre>`,
'', { type: 'output', expect: '10 20' },
'创建两个节点并用 next 连起来。',
`#include <stdio.h>\n#include <stdlib.h>\n\nstruct Node {\n    int value;\n    struct Node *next;\n};\n\nint main() {\n    struct Node *a = (struct Node*)malloc(sizeof(struct Node));\n    struct Node *b = (struct Node*)malloc(sizeof(struct Node));\n    a->value = 10; a->next = b;\n    b->value = 20; b->next = NULL;\n    printf("%d %d\\n", a->value, a->next->value);\n    free(a); free(b);\n    return 0;\n}`)
    ]
  }
];