const CHALLENGE_LEVELS = [
  { level: 1, name: '入门', icon: '⭐', badge: '⭐', color: '#e3f8ef', xp: 50 },
  { level: 2, name: '进阶', icon: '⭐⭐', badge: '🔥', color: '#e8f0ff', xp: 90 }
];

const CHALLENGES = [
  {
    id: 'c1', level: 1, xp: 50, title: '求 1 到 100 的和', tags: ['循环', '累加'],
    desc: `<p>计算 <code>1 + 2 + ... + 100</code> 的结果并输出。</p>`,
    specs: [{ call: '运行程序', out: '5050', note: '' }],
    starter: `#include <stdio.h>\n\nint main() {\n    // TODO: 累加 1 到 100\n    return 0;\n}`,
    check: { type: 'output', expect: '5050' },
    hint: '用 for 循环，准备 total = 0 再累加。',
    solution: `#include <stdio.h>\n\nint main() {\n    int total = 0;\n    for (int i = 1; i <= 100; i++) total += i;\n    printf("%d\\n", total);\n    return 0;\n}`
  },
  {
    id: 'c2', level: 1, xp: 50, title: '判断奇偶', tags: ['条件', '取余'],
    desc: `<p>判断一个整数是奇数还是偶数，输出“奇数”或“偶数”。</p>`,
    specs: [{ call: '输入 7', out: '奇数', note: '' }],
    starter: `#include <stdio.h>\n\nint main() {\n    int n = 7;\n    // TODO: 判断奇偶\n    return 0;\n}`,
    check: { type: 'output', expect: '奇数' },
    hint: '用 n % 2 判断余数。',
    solution: `#include <stdio.h>\n\nint main() {\n    int n = 7;\n    if (n % 2 == 0) printf("偶数\\n");\n    else printf("奇数\\n");\n    return 0;\n}`
  },
  {
    id: 'c3', level: 1, xp: 50, title: '找数组最大值', tags: ['数组', '循环'],
    desc: `<p>找到数组里的最大值并输出。</p>`,
    specs: [{ call: '{3,9,1,7,4}', out: '9', note: '' }],
    starter: `#include <stdio.h>\n\nint main() {\n    int nums[5] = {3, 9, 1, 7, 4};\n    // TODO: 找最大值\n    return 0;\n}`,
    check: { type: 'output', expect: '9' },
    hint: '先让 max = nums[0]，再遍历比较。',
    solution: `#include <stdio.h>\n\nint main() {\n    int nums[5] = {3, 9, 1, 7, 4};\n    int max = nums[0];\n    for (int i = 1; i < 5; i++) {\n        if (nums[i] > max) max = nums[i];\n    }\n    printf("%d\\n", max);\n    return 0;\n}`
  },
  {
    id: 'c4', level: 1, xp: 50, title: '九九乘法表', tags: ['嵌套循环'],
    desc: `<p>输出九九乘法表，每行格式如 <code>5 x 5 = 25</code>。</p>`,
    specs: [{ call: '运行程序', out: '5 x 5 = 25', note: '检查这一行' }],
    starter: `#include <stdio.h>\n\nint main() {\n    // TODO: 两层 for 循环\n    return 0;\n}`,
    check: { type: 'contains', expect: '5 x 5 = 25' },
    hint: '外层 i 从 1 到 9，内层 j 从 1 到 i。',
    solution: `#include <stdio.h>\n\nint main() {\n    for (int i = 1; i <= 9; i++) {\n        for (int j = 1; j <= i; j++) {\n            printf("%d x %d = %d\\n", i, j, i * j);\n        }\n    }\n    return 0;\n}`
  },
  {
    id: 'c5', level: 2, xp: 90, title: '回文字符串', tags: ['字符串', '循环'],
    desc: `<p>判断字符串 <code>level</code> 是否是回文，输出“是回文”或“不是回文”。</p>`,
    specs: [{ call: '"level"', out: '是回文', note: '' }],
    starter: `#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[] = "level";\n    // TODO: 判断是否回文\n    return 0;\n}`,
    check: { type: 'output', expect: '是回文' },
    hint: '用 strlen 拿长度，再从两端向中间比较。',
    solution: `#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[] = "level";\n    int len = strlen(s);\n    int ok = 1;\n    for (int i = 0; i < len / 2; i++) {\n        if (s[i] != s[len - 1 - i]) ok = 0;\n    }\n    printf(ok ? "是回文\\n" : "不是回文\\n");\n    return 0;\n}`
  },
  {
    id: 'c6', level: 2, xp: 90, title: '冒泡排序', tags: ['数组', '排序'],
    desc: `<p>把数组从小到大排序并输出，每个数字后面加一个空格。</p>`,
    specs: [{ call: '{5,3,8,1}', out: '1 3 5 8', note: '' }],
    starter: `#include <stdio.h>\n\nint main() {\n    int a[4] = {5, 3, 8, 1};\n    // TODO: 冒泡排序\n    return 0;\n}`,
    check: { type: 'contains', expect: '1 3 5 8' },
    hint: '两层循环，相邻比较后交换。',
    solution: `#include <stdio.h>\n\nint main() {\n    int a[4] = {5, 3, 8, 1};\n    for (int i = 0; i < 4; i++)\n        for (int j = 0; j < 3 - i; j++)\n            if (a[j] > a[j + 1]) {\n                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;\n            }\n    for (int i = 0; i < 4; i++) printf("%d ", a[i]);\n    printf("\\n");\n    return 0;\n}`
  },
  {
    id: 'c7', level: 2, xp: 90, title: '阶乘', tags: ['循环', '累乘'],
    desc: `<p>计算 <code>5!</code> 并输出，即 <code>5 × 4 × 3 × 2 × 1</code>。</p>`,
    specs: [{ call: '5', out: '120', note: '' }],
    starter: `#include <stdio.h>\n\nint main() {\n    int n = 5;\n    // TODO: 计算阶乘\n    return 0;\n}`,
    check: { type: 'output', expect: '120' },
    hint: '准备 result = 1，从 1 乘到 n。',
    solution: `#include <stdio.h>\n\nint main() {\n    int n = 5;\n    int result = 1;\n    for (int i = 1; i <= n; i++) result *= i;\n    printf("%d\\n", result);\n    return 0;\n}`
  },
  {
    id: 'c8', level: 2, xp: 90, title: '判断素数', tags: ['循环', '条件'],
    desc: `<p>判断 17 是否是素数，输出“是素数”或“不是素数”。</p>`,
    specs: [{ call: '17', out: '是素数', note: '' }],
    starter: `#include <stdio.h>\n\nint main() {\n    int n = 17;\n    // TODO: 判断素数\n    return 0;\n}`,
    check: { type: 'output', expect: '是素数' },
    hint: '从 2 试除到 n-1，如果能整除就不是素数。',
    solution: `#include <stdio.h>\n\nint main() {\n    int n = 17;\n    int prime = 1;\n    for (int i = 2; i < n; i++) {\n        if (n % i == 0) prime = 0;\n    }\n    printf(prime ? "是素数\\n" : "不是素数\\n");\n    return 0;\n}`
  }
];

