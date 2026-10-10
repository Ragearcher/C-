/* ============================================================
   data-advanced.js —— 进阶篇课程数据
   结构与 data-lessons.js 完全一致，只是 id 前缀用 a*-*，
   这样 State.done 不用分家、渲染逻辑可以完全复用。
   ============================================================ */

const ADVANCED_CHAPTERS = [

/* ==================== 进阶第一章 ==================== */
{
  id: 'a1', icon: '🏛️', title: '面向对象',
  subtitle: 'class / 继承 / 魔术方法',
  lessons: [
    {
      id: 'a1-1', title: '从函数到类', xp: 45,
      goal: '用 class 把数据和操作数据的方法打包在一起。',
      body: `
<h3>为什么需要类</h3>
<p>假设你要管理 100 只猫，每只都有名字和年龄。用字典要写成
<code>{"name": "咪咪", "age": 2}</code>，散落各处；用类，你可以定义一次「猫长什么样」，
然后造出无数只猫。</p>
<pre><code>class Cat:
    def __init__(self, name):
        self.name = name

mimi = Cat("咪咪")
print(mimi.name)      # 咪咪</code></pre>
<h3>三个新东西</h3>
<ul>
<li><code>class Cat:</code> —— 定义一类东西（约定类名首字母大写）</li>
<li><code>__init__</code> —— 「初始化方法」，创建实例时自动调用（前后各两条下划线）</li>
<li><code>self</code> —— 指向「当前这个实例」，所有方法第一个参数都是它</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>写 <code>self.name = name</code> 时，左边的 <code>self.name</code> 是<strong>存在实例上</strong>的；右边的 <code>name</code> 只是参数。<code>Cat("咪咪")</code> 时 Python 自动把 <code>self</code> 传进去，你<strong>不用自己传</strong>。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>类 = 图纸，实例 = 按图纸造出来的东西。<code>Cat</code> 是图纸，<code>mimi</code> 是造出来的猫。</div></div>
`,
      starter: `class Cat:
    def __init__(self, name):
        # 把参数 name 存到 self.name 上
        pass

# 造一只叫 咪咪 的猫，然后打印它的名字
`,
      check: {
        type: 'tests',
        code: `c = Cat("咪咪")
assert c.name == "咪咪", f"Cat('咪咪').name 应该是 咪咪，实际是 {getattr(c, 'name', '（没有这个属性）')!r}"
c2 = Cat("阿离")
assert c2.name == "阿离", "每只猫的名字应该互不影响"
assert "咪咪" in __OUTPUT__, "没有把猫的名字打印出来"`
      },
      hint: '把 pass 换成 self.name = name；然后 mimi = Cat("咪咪") 再 print(mimi.name)',
      solution: `class Cat:
    def __init__(self, name):
        self.name = name

mimi = Cat("咪咪")
print(mimi.name)`
    },
    {
      id: 'a1-2', title: '属性与方法', xp: 50,
      goal: '让对象自己维护状态，用方法改变它。',
      body: `
<h3>对象是有状态的</h3>
<p>函数是「给什么算什么」，方法是「对象记得自己是什么样，然后在此基础上变化」：</p>
<pre><code>class Counter:
    def __init__(self):
        self.value = 0          # 初始状态

    def add(self, n=1):
        self.value += n         # 改变自己的状态
        return self.value       # 返回新状态

c = Counter()
c.add()        # 1
c.add(10)      # 11</code></pre>
<p>注意 <code>self.value</code> 是<strong>实例属性</strong>：每个 Counter 各有一份，互不影响。</p>
<div class="tip tip-fun"><span class="tip-ico">🏦</span><div>本关要写一个存钱罐：存钱、取钱，取超了要拒绝。这就是「用方法保护状态」的典型场景 —— 余额不能随便被外部改坏。</div></div>
`,
      starter: `class PiggyBank:
    def __init__(self):
        self.balance = 0

    def deposit(self, amount):
        # 存钱：加余额，返回新的余额
        pass

    def withdraw(self, amount):
        # 取钱：余额够就扣掉并返回新余额
        #       余额不够就返回 False，且余额不变
        pass

bank = PiggyBank()
print(bank.deposit(100))
print(bank.withdraw(30))
print(bank.withdraw(999))`,
      check: {
        type: 'tests',
        code: `b = PiggyBank()
assert b.balance == 0, "初始余额应该是 0"
assert b.deposit(100) == 100, "存 100 后应该返回 100"
assert b.balance == 100, "存钱后 balance 应该是 100"
assert b.deposit(50) == 150, "再存 50 应该返回 150"
assert b.withdraw(30) == 120, "取 30 后应该返回 120"
assert b.withdraw(1000) is False, "余额不足应该返回 False"
assert b.balance == 120, "取钱失败时余额不能变"
b2 = PiggyBank()
assert b2.balance == 0, "两个存钱罐的余额应该互不影响"`
      },
      hint: 'deposit: self.balance += amount; return self.balance。withdraw 里先 if amount > self.balance: return False',
      solution: `class PiggyBank:
    def __init__(self):
        self.balance = 0

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        if amount > self.balance:
            return False
        self.balance -= amount
        return self.balance

bank = PiggyBank()
print(bank.deposit(100))
print(bank.withdraw(30))
print(bank.withdraw(999))`
    },
    {
      id: 'a1-3', title: '继承', xp: 50,
      goal: '用继承复用父类代码，只改写不同的部分。',
      body: `
<h3>子类 = 父类 + 改动</h3>
<pre><code>class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "..."

class Dog(Animal):          # 括号里写父类
    def speak(self):        # 重写（覆盖）父类的方法
        return "汪汪"

d = Dog("旺财")
print(d.name)      # 旺财   —— 名字是从父类继承来的
print(d.speak())   # 汪汪   —— 这个方法被子类改写了</code></pre>
<h3>super() 是什么</h3>
<p>子类如果自己写了 <code>__init__</code>，父类的 <code>__init__</code> 就<strong>不会自动执行</strong>了。
这时候要用 <code>super().__init__(...)</code> 手动调用，否则继承来的属性会缺失：</p>
<pre><code>class Puppy(Animal):
    def __init__(self, name, age):
        super().__init__(name)    # 先让父类把 name 处理好
        self.age = age            # 再加自己的东西</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>isinstance(d, Animal)</code> 为 <code>True</code> —— 狗<strong>是</strong>一种动物。这是继承的语义核心。</div></div>
`,
      starter: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

class Dog(Animal):
    def __init__(self, name):
        # 用 super() 调用父类的 __init__
        pass

    def speak(self):
        # 改写成 汪汪
        pass

print(Dog("旺财").speak())`,
      check: {
        type: 'tests',
        code: `a = Animal("x")
assert a.speak() == "...", "父类 Animal 的 speak 应该返回 ..."
d = Dog("旺财")
assert d.name == "旺财", "Dog 应该通过 super().__init__ 继承到 name"
assert d.speak() == "汪汪", "Dog 的 speak 应该返回 汪汪"
assert isinstance(d, Animal), "Dog 的实例应该也是 Animal 的实例"
assert isinstance(d, Dog), "Dog 的实例应该也是 Dog 的实例"`
      },
      hint: 'Dog.__init__ 里写 super().__init__(name)；speak 里 return "汪汪"',
      solution: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

class Dog(Animal):
    def __init__(self, name):
        super().__init__(name)

    def speak(self):
        return "汪汪"

print(Dog("旺财").speak())`
    },
    {
      id: 'a1-4', title: '魔术方法', xp: 55,
      goal: '让自定义对象支持 print、+、== 这些内置操作。',
      body: `
<h3>双下划线包起来的方法，都是给 Python 用的</h3>
<p>它们不是你手动调的，而是 Python 在特定时机自动调用的：</p>
<pre><code>class Money:
    def __init__(self, yuan):
        self.yuan = yuan

    def __str__(self):
        return f"{self.yuan} 元"      # print(obj) 时调用

    def __add__(self, other):
        return Money(self.yuan + other.yuan)   # a + b 时调用

    def __eq__(self, other):
        return self.yuan == other.yuan         # a == b 时调用</code></pre>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">
<tr style="background:var(--surface-2)"><td style="padding:7px 10px;border:1px solid var(--border)"><code>__str__</code></td><td style="padding:7px 10px;border:1px solid var(--border)">print / str() / f-string</td></tr>
<tr><td style="padding:7px 10px;border:1px solid var(--border)"><code>__add__</code></td><td style="padding:7px 10px;border:1px solid var(--border)">a + b</td></tr>
<tr style="background:var(--surface-2)"><td style="padding:7px 10px;border:1px solid var(--border)"><code>__eq__</code></td><td style="padding:7px 10px;border:1px solid var(--border)">a == b</td></tr>
<tr><td style="padding:7px 10px;border:1px solid var(--border)"><code>__len__</code></td><td style="padding:7px 10px;border:1px solid var(--border)">len(a)</td></tr>
</table>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>没写 <code>__str__</code> 时，<code>print(obj)</code> 会打印出 <code>&lt;__main__.Money object at 0x...&gt;</code> 这种看不懂的东西。给用户看的对象，一定要写 <code>__str__</code>。</div></div>
`,
      starter: `class Money:
    def __init__(self, yuan):
        self.yuan = yuan

    def __str__(self):
        # 返回 "N 元"
        pass

    def __add__(self, other):
        # 返回一个新的 Money，金额是两者之和
        pass

    def __eq__(self, other):
        # 金额相等就返回 True
        pass

print(Money(10))`,
      check: {
        type: 'tests',
        code: `a = Money(10)
assert str(a) == "10 元", f"str(Money(10)) 应该是 10 元，实际是 {str(a)!r}"
assert "10 元" in __OUTPUT__, "没有把 Money(10) 打印出来（或者 __str__ 没生效）"
b = Money(5)
c = a + b
assert isinstance(c, Money), "a + b 应该返回一个新的 Money 对象"
assert c.yuan == 15, f"10 + 5 应该是 15，实际是 {c.yuan}"
assert Money(10) == Money(10), "金额相同的两个 Money 应该相等"
assert not (Money(10) == Money(5)), "金额不同的 Money 不应该相等"`
      },
      hint: '__str__ 返回 f"{self.yuan} 元"；__add__ 返回 Money(self.yuan + other.yuan)；__eq__ 返回 self.yuan == other.yuan',
      solution: `class Money:
    def __init__(self, yuan):
        self.yuan = yuan

    def __str__(self):
        return f"{self.yuan} 元"

    def __add__(self, other):
        return Money(self.yuan + other.yuan)

    def __eq__(self, other):
        return self.yuan == other.yuan

print(Money(10))`
    },
    {
      id: 'a1-5', title: '类属性 vs 实例属性', xp: 50,
      goal: '搞清「大家共享一份」和「每人一份」的区别。',
      body: `
<h3>两个位置，两种含义</h3>
<pre><code>class User:
    count = 0                 # 类属性：写在 class 里、方法外，所有实例共享一份

    def __init__(self, name):
        self.name = name      # 实例属性：每个实例各有一份
        User.count += 1       # 改类属性要写 类名.count</code></pre>
<div class="tip tip-warn"><span class="tip-ico">☠️</span><div><strong>最常见的坑</strong>：写成 <code>self.count += 1</code>。这不会报错，但会<strong>悄悄创建</strong>一个属于该实例的新属性，类属性 <code>User.count</code> 永远停在 0。<br>读的时候 <code>self.count</code> 没问题（会向上找到类属性），<strong>写的时候必须用 <code>User.count</code></strong>。</div></div>
<h3>还有更危险的一种</h3>
<pre><code>class Bad:
    items = []              # ✗ 可变对象当类属性
    def add(self, x):
        self.items.append(x)   # 所有实例共用同一个列表！

class Good:
    def __init__(self):
        self.items = []     # ✓ 每个实例一个自己的列表</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>记住一句：<strong>可变的东西（列表、字典、集合）永远放在 <code>__init__</code> 里</strong>，不要当类属性。</div></div>
`,
      starter: `class User:
    count = 0        # 类属性：所有实例共享

    def __init__(self, name):
        self.name = name
        # 让 count 加一
        pass

u1 = User("小明")
u2 = User("小红")
u3 = User("小刚")

print(f"一共创建了 {User.count} 个用户")`,
      check: {
        type: 'tests',
        code: `assert User.count == 3, f"创建 3 个用户后 User.count 应该是 3，实际是 {User.count}（是不是写成了 self.count += 1？）"
assert "一共创建了 3 个用户" in __OUTPUT__, "没有按格式打印出用户数量"
u4 = User("额外1")
u5 = User("额外2")
assert User.count == 5, f"再创建 2 个后应该是 5，实际是 {User.count}"
assert u1.name == "小明" and u4.name == "额外1", "每个实例的 name 应该互不影响"`
      },
      hint: '在 __init__ 里写 User.count += 1（注意是类名，不是 self）',
      solution: `class User:
    count = 0

    def __init__(self, name):
        self.name = name
        User.count += 1

u1 = User("小明")
u2 = User("小红")
u3 = User("小刚")

print(f"一共创建了 {User.count} 个用户")`
    }
  ]
},

/* ==================== 进阶第二章 ==================== */
{
  id: 'a2', icon: '🧪', title: '高阶工具',
  subtitle: '可变参数 / 闭包 / 装饰器 / 生成器',
  lessons: [
    {
      id: 'a2-1', title: '*args 与 **kwargs', xp: 50,
      goal: '写出能接收任意个参数的函数。',
      body: `
<h3>一个星号管位置，两个星号管关键字</h3>
<pre><code>def total(*nums):            # nums 是一个元组
    return sum(nums)

total()            # 0
total(1, 2, 3)     # 6
total(*[1, 2, 3])  # 6   调用时加星号 = 把列表拆开传

def describe(**info):        # info 是一个字典
    return info

describe(name="小皮", age=18)   # {'name': '小皮', 'age': 18}</code></pre>
<div class="tip tip-fun"><span class="tip-ico">🔍</span><div>名字 <code>args</code> / <code>kwargs</code> 只是<strong>约定俗成</strong>，起什么名都行。真正起作用的是那个星号。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>调用时的 <code>*</code> 和 <code>**</code> 是反过来的：把容器<strong>拆开</strong>当成多个参数传进去。
<code>f(*[1,2])</code> 等价于 <code>f(1,2)</code>；<code>f(**{"a":1})</code> 等价于 <code>f(a=1)</code>。</div></div>
`,
      starter: `def total(*nums):
    # 返回所有数字的和；不传参数时返回 0
    pass

def describe(**info):
    # 返回 "键=值, 键=值" 这样的字符串
    # 例如 describe(name="小皮", age=18) -> "name=小皮, age=18"
    pass

print(total(1, 2, 3))
print(describe(name="小皮", age=18))`,
      check: {
        type: 'tests',
        code: `assert total() == 0, "不传参数时 total() 应该返回 0"
assert total(5) == 5, "total(5) 应该返回 5"
assert total(1, 2, 3) == 6, f"total(1,2,3) 应该返回 6，实际是 {total(1,2,3)!r}"
assert total(*[1, 2, 3, 4]) == 10, "total(*[1,2,3,4]) 应该返回 10"
assert describe(name="小皮", age=18) == "name=小皮, age=18", f"describe 结果不对：{describe(name='小皮', age=18)!r}"
assert describe() == "", "不传关键字参数时应该返回空字符串"`
      },
      hint: 'total 里 return sum(nums)；describe 里 return ", ".join(f"{k}={v}" for k, v in info.items())',
      solution: `def total(*nums):
    return sum(nums)

def describe(**info):
    return ", ".join(f"{k}={v}" for k, v in info.items())

print(total(1, 2, 3))
print(describe(name="小皮", age=18))`
    },
    {
      id: 'a2-2', title: '闭包', xp: 55,
      goal: '让函数「记住」定义时的环境。',
      body: `
<h3>函数里的函数，会记住外面的变量</h3>
<pre><code>def make_greeter(greeting):
    def greet(name):
        return f"{greeting}，{name}！"     # 用到了外层的 greeting
    return greet

hi = make_greeter("你好")
hi("小皮")      # 你好，小皮！</code></pre>
<p><code>make_greeter</code> 已经执行完了，但 <code>greeting</code> 这个变量<strong>没有消失</strong> ——
它被 <code>greet</code> 记住了。这就是闭包。</p>
<h3>想修改外层变量？要声明 nonlocal</h3>
<pre><code>def make_counter():
    count = 0
    def step():
        nonlocal count     # 不写这句，下面那行会创建局部变量
        count += 1
        return count
    return step</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>不加 <code>nonlocal</code> 会直接报 <code>UnboundLocalError</code> —— 因为 Python 看到函数里有 <code>count = ...</code>，就认定 <code>count</code> 是局部的，可它又还没被赋值。</div></div>
<div class="tip tip-fun"><span class="tip-ico">🎯</span><div>本关要写 <code>make_counter()</code>：每次调用返回的计数器都是<strong>独立</strong>的，互不干扰。</div></div>
`,
      starter: `def make_counter():
    count = 0

    def step():
        # 让 count 加一并返回（记得 nonlocal）
        pass

    return step

c = make_counter()
print(c(), c(), c())`,
      check: {
        type: 'tests',
        code: `c = make_counter()
assert c() == 1, f"第一次调用应该返回 1，实际是 {c()!r}"
assert c() == 2, "第二次调用应该返回 2"
assert c() == 3, "第三次调用应该返回 3"
c2 = make_counter()
assert c2() == 1, "两个计数器应该互不干扰，新的从 1 开始"
assert c() == 4, "旧的计数器不应该被新计数器影响"`
      },
      hint: 'step 里先写 nonlocal count，再 count += 1，最后 return count',
      solution: `def make_counter():
    count = 0

    def step():
        nonlocal count
        count += 1
        return count

    return step

c = make_counter()
print(c(), c(), c())`
    },
    {
      id: 'a2-3', title: '装饰器', xp: 60,
      goal: '用 @ 语法给函数「套一层」。',
      body: `
<h3>装饰器本质就是个函数</h3>
<p>它接收一个函数，返回一个新函数。仅此而已。</p>
<pre><code>def logged(func):
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}")
        result = func(*args, **kwargs)     # 执行原函数
        print("调用结束")
        return result                      # 把返回值原样交出去
    return wrapper

@logged                 # 等价于 add = logged(add)
def add(a, b):
    return a + b

add(1, 2)
# 调用 add
# 调用结束</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>装饰器的三件套：<strong>收函数 → 造一个 wrapper → 返回 wrapper</strong>。
<code>wrapper</code> 里必须用 <code>*args, **kwargs</code> 接住所有参数，
也必须 <code>return</code> 原函数的返回值，否则被装饰的函数就「废了」。</div></div>
<div class="tip tip-fun"><span class="tip-ico">🎁</span><div>实际用途：计时、打日志、检查权限、缓存结果、自动重试 —— 都是「在函数前后加点东西，但不改函数本身」。</div></div>
`,
      starter: `def logged(func):
    def wrapper(*args, **kwargs):
        # 调用前打印：调用 <函数名>
        # 调用原函数并把返回值存起来
        # 调用后打印：调用结束
        # 返回原函数的返回值
        pass
    return wrapper

@logged
def add(a, b):
    return a + b

print(add(1, 2))`,
      check: {
        type: 'tests',
        code: `assert add(1, 2) == 3, f"被装饰后 add(1,2) 仍然应该返回 3，实际是 {add(1,2)!r}"
assert add(10, 20) == 30, "参数应该被正确透传"
out = __OUTPUT__
assert "调用 add" in out, f"没有打印出『调用 add』。实际输出：{out!r}"
assert "调用结束" in out, f"没有打印出『调用结束』。实际输出：{out!r}"`
      },
      hint: 'wrapper 里：print(f"调用 {func.__name__}") → r = func(*args, **kwargs) → print("调用结束") → return r',
      solution: `def logged(func):
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}")
        result = func(*args, **kwargs)
        print("调用结束")
        return result
    return wrapper

@logged
def add(a, b):
    return a + b

print(add(1, 2))`
    },
    {
      id: 'a2-4', title: 'lambda 与高阶函数', xp: 50,
      goal: '用一行匿名函数给 sorted / filter / map 配「规则」。',
      body: `
<h3>lambda 就是「用完就扔的函数」</h3>
<pre><code>square = lambda n: n ** 2        # 等价于 def square(n): return n ** 2</code></pre>
<p>它最大的价值是<strong>当作参数传进去</strong>，尤其是排序的 <code>key</code>：</p>
<pre><code>people = [("小明", 18), ("小红", 15)]
sorted(people, key=lambda p: p[1])    # 按年龄排
sorted(people, key=lambda p: -p[1])   # 按年龄倒序（加负号）</code></pre>
<h3>三个老牌高阶函数</h3>
<pre><code>list(filter(lambda n: n % 2 == 0, range(1, 11)))   # [2,4,6,8,10]  过滤
list(map(lambda n: n ** 2, [1, 2, 3]))            # [1,4,9]       映射</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>filter</code> 和 <code>map</code> 返回的是<strong>迭代器</strong>，不是列表。要列表得用 <code>list()</code> 包一下，否则打印出来是 <code>&lt;filter object at 0x...&gt;</code>。</div></div>
<div class="tip tip-fun"><span class="tip-ico">🐍</span><div>Python 圈有个说法：<code>map</code>/<code>filter</code> 能用列表推导式代替时，优先用推导式（更好读）。但 <code>sorted(key=lambda ...)</code> 是无可替代的，必须会。</div></div>
`,
      starter: `people = [("小明", 18), ("小红", 15), ("小刚", 20)]

# 1) 按年龄从小到大排序，取出名字列表
names = []

# 2) 用 filter 取出 1~10 里的偶数
evens = []

# 3) 用 map 把 [1, 2, 3, 4] 变成各自的平方
squares = []

print(names)
print(evens)
print(squares)`,
      check: {
        type: 'tests',
        code: `assert names == ["小红", "小明", "小刚"], f"按年龄排序后的名字应该是 ['小红','小明','小刚']，实际是 {names!r}"
assert evens == [2, 4, 6, 8, 10], f"evens 应该是 [2,4,6,8,10]，实际是 {evens!r}"
assert squares == [1, 4, 9, 16], f"squares 应该是 [1,4,9,16]，实际是 {squares!r}"
assert isinstance(evens, list) and isinstance(squares, list), "记得用 list() 把迭代器转成列表"`
      },
      hint: 'sorted(people, key=lambda p: p[1]) 然后取 [p[0] for p in ...]；filter/map 外面套 list()',
      solution: `people = [("小明", 18), ("小红", 15), ("小刚", 20)]

names = [p[0] for p in sorted(people, key=lambda p: p[1])]
evens = list(filter(lambda n: n % 2 == 0, range(1, 11)))
squares = list(map(lambda n: n ** 2, [1, 2, 3, 4]))

print(names)
print(evens)
print(squares)`
    },
    {
      id: 'a2-5', title: '生成器与 yield', xp: 55,
      goal: '用 yield 一次吐一个值，而不是一次造一整个列表。',
      body: `
<h3>return 是「交完就散伙」，yield 是「交一个，等你下次来」</h3>
<pre><code>def countdown(n):
    while n > 0:
        yield n        # 吐出一个值，然后在这里暂停
        n -= 1

for x in countdown(3):
    print(x)           # 3 2 1</code></pre>
<p>函数里出现 <code>yield</code>，它就变成了<strong>生成器函数</strong>。调用它不会立刻执行函数体，
而是返回一个生成器对象，每次 <code>next()</code> 才往前走一步。</p>
<h3>为什么用它</h3>
<ul>
<li><strong>省内存</strong>：<code>range(10**9)</code> 不会真造出十亿个数</li>
<li><strong>能表示无限序列</strong>：下面的斐波那契永远不会结束，但你可以只取前 10 个</li>
<li><strong>惰性</strong>：用到才算，不用就不算</li>
</ul>
<pre><code>def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

g = fib()
[next(g) for _ in range(5)]    # [0, 1, 1, 2, 3]</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>生成器<strong>只能遍历一次</strong>。遍历完再 <code>list()</code> 就是空的 —— 它不像列表那样存着数据。</div></div>
`,
      starter: `def countdown(n):
    # 用 yield 从 n 倒数到 1
    pass

def fib():
    # 无限生成斐波那契数列：0, 1, 1, 2, 3, 5, 8, ...
    pass

print(list(countdown(3)))

g = fib()
print([next(g) for _ in range(10)])`,
      check: {
        type: 'tests',
        code: `assert list(countdown(3)) == [3, 2, 1], f"countdown(3) 应该是 [3,2,1]，实际是 {list(countdown(3))!r}"
assert list(countdown(0)) == [], "countdown(0) 应该是空的"
assert list(countdown(5)) == [5, 4, 3, 2, 1], "countdown(5) 应该是 [5,4,3,2,1]"
g = fib()
first10 = [next(g) for _ in range(10)]
assert first10 == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34], f"fib 前 10 项应该是 [0,1,1,2,3,5,8,13,21,34]，实际是 {first10!r}"
g2 = fib()
assert next(g2) == 0 and next(g2) == 1, "fib 应该从 0、1 开始"`
      },
      hint: 'countdown 里 while n > 0: yield n; n -= 1。fib 里 a, b = 0, 1 然后 while True: yield a; a, b = b, a + b',
      solution: `def countdown(n):
    while n > 0:
        yield n
        n -= 1

def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

print(list(countdown(3)))

g = fib()
print([next(g) for _ in range(10)])`
    }
  ]
},

/* ==================== 进阶第三章 ==================== */
{
  id: 'a3', icon: '📦', title: '标准库武器库',
  subtitle: 'collections / datetime / json / re',
  lessons: [
    {
      id: 'a3-1', title: 'collections', xp: 50,
      goal: '用 Counter 和 defaultdict 把常见统计写短。',
      body: `
<h3>Counter：数数专用</h3>
<pre><code>from collections import Counter

c = Counter("a b a c a b".split())
c["a"]                  # 3
c.most_common(2)        # [('a', 3), ('b', 2)]  出现最多的前两个</code></pre>
<p>还记得你手写的那个 <code>counts[w] = counts.get(w, 0) + 1</code> 吗？
<code>Counter</code> 就是它的官方版本，而且多了 <code>most_common</code> 这种现成功能。</p>
<h3>defaultdict：不用再判断「键存在吗」</h3>
<pre><code>from collections import defaultdict

groups = defaultdict(list)      # 访问不存在的键时，自动建一个空列表
for name, dept in records:
    groups[dept].append(name)   # 不用写 if dept not in groups: ...

groups["技术"]      # ['小明', '小刚']</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>defaultdict(list)</code> 的参数是「默认工厂」：<code>list</code> 造空列表，<code>int</code> 造 0，<code>set</code> 造空集合。</div></div>
<div class="tip tip-fun"><span class="tip-ico">🎁</span><div><code>Counter</code> 还能直接相加减、取交集，做词频对比特别好用。</div></div>
`,
      starter: `from collections import Counter, defaultdict

words = "a b a c a b".split()

# 1) 统计词频，取出出现最多的前 2 个，存进 top2
top2 = []

records = [("小明", "技术"), ("小红", "市场"), ("小刚", "技术")]

# 2) 用 defaultdict(list) 按部门把人分组，存进 groups
groups = None

print(top2)
print(dict(groups))`,
      check: {
        type: 'tests',
        code: `assert top2 == [("a", 3), ("b", 2)], f"top2 应该是 [('a', 3), ('b', 2)]，实际是 {top2!r}"
assert groups is not None, "groups 还是 None，没有分组"
assert dict(groups) == {"技术": ["小明", "小刚"], "市场": ["小红"]}, f"分组结果不对：{dict(groups) if groups else None!r}"
assert isinstance(groups, defaultdict), "应该用 defaultdict 来做"
assert groups["不存在的部门"] == [], "defaultdict 访问不存在的键应该返回空列表而不是报错"`
      },
      hint: 'top2 = Counter(words).most_common(2)；groups = defaultdict(list) 然后 groups[dept].append(name)',
      solution: `from collections import Counter, defaultdict

words = "a b a c a b".split()
top2 = Counter(words).most_common(2)

records = [("小明", "技术"), ("小红", "市场"), ("小刚", "技术")]
groups = defaultdict(list)
for name, dept in records:
    groups[dept].append(name)

print(top2)
print(dict(groups))`
    },
    {
      id: 'a3-2', title: 'datetime', xp: 45,
      goal: '处理日期、算时间差、按格式输出。',
      body: `
<h3>两个主角</h3>
<pre><code>from datetime import date, datetime, timedelta

d = date(2026, 9, 1)          # 年月日
now = datetime.now()          # 当前日期+时间

d.year, d.month, d.day        # 2026 9 1
d.weekday()                   # 0=周一 … 6=周日</code></pre>
<h3>算时间差：直接相减</h3>
<pre><code>start = date(2026, 9, 1)
end = date(2026, 12, 25)
delta = end - start
delta.days                    # 相差多少天

end + timedelta(days=7)       # 往后推 7 天</code></pre>
<h3>格式化：strftime</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">
<tr style="background:var(--surface-2)"><td style="padding:7px 10px;border:1px solid var(--border)"><code>%Y</code></td><td style="padding:7px 10px;border:1px solid var(--border)">四位年份 2026</td></tr>
<tr><td style="padding:7px 10px;border:1px solid var(--border)"><code>%m</code></td><td style="padding:7px 10px;border:1px solid var(--border)">月份 09</td></tr>
<tr style="background:var(--surface-2)"><td style="padding:7px 10px;border:1px solid var(--border)"><code>%d</code></td><td style="padding:7px 10px;border:1px solid var(--border)">日期 25</td></tr>
<tr><td style="padding:7px 10px;border:1px solid var(--border)"><code>%H:%M</code></td><td style="padding:7px 10px;border:1px solid var(--border)">时:分</td></tr>
</table>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div><code>date(2026, 9, 1)</code> 的月份和日期<strong>不加前导零</strong>，写 <code>date(2026, 09, 01)</code> 在 Python 3 里是语法错误。</div></div>
`,
      starter: `from datetime import date

start = date(2026, 9, 1)
end = date(2026, 12, 25)

# 1) 算两个日期相差多少天，存进 days
days = None

# 2) 把 end 格式化成 "2026年12月25日" 并打印

print(f"相差 {days} 天")`,
      check: {
        type: 'tests',
        code: `assert days == 115, f"2026-09-01 到 2026-12-25 相差 115 天，实际是 {days!r}"
assert "2026年12月25日" in __OUTPUT__, f"没有按 Y年M月D日 格式打印。实际输出：{__OUTPUT__!r}"
assert "相差 115 天" in __OUTPUT__, "没有打印出相差天数"`
      },
      hint: 'days = (end - start).days；print(end.strftime("%Y年%m月%d日"))',
      solution: `from datetime import date

start = date(2026, 9, 1)
end = date(2026, 12, 25)

days = (end - start).days
print(end.strftime("%Y年%m月%d日"))
print(f"相差 {days} 天")`
    },
    {
      id: 'a3-3', title: 'json', xp: 50,
      goal: '在 Python 对象和 JSON 文本之间来回转换。',
      body: `
<h3>两对函数，别记混</h3>
<pre><code>import json

json.dumps(obj)     # Python 对象 -> JSON 字符串     （dumps 有 s = string）
json.loads(s)       # JSON 字符串 -> Python 对象

json.dump(obj, f)   # 写进文件
json.load(f)        # 从文件读</code></pre>
<p>类型映射：<code>dict→对象</code>、<code>list→数组</code>、<code>str→字符串</code>、
<code>int/float→数字</code>、<code>True/False→true/false</code>、<code>None→null</code>。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>默认情况下 <code>json.dumps</code> 会把中文转义成 <code>\\u5c0f\\u76ae</code> 这种。
加 <code>ensure_ascii=False</code> 才能保留中文。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>JSON 里没有单引号、没有 <code>True</code>、没有结尾逗号。手写 JSON 时最常犯的错就是把 Python 的字面量直接粘过去。</div></div>
`,
      starter: `import json

data = {"name": "小皮", "skills": ["Python", "写作"], "level": 3}

# 1) 转成 JSON 字符串（保留中文），存进 s
s = ""

# 2) 再把 s 解析回 Python 对象，存进 back
back = None

raw = '{"city": "北京", "temp": 26}'
# 3) 解析 raw，把温度存进 temp
temp = None

print(s)`,
      check: {
        type: 'tests',
        code: `assert isinstance(s, str) and s.strip().startswith("{"), f"s 应该是一个 JSON 字符串，实际是 {s!r}"
assert "小皮" in s, f"中文被转义了，记得加 ensure_ascii=False。实际：{s!r}"
assert back == data, f"解析回来的对象应该和原字典相等，实际是 {back!r}"
assert isinstance(back["skills"], list), "skills 应该还原成 list"
assert back["skills"][1] == "写作", "嵌套列表的内容也要正确"
assert temp == 26, f"temp 应该是 26，实际是 {temp!r}"`
      },
      hint: 's = json.dumps(data, ensure_ascii=False)；back = json.loads(s)；temp = json.loads(raw)["temp"]',
      solution: `import json

data = {"name": "小皮", "skills": ["Python", "写作"], "level": 3}

s = json.dumps(data, ensure_ascii=False)
back = json.loads(s)

raw = '{"city": "北京", "temp": 26}'
temp = json.loads(raw)["temp"]

print(s)`
    },
    {
      id: 'a3-4', title: '正则表达式入门', xp: 60,
      goal: '用 re 匹配、提取、替换文本。',
      body: `
<h3>四个最常用的函数</h3>
<pre><code>import re

re.findall(r"\\d+", "abc123def45")     # ['123', '45']   找出所有匹配
re.sub(r"\\d+", "#", "abc123def45")    # 'abc#def#'      替换
re.fullmatch(r"\\d{3}", "123")         # 匹配对象 或 None  整串必须完全匹配
re.search(r"\\d+", "abc123")           # 匹配对象 或 None  任意位置匹配</code></pre>
<h3>常用符号</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">
<tr style="background:var(--surface-2)"><td style="padding:6px 10px;border:1px solid var(--border)"><code>\\d</code></td><td style="padding:6px 10px;border:1px solid var(--border)">一个数字，等价 <code>[0-9]</code></td></tr>
<tr><td style="padding:6px 10px;border:1px solid var(--border)"><code>\\w</code></td><td style="padding:6px 10px;border:1px solid var(--border)">字母/数字/下划线</td></tr>
<tr style="background:var(--surface-2)"><td style="padding:6px 10px;border:1px solid var(--border)"><code>.</code></td><td style="padding:6px 10px;border:1px solid var(--border)">任意一个字符</td></tr>
<tr><td style="padding:6px 10px;border:1px solid var(--border)"><code>*</code> <code>+</code> <code>?</code></td><td style="padding:6px 10px;border:1px solid var(--border)">0次以上 / 1次以上 / 0或1次</td></tr>
<tr style="background:var(--surface-2)"><td style="padding:6px 10px;border:1px solid var(--border)"><code>{3}</code> <code>{3,5}</code></td><td style="padding:6px 10px;border:1px solid var(--border)">恰好 3 次 / 3~5 次</td></tr>
<tr><td style="padding:6px 10px;border:1px solid var(--border)"><code>[abc]</code> <code>[^abc]</code></td><td style="padding:6px 10px;border:1px solid var(--border)">这些之一 / 不是这些</td></tr>
<tr style="background:var(--surface-2)"><td style="padding:6px 10px;border:1px solid var(--border)"><code>^</code> <code>$</code></td><td style="padding:6px 10px;border:1px solid var(--border)">开头 / 结尾</td></tr>
</table>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>正则字符串一定要写 <code>r"..."</code>（原始字符串）。不然 <code>\\d</code> 会被 Python 当成转义字符处理，行为就变了。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>fullmatch</code> 要求<strong>整串</strong>都匹配，<code>search</code> 只要求<strong>某处</strong>匹配。校验格式用 <code>fullmatch</code>，找内容用 <code>search</code>/<code>findall</code>。</div></div>
`,
      starter: `import re

text = "联系我：13812345678 或 13998765432"

# 1) 用 findall 提取所有手机号（11 位，1 开头，第二位 3~9）
phones = []

# 2) 用 sub 把所有手机号替换成 [已隐藏]
hidden = ""

# 3) 用 fullmatch 判断格式
valid = False      # "13812345678" 应该为 True
invalid = True     # "1381234567"（只有 10 位）应该为 False

print(phones)
print(hidden)`,
      check: {
        type: 'tests',
        code: `assert phones == ["13812345678", "13998765432"], f"phones 应该是两个手机号，实际是 {phones!r}"
assert hidden == "联系我：[已隐藏] 或 [已隐藏]", f"hidden 不对：{hidden!r}"
assert valid is True, f"valid 应该是 True，实际是 {valid!r}"
assert invalid is False, f"invalid 应该是 False，实际是 {invalid!r}"
assert len(re.findall(r"1[3-9]\\d{9}", "13812345678 和 23812345678")) == 1, "你的模式不应该匹配 2 开头的号码"`
      },
      hint: '模式写成 r"1[3-9]\\d{9}"；findall 找全部，sub 替换，fullmatch 校验时用 bool() 包一下',
      solution: `import re

text = "联系我：13812345678 或 13998765432"

PATTERN = r"1[3-9]\\d{9}"

phones = re.findall(PATTERN, text)
hidden = re.sub(PATTERN, "[已隐藏]", text)

valid = bool(re.fullmatch(PATTERN, "13812345678"))
invalid = bool(re.fullmatch(PATTERN, "1381234567"))

print(phones)
print(hidden)`
    },
    {
      id: 'a3-5', title: 'itertools', xp: 50,
      goal: '排列、组合、无限序列，标准库都给你备好了。',
      body: `
<h3>三个高频工具</h3>
<pre><code>import itertools

# 排列：顺序不同算不同  (1,2) 和 (2,1) 都要
list(itertools.permutations([1, 2, 3], 2))
# [(1,2),(1,3),(2,1),(2,3),(3,1),(3,2)]   共 6 个

# 组合：顺序无关，(1,2) 和 (2,1) 只算一个
list(itertools.combinations([1, 2, 3, 4], 2))
# [(1,2),(1,3),(1,4),(2,3),(2,4),(3,4)]   共 6 个

# 无限计数器 + 截取
list(itertools.islice(itertools.count(0, 2), 5))    # [0, 2, 4, 6, 8]</code></pre>
<div class="tip tip-fun"><span class="tip-ico">🧮</span><div>数量公式：排列 <code>P(n,k) = n!/(n-k)!</code>，组合 <code>C(n,k) = n!/(k!(n-k)!)</code>。
<code>[1,2,3]</code> 取 2 个：排列 6 种，组合 3 种 —— 因为组合把顺序重复的合并了。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>itertools</code> 里的东西全是<strong>惰性</strong>的迭代器，所以要 <code>list()</code> 包一下才能打印。
<code>count()</code> 是无限序列，<strong>绝对不能</strong>直接 <code>list(itertools.count())</code>，会卡死 —— 必须用 <code>islice</code> 截断。</div></div>
`,
      starter: `import itertools

# 1) [1, 2, 3] 里取 2 个的排列
perms = []

# 2) [1, 2, 3, 4] 里取 2 个的组合
combos = []

# 3) 从 0 开始每次加 2，取前 5 个
evens = []

print(perms)
print(combos)
print(evens)`,
      check: {
        type: 'tests',
        code: `assert len(perms) == 6, f"3 个里取 2 个的排列应该有 6 种，实际 {len(perms)} 种"
assert (1, 2) in perms and (2, 1) in perms, "排列里 (1,2) 和 (2,1) 都应该出现"
assert len(combos) == 6, f"4 个里取 2 个的组合应该有 6 种，实际 {len(combos)} 种"
assert (1, 2) in combos, "组合里应该有 (1, 2)"
assert (2, 1) not in combos, "组合不考虑顺序，(2,1) 不应该单独出现"
assert evens == [0, 2, 4, 6, 8], f"evens 应该是 [0,2,4,6,8]，实际是 {evens!r}"`
      },
      hint: 'perms = list(itertools.permutations([1,2,3], 2))；combos = list(itertools.combinations([1,2,3,4], 2))；evens = list(itertools.islice(itertools.count(0, 2), 5))',
      solution: `import itertools

perms = list(itertools.permutations([1, 2, 3], 2))
combos = list(itertools.combinations([1, 2, 3, 4], 2))
evens = list(itertools.islice(itertools.count(0, 2), 5))

print(perms)
print(combos)
print(evens)`
    }
  ]
},

/* ==================== 进阶第四章 ==================== */
{
  id: 'a4', icon: '🧮', title: '算法入门',
  subtitle: '递归 / 二分 / 排序 / 复杂度',
  lessons: [
    {
      id: 'a4-1', title: '递归', xp: 50,
      goal: '用「自己调用自己」解决问题。',
      body: `
<h3>递归的两个必备条件</h3>
<ol>
<li><strong>终止条件</strong>：什么时候停（不然会无限递归到爆栈）</li>
<li><strong>递推关系</strong>：把大问题缩小成同类的小问题</li>
</ol>
<pre><code>def factorial(n):
    if n <= 1:              # ① 终止条件
        return 1
    return n * factorial(n - 1)   # ② 递推：n! = n × (n-1)!

factorial(5)     # 5*4*3*2*1 = 120</code></pre>
<p>展开看是这样：</p>
<pre><code>factorial(5)
= 5 * factorial(4)
= 5 * 4 * factorial(3)
= ...
= 5 * 4 * 3 * 2 * factorial(1)
= 5 * 4 * 3 * 2 * 1</code></pre>
<div class="tip tip-warn"><span class="tip-ico">☠️</span><div>忘了终止条件，Python 会在 1000 层左右抛出 <code>RecursionError: maximum recursion depth exceeded</code>。看到这个错，先检查终止条件。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>递归写起来优雅，但每层调用都要占内存。像斐波那契这种「同一个子问题被反复算」的场景，裸递归会慢得可怕 —— 下一关会讲怎么救。</div></div>
`,
      starter: `def factorial(n):
    # 阶乘：factorial(5) = 5 * 4 * 3 * 2 * 1 = 120
    pass

def fib(n):
    # 斐波那契：fib(0)=0, fib(1)=1, fib(n) = fib(n-1) + fib(n-2)
    pass

print(factorial(5))
print(fib(10))`,
      check: {
        type: 'tests',
        code: `assert factorial(0) == 1, "factorial(0) 应该是 1"
assert factorial(1) == 1, "factorial(1) 应该是 1"
assert factorial(5) == 120, f"factorial(5) 应该是 120，实际是 {factorial(5)!r}"
assert factorial(10) == 3628800, "factorial(10) 应该是 3628800"
assert fib(0) == 0 and fib(1) == 1, "fib(0)=0, fib(1)=1"
assert fib(10) == 55, f"fib(10) 应该是 55，实际是 {fib(10)!r}"
assert fib(15) == 610, "fib(15) 应该是 610"`
      },
      hint: 'factorial：if n <= 1: return 1 然后 return n * factorial(n - 1)。fib：if n < 2: return n 然后 return fib(n-1) + fib(n-2)',
      solution: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(factorial(5))
print(fib(10))`
    },
    {
      id: 'a4-2', title: '二分查找', xp: 55,
      goal: '在有序数据里用「每次砍一半」的方式查找。',
      body: `
<h3>猜数字的最优策略</h3>
<p>1~100 猜数字，最聪明的猜法是每次都猜中间值 —— 最多 7 次必中。这就是二分查找。</p>
<pre><code>def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid              # 找到了
        elif nums[mid] < target:
            lo = mid + 1            # 目标在右半边
        else:
            hi = mid - 1            # 目标在左半边
    return -1                       # 没找到</code></pre>
<h3>三个容易写错的点</h3>
<ul>
<li><code>while lo &lt;= hi</code>（不是 <code>&lt;</code>）—— 只剩一个元素时还要比</li>
<li><code>lo = mid + 1</code> / <code>hi = mid - 1</code>（不是 <code>= mid</code>）—— 否则死循环</li>
<li>必须先<strong>排序</strong>。二分查找在乱序列表上会给出错误结果，而且不报错</li>
</ul>
<div class="tip tip-fun"><span class="tip-ico">⚡</span><div>100 万条数据：逐个找最多要 100 万次，二分最多只要 20 次。下一关会具体算这个差距。</div></div>
`,
      starter: `def binary_search(nums, target):
    """在【有序】列表 nums 里查找 target，返回它的下标；找不到返回 -1"""
    pass

data = [1, 3, 5, 7, 9, 11, 13]
print(binary_search(data, 7))
print(binary_search(data, 4))`,
      check: {
        type: 'tests',
        code: `data = [1, 3, 5, 7, 9, 11, 13]
assert binary_search(data, 1) == 0, f"找第一个元素应该返回 0，实际 {binary_search(data, 1)!r}"
assert binary_search(data, 13) == 6, f"找最后一个元素应该返回 6，实际 {binary_search(data, 13)!r}"
assert binary_search(data, 7) == 3, f"找中间元素应该返回 3，实际 {binary_search(data, 7)!r}"
assert binary_search(data, 4) == -1, f"找不到应该返回 -1，实际 {binary_search(data, 4)!r}"
assert binary_search([], 5) == -1, "空列表应该返回 -1"
assert binary_search([42], 42) == 0, "只有一个元素时也要能找到"
assert binary_search(list(range(0, 10000, 2)), 9998) == 4999, "大列表也要正确"`
      },
      hint: 'lo, hi = 0, len(nums) - 1；while lo <= hi: mid = (lo + hi) // 2，然后三种情况分别处理',
      solution: `def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

data = [1, 3, 5, 7, 9, 11, 13]
print(binary_search(data, 7))
print(binary_search(data, 4))`
    },
    {
      id: 'a4-3', title: '手写排序', xp: 60,
      goal: '理解排序是怎么「排」出来的，而不只是会调 sorted()。',
      body: `
<h3>冒泡排序：相邻两个比，大的往后挪</h3>
<pre><code>def bubble_sort(nums):
    nums = nums[:]              # 先复制，别改原列表
    n = len(nums)
    for i in range(n):
        for j in range(n - 1 - i):     # 后面 i 个已经排好了
            if nums[j] > nums[j + 1]:
                nums[j], nums[j + 1] = nums[j + 1], nums[j]   # 交换
    return nums</code></pre>
<p>每一轮「冒泡」都会把当前最大的数送到末尾，所以内层循环可以少比一次（<code>- i</code>）。</p>
<h3>选择排序：每轮找出最小的，换到前面</h3>
<pre><code>def selection_sort(nums):
    nums = nums[:]
    for i in range(len(nums)):
        m = i
        for j in range(i + 1, len(nums)):
            if nums[j] < nums[m]:
                m = j
        nums[i], nums[m] = nums[m], nums[i]
    return nums</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>Python 里交换两个变量不用临时变量：<code>a, b = b, a</code>。这是元组拆包的妙用。</div></div>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>两种都是 <code>O(n²)</code>。实际工作中<strong>直接用 <code>sorted()</code></strong> —— 它是 C 实现的 Timsort，比你手写的快几十倍。手写是为了<strong>理解原理</strong>，不是为了替代。</div></div>
`,
      starter: `def bubble_sort(nums):
    """返回从小到大排好的新列表；不要修改传入的 nums"""
    pass

def selection_sort(nums):
    """用选择排序实现，同样返回新列表"""
    pass

print(bubble_sort([5, 3, 8, 1]))
print(selection_sort([5, 3, 8, 1]))`,
      check: {
        type: 'tests',
        code: `assert bubble_sort([3, 1, 2]) == [1, 2, 3], f"bubble_sort([3,1,2]) 不对：{bubble_sort([3,1,2])!r}"
assert bubble_sort([5, 3, 8, 1]) == [1, 3, 5, 8], "bubble_sort 排序结果不对"
assert bubble_sort([]) == [], "空列表应该返回空列表"
assert bubble_sort([7]) == [7], "单元素列表应该原样返回"
assert bubble_sort([5, 5, 1]) == [1, 5, 5], "重复元素也要正确处理"
assert selection_sort([3, 1, 2]) == [1, 2, 3], f"selection_sort([3,1,2]) 不对：{selection_sort([3,1,2])!r}"
assert selection_sort([5, 3, 8, 1]) == [1, 3, 5, 8], "selection_sort 排序结果不对"
assert selection_sort([9, 2, 2, 7]) == [2, 2, 7, 9], "selection_sort 对重复元素处理不对"
src = [3, 1, 2]
bubble_sort(src)
selection_sort(src)
assert src == [3, 1, 2], "不应该修改传入的原列表（记得先 nums[:] 复制一份）"`
      },
      hint: '两个函数开头都先写 nums = nums[:]。冒泡是相邻比较交换；选择是每轮找最小值下标再交换到前面',
      solution: `def bubble_sort(nums):
    nums = nums[:]
    n = len(nums)
    for i in range(n):
        for j in range(n - 1 - i):
            if nums[j] > nums[j + 1]:
                nums[j], nums[j + 1] = nums[j + 1], nums[j]
    return nums

def selection_sort(nums):
    nums = nums[:]
    for i in range(len(nums)):
        m = i
        for j in range(i + 1, len(nums)):
            if nums[j] < nums[m]:
                m = j
        nums[i], nums[m] = nums[m], nums[i]
    return nums

print(bubble_sort([5, 3, 8, 1]))
print(selection_sort([5, 3, 8, 1]))`
    },
    {
      id: 'a4-4', title: '时间复杂度', xp: 50,
      goal: '用大 O 估计算法要跑多久。',
      body: `
<h3>大 O 描述的是「增长趋势」，不是精确秒数</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">
<tr style="background:var(--surface-2)"><td style="padding:7px 10px;border:1px solid var(--border)"><code>O(1)</code></td><td style="padding:7px 10px;border:1px solid var(--border)">字典查键、取列表第一个</td><td style="padding:7px 10px;border:1px solid var(--border)">跟 n 无关</td></tr>
<tr><td style="padding:7px 10px;border:1px solid var(--border)"><code>O(log n)</code></td><td style="padding:7px 10px;border:1px solid var(--border)">二分查找</td><td style="padding:7px 10px;border:1px solid var(--border)">n 翻倍，只多一步</td></tr>
<tr style="background:var(--surface-2)"><td style="padding:7px 10px;border:1px solid var(--border)"><code>O(n)</code></td><td style="padding:7px 10px;border:1px solid var(--border)">遍历一遍列表</td><td style="padding:7px 10px;border:1px solid var(--border)">n 翻倍，时间翻倍</td></tr>
<tr><td style="padding:7px 10px;border:1px solid var(--border)"><code>O(n log n)</code></td><td style="padding:7px 10px;border:1px solid var(--border)">sorted()、归并排序</td><td style="padding:7px 10px;border:1px solid var(--border)">实际排序的标准答案</td></tr>
<tr style="background:var(--surface-2)"><td style="padding:7px 10px;border:1px solid var(--border)"><code>O(n²)</code></td><td style="padding:7px 10px;border:1px solid var(--border)">冒泡排序、双重循环</td><td style="padding:7px 10px;border:1px solid var(--border)">n 翻倍，时间变 4 倍</td></tr>
</table>
<h3>亲手感受一下差距</h3>
<p>在 100 万个元素里查找：</p>
<ul>
<li>逐个找（<code>O(n)</code>）：最多 <strong>1,000,000</strong> 次比较</li>
<li>二分查找（<code>O(log n)</code>）：最多 <strong>20</strong> 次</li>
</ul>
<div class="tip tip-fun"><span class="tip-ico">🧠</span><div>本关不用写查找，只要写两个「数步数」的函数，把上面这个 20 和 1000000 算出来。亲手算一遍，比看十遍表格都管用。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>二分查找的步数就是「把 n 反复除以 2，几次能到 0」。这正是 <code>log₂n</code> 的含义。</div></div>
`,
      starter: `def count_linear_steps(n):
    """逐个查找，最坏情况要比较几次"""
    pass

def count_binary_steps(n):
    """二分查找，最坏情况要比较几次（反复折半直到没有元素）"""
    pass

print("线性查找 100 万条：", count_linear_steps(1000000), "次")
print("二分查找 100 万条：", count_binary_steps(1000000), "次")`,
      check: {
        type: 'tests',
        code: `assert count_linear_steps(100) == 100, f"线性查找 100 条应该是 100 次，实际 {count_linear_steps(100)!r}"
assert count_linear_steps(1000000) == 1000000, "线性查找的步数就是元素个数"
assert count_binary_steps(1) == 1, f"只有 1 个元素时比较 1 次，实际 {count_binary_steps(1)!r}"
assert count_binary_steps(2) == 2, f"2 个元素最多比较 2 次，实际 {count_binary_steps(2)!r}"
assert count_binary_steps(1000) == 10, f"1000 条应该是 10 次，实际 {count_binary_steps(1000)!r}"
assert count_binary_steps(1000000) == 20, f"100 万条应该是 20 次，实际 {count_binary_steps(1000000)!r}"
assert count_binary_steps(4) == 3, f"4 个元素最多 3 次，实际 {count_binary_steps(4)!r}"`
      },
      hint: 'count_linear_steps 直接 return n；count_binary_steps 用循环：steps = 0，while n > 0: steps += 1; n //= 2，最后 return steps',
      solution: `def count_linear_steps(n):
    return n

def count_binary_steps(n):
    steps = 0
    while n > 0:
        steps += 1
        n //= 2
    return steps

print("线性查找 100 万条：", count_linear_steps(1000000), "次")
print("二分查找 100 万条：", count_binary_steps(1000000), "次")`
    },
    {
      id: 'a4-5', title: '动态规划入门', xp: 55,
      goal: '用「记住算过的结果」把指数级暴力降成线性。',
      body: `
<h3>先看裸递归有多慢</h3>
<pre><code>def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

fib(35)      # 要算约 3000 万次，等好几秒</code></pre>
<p>慢的原因是<strong>同一个子问题被反复计算</strong>：<code>fib(30)</code> 里 <code>fib(28)</code> 算了两次，
<code>fib(27)</code> 算了三次…… 指数级膨胀。</p>
<h3>解法一：记忆化（给函数加个缓存）</h3>
<pre><code>from functools import lru_cache

@lru_cache(maxsize=None)
def fib_fast(n):
    if n < 2: return n
    return fib_fast(n-1) + fib_fast(n-2)

fib_fast(35)     # 瞬间出结果</code></pre>
<p><code>@lru_cache</code> 是个现成的装饰器：同一个参数第二次调用时，直接把上次的结果返回，不重新算。
注意递归里要调用<strong>被装饰的自己</strong>（<code>fib_fast</code>），调用没装饰的 <code>fib</code> 就没用了。</p>
<h3>解法二：爬楼梯（经典入门题）</h3>
<p>一次走 1 阶或 2 阶，n 阶楼梯有多少种走法？<br>
想通最后一步：要么从 <code>n-1</code> 走 1 阶上来，要么从 <code>n-2</code> 走 2 阶上来。
所以 <code>climb(n) = climb(n-1) + climb(n-2)</code> —— 和斐波那契一模一样。</p>
<div class="tip tip-fun"><span class="tip-ico">🎯</span><div>动态规划的核心就一句话：<strong>把算过的答案记下来，别重复算</strong>。递推关系（状态转移方程）想清楚了，代码就三行。</div></div>
`,
      starter: `from functools import lru_cache

def climb(n):
    """n 阶楼梯，每次走 1 或 2 阶，共有多少种走法（裸递归）"""
    pass

@lru_cache(maxsize=None)
def climb_fast(n):
    """加上缓存，让它能轻松算到 n=35"""
    pass

print(climb(10))
print(climb_fast(35))`,
      check: {
        type: 'tests',
        code: `assert climb(1) == 1, f"1 阶只有 1 种走法，实际 {climb(1)!r}"
assert climb(2) == 2, f"2 阶有 2 种走法，实际 {climb(2)!r}"
assert climb(3) == 3, "3 阶有 3 种走法"
assert climb(10) == 89, f"climb(10) 应该是 89，实际 {climb(10)!r}"
assert climb_fast(1) == 1 and climb_fast(2) == 2, "climb_fast 的小数值也要对"
assert climb_fast(10) == 89, "climb_fast(10) 应该是 89"
assert climb_fast(35) == 14930352, f"climb_fast(35) 应该是 14930352，实际 {climb_fast(35)!r}"
assert climb_fast.cache_info().hits > 0, "climb_fast 没有命中缓存 —— 递归时是不是调用了没装饰的版本？"`
      },
      hint: '两个函数体一样：if n <= 2: return n 然后 return climb(n-1) + climb(n-2)。climb_fast 里要调用 climb_fast 自己',
      solution: `from functools import lru_cache

def climb(n):
    if n <= 2:
        return n
    return climb(n - 1) + climb(n - 2)

@lru_cache(maxsize=None)
def climb_fast(n):
    if n <= 2:
        return n
    return climb_fast(n - 1) + climb_fast(n - 2)

print(climb(10))
print(climb_fast(35))`
    }
  ]
}

];
