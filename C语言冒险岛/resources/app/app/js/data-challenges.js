/* ============================================================
   data-challenges.js —— 挑战题库

   和「关卡」的区别：关卡是手把手教，挑战是只给题目和示例，
   自己想办法。参考答案要通过本题、或失败 3 次之后才解锁。

   字段说明：
    level   1=入门 2=进阶 3=困难（决定分组、颜色、XP）
            icon 是「几个星」的完整写法，用在有横向空间的标题里；
            badge 是单个字符，用在卡片角标和侧栏那种小方框里（放不下三颗星）
     desc    题目描述（HTML）
     specs   输入输出示例，展示用，判题不用
     starter 起始代码（只给函数签名，不给提示）
     check   隐藏测试（tests 类型，可看到 __OUTPUT__）
     hint    思路提示（不点破怎么写）
     solution 参考实现
   ============================================================ */

const CHALLENGE_LEVELS = [
  { level: 1, name: '入门', icon: '⭐',    badge: '⭐', color: '#e3f8ef', xp: 60,  desc: '基础语法就能解，主要是把思路理清' },
  { level: 2, name: '进阶', icon: '⭐⭐',  badge: '🔥', color: '#e8f0ff', xp: 100, desc: '要想一下数据结构，边界情况容易翻车' },
  { level: 3, name: '困难', icon: '⭐⭐⭐', badge: '💎', color: '#fdecec', xp: 160, desc: '需要一点算法功底，想不出来很正常' }
];

