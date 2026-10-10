/* ============================================================
   data-projects.js —— 项目工坊数据
   每个项目 = 目标 + 步骤清单 + 起始代码 + 自动判题 + 参考实现 + 进阶挑战
   ============================================================ */

const PROJECTS = [
{
  id: 'p1', emoji: '🎲', name: '猜数字游戏', sub: '随机数 · 循环 · 条件判断',
  diff: 2, color: '#eaf1ff', tags: ['random', 'while', 'if/elif'],
  desc: '电脑想一个数，你来猜。每次猜错它都会提示「大了」还是「小了」——这是最经典的入门项目。',
  intro: `
<p>这个项目会把你学过的 <strong>循环 + 条件判断 + 输入输出</strong> 全部串起来，做出一个真正能玩的小游戏。</p>
<div class="tip tip-fun"><span class="tip-ico">🧠</span><div>核心思路：用一个 <code>while True</code> 无限循环反复读输入，猜中就 <code>break</code> 跳出。这就是所有命令行游戏的基本骨架。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>为了让判题结果可复现，这个项目<strong>先把答案固定成 42</strong>。等你调通了，再把那一行换成 <code>answer = random.randint(1, 100)</code> 就变成真随机游戏了。</div></div>
`,
  steps: [
    '<strong>准备答案和计数器</strong>：<code>answer = 42</code>，<code>count = 0</code>。',
    '<strong>开一个无限循环</strong>：<code>while True:</code>。',
    '<strong>读入猜测</strong>：<code>guess = int(input("猜一个 1~100 的数字："))</code>，别忘了 <code>int()</code> 转换。',
    '<strong>计数</strong>：每猜一次 <code>count += 1</code>。',
    '<strong>三分支判断</strong>：大于答案提示「大了」，小于提示「小了」，相等就输出 <code>猜对了！你用了 N 次</code> 并 <code>break</code>。'
  ],
  starter: `import random

# 先固定答案，方便调试。调通后再换成 random.randint(1, 100)
answer = 42
count = 0

# 在这里写主循环
`,
  stdin: '50\n25\n37\n42\n',
  check: { type: 'contains', expect: ['大了', '小了', '猜对了！你用了 4 次'] },
  solution: `import random

answer = 42
count = 0

while True:
    guess = int(input("猜一个 1~100 的数字："))
    count += 1

    if guess > answer:
        print("大了")
    elif guess < answer:
        print("小了")
    else:
        print(f"猜对了！你用了 {count} 次")
        break
`,
  challenge: '加上「最多猜 7 次」的限制：超过就输出「次数用完啦，答案是 42」并退出。再进一步，把 <code>answer</code> 换成随机数，并限制只在 1~100 之间猜。'
},

{
  id: 'p2', emoji: '✅', name: '命令行待办清单', sub: '列表 · 函数 · 菜单循环',
  diff: 2, color: '#e3f8ef', tags: ['list', 'while', 'enumerate'],
  desc: '做一个能添加、查看、完成事项的待办清单，是理解「程序状态」的最好练习。',
  intro: `
<p>待办清单的本质是：<strong>一个列表保存状态</strong>，<strong>一个循环不断读取命令</strong>，<strong>一组 if 分发到不同操作</strong>。这就是几乎所有管理类软件的雏形。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>标准输入框里预填了 6 行命令，相当于模拟用户的一次操作流程：添加「写作业」→ 添加「练琴」→ 查看列表 → 退出。</div></div>
`,
  steps: [
    '<strong>准备数据</strong>：<code>todos = []</code> 存待办事项。',
    '<strong>写菜单函数</strong>：<code>show_menu()</code> 打印 <code>1.添加  2.查看  3.完成  4.退出</code>。',
    '<strong>主循环</strong>：<code>while True:</code> 里先调 <code>show_menu()</code>，再 <code>cmd = input("请选择：")</code>。',
    '<strong>分发命令</strong>：<code>cmd == "1"</code> 添加（再 <code>input()</code> 问内容），<code>"2"</code> 用 <code>enumerate</code> 带序号打印全部。',
    '<strong>"3" 完成事项</strong>：读取序号，用 <code>todos.pop(idx - 1)</code> 移除。',
    '<strong>"4" 退出</strong>：打印 <code>再见！</code> 然后 <code>break</code>。'
  ],
  starter: `todos = []

def show_menu():
    print("1.添加  2.查看  3.完成  4.退出")

# 主循环：读命令 -> 分发到不同操作
`,
  stdin: '1\n写作业\n1\n练琴\n2\n4\n',
  check: { type: 'contains', expect: ['写作业', '练琴', '再见！'] },
  solution: `todos = []

def show_menu():
    print("1.添加  2.查看  3.完成  4.退出")

while True:
    show_menu()
    cmd = input("请选择：")

    if cmd == "1":
        item = input("要做什么？")
        todos.append(item)
        print(f"已添加：{item}")

    elif cmd == "2":
        if not todos:
            print("清单还是空的")
        else:
            for i, t in enumerate(todos, 1):
                print(f"{i}. {t}")

    elif cmd == "3":
        idx = int(input("要完成第几项？"))
        if 1 <= idx <= len(todos):
            done = todos.pop(idx - 1)
            print(f"已完成：{done}")
        else:
            print("没有这一项")

    elif cmd == "4":
        print("再见！")
        break

    else:
        print("看不懂这个命令")
`,
  challenge: '给每条待办加上状态（用字典 <code>{"text": ..., "done": False}</code>），查看时已完成的显示 <code>[x]</code>，未完成的显示 <code>[ ]</code>。'
},

{
  id: 'p3', emoji: '🔐', name: '随机密码生成器', sub: '模块 · 字符串 · 列表操作',
  diff: 2, color: '#f0ecff', tags: ['random', 'string', 'join'],
  desc: '做一个能生成强密码的小工具，顺便搞懂「随机」和「洗牌」是怎么回事。',
  intro: `
<p>一个合格密码要满足<strong>四类字符都至少出现一次</strong>。所以生成策略是：先从每类里各挑一个保底，再用剩余长度随机填充，最后<strong>打乱顺序</strong>。</p>
<div class="tip tip-fun"><span class="tip-ico">🔀</span><div>为什么最后一定要打乱？因为不打乱的话，密码的前四位永远是「小写-大写-数字-符号」，规律太明显，一眼就被看穿。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>string</code> 模块里有现成的字符集：<code>ascii_lowercase</code>（小写）、<code>ascii_uppercase</code>（大写）、<code>digits</code>（数字）。</div></div>
`,
  steps: [
    '<strong>导入模块</strong>：<code>import random, string</code>。',
    '<strong>读长度</strong>：<code>n = int(input("密码长度："))</code>，标准输入里预填了 12。',
    '<strong>准备字符集</strong>：小写 / 大写 / 数字 / 符号 <code>"!@#$%^&*"</code> 四类。',
    '<strong>保底四个</strong>：每类先 <code>random.choice()</code> 抽一个放进列表。',
    '<strong>补足长度</strong>：用 <code>while</code> 从全部字符里随机抽，直到列表长度到 <code>n</code>。',
    '<strong>打乱并拼接</strong>：<code>random.shuffle()</code> 后 <code>"".join()</code>，结果存进变量 <code>password</code> 并打印。'
  ],
  starter: `import random
import string

n = int(input("密码长度："))

lower = string.ascii_lowercase
upper = string.ascii_uppercase
digits = string.digits
symbols = "!@#$%^&*"

password = ""   # 待生成

print(password)
`,
  stdin: '12\n',
  check: {
    type: 'tests',
    code: `assert isinstance(password, str), "password 应该是字符串"
assert len(password) == 12, f"密码长度应该是 12，实际是 {len(password)}"
assert any(c.isupper() for c in password), "密码里至少要有一个大写字母"
assert any(c.islower() for c in password), "密码里至少要有一个小写字母"
assert any(c.isdigit() for c in password), "密码里至少要有一个数字"
assert any(c in symbols for c in password), "密码里至少要有一个符号（!@#$%^&*）"`
  },
  solution: `import random
import string

n = int(input("密码长度："))

lower = string.ascii_lowercase
upper = string.ascii_uppercase
digits = string.digits
symbols = "!@#$%^&*"

all_chars = lower + upper + digits + symbols

password = [
    random.choice(lower),
    random.choice(upper),
    random.choice(digits),
    random.choice(symbols),
]

while len(password) < n:
    password.append(random.choice(all_chars))

random.shuffle(password)
password = "".join(password)

print(password)
`,
  challenge: '加上「生成 5 个候选密码」的功能，并且避免出现容易混淆的字符（<code>0</code> 和 <code>O</code>、<code>1</code> 和 <code>l</code>）。提示：用 <code>replace()</code> 把它们从字符集里去掉。'
},

{
  id: 'p4', emoji: '📊', name: '词频统计器', sub: '字典 · 排序 · 数据处理',
  diff: 3, color: '#fff6de', tags: ['dict', 'split', 'sorted'],
  desc: '统计一段文字里每个词出现了多少次，找出出现最多的前 3 名。数据分析的第一课。',
  intro: `
<p>这是数据处理里最重要的模式之一：<strong>遍历 → 计数 → 排序 → 取前 N</strong>。搜索引擎的索引、热搜榜、日志分析，用的都是这套逻辑。</p>
<div class="tip tip-fun"><span class="tip-ico">💡</span><div>计数的关键一行是 <code>counts[w] = counts.get(w, 0) + 1</code>。它的意思是：「如果字典里已经有 w 就拿它的值，没有就当 0，然后加 1」——避免了 <code>KeyError</code>。</div></div>
`,
  steps: [
    '<strong>切词</strong>：<code>words = text.split()</code>。',
    '<strong>建空字典</strong>：<code>counts = {}</code>。',
    '<strong>遍历计数</strong>：用 <code>counts.get(w, 0) + 1</code> 累加。',
    '<strong>排序</strong>：<code>sorted(counts.items(), key=lambda kv: -kv[1])</code>，负号表示从大到小。',
    '<strong>取前三并打印</strong>：<code>[:3]</code> 切片，格式为 <code>词: 次数</code>。'
  ],
  starter: `text = "apple banana apple cherry apple banana apple"

# 1) 切分成单词列表
# 2) 用字典统计每个词出现的次数
# 3) 按次数从多到少取前 3 名，按 "词: 次数" 逐行打印
`,
  check: { type: 'output', expect: 'apple: 4\nbanana: 2\ncherry: 1' },
  solution: `text = "apple banana apple cherry apple banana apple"

words = text.split()

counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1

top3 = sorted(counts.items(), key=lambda kv: -kv[1])[:3]

for word, c in top3:
    print(f"{word}: {c}")
`,
  challenge: '把 <code>text</code> 换成你自己写的一段话，并且忽略大小写（提示：<code>text.lower().split()</code>），再去掉标点符号。'
},

{
  id: 'p5', emoji: '🎨', name: 'ASCII 艺术工坊', sub: '嵌套循环 · 字符串乘法',
  diff: 1, color: '#fff0e8', tags: ['for', 'range', '字符串运算'],
  desc: '用星号画出一座金字塔。看起来简单，但它是理解「嵌套循环」和「对齐」的最好练习。',
  intro: `
<p>图形的本质是<strong>每行重复打印某些字符</strong>。只要找出「第 i 行需要几个空格、几个星号」的规律，图形就出来了。</p>
<div class="tip tip-fun"><span class="tip-ico">📐</span><div>金字塔的规律：<br>· 空格数 = <code>n - i</code><br>· 星号数 = <code>2 * i - 1</code>（每行多 2 个，保持居中）</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>Python 里字符串可以相乘：<code>"*" * 5</code> 得到 <code>*****</code>，<code>" " * 3</code> 得到三个空格。这一招能省掉一整个内层循环。</div></div>
`,
  steps: [
    '<strong>确定层数</strong>：<code>n = 5</code>。',
    '<strong>外层循环</strong>：<code>for i in range(1, n + 1):</code> 控制第几行。',
    '<strong>算空格</strong>：第 i 行左边要有 <code>n - i</code> 个空格。',
    '<strong>算星号</strong>：第 i 行要有 <code>2 * i - 1</code> 个星号。',
    '<strong>拼起来打印</strong>：<code>print(" " * (n - i) + "*" * (2 * i - 1))</code>。'
  ],
  starter: `n = 5

# 第 i 行：先打印 (n - i) 个空格，再打印 (2 * i - 1) 个星号
# 目标效果：
#     *
#    ***
#   *****
#  *******
# *********
`,
  check: { type: 'output', expect: '    *\n   ***\n  *****\n *******\n*********' },
  solution: `n = 5

for i in range(1, n + 1):
    spaces = " " * (n - i)
    stars = "*" * (2 * i - 1)
    print(spaces + stars)
`,
  challenge: '用同一个规律画一个「菱形」：上半部分是金字塔，下半部分把循环倒过来（<code>range(n - 1, 0, -1)</code>）。再把 <code>*</code> 换成你喜欢的 emoji。'
},

{
  id: 'p6', emoji: '📈', name: '学生成绩分析器', sub: '字典列表 · 统计 · 综合实战',
  diff: 3, color: '#fdecec', tags: ['dict', 'list', 'f-string'],
  desc: '给一组学生的成绩数据，算出每人总分、平均分、班级平均分和第一名。综合度最高的项目。',
  intro: `
<p>真实世界的数据几乎都长这样：<strong>列表里装着字典</strong>。这个项目教你把「一堆结构化数据」变成「有用的结论」。</p>
<div class="tip tip-fun"><span class="tip-ico">🧩</span><div>注意 <code>avg:.1f</code> 这个写法 —— 冒号后面是<strong>格式说明</strong>，<code>.1f</code> 表示保留 1 位小数的浮点数。做报表必会。</div></div>
`,
  steps: [
    '<strong>看懂数据结构</strong>：每个学生是一个字典，有 <code>name</code> 和 <code>scores</code> 两个键。',
    '<strong>准备三个累加器</strong>：全班总分 <code>total_all</code>、全班人数 <code>count_all</code>、最高分记录 <code>best</code>。',
    '<strong>遍历每个学生</strong>：<code>sum(s["scores"])</code> 得总分，除以科目数得平均分。',
    '<strong>按格式打印</strong>：<code>f"{name} 总分 {total} 平均 {avg:.1f}"</code>。',
    '<strong>顺手累计</strong>：把总分和人数加到全班统计里，并更新最高分记录。',
    '<strong>最后输出</strong>：班级平均分和总分最高的同学。'
  ],
  starter: `students = [
    {"name": "小明", "scores": [88, 92, 79]},
    {"name": "小红", "scores": [95, 88, 92]},
    {"name": "小刚", "scores": [70, 85, 85]},
]

# 对每个学生：算总分和平均分并打印
# 最后再打印：班级平均分 和 总分最高的同学
`,
  check: {
    type: 'output',
    expect: '小明 总分 259 平均 86.3\n小红 总分 275 平均 91.7\n小刚 总分 240 平均 80.0\n班级平均分: 86.0\n总分最高: 小红'
  },
  solution: `students = [
    {"name": "小明", "scores": [88, 92, 79]},
    {"name": "小红", "scores": [95, 88, 92]},
    {"name": "小刚", "scores": [70, 85, 85]},
]

total_all = 0
count_all = 0
best_name = ""
best_total = -1

for s in students:
    total = sum(s["scores"])
    avg = total / len(s["scores"])
    print(f"{s['name']} 总分 {total} 平均 {avg:.1f}")

    total_all += total
    count_all += len(s["scores"])

    if total > best_total:
        best_total = total
        best_name = s["name"]

print(f"班级平均分: {total_all / count_all:.1f}")
print(f"总分最高: {best_name}")
`,
  challenge: '给每个学生加上等级评定（平均分 90+ 优秀 / 80+ 良好 / 60+ 及格 / 否则 不及格），并找出「偏科最严重」的同学（最高分和最低分之差最大）。'
},

/* ==================== 进阶项目 ==================== */
{
  id: 'p7', level: 'advanced', emoji: '🏦', name: '银行账户系统', sub: '面向对象 · 继承 · 异常',
  diff: 3, color: '#e8f0ff', tags: ['class', '继承', 'raise'],
  desc: '用类建一个银行：开户、存钱、取钱、转账、算利息。第一个真正「像软件」的项目。',
  intro: `
<p>这个项目把进阶篇第一章的东西全用上：<strong>类、继承、魔术方法、抛异常</strong>。
写完它，你就理解了为什么真实系统里到处都是「对象」。</p>
<div class="tip tip-fun"><span class="tip-ico">🧠</span><div>核心设计思想：<strong>余额不能从外面随便改</strong>。所有对余额的修改都必须走 <code>deposit</code> / <code>withdraw</code> 这些方法，
这样规则（不能存负数、不能取超额）才有地方生效。这就是「封装」。</div></div>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>出错了怎么办？这里用 <code>raise ValueError("余额不足")</code> 主动抛异常，而不是返回 <code>False</code>。
区别在于：<strong>调用方不能装作没看见</strong> —— 不处理程序就崩，逼着人写对。</div></div>
`,
  steps: [
    '<strong>写 Account 类</strong>：<code>__init__(self, owner, balance=0)</code>，把两个参数存成属性。',
    '<strong>deposit</strong>：金额必须为正（否则 <code>raise ValueError</code>），加余额并返回新余额。',
    '<strong>withdraw</strong>：余额不够就 <code>raise ValueError("余额不足")</code>，够就扣掉并返回新余额。',
    '<strong>transfer</strong>：<code>self.withdraw(amount)</code> 然后 <code>other.deposit(amount)</code>，返回自己的新余额。',
    '<strong>__str__</strong>：返回 <code>"户主: 余额 元"</code> 这样的字符串。',
    '<strong>SavingsAccount 继承 Account</strong>：加类属性 <code>rate = 0.03</code>，方法 <code>add_interest()</code> 按利率加利息（<code>round(x, 2)</code>）并返回新余额。'
  ],
  starter: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        # 金额 <= 0 就 raise ValueError("存款金额必须为正")
        pass

    def withdraw(self, amount):
        # 余额不够就 raise ValueError("余额不足")
        pass

    def transfer(self, other, amount):
        # 从自己转给别人，返回自己的新余额
        pass

    def __str__(self):
        pass


class SavingsAccount(Account):
    rate = 0.03

    def add_interest(self):
        # 按 rate 加利息，四舍五入到分，返回新余额
        pass


a = Account("小明", 100)
print(a)
`,
  check: {
    type: 'tests',
    code: `a = Account("小明", 100)
assert a.owner == "小明" and a.balance == 100, "初始属性不对"
assert a.deposit(50) == 150, f"存 50 后应该返回 150，实际 {a.deposit(50)!r}"
assert a.balance == 150, "存钱后余额不对"
assert a.withdraw(30) == 120, f"取 30 后应该返回 120，实际 {a.withdraw(30)!r}"

b = Account("小红")
assert b.balance == 0, "不传余额时默认应该是 0"
a.transfer(b, 20)
assert a.balance == 100 and b.balance == 20, f"转账后余额不对：a={a.balance}, b={b.balance}"

assert str(Account("小明", 120)) == "小明: 120 元", f"__str__ 格式不对：{str(Account('小明', 120))!r}"

try:
    a.withdraw(99999)
    raise AssertionError("余额不足时应该抛 ValueError")
except ValueError:
    pass
try:
    a.deposit(-1)
    raise AssertionError("存负数时应该抛 ValueError")
except ValueError:
    pass

s = SavingsAccount("小刚", 1000)
assert isinstance(s, Account), "SavingsAccount 应该继承自 Account"
assert s.owner == "小刚", "子类应该继承父类的属性"
assert s.add_interest() == 1030.0, f"1000 元按 3% 加息后应该是 1030.0，实际 {s.add_interest()!r}"
assert s.balance == 1030.0, "加息后余额不对"`
  },
  solution: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("存款金额必须为正")
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("余额不足")
        self.balance -= amount
        return self.balance

    def transfer(self, other, amount):
        self.withdraw(amount)
        other.deposit(amount)
        return self.balance

    def __str__(self):
        return f"{self.owner}: {self.balance} 元"


class SavingsAccount(Account):
    rate = 0.03

    def add_interest(self):
        self.balance = round(self.balance * (1 + self.rate), 2)
        return self.balance


a = Account("小明", 100)
print(a)
`,
  challenge: '加一个交易流水：每次存取都往 <code>self.history</code> 里记一条 <code>("存", 50, 余额)</code>，再写个 <code>statement()</code> 打印完整账单。另外给 <code>SavingsAccount</code> 加「余额低于 100 不给利息」的规则。'
},

{
  id: 'p8', level: 'advanced', emoji: '🔍', name: '日志分析器', sub: '正则 · Counter · 数据统计',
  diff: 3, color: '#fff6de', tags: ['re', 'Counter', '解包'],
  desc: '从一堆服务器日志里提取信息：各状态码出现多少次、哪些接口报错了、平均响应时间是多少。',
  intro: `
<p>这是数据工程的日常：<strong>把非结构化文本变成结构化数据，再统计</strong>。
运维、后端、数据分析岗每天在做的事。</p>
<div class="tip tip-fun"><span class="tip-ico">🎯</span><div>关键一步是用一个正则把每行拆成 4 段。写好之后 <code>findall</code> 一次拿到所有行，
剩下的就是纯统计了 —— 这就是「解析」和「分析」分离的思想。</div></div>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div><code>re.findall</code> 提取出来的<strong>全是字符串</strong>，包括 <code>"200"</code> 和 <code>"120"</code>。
要做数学运算和按数字分组，必须先 <code>int()</code>。忘了转就会得到 <code>{"200": 3}</code> 而不是 <code>{200: 3}</code>。</div></div>
`,
  steps: [
    '<strong>写解析正则</strong>：把 <code>级别 / 接口 / 状态码 / 耗时</code> 四段捕获出来。提示：<code>r"(\\w+)\\s+(/api/\\S+)\\s+(\\d{3})\\s+(\\d+)ms"</code>。',
    '<strong>一次提取所有行</strong>：<code>rows = re.findall(PATTERN, LOG)</code>。',
    '<strong>统计状态码</strong>：把状态码 <code>int()</code> 之后交给 <code>Counter</code>，存进 <code>status_counts</code>。',
    '<strong>挑出报错接口</strong>：级别为 <code>ERROR</code> 的那些行的接口路径，存进 <code>error_paths</code>（保持原顺序，重复也保留）。',
    '<strong>算平均耗时</strong>：所有耗时的平均值，<code>round(..., 1)</code> 保留一位小数，存进 <code>avg_ms</code>。'
  ],
  starter: `import re
from collections import Counter

LOG = """2026-09-16 10:00:01 INFO  /api/login 200 120ms
2026-09-16 10:00:02 ERROR /api/order 500 890ms
2026-09-16 10:00:03 INFO  /api/login 200 95ms
2026-09-16 10:00:04 WARN  /api/cart 404 60ms
2026-09-16 10:00:05 ERROR /api/order 500 1200ms
2026-09-16 10:00:06 INFO  /api/user 200 45ms"""

# 1) 写解析正则
PATTERN = r""

rows = []

# 2) 状态码统计（键要转成 int）
status_counts = None

# 3) 报错接口列表
error_paths = []

# 4) 平均耗时（保留 1 位小数）
avg_ms = None

print("状态码统计:", dict(status_counts) if status_counts else None)
print("错误接口:", error_paths)
print(f"平均响应时间: {avg_ms}ms")
`,
  check: {
    type: 'tests',
    code: `assert len(rows) == 6, f"应该从日志里解析出 6 行，实际 {len(rows)} 行（检查一下正则）"
assert rows[0][0] == "INFO" and rows[0][1] == "/api/login", f"第一行解析结果不对：{rows[0]!r}"
assert rows[1][0] == "ERROR" and rows[1][2] == "500", f"第二行解析结果不对：{rows[1]!r}"
assert status_counts == {200: 3, 500: 2, 404: 1}, f"状态码统计应该是 {{200: 3, 500: 2, 404: 1}}，实际 {status_counts!r}（键是不是忘了转 int？）"
assert error_paths == ["/api/order", "/api/order"], f"报错接口应该是两个 /api/order，实际 {error_paths!r}"
assert avg_ms == 401.7, f"平均耗时应该是 401.7，实际 {avg_ms!r}"`
  },
  solution: `import re
from collections import Counter

LOG = """2026-09-16 10:00:01 INFO  /api/login 200 120ms
2026-09-16 10:00:02 ERROR /api/order 500 890ms
2026-09-16 10:00:03 INFO  /api/login 200 95ms
2026-09-16 10:00:04 WARN  /api/cart 404 60ms
2026-09-16 10:00:05 ERROR /api/order 500 1200ms
2026-09-16 10:00:06 INFO  /api/user 200 45ms"""

PATTERN = r"(\\w+)\\s+(/api/\\S+)\\s+(\\d{3})\\s+(\\d+)ms"

rows = re.findall(PATTERN, LOG)

status_counts = Counter(int(status) for _, _, status, _ in rows)
error_paths = [path for level, path, _, _ in rows if level == "ERROR"]
avg_ms = round(sum(int(ms) for r in rows for ms in [r[3]]) / len(rows), 1)

print("状态码统计:", dict(status_counts))
print("错误接口:", error_paths)
print(f"平均响应时间: {avg_ms}ms")
`,
  challenge: '再加两个统计：① 每个接口的平均耗时，按从慢到快排序输出；② 找出所有 4xx/5xx 的接口并去重（用 <code>set</code>）。如果嫌 <code>rows</code> 可读性差，试着用 <code>namedtuple</code> 或 <code>dataclass</code> 把它变成有字段名的对象。'
},

{
  id: 'p9', level: 'advanced', emoji: '📝', name: '迷你模板引擎', sub: '正则 · 回调函数 · 容错',
  diff: 2, color: '#f0ecff', tags: ['re', 'sub', '函数作为参数'],
  desc: '实现一个 30 行的模板引擎：把 "{name} 今年 {age} 岁" 里的占位符替换成真实数据。',
  intro: `
<p>网页渲染、邮件群发、代码生成，背后都是这个东西。用 <code>re.sub</code> 加一个<strong>回调函数</strong>就能实现。</p>
<div class="tip tip-fun"><span class="tip-ico">🔑</span><div><code>re.sub</code> 的第二个参数除了字符串，还可以传<strong>函数</strong>：每匹配到一次就调用一次，用它的返回值做替换内容。
这就是「替换逻辑太复杂，一个字符串写不下」时的标准解法。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>本项目的容错规则：<code>{key}</code> 找得到就替换；<code>{key|默认值}</code> 找不到就用默认值；
既找不到又没默认值就替换成<strong>空字符串</strong> —— 模板里少填一个字段不该让整页崩掉。</div></div>
`,
  steps: [
    '<strong>想清楚要匹配什么</strong>：一对大括号，里面不能有嵌套大括号，所以模式是 <code>r"\\{([^{}]+)\\}"</code>。',
    '<strong>写替换函数</strong>：接收 match 对象，用 <code>m.group(1)</code> 取出大括号里的内容。',
    '<strong>拆默认值</strong>：用 <code>key, _, default = 内容.partition("|")</code> 把 <code>name|匿名</code> 拆成两半。',
    '<strong>三段判断</strong>：key 在 data 里 → <code>str(data[key])</code>；否则有默认值 → 默认值；否则 → <code>""</code>。',
    '<strong>交给 re.sub</strong>：<code>return re.sub(模式, 替换函数, template)</code>。'
  ],
  starter: `import re

def render(template, data):
    """把 template 里的 {key} 和 {key|默认值} 替换掉，返回新字符串"""
    def replace(m):
        # m.group(1) 是花括号里的内容
        pass

    return re.sub(r"\\{([^{}]+)\\}", replace, template)


print(render("{name} 今年 {age} 岁，来自 {city}。昵称：{nick|无}",
             {"name": "小皮", "age": 18, "city": "北京"}))
`,
  check: {
    type: 'tests',
    code: `t1 = "{name} 今年 {age} 岁，来自 {city}。昵称：{nick|无}"
d1 = {"name": "小皮", "age": 18, "city": "北京"}
assert render(t1, d1) == "小皮 今年 18 岁，来自 北京。昵称：无", f"结果不对：{render(t1, d1)!r}"
assert render("{a}+{b}", {"a": 1, "b": 2}) == "1+2", "数字也要能替换（记得 str()）"
assert render("没有占位符", {}) == "没有占位符", "没有占位符时应该原样返回"
assert render("{missing}", {}) == "", "找不到又没有默认值应该替换成空字符串"
assert render("{missing|默认}", {}) == "默认", "找不到时应该用默认值"
assert render("{a|默认}", {"a": "有值"}) == "有值", "找得到时应该优先用 data 里的值"
assert render("{a} 和 {a}", {"a": "X"}) == "X 和 X", "同一个占位符出现多次都要替换"`
  },
  solution: `import re

def render(template, data):
    def replace(m):
        key, _, default = m.group(1).partition("|")
        key = key.strip()
        if key in data:
            return str(data[key])
        return default.strip() if default else ""

    return re.sub(r"\\{([^{}]+)\\}", replace, template)


print(render("{name} 今年 {age} 岁，来自 {city}。昵称：{nick|无}",
             {"name": "小皮", "age": 18, "city": "北京"}))
`,
  challenge: `加上条件语法 <code>{?vip}尊贵的会员{/vip}</code>：vip 为真时保留中间内容，否则整段删掉。
提示：先 <code>re.sub</code> 处理条件块，再处理普通占位符，注意顺序。`
}

];
