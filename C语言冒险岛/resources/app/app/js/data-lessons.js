/* ============================================================
   data-lessons.js —— 关卡课程数据
   每一关：讲解 + 任务 + 起始代码 + 自动判题 + 提示 + 参考答案
   check 类型：
     {type:'output',   expect:'...'}          → 输出必须完全一致
     {type:'contains', expect:['a','b']}      → 输出里必须包含这些片段
     {type:'tests',    code:'assert ...'}     → 追加隐藏测试（可用 __OUTPUT__ 看输出）
   ============================================================ */

const LESSON_CHAPTERS = [

/* ==================== 第一章 ==================== */
{
  id: 'ch1', icon: '🚀', title: '出发！',
  subtitle: '变量与输出',
  lessons: [
    {
      id: 'l1-1', title: '你好，Python', xp: 20,
      goal: '用 print() 让电脑开口说话。',
      body: `
<h3>print 是 Python 的嘴巴</h3>
<p>想让电脑说点什么，只要把内容塞进 <code>print()</code> 的括号里。</p>
<pre><code>print("你好，世界")</code></pre>
<p>引号是「字符串」的包装纸 —— 单引号 <code>'</code> 和双引号 <code>"</code> 都行，但必须成对出现，否则 Python 会以为你话没说完。</p>
<div class="tip tip-fun"><span class="tip-ico">🎮</span><div>下面编辑器里已经有一行代码了，把它改成输出 <strong>你好，世界</strong>，然后点「运行」看看效果。</div></div>
`,
      starter: 'print("Hello")',
      check: { type: 'output', expect: '你好，世界' },
      hint: '把括号里的内容换成中文，注意引号要保留。',
      solution: 'print("你好，世界")'
    },
    {
      id: 'l1-2', title: '一口气说三件事', xp: 20,
      goal: '学会 print 的多个参数和 sep 分隔符。',
      body: `
<h3>逗号 = 排队输出</h3>
<p>给 <code>print()</code> 多个参数，它会自动用<strong>空格</strong>把它们连起来：</p>
<pre><code>print("我", "爱", "Python")   # 我 爱 Python</code></pre>
<p>想换分隔符？加一个 <code>sep</code> 参数：</p>
<pre><code>print("2026", "09", "16", sep="-")   # 2026-09-16</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>sep</code> 叫「关键字参数」，冒号后面写它的值，等号两边不要加空格。</div></div>
`,
      starter: 'print("2026", "09", "16")',
      check: { type: 'output', expect: '2026/09/16' },
      hint: '在 print 的最后加上 sep="/" 。',
      solution: 'print("2026", "09", "16", sep="/")'
    },
    {
      id: 'l1-3', title: '变量是个盒子', xp: 25,
      goal: '用变量保存数据。',
      body: `
<h3>给数据贴个标签</h3>
<p>变量就像一个贴了名字的盒子，把数据放进去，之后用名字就能取出来：</p>
<pre><code>name = "小皮"
print(name)        # 小皮
print("你好", name) # 你好 小皮</code></pre>
<p>等号 <code>=</code> 不是数学里的「相等」，而是<strong>赋值</strong>：把右边的东西装进左边的盒子里。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>变量名不能有空格、不能用数字开头，也区分大小写。<code>City</code> 和 <code>city</code> 是两个不同的盒子。</div></div>
`,
      starter: `city = "北京"
year = 2026

# 在这里打印 city 和 year
`,
      check: {
        type: 'tests',
        code: `assert city == "北京", "变量 city 应该是 北京"
assert year == 2026, "变量 year 应该是 2026"
assert "北京 2026" in __OUTPUT__, "没有打印出 北京 2026，试试 print(city, year)"`
      },
      hint: 'print(city, year) 会自动用空格隔开。',
      solution: `city = "北京"
year = 2026

print(city, year)`
    },
    {
      id: 'l1-4', title: '数字会算数', xp: 25,
      goal: '掌握 + - * / // % ** 七种运算。',
      body: `
<h3>Python 是个计算器</h3>
<pre><code>print(7 + 3)    # 10   加
print(7 - 3)    # 4    减
print(7 * 3)    # 21   乘
print(7 / 3)    # 2.333...  除（结果一定是小数）
print(7 // 3)   # 2    整除（砍掉小数部分）
print(7 % 3)    # 1    取余（余数）
print(7 ** 3)   # 343  幂（7 的 3 次方）</code></pre>
<div class="tip tip-fun"><span class="tip-ico">🧮</span><div><code>//</code> 和 <code>%</code> 是刷题时最常用的搭档：一个给商，一个给余数。</div></div>
`,
      starter: `a = 17
b = 5

# 用 // 算出商，用 % 算出余数，按格式打印出来
`,
      check: { type: 'output', expect: '商: 3\n余数: 2' },
      hint: 'print("商:", a // b) —— 逗号会自动补一个空格，正好凑成 "商: 3"。',
      solution: `a = 17
b = 5

print("商:", a // b)
print("余数:", a % b)`
    },
    {
      id: 'l1-5', title: 'f-string 魔法', xp: 30,
      goal: '用 f-string 把变量织进句子里。',
      body: `
<h3>字符串插值</h3>
<p>在引号前加一个 <code>f</code>，里面用 <code>{}</code> 包住变量，Python 会自动把值填进去：</p>
<pre><code>name = "小皮"
age = 18
print(f"你好，{name}！我今年 {age} 岁。")</code></pre>
<p>大括号里甚至可以写算式：</p>
<pre><code>print(f"明年我就 {age + 1} 岁了")   # 明年我就 19 岁了</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>忘了写 <code>f</code>，大括号就会被当成普通文字原样打印出来 —— 这是新手最常见的坑。</div></div>
`,
      starter: `age = 18

# 用 f-string 打印：我今年 18 岁，明年 19 岁。
`,
      check: { type: 'output', expect: '我今年 18 岁，明年 19 岁。' },
      hint: 'print(f"我今年 {age} 岁，明年 {age + 1} 岁。")',
      solution: `age = 18

print(f"我今年 {age} 岁，明年 {age + 1} 岁。")`
    },
    {
      id: 'l1-6', title: '打字机：input()', xp: 30,
      goal: '让程序读取用户输入。',
      body: `
<h3>程序开始会听话了</h3>
<p><code>input()</code> 会暂停程序，等你敲一行字回车，然后把那一行<strong>当作字符串</strong>交给你：</p>
<pre><code>name = input("请输入名字：")
print(f"你好，{name}！")</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div><code>input()</code> 拿到的永远是<strong>字符串</strong>。想当数字用，得先转换：<code>age = int(input())</code>。忘了转就会遇到 <code>TypeError</code>。</div></div>
<div class="tip tip-fun"><span class="tip-ico">⌨️</span><div>这个编辑器下方有个<strong>「标准输入」</strong>框，程序运行时 <code>input()</code> 会从那里按行读取。里面已经预填好了 <code>小皮</code>。</div></div>
`,
      starter: `name = input("请输入名字：")

# 打印问候语：你好，<名字>！
`,
      stdin: '小皮',
      check: { type: 'contains', expect: '你好，小皮！' },
      hint: 'print(f"你好，{name}！")',
      solution: `name = input("请输入名字：")

print(f"你好，{name}！")`
    }
  ]
},

/* ==================== 第二章 ==================== */
{
  id: 'ch2', icon: '🔀', title: '分岔路口',
  subtitle: '条件判断',
  lessons: [
    {
      id: 'l2-1', title: '真与假', xp: 20,
      goal: '认识布尔值和比较运算符。',
      body: `
<h3>只有两个答案的世界</h3>
<p>比较两个东西，得到的结果要么是 <code>True</code>（真）要么是 <code>False</code>（假）：</p>
<pre><code>print(7 > 3)      # True
print(7 < 3)      # False
print(7 == 7)     # True   注意是两个等号！
print(7 != 3)     # True   不等于
print(7 >= 7)     # True   大于等于</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>一个等号 <code>=</code> 是赋值，两个等号 <code>==</code> 才是判断相等。写错了 Python 不会报错，但逻辑全歪。</div></div>
`,
      starter: `# 第一行：7 是否大于 3
print(7 > 3)

# 第二行：字符串 "a" 是否等于 "b"
`,
      check: { type: 'output', expect: 'True\nFalse' },
      hint: 'print("a" == "b")',
      solution: `print(7 > 3)
print("a" == "b")`
    },
    {
      id: 'l2-2', title: '第一道门', xp: 25,
      goal: '写出第一个 if 语句。',
      body: `
<h3>if：条件成立才执行</h3>
<pre><code>score = 85
if score >= 60:
    print("及格")</code></pre>
<p>三个要点：<br>
① <code>if</code> 后面跟条件，行尾必须有一个<strong>英文冒号</strong> <code>:</code><br>
② 下一行要<strong>缩进</strong>（4 个空格），表示「这句属于这个 if」<br>
③ 不缩进的代码，无论条件真假都会执行</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>Python 用缩进划分代码块，不像其他语言用大括号。缩进乱了程序就跑不动。</div></div>
`,
      starter: `score = 85

# 如果 score 大于等于 60，就打印：及格
`,
      check: { type: 'output', expect: '及格' },
      hint: 'if score >= 60: 换行后缩进 4 个空格再写 print。',
      solution: `score = 85

if score >= 60:
    print("及格")`
    },
    {
      id: 'l2-3', title: '否则怎么办', xp: 25,
      goal: '用 else 处理另一种情况。',
      body: `
<h3>if / else：两条路</h3>
<pre><code>if 条件:
    条件成立时做的事
else:
    条件不成立时做的事</code></pre>
<p><code>else</code> 后面<strong>不写条件</strong>，因为它接住的是「以上都不满足」的情况。</p>
<div class="tip tip-fun"><span class="tip-ico">🎮</span><div>本关 <code>score = 55</code>，所以应该输出「补考」。写完运行验证一下。</div></div>
`,
      starter: `score = 55

# 大于等于 60 打印 及格，否则打印 补考
`,
      check: { type: 'output', expect: '补考' },
      hint: 'if score >= 60: ... else: ...',
      solution: `score = 55

if score >= 60:
    print("及格")
else:
    print("补考")`
    },
    {
      id: 'l2-4', title: '多岔路', xp: 30,
      goal: '用 elif 处理多个分支。',
      body: `
<h3>elif：还有别的可能</h3>
<pre><code>if score >= 90:
    print("优秀")
elif score >= 80:
    print("良好")
elif score >= 60:
    print("及格")
else:
    print("不及格")</code></pre>
<p>Python 从上往下<strong>逐个检查</strong>，一旦命中就执行那一块，后面的全部跳过。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>顺序很重要！如果把 <code>>= 60</code> 写在最前面，那 95 分也会被判定为「及格」。<strong>从严格到宽松</strong>排。</div></div>
`,
      starter: `score = 87

# 90+ 优秀 / 80+ 良好 / 60+ 及格 / 否则 不及格
`,
      check: { type: 'output', expect: '良好' },
      hint: '注意从大到小判断：先 if score >= 90，再 elif score >= 80 …',
      solution: `score = 87

if score >= 90:
    print("优秀")
elif score >= 80:
    print("良好")
elif score >= 60:
    print("及格")
else:
    print("不及格")`
    },
    {
      id: 'l2-5', title: '组合条件', xp: 35,
      goal: '用 and / or / not 拼出复杂判断。',
      body: `
<h3>逻辑三兄弟</h3>
<pre><code>print(True and False)   # False  两个都真才真
print(True or False)    # True   有一个真就真
print(not True)         # False  取反</code></pre>
<p>经典例子 —— 判断闰年：</p>
<pre><code>if (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:
    print("闰年")</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>括号能帮你看清优先级，也能少犯错。<code>and</code> 的优先级比 <code>or</code> 高，但加括号永远更安全。</div></div>
`,
      starter: `year = 2024

# 闰年规则：能被 4 整除且不能被 100 整除，或者能被 400 整除
# 输出：2024 是闰年  或  2024 不是闰年
`,
      check: { type: 'output', expect: '2024 是闰年' },
      hint: 'print(f"{year} 是闰年") —— 用 f-string 把年份拼进去。',
      solution: `year = 2024

if (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:
    print(f"{year} 是闰年")
else:
    print(f"{year} 不是闰年")`
    }
  ]
},

/* ==================== 第三章 ==================== */
{
  id: 'ch3', icon: '🌀', title: '循环迷宫',
  subtitle: 'for / while',
  lessons: [
    {
      id: 'l3-1', title: '重复的力量', xp: 25,
      goal: '用 for + range 重复执行。',
      body: `
<h3>range 生成一串数字</h3>
<pre><code>range(5)        # 0 1 2 3 4      （从 0 开始，不含 5）
range(1, 6)     # 1 2 3 4 5      （含头不含尾）
range(0, 10, 2) # 0 2 4 6 8      （第三个参数是步长）</code></pre>
<p>用 for 把它一个个取出来：</p>
<pre><code>for i in range(1, 4):
    print(i)</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div><strong>含头不含尾</strong>是 Python 的铁律。想打印 1 到 5，就得写 <code>range(1, 6)</code>。</div></div>
`,
      starter: `# 用 for 循环打印 1 到 5，每行一个数字
`,
      check: { type: 'output', expect: '1\n2\n3\n4\n5' },
      hint: 'for i in range(1, 6): 然后缩进 print(i)。',
      solution: `for i in range(1, 6):
    print(i)`
    },
    {
      id: 'l3-2', title: '挨个点名', xp: 30,
      goal: '遍历列表，用 enumerate 拿序号。',
      body: `
<h3>直接遍历容器</h3>
<pre><code>fruits = ["苹果", "香蕉", "樱桃"]
for f in fruits:
    print(f)</code></pre>
<p>想要序号？<code>enumerate</code> 一次给你「序号 + 元素」：</p>
<pre><code>for i, f in enumerate(fruits, 1):
    print(i, f)</code></pre>
<p>第二个参数 <code>1</code> 表示序号从 1 开始（默认从 0）。</p>
`,
      starter: `fruits = ["苹果", "香蕉", "樱桃"]

# 输出：
# 1. 苹果
# 2. 香蕉
# 3. 樱桃
`,
      check: { type: 'output', expect: '1. 苹果\n2. 香蕉\n3. 樱桃' },
      hint: 'print(f"{i}. {f}")',
      solution: `fruits = ["苹果", "香蕉", "樱桃"]

for i, f in enumerate(fruits, 1):
    print(f"{i}. {f}")`
    },
    {
      id: 'l3-3', title: '累加器', xp: 35,
      goal: '用循环累加，掌握「先初始化再累积」的套路。',
      body: `
<h3>经典套路：一个变量滚雪球</h3>
<pre><code>total = 0          # ① 先准备一个空容器
for i in range(1, 101):
    total = total + i   # ② 每轮往里加
print(total)       # 5050</code></pre>
<p><code>total = total + i</code> 可以简写成 <code>total += i</code>，意思完全一样。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这个「初始化 → 循环累积 → 输出」的三步套路，后面算平均分、统计词频、求最大值全都能用。</div></div>
`,
      starter: `total = 0

# 用 for 循环把 1~100 累加到 total 里

print(f"1 到 100 的和是 {total}")`,
      check: { type: 'output', expect: '1 到 100 的和是 5050' },
      hint: 'for i in range(1, 101): 然后缩进写 total += i。',
      solution: `total = 0

for i in range(1, 101):
    total += i

print(f"1 到 100 的和是 {total}")`
    },
    {
      id: 'l3-4', title: '只要还没到', xp: 30,
      goal: '用 while 做条件循环。',
      body: `
<h3>while：条件为真就一直转</h3>
<pre><code>n = 3
while n > 0:
    print(n)
    n -= 1        # 这一行千万不能忘！
print("发射！")</code></pre>
<p>for 适合「知道要转几次」，while 适合「不知道几次，转到条件不满足为止」。</p>
<div class="tip tip-warn"><span class="tip-ico">☠️</span><div>忘了在循环里改变条件，就会<strong>死循环</strong>。这个平台会自动中断跑太多步的代码并提醒你。</div></div>
`,
      starter: `n = 5

# 用 while 从 5 倒数到 1，最后打印 发射！
`,
      check: { type: 'output', expect: '5\n4\n3\n2\n1\n发射！' },
      hint: '循环里记得写 n -= 1，循环结束后（不缩进）再 print("发射！")。',
      solution: `n = 5

while n > 0:
    print(n)
    n -= 1

print("发射！")`
    },
    {
      id: 'l3-5', title: '跳出与跳过', xp: 35,
      goal: '掌握 break 和 continue。',
      body: `
<h3>两个控制开关</h3>
<ul>
<li><code>break</code>：直接<strong>结束整个循环</strong>，跳到循环外面</li>
<li><code>continue</code>：<strong>跳过本轮剩下的代码</strong>，直接开始下一轮</li>
</ul>
<pre><code>for i in range(1, 11):
    if i == 7:
        break        # 到 7 就收工
    if i % 2 == 0:
        continue     # 偶数跳过
    print(i)         # 1 3 5</code></pre>
<div class="tip tip-fun"><span class="tip-ico">🎮</span><div>本关要求输出 <strong>1 3 5</strong> 三个数字，各占一行。</div></div>
`,
      starter: `for i in range(1, 11):
    # 遇到 7 就 break，遇到偶数就 continue，其余打印
    pass`,
      check: { type: 'output', expect: '1\n3\n5' },
      hint: '顺序很重要：先判断 i == 7 就 break，再判断 i % 2 == 0 就 continue。',
      solution: `for i in range(1, 11):
    if i == 7:
        break
    if i % 2 == 0:
        continue
    print(i)`
    }
  ]
},

/* ==================== 第四章 ==================== */
{
  id: 'ch4', icon: '🧰', title: '函数工坊',
  subtitle: 'def 与复用',
  lessons: [
    {
      id: 'l4-1', title: '定义第一个函数', xp: 30,
      goal: '用 def 把代码打包起来。',
      body: `
<h3>函数 = 可以反复调用的代码包</h3>
<pre><code>def greet(name):
    return f"你好，{name}！"

print(greet("小皮"))   # 你好，小皮！</code></pre>
<p>拆解一下：<br>
· <code>def</code> 告诉 Python「我要定义一个函数」<br>
· <code>greet</code> 是函数名，括号里的 <code>name</code> 是<strong>参数</strong>（原材料）<br>
· <code>return</code> 把结果<strong>交出去</strong>，函数到这就结束</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>忘了写 <code>return</code>，函数会默默返回 <code>None</code>（什么都没有）。这是新手最常见的 bug。</div></div>
`,
      starter: `def greet(name):
    # 返回：你好，<name>！
    pass

print(greet("小皮"))`,
      check: {
        type: 'tests',
        code: `assert greet("阿离") == "你好，阿离！", f"greet('阿离') 应该返回 你好，阿离！，实际返回 {greet('阿离')!r}"
assert "你好，小皮！" in __OUTPUT__, "没有把 greet 的结果打印出来"`
      },
      hint: '把 pass 换成 return f"你好，{name}！"',
      solution: `def greet(name):
    return f"你好，{name}！"

print(greet("小皮"))`
    },
    {
      id: 'l4-2', title: '参数与返回值', xp: 30,
      goal: '写一个带多个参数的函数。',
      body: `
<h3>函数可以有多个入口和出口</h3>
<pre><code>def add(a, b):
    return a + b

result = add(3, 4)   # 把返回值装进变量
print(result)        # 7</code></pre>
<p>调用时按<strong>位置</strong>传参：第一个值给 <code>a</code>，第二个给 <code>b</code>。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>函数的返回值可以直接参与运算：<code>print(add(1, 2) * 10)</code> → 30。</div></div>
`,
      starter: `def add(a, b):
    # 返回两数之和
    pass

print(add(3, 4))`,
      check: {
        type: 'tests',
        code: `assert add(2, 3) == 5, f"add(2, 3) 应该等于 5，实际是 {add(2, 3)!r}"
assert add(-1, 1) == 0, f"add(-1, 1) 应该等于 0，实际是 {add(-1, 1)!r}"
assert "7" in __OUTPUT__, "没有把 add(3, 4) 的结果打印出来"`
      },
      hint: 'return a + b',
      solution: `def add(a, b):
    return a + b

print(add(3, 4))`
    },
    {
      id: 'l4-3', title: '默认参数', xp: 35,
      goal: '给参数设一个「不填就用这个」的默认值。',
      body: `
<h3>偷懒的艺术</h3>
<pre><code>def power(base, exp=2):
    return base ** exp

print(power(5))      # 25   exp 用默认值 2
print(power(2, 3))   # 8    显式传了 3</code></pre>
<p>带默认值的参数要放在<strong>参数列表最后</strong>，否则 Python 会报语法错误。</p>
<div class="tip tip-fun"><span class="tip-ico">🎯</span><div>本关要写一个 <code>power(base, exp=2)</code>：不传指数时算平方，传了就按传的算。</div></div>
`,
      starter: `def power(base, exp=2):
    # 返回 base 的 exp 次方
    pass

print(power(5))`,
      check: {
        type: 'tests',
        code: `assert power(5) == 25, f"power(5) 应该等于 25，实际是 {power(5)!r}"
assert power(2, 3) == 8, f"power(2, 3) 应该等于 8，实际是 {power(2, 3)!r}"
assert power(2, 10) == 1024, f"power(2, 10) 应该等于 1024，实际是 {power(2, 10)!r}"`
      },
      hint: 'return base ** exp',
      solution: `def power(base, exp=2):
    return base ** exp

print(power(5))
print(power(2, 3))`
    },
    {
      id: 'l4-4', title: '综合：函数 + 循环', xp: 45,
      goal: '把判断逻辑封装成函数，再在循环里复用。',
      body: `
<h3>让代码变「可读」</h3>
<p>看这两段代码，哪个一眼就懂？</p>
<pre><code># 版本 A
for n in range(1, 11):
    if n % 2 == 0:
        print(n)

# 版本 B
def is_even(n):
    return n % 2 == 0

for n in range(1, 11):
    if is_even(n):
        print(n)</code></pre>
<p>版本 B 多了一个函数，但 <code>if is_even(n)</code> 读起来就像英文句子。这就是函数最大的价值 —— <strong>给逻辑起个名字</strong>。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>return n % 2 == 0</code> 直接把比较结果返回，不用写成 if/else。这种写法在 Python 里很常见。</div></div>
`,
      starter: `def is_even(n):
    # 偶数返回 True，奇数返回 False
    pass

# 用循环打印 1~10 里的偶数，每行一个
`,
      check: {
        type: 'tests',
        code: `assert is_even(4) is True, "is_even(4) 应该是 True"
assert is_even(7) is False, "is_even(7) 应该是 False"
assert __OUTPUT__.split() == ["2", "4", "6", "8", "10"], f"应该依次输出 2 4 6 8 10，实际是 {__OUTPUT__!r}"`
      },
      hint: '函数体写 return n % 2 == 0；循环里 if is_even(n): print(n)',
      solution: `def is_even(n):
    return n % 2 == 0

for n in range(1, 11):
    if is_even(n):
        print(n)`
    }
  ]
},

/* ==================== 第五章 ==================== */
{
  id: 'ch5', icon: '🗄️', title: '数据结构宝库',
  subtitle: '列表 / 字典 / 集合',
  lessons: [
    {
      id: 'l5-1', title: '列表：能改的清单', xp: 30,
      goal: '创建、追加、排序列表。',
      body: `
<h3>用方括号装一串数据</h3>
<pre><code>nums = [3, 1, 4, 1, 5]
nums.append(9)        # 末尾追加 → [3, 1, 4, 1, 5, 9]
print(nums[0])        # 3      下标从 0 开始
print(nums[-1])       # 9      负数表示从后往前数
print(len(nums))      # 6      长度
nums.sort()           # 原地排序（改变自己）
print(sorted(nums))   # 返回新列表（不改自己）</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div><code>sort()</code> 直接改原列表且返回 <code>None</code>；<code>sorted()</code> 返回一个新列表。别写成 <code>nums = nums.sort()</code>，那样 nums 会变成 None。</div></div>
`,
      starter: `nums = [3, 1, 4, 1, 5, 9, 2, 6]

# 第一行：输出排序后的列表
# 第二行：输出最大值
`,
      check: { type: 'output', expect: '[1, 1, 2, 3, 4, 5, 6, 9]\n9' },
      hint: 'print(sorted(nums)) 和 print(max(nums))',
      solution: `nums = [3, 1, 4, 1, 5, 9, 2, 6]

print(sorted(nums))
print(max(nums))`
    },
    {
      id: 'l5-2', title: '字典：查号台', xp: 35,
      goal: '用键值对存数据。',
      body: `
<h3>键 → 值</h3>
<pre><code>scores = {"语文": 88, "数学": 95}
print(scores["语文"])        # 88
scores["英语"] = 79          # 新增一项
print(list(scores.keys()))   # 所有键
print(list(scores.values())) # 所有值
print(sum(scores.values()))  # 所有值求和</code></pre>
<p>字典擅长「用名字查数据」，列表擅长「按顺序排」。选对工具，代码能短一半。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>直接访问不存在的键会报 <code>KeyError</code>。想安全一点用 <code>scores.get("物理", 0)</code>，查不到就返回默认值 0。</div></div>
`,
      starter: `scores = {"语文": 88, "数学": 95, "英语": 79}

# 第一行：总分: 262
# 第二行：平均分: 87.3   （保留 1 位小数）
`,
      check: { type: 'output', expect: '总分: 262\n平均分: 87.3' },
      hint: 'total = sum(scores.values())，平均分用 round(total / len(scores), 1)',
      solution: `scores = {"语文": 88, "数学": 95, "英语": 79}

total = sum(scores.values())
print("总分:", total)
print("平均分:", round(total / len(scores), 1))`
    },
    {
      id: 'l5-3', title: '元组与集合', xp: 30,
      goal: '认识不可变的元组和自动去重的集合。',
      body: `
<h3>另外两个容器</h3>
<pre><code>point = (3, 5)          # 元组：圆括号，不能修改
x, y = point            # 拆包，x=3 y=5

tags = {"python", "代码", "python"}
print(tags)             # {'python', '代码'}  自动去重
print(len(tags))        # 2</code></pre>
<p>集合用花括号，但<strong>没有键值对</strong> —— 这是它和字典的区别。集合最大的本事就是<strong>去重</strong>和<strong>快速判断成员</strong>。</p>
<div class="tip tip-fun"><span class="tip-ico">🎯</span><div>把列表丢进 <code>set()</code>，一秒去重，是数据处理里最常用的一招。</div></div>
`,
      starter: `tags = ["python", "代码", "python", "学习", "代码"]

# 用 set 去重，输出：不同的标签有 3 个
`,
      check: { type: 'output', expect: '不同的标签有 3 个' },
      hint: 'print(f"不同的标签有 {len(set(tags))} 个")',
      solution: `tags = ["python", "代码", "python", "学习", "代码"]

print(f"不同的标签有 {len(set(tags))} 个")`
    },
    {
      id: 'l5-4', title: '列表推导式', xp: 40,
      goal: '用一行生成一个列表。',
      body: `
<h3>把 for 循环压成一行</h3>
<pre><code># 普通写法
squares = []
for n in range(1, 6):
    squares.append(n ** 2)

# 列表推导式
squares = [n ** 2 for n in range(1, 6)]</code></pre>
<p>还能加过滤条件：</p>
<pre><code>evens = [n for n in range(1, 11) if n % 2 == 0]   # [2, 4, 6, 8, 10]</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>结构是 <code>[表达式 for 变量 in 可迭代对象 if 条件]</code>，条件部分可以省略。</div></div>
`,
      starter: `# 现在生成的是所有数的平方，改成只要偶数的平方
result = [n ** 2 for n in range(1, 21)]
print(result)`,
      check: { type: 'output', expect: '[4, 16, 36, 64, 100, 144, 196, 256, 324, 400]' },
      hint: '在 for 后面加一个 if n % 2 == 0 。',
      solution: `result = [n ** 2 for n in range(1, 21) if n % 2 == 0]
print(result)`
    }
  ]
},

/* ==================== 第六章 ==================== */
{
  id: 'ch6', icon: '⚔️', title: '实战武器库',
  subtitle: '字符串 / 模块 / 异常 / 文件',
  lessons: [
    {
      id: 'l6-1', title: '字符串的十八般武艺', xp: 35,
      goal: '掌握 split / join / strip / replace。',
      body: `
<h3>处理文本的基本功</h3>
<pre><code>text = "  hello world  "
text.strip()              # "hello world"   去掉首尾空白
text.split()              # ['hello', 'world']  按空白切分
"a,b,c".split(",")        # ['a', 'b', 'c']
"-".join(["a", "b"])      # "a-b"
"abc".replace("a", "X")   # "Xbc"
"abc".upper()             # "ABC"
"ABC".lower()             # "abc"</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>split()</code> 不传参数时按「任意连续空白」切分，还会自动忽略开头结尾的空格 —— 处理句子最省事。</div></div>
`,
      starter: `text = "the quick brown fox jumps over the lazy dog"

# 输出：这句话有 9 个单词
`,
      check: { type: 'output', expect: '这句话有 9 个单词' },
      hint: 'print(f"这句话有 {len(text.split())} 个单词")',
      solution: `text = "the quick brown fox jumps over the lazy dog"

print(f"这句话有 {len(text.split())} 个单词")`
    },
    {
      id: 'l6-2', title: '模块：借别人的工具', xp: 35,
      goal: 'import 并使用标准库。',
      body: `
<h3>不要重复造轮子</h3>
<pre><code>import random
import math

random.randint(1, 6)      # 1~6 的随机整数（含两端）
random.choice(["剪刀", "石头", "布"])
math.sqrt(16)             # 4.0
math.pi                   # 3.141592653589793
round(3.14159, 2)         # 3.14</code></pre>
<p>也可以只取其中几个：</p>
<pre><code>from math import sqrt, pi
print(sqrt(9))            # 3.0</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>Python 自带几百个标准库（random、math、json、datetime…），不用安装就能直接用。</div></div>
`,
      starter: `import random
import math

# 1) 掷一个 1~6 的骰子，结果存进变量 dice
# 2) 算 2 的平方根，保留 2 位小数，存进变量 root

print(dice, root)`,
      check: {
        type: 'tests',
        code: `assert isinstance(dice, int) and 1 <= dice <= 6, f"dice 应该是 1~6 的整数，实际是 {dice!r}"
assert isinstance(root, float) and abs(root - 1.41) < 1e-9, f"root 应该是 1.41，实际是 {root!r}"`
      },
      hint: 'dice = random.randint(1, 6)；root = round(math.sqrt(2), 2)',
      solution: `import random
import math

dice = random.randint(1, 6)
root = round(math.sqrt(2), 2)

print(dice, root)`
    },
    {
      id: 'l6-3', title: '别让程序崩掉', xp: 40,
      goal: '用 try / except 优雅地处理错误。',
      body: `
<h3>提前想好「万一出错了呢」</h3>
<pre><code>try:
    n = int("abc")      # 这里会炸
    print(n)
except ValueError:
    print("转换失败")    # 炸了之后走这里</code></pre>
<p>程序不会崩溃，而是按你安排的路线继续跑。</p>
<p>常见异常类型：</p>
<ul>
<li><code>ValueError</code> —— 值不对，比如 <code>int("abc")</code></li>
<li><code>ZeroDivisionError</code> —— 除以 0</li>
<li><code>KeyError</code> —— 字典里没这个键</li>
<li><code>IndexError</code> —— 列表下标越界</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>不要用一句 <code>except:</code> 吞掉所有错误，那样真正的 bug 会被藏起来。写清楚你预期哪种异常。</div></div>
`,
      starter: `s = input()

# 用 try/except 把 s 转成整数
# 成功就打印：转换成功: <数字>
# 失败就打印：转换失败
`,
      stdin: 'abc',
      check: { type: 'contains', expect: '转换失败' },
      hint: 'try: n = int(s) / except ValueError: print("转换失败")',
      solution: `s = input()

try:
    n = int(s)
    print(f"转换成功: {n}")
except ValueError:
    print("转换失败")`
    },
    {
      id: 'l6-4', title: '读写文件', xp: 45,
      goal: '用 with open 写入和读取文件。',
      body: `
<h3>把数据存下来</h3>
<pre><code># 写文件（"w" 覆盖写，"a" 追加写）
with open("note.txt", "w", encoding="utf-8") as f:
    f.write("第一行\\n")

# 读文件
with open("note.txt", "r", encoding="utf-8") as f:
    content = f.read()
    # 或者逐行遍历：for line in f:</code></pre>
<p><code>with</code> 的好处：代码块结束时<strong>自动关文件</strong>，不用手写 <code>f.close()</code>。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>写中文记得加 <code>encoding="utf-8"</code>，否则在 Windows 上可能乱码。</div></div>
<div class="tip tip-fun"><span class="tip-ico">💾</span><div>这个平台的 Python 跑在浏览器沙箱里，文件写在内存中，刷新页面就没了 —— 但语法和真实 Python 完全一样。</div></div>
`,
      starter: `lines = ["第一行", "第二行", "第三行"]

# 1) 把 lines 写入 note.txt（每行末尾要有换行符）
# 2) 重新读出来，带行号打印：
#    1: 第一行
#    2: 第二行
#    3: 第三行
`,
      check: { type: 'output', expect: '1: 第一行\n2: 第二行\n3: 第三行' },
      hint: '写的时候 f.write(line + "\\n")；读的时候 for i, line in enumerate(f, 1): print(f"{i}: {line.strip()}")',
      solution: `lines = ["第一行", "第二行", "第三行"]

with open("note.txt", "w", encoding="utf-8") as f:
    for line in lines:
        f.write(line + "\\n")

with open("note.txt", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        print(f"{i}: {line.strip()}")`
    }
  ]
}

];