const CHALLENGES = [

/* ==================== ⭐ 入门 ==================== */
{
  id: 'c1', level: 1, title: '两数之和', tags: ['列表', '字典'],
  desc: `
<p>给定一个整数列表 <code>nums</code> 和一个目标值 <code>target</code>，
找出列表中<strong>两个不同的数</strong>，使它们的和等于 <code>target</code>，
返回这两个数的<strong>下标</strong>（小的在前）。</p>
<p>保证每组输入<strong>恰好有一个解</strong>，同一个元素不能重复使用。</p>
`,
  specs: [
    { call: 'two_sum([2, 7, 11, 15], 9)', out: '[0, 1]', note: 'nums[0] + nums[1] = 2 + 7 = 9' },
    { call: 'two_sum([3, 2, 4], 6)', out: '[1, 2]', note: '' },
    { call: 'two_sum([3, 3], 6)', out: '[0, 1]', note: '值相同但下标不同，算两个' }
  ],
  starter: `def two_sum(nums, target):
    """返回两个下标 [i, j]，使 nums[i] + nums[j] == target"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert two_sum([2, 7, 11, 15], 9) == [0, 1], f"two_sum([2,7,11,15], 9) 应该是 [0, 1]，实际 {two_sum([2,7,11,15], 9)!r}"
assert two_sum([3, 2, 4], 6) == [1, 2], f"two_sum([3,2,4], 6) 应该是 [1, 2]，实际 {two_sum([3,2,4], 6)!r}"
assert two_sum([3, 3], 6) == [0, 1], "值相同但下标不同，应该返回 [0, 1]"
assert two_sum([1, 2], 99) == [], "无解时应该返回空列表"
assert two_sum([-1, -2, -3, -4, -5], -8) == [2, 4], "负数也要能处理"
assert two_sum(list(range(2000)), 3997) == [1998, 1999], "大一点的输入也要正确（1998 + 1999 = 3997）"`
  },
  hint: '两层循环当然能做，但那是 O(n²)。想一下：遍历到第 i 个数时，你要找的那个数其实是 <code>target - nums[i]</code> —— 用一个字典把「见过的数 → 下标」记下来，就能一次遍历搞定。',
  solution: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []
`
},
{
  id: 'c2', level: 1, title: '回文串判断', tags: ['字符串', '双指针'],
  desc: `
<p>给定一个字符串，判断它是不是<strong>回文</strong>。</p>
<p>规则：<strong>只考虑字母和数字</strong>，忽略大小写、空格和标点符号。
空字符串算回文。</p>
`,
  specs: [
    { call: 'is_palindrome("A man, a plan, a canal: Panama")', out: 'True', note: '去掉标点空格并转小写后是 amanaplanacanalpanama' },
    { call: 'is_palindrome("race a car")', out: 'False', note: '' },
    { call: 'is_palindrome("")', out: 'True', note: '空串算回文' }
  ],
  starter: `def is_palindrome(s):
    """是回文返回 True，否则返回 False"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert is_palindrome("A man, a plan, a canal: Panama") is True, "标准回文没判对"
assert is_palindrome("race a car") is False, "不是回文却判成了 True"
assert is_palindrome("") is True, "空字符串算回文"
assert is_palindrome(" ") is True, "只有空格，清理后是空串，算回文"
assert is_palindrome("0P") is False, "0 和 P 不是同一个字符（大小写和数字要区分）"
assert is_palindrome("上海自来水来自海上") is True, "中文也算字母数字"
assert is_palindrome("ab_a") is True, "下划线要忽略"`
  },
  hint: '分两步：先把字符串「清洗」成一个只含小写字母数字的新序列，再看它和它的反转是否相等。清洗时可以用列表推导式配合 <code>c.isalnum()</code>。',
  solution: `def is_palindrome(s):
    cleaned = [c.lower() for c in s if c.isalnum()]
    return cleaned == cleaned[::-1]
`
},
{
  id: 'c3', level: 1, title: '去重但保持顺序', tags: ['列表', '集合'],
  desc: `
<p>给定一个列表，去掉重复元素，<strong>并保持元素第一次出现的顺序</strong>。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>直接 <code>list(set(items))</code> 是错的 —— <code>set</code> 不保证顺序，结果会乱。</div></div>
`,
  specs: [
    { call: 'dedupe([1, 2, 1, 3, 2, 4])', out: '[1, 2, 3, 4]', note: '' },
    { call: 'dedupe(["a", "b", "a"])', out: '["a", "b"]', note: '' },
    { call: 'dedupe([])', out: '[]', note: '' }
  ],
  starter: `def dedupe(items):
    """去重，并保持首次出现的顺序，返回新列表"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert dedupe([1, 2, 1, 3, 2, 4]) == [1, 2, 3, 4], f"结果不对：{dedupe([1,2,1,3,2,4])!r}"
assert dedupe(["a", "b", "a"]) == ["a", "b"], "字符串列表也要保持顺序"
assert dedupe([]) == [], "空列表返回空列表"
assert dedupe([1, 1, 1]) == [1], "全是重复元素时只留一个"
assert dedupe([3, 1, 3, 2, 1]) == [3, 1, 2], "顺序要按首次出现，不是按大小"
src = [1, 2, 1]
dedupe(src)
assert src == [1, 2, 1], "不要修改传入的原列表"`
  },
  hint: '准备一个空列表放结果，再准备一个集合记录「见过的」。遍历时遇到没见过的就同时加进两者，这样顺序天然就是首次出现的顺序。',
  solution: `def dedupe(items):
    seen = set()
    out = []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out
`
},
{
  id: 'c4', level: 1, title: '单词计数', tags: ['字典', '字符串'],
  desc: `
<p>统计一段文本里每个单词出现了多少次，返回一个字典。</p>
<p>规则：<strong>不区分大小写</strong>（统一转小写），按空格切分，忽略多余空白。</p>
`,
  specs: [
    { call: 'word_count("The cat the dog")', out: '{"the": 2, "cat": 1, "dog": 1}', note: 'The 和 the 算同一个' },
    { call: 'word_count("a  a\\tb")', out: '{"a": 2, "b": 1}', note: '多个空格和制表符都算分隔' },
    { call: 'word_count("")', out: '{}', note: '' }
  ],
  starter: `def word_count(text):
    """返回 {单词: 次数} 的字典"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert word_count("The cat the dog") == {"the": 2, "cat": 1, "dog": 1}, f"结果不对：{word_count('The cat the dog')!r}"
assert word_count("") == {}, "空字符串返回空字典"
assert word_count("a a a") == {"a": 3}, "重复单词要累加"
assert word_count("a  a\\tb") == {"a": 2, "b": 1}, "多个空白要当成一个分隔符"
assert word_count("Hello HELLO hello") == {"hello": 3}, "大小写要合并"`
  },
  hint: '<code>text.lower().split()</code> 一步就能完成「转小写 + 按任意空白切分 + 忽略首尾空白」。累加时用 <code>counts[w] = counts.get(w, 0) + 1</code> 避免 KeyError。',
  solution: `def word_count(text):
    counts = {}
    for w in text.lower().split():
        counts[w] = counts.get(w, 0) + 1
    return counts
`
},
{
  id: 'c5', level: 1, title: 'FizzBuzz', tags: ['循环', '条件'],
  desc: `
<p>返回一个列表，包含 <code>1</code> 到 <code>n</code> 的字符串形式，但：</p>
<ul>
<li>3 的倍数 → <code>"Fizz"</code></li>
<li>5 的倍数 → <code>"Buzz"</code></li>
<li>同时是 3 和 5 的倍数 → <code>"FizzBuzz"</code></li>
</ul>
<p><code>n &lt;= 0</code> 时返回空列表。</p>
<div class="tip tip-fun"><span class="tip-ico">💡</span><div>看似简单，但「先判断 15 的倍数」这个顺序是很多人栽的地方 —— 先判断 3 的话，15 会变成 Fizz 而不是 FizzBuzz。</div></div>
`,
  specs: [
    { call: 'fizzbuzz(5)', out: '["1", "2", "Fizz", "4", "Buzz"]', note: '' },
    { call: 'fizzbuzz(15)[-1]', out: '"FizzBuzz"', note: '' },
    { call: 'fizzbuzz(0)', out: '[]', note: '' }
  ],
  starter: `def fizzbuzz(n):
    """返回长度为 n 的列表"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert fizzbuzz(5) == ["1", "2", "Fizz", "4", "Buzz"], f"结果不对：{fizzbuzz(5)!r}"
assert fizzbuzz(0) == [], "n=0 应该返回空列表"
assert fizzbuzz(-3) == [], "负数也应该返回空列表"
assert fizzbuzz(15)[-1] == "FizzBuzz", "15 应该同时命中 3 和 5，输出 FizzBuzz"
assert fizzbuzz(3)[2] == "Fizz", "3 应该是 Fizz"
assert fizzbuzz(5)[4] == "Buzz", "5 应该是 Buzz"
assert all(isinstance(x, str) for x in fizzbuzz(20)), "列表里每个元素都应该是字符串"
assert fizzbuzz(20)[14] == "FizzBuzz", "第 15 个元素是 FizzBuzz"`
  },
  hint: '循环里<strong>先判断能不能同时被 3 和 5 整除</strong>（也就是 % 15 == 0），再判断 3、再判断 5，最后才是普通数字。别忘了把数字转成字符串。',
  solution: `def fizzbuzz(n):
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            out.append("FizzBuzz")
        elif i % 3 == 0:
            out.append("Fizz")
        elif i % 5 == 0:
            out.append("Buzz")
        else:
            out.append(str(i))
    return out
`
},

/* ==================== ⭐⭐ 进阶 ==================== */
{
  id: 'c6', level: 2, title: '有效的括号', tags: ['栈', '字符串'],
  desc: `
<p>给定一个只包含 <code>(</code> <code>)</code> <code>[</code> <code>]</code> <code>{</code> <code>}</code> 的字符串，
判断括号是否<strong>正确配对</strong>。</p>
<p>正确意味着：每个左括号都有对应的右括号，且<strong>嵌套顺序正确</strong>。</p>
`,
  specs: [
    { call: 'is_valid("()[]{}")', out: 'True', note: '' },
    { call: 'is_valid("(]")', out: 'False', note: '类型不匹配' },
    { call: 'is_valid("([)]")', out: 'False', note: '交叉嵌套，顺序错了' },
    { call: 'is_valid("{[]}")', out: 'True', note: '正确的嵌套' }
  ],
  starter: `def is_valid(s):
    """括号正确配对返回 True"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert is_valid("()") is True, "最简单的应该通过"
assert is_valid("()[]{}") is True, "三种括号并列应该通过"
assert is_valid("(]") is False, "类型不匹配应该失败"
assert is_valid("([)]") is False, "交叉嵌套应该失败"
assert is_valid("{[]}") is True, "正确嵌套应该通过"
assert is_valid("") is True, "空字符串算有效"
assert is_valid("(") is False, "只有左括号应该失败"
assert is_valid(")") is False, "只有右括号应该失败"
assert is_valid("(((((())))))") is True, "多层嵌套要能处理"
assert is_valid("(((") is False, "左括号没闭合应该失败"`
  },
  hint: '用一个<strong>栈</strong>（Python 里就是列表，用 append/pop）。遇到左括号就压进去；遇到右括号就看栈顶是不是它对应的左括号 —— 是就弹出来，不是（或栈为空）就直接返回 False。最后栈必须是空的。',
  solution: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack
`
},
{
  id: 'c7', level: 2, title: '最长连续序列', tags: ['集合', '去重'],
  desc: `
<p>给定一个未排序的整数列表，找出<strong>最长的连续递增序列</strong>的长度。</p>
<p>连续指数值上相邻（如 1, 2, 3, 4），<strong>不要求元素在原列表里相邻</strong>。</p>
<p>要求时间复杂度 <code>O(n)</code> —— 也就是说不能先排序（排序是 O(n log n)）。</p>
`,
  specs: [
    { call: 'longest_consecutive([100, 4, 200, 1, 3, 2])', out: '4', note: '最长的是 1,2,3,4' },
    { call: 'longest_consecutive([1, 1, 1])', out: '1', note: '重复元素只算一次' },
    { call: 'longest_consecutive([])', out: '0', note: '' }
  ],
  starter: `def longest_consecutive(nums):
    """返回最长连续序列的长度"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert longest_consecutive([100, 4, 200, 1, 3, 2]) == 4, f"应该是 4，实际 {longest_consecutive([100,4,200,1,3,2])!r}"
assert longest_consecutive([]) == 0, "空列表返回 0"
assert longest_consecutive([1, 1, 1]) == 1, "全是同一个数，长度 1"
assert longest_consecutive([1, 2, 0, 1]) == 3, "0,1,2 连续，长度 3"
assert longest_consecutive([5]) == 1, "单元素返回 1"
assert longest_consecutive([-3, -2, -1, 0]) == 4, "负数也要能处理"
assert longest_consecutive([9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]) == 7, "这条容易漏"
assert longest_consecutive(list(range(500))) == 500, "大一点的输入"
assert longest_consecutive(list(range(0, 2000, 2))) == 1, "全部隔一个，最长就是 1"`
  },
  hint: '先把列表扔进 <code>set</code>（顺便去重 + 让查找变成 O(1)）。关键技巧：只从「序列的起点」开始数 —— 也就是满足 <code>n - 1 not in s</code> 的那个数。这样每个元素最多被访问两次，整体就是 O(n)。',
  solution: `def longest_consecutive(nums):
    s = set(nums)
    best = 0
    for n in s:
        if n - 1 not in s:
            length = 1
            while n + length in s:
                length += 1
            best = max(best, length)
    return best
`
},
{
  id: 'c8', level: 2, title: '只出现一次的数字', tags: ['字典', '位运算'],
  desc: `
<p>给定一个列表，其中<strong>除了一个数只出现一次，其余每个数都出现两次</strong>，找出那个只出现一次的数。</p>
<p>要求：额外空间尽量少（能想到 <code>O(1)</code> 的解法最好）。</p>
`,
  specs: [
    { call: 'single_number([4, 1, 2, 1, 2])', out: '4', note: '' },
    { call: 'single_number([2, 2, 1])', out: '1', note: '' },
    { call: 'single_number([7])', out: '7', note: '' }
  ],
  starter: `def single_number(nums):
    """返回那个只出现一次的数"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert single_number([4, 1, 2, 1, 2]) == 4, f"应该是 4，实际 {single_number([4,1,2,1,2])!r}"
assert single_number([2, 2, 1]) == 1, "应该是 1"
assert single_number([7]) == 7, "只有一个元素时就是它"
assert single_number([1, 1, 2, 2, 3]) == 3, "应该是 3"
assert single_number([0, 1, 0]) == 1, "0 也要能处理"
assert single_number([-1, -1, -2]) == -2, "负数也要能处理"
assert single_number([1, 2, 3, 2, 1]) == 3, "顺序打乱也要对"`
  },
  hint: '两条路：① 用 <code>Counter</code> 数一遍，找出现 1 次的那个（好想，但用了额外空间）。② <strong>异或</strong>：<code>a ^ a == 0</code>、<code>a ^ 0 == a</code>，把所有数异或起来，成对的自动抵消，剩下的就是答案（O(1) 空间）。',
  solution: `def single_number(nums):
    result = 0
    for n in nums:
        result ^= n
    return result
`
},
{
  id: 'c9', level: 2, title: '合并区间', tags: ['排序', '列表'],
  desc: `
<p>给定一组区间 <code>[[开始, 结束], ...]</code>，合并所有<strong>重叠</strong>的区间，返回合并后的结果。</p>
<p>结果要按开始位置从小到大排列。返回<strong>列表的列表</strong>。</p>
<p>两个区间 <code>[1,3]</code> 和 <code>[3,6]</code> 算重叠（端点相接也算）。</p>
`,
  specs: [
    { call: 'merge_intervals([[1,3],[2,6],[8,10],[15,18]])', out: '[[1,6],[8,10],[15,18]]', note: '[1,3] 和 [2,6] 合并成 [1,6]' },
    { call: 'merge_intervals([[1,4],[4,5]])', out: '[[1,5]]', note: '端点相接算重叠' },
    { call: 'merge_intervals([[5,6],[1,2]])', out: '[[1,2],[5,6]]', note: '输入可能乱序，要先排序' }
  ],
  starter: `def merge_intervals(intervals):
    """返回合并后的区间列表"""
    pass
`,
  check: {
    type: 'tests',
    code: `def norm(x):
    return [list(i) for i in x]

assert norm(merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]])) == [[1, 6], [8, 10], [15, 18]], f"结果不对：{merge_intervals([[1,3],[2,6],[8,10],[15,18]])!r}"
assert norm(merge_intervals([])) == [], "空输入返回空列表"
assert norm(merge_intervals([[1, 4], [4, 5]])) == [[1, 5]], "端点相接要合并"
assert norm(merge_intervals([[5, 6], [1, 2]])) == [[1, 2], [5, 6]], "乱序输入要先排序"
assert norm(merge_intervals([[1, 10], [2, 3]])) == [[1, 10]], "被完全包含的区间要吸收掉"
assert norm(merge_intervals([[1, 2]])) == [[1, 2]], "单个区间原样返回"
assert norm(merge_intervals([[1, 4], [0, 4]])) == [[0, 4]], "左端点更小的要扩展"
assert norm(merge_intervals([[1, 4], [2, 3], [5, 7], [6, 8]])) == [[1, 4], [5, 8]], "多个区间连续合并"`
  },
  hint: '先<strong>按开始位置排序</strong>。排序之后，重叠的区间一定相邻。然后维护一个结果列表：新来的区间如果能和结果里最后一个重叠（<code>新开始 &lt;= 最后一个的结束</code>），就扩展最后一个的结束位置；否则直接追加。',
  solution: `def merge_intervals(intervals):
    if not intervals:
        return []
    ordered = sorted(intervals)
    out = [list(ordered[0])]
    for start, end in ordered[1:]:
        if start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out
`
},
{
  id: 'c10', level: 2, title: '反转单词顺序', tags: ['字符串', 'split'],
  desc: `
<p>把句子里的<strong>单词顺序</strong>反过来，单词本身不变。</p>
<p>多个空格要压缩成一个，首尾空格要去掉。</p>
`,
  specs: [
    { call: 'reverse_words("the sky is blue")', out: '"blue is sky the"', note: '' },
    { call: 'reverse_words("  hello world  ")', out: '"world hello"', note: '多余空格要去掉' },
    { call: 'reverse_words("a good   example")', out: '"example good a"', note: '中间多个空格压缩成一个' }
  ],
  starter: `def reverse_words(s):
    """返回反转单词顺序后的新字符串"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert reverse_words("the sky is blue") == "blue is sky the", f"结果不对：{reverse_words('the sky is blue')!r}"
assert reverse_words("  hello world  ") == "world hello", "首尾空格要去掉"
assert reverse_words("a good   example") == "example good a", "中间多个空格要压缩"
assert reverse_words("a") == "a", "单个单词原样返回"
assert reverse_words("") == "", "空字符串返回空字符串"
assert reverse_words("   ") == "", "只有空格返回空字符串"`
  },
  hint: '先想清楚 <code>"  a  b  ".split()</code> 会得到什么 —— 不带参数的 <code>split()</code> 会自动处理连续空白和首尾空白。然后反转列表，再用 <code>" ".join()</code> 拼回去。',
  solution: `def reverse_words(s):
    return " ".join(s.split()[::-1])
`
},

/* ==================== ⭐⭐⭐ 困难 ==================== */
{
  id: 'c11', level: 3, title: '最长回文子串', tags: ['字符串', '中心扩展'],
  desc: `
<p>给定一个字符串，找出它<strong>最长的回文子串</strong>。子串是连续的一段。</p>
<p>测试用例保证答案唯一，所以不用担心「同样长的多个答案选哪个」。</p>
`,
  specs: [
    { call: 'longest_palindrome("cbbd")', out: '"bb"', note: '' },
    { call: 'longest_palindrome("racecarx")', out: '"racecar"', note: '' },
    { call: 'longest_palindrome("forgeeksskeegfor")', out: '"geeksskeeg"', note: '' }
  ],
  starter: `def longest_palindrome(s):
    """返回最长的回文子串"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert longest_palindrome("cbbd") == "bb", f"应该是 'bb'，实际 {longest_palindrome('cbbd')!r}"
assert longest_palindrome("racecarx") == "racecar", f"应该是 'racecar'，实际 {longest_palindrome('racecarx')!r}"
assert longest_palindrome("forgeeksskeegfor") == "geeksskeeg", f"应该是 'geeksskeeg'，实际 {longest_palindrome('forgeeksskeegfor')!r}"
assert longest_palindrome("a") == "a", "单字符返回自己"
assert longest_palindrome("aa") == "aa", "两个相同字符就是回文"
assert longest_palindrome("ab") == "a", "两个不同字符，最长就是单个字符"
assert longest_palindrome("") == "", "空字符串返回空字符串"
assert longest_palindrome("xabccbay") == "abccba", "偶数长度的回文"`
  },
  hint: '不要枚举所有子串（那是 O(n³)）。换个角度：<strong>回文是从中心向两边对称展开的</strong>。所以枚举「中心」—— 每个字符是一个中心（奇数长度），每两个相邻字符之间也是一个中心（偶数长度），从中心往两边扩，直到不再对称为止。一共 2n-1 个中心，整体 O(n²)。',
  solution: `def longest_palindrome(s):
    if not s:
        return ""
    best = ""

    def expand(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return s[left + 1:right]

    for i in range(len(s)):
        odd = expand(i, i)          # 奇数长度，中心是一个字符
        even = expand(i, i + 1)     # 偶数长度，中心在两个字符之间
        if len(odd) > len(best):
            best = odd
        if len(even) > len(best):
            best = even
    return best
`
},
{
  id: 'c12', level: 3, title: '零钱兑换', tags: ['动态规划', '贪心陷阱'],
  desc: `
<p>给定若干种硬币面额 <code>coins</code> 和一个总金额 <code>amount</code>，
用<strong>最少的硬币数量</strong>凑出这个金额。凑不出来返回 <code>-1</code>。</p>
<p>每种硬币可以用无限次。<code>amount == 0</code> 时返回 <code>0</code>。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div><strong>贪心是错的</strong>。比如面额 <code>[1, 3, 4]</code> 凑 6：
贪心会先拿 4，然后 1+1，一共 3 枚；但最优是 3+3，只要 2 枚。</div></div>
`,
  specs: [
    { call: 'coin_change([1, 2, 5], 11)', out: '3', note: '5 + 5 + 1 = 11' },
    { call: 'coin_change([2], 3)', out: '-1', note: '凑不出来' },
    { call: 'coin_change([1], 0)', out: '0', note: '金额为 0 不需要硬币' }
  ],
  starter: `def coin_change(coins, amount):
    """返回最少硬币数，凑不出返回 -1"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert coin_change([1, 2, 5], 11) == 3, f"应该是 3，实际 {coin_change([1,2,5], 11)!r}"
assert coin_change([2], 3) == -1, "凑不出来要返回 -1"
assert coin_change([1], 0) == 0, "金额 0 返回 0"
assert coin_change([1, 3, 4], 6) == 2, f"[1,3,4] 凑 6 最优是 3+3=2 枚，实际 {coin_change([1,3,4], 6)!r}（贪心会算成 3）"
assert coin_change([1, 5, 10, 25], 63) == 6, f"应该是 6，实际 {coin_change([1,5,10,25], 63)!r}"
assert coin_change([2, 5], 1) == -1, "最小面额比目标大，凑不出来"
assert coin_change([186, 419, 83, 408], 6249) == 20, "这道题是经典用例，答案 20"`
  },
  hint: '动态规划：定义 <code>dp[i]</code> 为「凑出金额 i 所需的最少硬币数」。从小到大算每个 <code>i</code>：<code>dp[i] = min(dp[i - c] + 1)</code>，对所有 <code>c &lt;= i</code> 取最小。凑不出的位置记成无穷大，最后检查一下。',
  solution: `def coin_change(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i and dp[i - c] + 1 < dp[i]:
                dp[i] = dp[i - c] + 1
    return -1 if dp[amount] == INF else dp[amount]
`
},
{
  id: 'c13', level: 3, title: '岛屿数量', tags: ['二维数组', '递归', 'DFS'],
  desc: `
<p>给定一个由 <code>"1"</code>（陆地）和 <code>"0"</code>（水）组成的二维网格，
数一数有多少个<strong>岛屿</strong>。</p>
<p>岛屿由上下左右相邻的陆地连成一片（<strong>斜着不算</strong>）。</p>
<p>注意：<strong>不要修改传入的 grid</strong>。</p>
`,
  specs: [
    { call: 'num_islands([["1","1","0"],["1","1","0"],["0","0","1"]])', out: '2', note: '左上角一整块 + 右下角一块' },
    { call: 'num_islands([["0"]])', out: '0', note: '' },
    { call: 'num_islands([["1","0","1","0","1"]])', out: '3', note: '一行里的三块互不相邻' }
  ],
  starter: `def num_islands(grid):
    """返回岛屿数量"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert num_islands([["1","1","0"],["1","1","0"],["0","0","1"]]) == 2, "标准用例应该是 2"
assert num_islands([["0"]]) == 0, "全是水，0 个岛"
assert num_islands([["1"]]) == 1, "一块陆地，1 个岛"
assert num_islands([]) == 0, "空网格返回 0"
assert num_islands([["1","0","1","0","1"]]) == 3, "一行里三个不相邻的岛"
assert num_islands([["1","1","1"],["1","1","1"],["1","1","1"]]) == 1, "整片连在一起只算 1 个"
assert num_islands([["1","0"],["0","1"]]) == 2, "斜着不算相邻，所以是 2 个"
g = [["1","1"],["1","1"]]
num_islands(g)
assert g == [["1","1"],["1","1"]], "不要修改传入的 grid（先复制一份再改）"`
  },
  hint: `遍历每个格子，遇到 <code>"1"</code> 就把计数器 +1，然后<strong>把这一整片陆地「淹掉」</strong>（改成 <code>"0"</code>），
这样后面再遇到它就不会重复计数了。淹的操作写成递归函数：把自己变 0，再对上下左右四个方向递归。`,
  solution: `def num_islands(grid):
    if not grid:
        return 0
    grid = [row[:] for row in grid]     # 复制一份，别改原网格
    rows, cols = len(grid), len(grid[0])
    count = 0

    def sink(r, c):
        if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "1":
            grid[r][c] = "0"
            sink(r + 1, c)
            sink(r - 1, c)
            sink(r, c + 1)
            sink(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count
`
},
{
  id: 'c14', level: 3, title: '出现频率最高的 K 个词', tags: ['Counter', '排序'],
  desc: `
<p>给定单词列表和整数 <code>k</code>，返回出现次数最多的前 <code>k</code> 个单词。</p>
<p><strong>次数相同时按字典序（字母顺序）排列</strong>，保证结果唯一。</p>
`,
  specs: [
    { call: 'top_k_words(["i","love","leetcode","i","love","coding"], 2)', out: '["i", "love"]', note: '' },
    { call: 'top_k_words(["b","a","b","a"], 2)', out: '["a", "b"]', note: '次数相同，按字母序' },
    { call: 'top_k_words(["a"], 1)', out: '["a"]', note: '' }
  ],
  starter: `def top_k_words(words, k):
    """返回前 k 个高频词"""
    pass
`,
  check: {
    type: 'tests',
    code: `assert top_k_words(["i","love","leetcode","i","love","coding"], 2) == ["i", "love"], f"结果不对：{top_k_words(['i','love','leetcode','i','love','coding'], 2)!r}"
assert top_k_words(["b","a","b","a"], 2) == ["a", "b"], "次数相同时要按字母序，所以是 a 在前"
assert top_k_words(["a"], 1) == ["a"], "只有一个词"
assert top_k_words(["the","day","is","sunny","the","the","the","sunny","is","is"], 4) == ["the", "is", "sunny", "day"], f"结果不对：{top_k_words(['the','day','is','sunny','the','the','the','sunny','is','is'], 4)!r}"
assert top_k_words(["x","y"], 5) == ["x", "y"], "k 比单词种类多时，返回全部（按字母序）"
assert top_k_words([], 3) == [], "空列表返回空列表"`
  },
  hint: `排序的 key 要同时表达两件事：<strong>次数从大到小，字母从小到大</strong>。
用元组做 key：<code>(-次数, 单词)</code> —— 负号把「大」变成「小」，正好和单词的正序排在一起。`,
  solution: `from collections import Counter

def top_k_words(words, k):
    counts = Counter(words)
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [w for w, _ in ordered[:k]]
`
},
{
  id: 'c15', level: 3, title: 'LRU 缓存', tags: ['面向对象', 'OrderedDict', '设计题'],
  desc: `
<p>实现一个 <strong>LRU（最近最少使用）缓存</strong>，容量固定为 <code>capacity</code>。</p>
<ul>
<li><code>get(key)</code>：存在就返回对应的值，<strong>并把它标记为「最近使用」</strong>；不存在返回 <code>-1</code>。</li>
<li><code>put(key, value)</code>：写入或更新，并标记为「最近使用」；如果超出容量，<strong>淘汰最久没被使用的那个</strong>。</li>
</ul>
<div class="tip tip-fun"><span class="tip-ico">🔑</span><div>提示：Python 的 <code>collections.OrderedDict</code> 有
<code>move_to_end(key)</code> 和 <code>popitem(last=False)</code> 两个方法，天生适合做这件事。
当然你也可以自己用普通字典 + 列表实现。</div></div>
`,
  specs: [
    { call: 'c = LRUCache(2); c.put(1, 1); c.put(2, 2); c.get(1)', out: '1', note: '' },
    { call: 'c.put(3, 3)  # 容量满了，淘汰最久未用的 2', out: 'None', note: '' },
    { call: 'c.get(2)', out: '-1', note: '2 已经被淘汰' }
  ],
  starter: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        # 在这里准备你的数据结构

    def get(self, key):
        pass

    def put(self, key, value):
        pass
`,
  check: {
    type: 'tests',
    code: `c = LRUCache(2)
c.put(1, 1)
c.put(2, 2)
assert c.get(1) == 1, f"get(1) 应该是 1，实际 {c.get(1)!r}"
c.put(3, 3)
assert c.get(2) == -1, "key 2 最久没用过，应该被淘汰"
assert c.get(3) == 3, "刚写入的 key 3 应该在"
c.put(4, 4)
assert c.get(1) == -1, "key 1 刚才被 get 过之后又变成最久未用了，应被淘汰"
assert c.get(3) == 3 and c.get(4) == 4, "key 3 和 4 都应该还在"

c2 = LRUCache(1)
c2.put(1, 1)
c2.put(2, 2)
assert c2.get(1) == -1, "容量 1，写第二个时第一个就该被淘汰"
assert c2.get(2) == 2, "key 2 应该在"

c3 = LRUCache(2)
c3.put(1, 1)
c3.put(2, 2)
c3.put(1, 10)     # 更新已存在的 key，应该算「最近使用」
c3.put(3, 3)      # 该淘汰的是最久未用的 2，而不是 1
assert c3.get(1) == 10, "重复 put 同一个 key 应该更新值，而且算「最近使用」"
assert c3.get(2) == -1, "被淘汰的应该是 key 2"`
  },
  hint: `核心是「访问顺序」这件事：每次 <code>get</code> 或 <code>put</code> 都要把对应 key 挪到「最新」的位置；
超容量时删掉「最旧」的那个。<code>OrderedDict</code> 正好按插入顺序排列，<code>move_to_end</code> 挪到末尾，<code>popitem(last=False)</code> 弹出开头（最旧）。`,
  solution: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)
`
}

];