const PROJECTS = [
  {
    id: 'p1', icon: '🧮', title: '简易计算器', xp: 80,
    desc: `<p>读取两个整数，输出它们的和、差、积、商。</p>`,
    starter: `#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d %d\\n", a, b);\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d + %d = %d\\n", a, b, a + b);\n    printf("%d - %d = %d\\n", a, b, a - b);\n    printf("%d * %d = %d\\n", a, b, a * b);\n    if (b != 0) printf("%d / %d = %d\\n", a, b, a / b);\n    return 0;\n}`
  },
  {
    id: 'p2', icon: '🎲', title: '猜数字游戏', xp: 90,
    desc: `<p>设置一个固定答案，让玩家猜数字。</p>`,
    starter: `#include <stdio.h>\n\nint main() {\n    int answer = 42;\n    printf("请猜一个数字：\\n");\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nint main() {\n    int answer = 42, guess;\n    printf("请猜一个数字：\\n");\n    scanf("%d", &guess);\n    if (guess == answer) printf("猜对了！\\n");\n    else if (guess > answer) printf("太大了\\n");\n    else printf("太小了\\n");\n    return 0;\n}`
  },
  {
    id: 'p3', icon: '📊', title: '成绩统计', xp: 100,
    desc: `<p>计算一组成绩的总分和平均分。</p>`,
    starter: `#include <stdio.h>\n\nint main() {\n    int scores[5] = {88, 95, 79, 64, 91};\n    printf("成绩统计\\n");\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nint main() {\n    int scores[5] = {88, 95, 79, 64, 91};\n    int total = 0;\n    for (int i = 0; i < 5; i++) total += scores[i];\n    printf("总分：%d\\n", total);\n    printf("平均分：%.1f\\n", total / 5.0);\n    return 0;\n}`
  },
  {
    id: 'p4', icon: '📇', title: '通讯录', xp: 120,
    desc: `<p>用结构体保存姓名和电话，并打印联系人。</p>`,
    starter: `#include <stdio.h>\n\nstruct Contact {\n    char name[20];\n    char phone[20];\n};\n\nint main() {\n    struct Contact c = {"小皮", "13800000001"};\n    printf("通讯录\\n");\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nstruct Contact {\n    char name[20];\n    char phone[20];\n};\n\nint main() {\n    struct Contact c = {"小皮", "13800000001"};\n    printf("%s：%s\\n", c.name, c.phone);\n    return 0;\n}`
  },
  {
    id: 'p5', icon: '🏦', title: '银行账户', xp: 130,
    desc: `<p>模拟一个简单银行账户，支持存款、取款和查询余额。</p>`,
    starter: `#include <stdio.h>\n\nint main() {\n    int balance = 1000;\n    printf("余额：%d\\n", balance);\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nint main() {\n    int balance = 1000;\n    balance += 500;\n    balance -= 200;\n    printf("余额：%d\\n", balance);\n    return 0;\n}`
  },
  {
    id: 'p6', icon: '📦', title: '商品库存', xp: 140,
    desc: `<p>用结构体数组管理商品名称和库存数量。</p>`,
    starter: `#include <stdio.h>\n\nstruct Goods {\n    char name[20];\n    int stock;\n};\n\nint main() {\n    printf("库存管理\\n");\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nstruct Goods {\n    char name[20];\n    int stock;\n};\n\nint main() {\n    struct Goods list[2] = {{"苹果", 30}, {"香蕉", 20}};\n    for (int i = 0; i < 2; i++) printf("%s：%d\\n", list[i].name, list[i].stock);\n    return 0;\n}`
  },
  {
    id: 'p7', icon: '📝', title: '文本统计', xp: 130,
    desc: `<p>统计一段文字中的字符数、单词数和行数。</p>`,
    starter: `#include <stdio.h>\n\nint main() {\n    char text[] = "C language is useful.\\n";\n    printf("文本统计\\n");\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nint main() {\n    char text[] = "C language is useful.\\n";\n    int chars = 0, words = 0, lines = 1;\n    for (int i = 0; text[i] != '\\0'; i++) {\n        chars++;\n        if (text[i] == ' ') words++;\n        if (text[i] == '\\n') lines++;\n    }\n    words++;\n    printf("字符：%d 单词：%d 行数：%d\\n", chars, words, lines);\n    return 0;\n}`
  },
  {
    id: 'p8', icon: '🌡️', title: '温度转换', xp: 110,
    desc: `<p>把摄氏温度转换成华氏温度。</p>`,
    starter: `#include <stdio.h>\n\nint main() {\n    float c = 25;\n    printf("温度转换\\n");\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nint main() {\n    float c = 25;\n    float f = c * 9 / 5 + 32;\n    printf("%.1f 摄氏度 = %.1f 华氏度\\n", c, f);\n    return 0;\n}`
  },
  {
    id: 'p9', icon: '💼', title: '员工工资计算', xp: 150,
    desc: `<p>用结构体计算员工工资，含基本工资和奖金。</p>`,
    starter: `#include <stdio.h>\n\nstruct Employee {\n    char name[20];\n    int base;\n    int bonus;\n};\n\nint main() {\n    printf("工资表\\n");\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n\nstruct Employee {\n    char name[20];\n    int base;\n    int bonus;\n};\n\nint main() {\n    struct Employee e = {"小明", 5000, 1200};\n    printf("%s 工资：%d\\n", e.name, e.base + e.bonus);\n    return 0;\n}`
  },
  {
    id: 'p10', icon: '🔗', title: '链表通讯录', xp: 160,
    desc: `<p>用链表保存多个联系人。</p>`,
    starter: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct Contact {\n    char name[20];\n    struct Contact *next;\n};\n\nint main() {\n    printf("链表通讯录\\n");\n    return 0;\n}`,
    check: { type: 'project' },
    solution: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct Contact {\n    char name[20];\n    struct Contact *next;\n};\n\nint main() {\n    struct Contact *a = (struct Contact*)malloc(sizeof(struct Contact));\n    struct Contact *b = (struct Contact*)malloc(sizeof(struct Contact));\n    sprintf(a->name, "小皮"); a->next = b;\n    sprintf(b->name, "阿离"); b->next = NULL;\n    for (struct Contact *p = a; p; p = p->next) printf("%s\\n", p->name);\n    free(a); free(b);\n    return 0;\n}`
  }
];

const ACHIEVEMENTS = [
  { id: 'first', icon: '🎯', title: '初次冒险', desc: '完成第一关', goal: 1 },
  { id: 'starter', icon: '⭐', title: '小有所成', desc: '完成 10 个关卡', goal: 10 },
  { id: 'fighter', icon: '⚔️', title: '战斗专家', desc: '完成 5 道挑战', goal: 5 },
  { id: 'builder', icon: '🛠️', title: '造物者', desc: '完成 3 个项目', goal: 3 },
  { id: 'scholar', icon: '🏆', title: 'C 语言学者', desc: '累计获得 2000 经验', goal: 2000 }
];
