/* ============================================================
   data-tracks.js —— 实战工坊（方向板块）数据

   每个方向 = 一个真实的应用领域。结构：
     chapters  若干章节（写法与 data-lessons.js / data-advanced.js 完全一致）
     projects  该方向的实战项目（写法与 data-projects.js 一致）
     needs     跑这个方向需要哪些「设备能力」

   needs 是这套设计的关键。同一个方向在不同设备上能走多远差很多：
   本机 Python 有真 socket、能起子进程、能开窗口；浏览器沙箱里这些都没有。
   所以方向卡上会拿 needs 和设备实际能力对一遍，做不到的地方明确标出来，
   而不是让学生在报错信息里自己猜。
   ============================================================ */

/* 能力代号（与 PyRunner.caps 一一对应）：
     net       能连真实网络（真 socket）
     process   能起子进程 / 执行系统命令
     gui       能开图形窗口
     pkg       能安装第三方包
   文件读写和标准库两端都有，不用声明。 */
const TRACK_NEEDS = {
  net: '真实网络访问',
  process: '运行系统命令',
  gui: '图形窗口',
  pkg: '安装第三方库'
};

const TRACKS = [

/* ==================== 1. 网络爬虫（核心方向） ==================== */
{
  id: 'crawl', icon: '🕸️', name: '网络爬虫', tag: '核心方向',
  desc: '把网页变成能用的数据',
  intro: `
<p>爬虫是很多人学 Python 的第一个真实目标：把网页上散着的信息，变成一张能筛选、能统计的表。</p>
<p>这个方向用<strong>本地靶场</strong>来练 —— 请求是真的 HTTP 请求，内容是我们自己的。
所以它永远在那儿、不会改版、也不会把你封掉，你可以放心反复试。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>练完这里的抓取和解析，
把地址换成真实网站就能直接用。最后一关专门讲用真实网站前必须注意的事。</div></div>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
  id: 'a5', icon: '🌐', title: '网络与爬虫',
  subtitle: 'HTTP / 提取数据 / 分页 / 规矩',
  lessons: [
    {
      id: 'a5-1', title: '把网页抓下来', xp: 55,
      goal: '用 urllib 发出第一个 HTTP 请求，把网页原始内容拿到手。',
      body: `
<h3>浏览器背后发生了什么</h3>
<p>你在地址栏敲回车，浏览器其实做了三件事：<strong>发出一个请求</strong>、
<strong>收到一段文本</strong>、<strong>把文本画成页面</strong>。</p>
<p>爬虫就是跳过第三步 —— 只要那段文本。</p>
<pre><code>import urllib.request

resp = urllib.request.urlopen(SITE + "/news.html", timeout=5)
print(resp.status)                      # 200 表示成功
html = resp.read().decode("utf-8")      # 字节 -> 文字</code></pre>
<h3>三个必须知道的点</h3>
<ul>
<li><code>SITE</code> 是练习靶场的地址，已经替你准备好了。后面所有关卡都从它出发。</li>
<li><code>timeout=5</code> 是「最多等 5 秒」。不写的话，碰上卡住的网站你的程序会一直挂着不返回。</li>
<li><code>resp.read()</code> 拿到的是一串 <strong>字节</strong>（bytes），不是文字，必须
<code>.decode("utf-8")</code> 才能变成能读的字符串。忘了这一步，中文就是一堆乱码。</li>
</ul>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>爬虫的第一条经验：<strong>先把原始内容原样拿下来看一眼</strong>。
在写任何提取逻辑之前，先 print 出来看看它到底长什么样 —— 后面无数个 bug 都能在这一步避免。</div></div>
<div class="tip tip-fun"><span class="tip-ico">🎯</span><div>这一章抓的是本地搭的一个练习站（一个虚构的「编程日报」）。
请求是真的 HTTP 请求，只是内容是我们自己的 —— 所以它永远在那儿、不会改版、也不会把你封掉。
后面会讲怎么把这个本事用到真实网站上，以及用的时候要注意什么。</div></div>
`,
      starter: `import urllib.request

url = SITE + "/news.html"

# 1) 发出请求，把响应对象存进 resp，记得加 timeout=5
# 2) 打印 resp.status
# 3) 把正文读出来并解码成字符串，存进 html
# 4) 打印 len(html)
`,
      check: { type: 'tests', code: `assert 'resp' in dir(), "没有看到变量 resp"
assert resp.status == 200, f"状态码应该是 200，实际是 {resp.status}"
assert isinstance(html, str), "html 应该是字符串（记得 decode）"
assert len(html) > 1000, f"html 太短了（{len(html)} 个字符），是不是没读全？"
assert "news-list" in html, "这好像不是新闻列表页的内容"
assert "编程日报" in html, "中文没解码对，检查一下 decode 的编码"` },
      hint: '三行就够：<code>resp = urllib.request.urlopen(url, timeout=5)</code>、<code>print(resp.status)</code>、<code>html = resp.read().decode("utf-8")</code>，最后 print 一下长度。',
      solution: `import urllib.request

url = SITE + "/news.html"

resp = urllib.request.urlopen(url, timeout=5)
print(resp.status)

html = resp.read().decode("utf-8")
print(len(html))`
    },

    {
      id: 'a5-2', title: '从网页里挑出想要的东西', xp: 60,
      goal: '用正则从 HTML 里把标题一条条捞出来。',
      body: `
<h3>抓下来的东西是一大坨</h3>
<p>你上一步抓到的 HTML 有 2000 多字符，但真正想要的只有几条标题。怎么挑出来？</p>
<p>先看一眼要挑的东西长什么样：</p>
<pre><code>&lt;a class="news-title" href="/post-1.html"&gt;Python 3.14 正式发布&lt;/a&gt;</code></pre>
<p>规律很明确：<code>class="news-title"</code> 开头，<code>&gt;</code> 之后、<code>&lt;</code> 之前就是标题。</p>
<h3>用正则把「中间那段」抠出来</h3>
<pre><code>import re

titles = re.findall(r'class="news-title"[^>]*>([^<]+)&lt;', html)
print(titles)   # ['Python 3.14 正式发布：真的快了不少', '为什么你的 for 循环可以更快', ...]</code></pre>
<h3>括号决定返回什么</h3>
<ul>
<li><code>re.findall</code> 返回的是<strong>所有匹配</strong>组成的列表。</li>
<li>正则里只要有<strong>一对括号</strong>，它返回的就是<strong>括号里的内容</strong>，而不是整段匹配。
这一点非常实用：你只想要标题，不想要外面的标签。</li>
<li><code>[^&gt;]*</code> 的意思是「一串不是 <code>&gt;</code> 的字符」。用它比用 <code>.*?</code> 更稳，
因为 HTML 里换行很多，<code>.*?</code> 容易跨行吃到不该吃的东西。</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>用正则处理 HTML 是有边界的：结构简单、格式规整时非常好用；
但碰上嵌套很深、标签到处换行的页面就会开始出错。下一关讲正规做法。</div></div>
`,
      starter: `import urllib.request
import re

html = urllib.request.urlopen(SITE + "/news.html", timeout=5).read().decode("utf-8")

# 用 re.findall 把所有标题抠出来，存进 titles
titles = []

print(titles)
`,
      check: { type: 'tests', code: `assert isinstance(titles, list), "titles 应该是列表"
assert len(titles) == 3, f"这一页有 3 条新闻，实际抓到 {len(titles)} 条"
assert titles[0].startswith("Python 3.14"), f"第一条不对：{titles[0]!r}"
assert all("<" not in t for t in titles), "抓出来的内容里还带着标签，检查一下正则的括号"` },
      hint: '正则写成 <code>r\'class="news-title"[^&gt;]*&gt;([^&lt;]+)&lt;\'</code>，外面套 <code>re.findall(..., html)</code>。',
      solution: `import urllib.request
import re

html = urllib.request.urlopen(SITE + "/news.html", timeout=5).read().decode("utf-8")

titles = re.findall(r'class="news-title"[^>]*>([^<]+)<', html)

print(titles)`
    },

    {
      id: 'a5-3', title: '用标准库正经解析 HTML', xp: 60,
      goal: '用 html.parser 写一个收集器，不靠正则也能提取数据。',
      body: `
<h3>正则什么时候会翻车</h3>
<p>如果标题本身含有 <code>&lt;</code>，或者标签属性换了一行，上一关的正则就不灵了。
更重要的是：正则不知道「标签的嵌套关系」，它只知道字符顺序。</p>
<p>Python 标准库自带一个 HTML 解析器，它<strong>真的理解标签结构</strong>。</p>
<h3>思路：解析器一边读一边把想要的东西记下来</h3>
<pre><code>from html.parser import HTMLParser

class TitleCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.titles = []
        self.inside = False        # 当前是不是正待在标题标签肚子里

    def handle_starttag(self, tag, attrs):
        if tag == "a" and ("class", "news-title") in attrs:
            self.inside = True

    def handle_endtag(self, tag):
        if tag == "a":
            self.inside = False

    def handle_data(self, data):
        if self.inside:
            self.titles.append(data.strip())</code></pre>
<h3>它是怎么工作的</h3>
<ul>
<li><code>handle_starttag</code>：遇到 <code>&lt;a ...&gt;</code> 时调用，<code>attrs</code> 是属性列表，
形如 <code>[("class", "news-title"), ("href", "/post-1.html")]</code>。</li>
<li><code>handle_data</code>：遇到标签之间的文字时调用。</li>
<li><code>handle_endtag</code>：遇到 <code>&lt;/a&gt;</code> 时调用。</li>
</ul>
<p>所以「进入标题标签时竖个旗子，读到文字就记下来，遇到结束标签就把旗子放下」，
就能准确收集到所有标题。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这个「继承一个类、覆盖几个方法」的写法，
正是你在第一章学的面向对象。标准库里有大量这种用法 —— 它给你搭好骨架，你只填需要的那几笔。</div></div>
<div class="tip tip-fun"><span class="tip-ico">🔧</span><div>真实项目里更常用第三方库
<code>BeautifulSoup</code>，它把这种写法缩短成一行。不过理解上面这个骨架，你才知道它在替你做什么。</div></div>
`,
      starter: `import urllib.request
from html.parser import HTMLParser

html = urllib.request.urlopen(SITE + "/news.html", timeout=5).read().decode("utf-8")

class TitleCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.titles = []
        self.inside = False

    # 补全三个方法：handle_starttag / handle_endtag / handle_data


parser = TitleCollector()
parser.feed(html)

print(parser.titles)
`,
      check: { type: 'tests', code: `assert 'parser' in dir(), "没有看到 parser"
assert isinstance(parser.titles, list), "titles 应该是个列表"
assert len(parser.titles) == 3, f"应该收到 3 条标题，实际 {len(parser.titles)} 条：{parser.titles!r}"
assert parser.titles[0].startswith("Python 3.14"), f"第一条不对：{parser.titles[0]!r}"
assert all("<" not in t for t in parser.titles), "收集到的内容里不该带标签"
assert "为什么你的 for 循环可以更快" in parser.titles, "第二条没收到"` },
      hint: '<code>handle_starttag</code> 里判断 <code>tag == "a"</code> 且 <code>("class", "news-title") in attrs</code> 时把 <code>self.inside</code> 设成 True；<code>handle_endtag</code> 里遇到 <code>"a"</code> 设回 False；<code>handle_data</code> 里当 <code>self.inside</code> 为真时 <code>append(data.strip())</code>。',
      solution: `import urllib.request
from html.parser import HTMLParser

html = urllib.request.urlopen(SITE + "/news.html", timeout=5).read().decode("utf-8")

class TitleCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.titles = []
        self.inside = False

    def handle_starttag(self, tag, attrs):
        if tag == "a" and ("class", "news-title") in attrs:
            self.inside = True

    def handle_endtag(self, tag):
        if tag == "a":
            self.inside = False

    def handle_data(self, data):
        if self.inside:
            self.titles.append(data.strip())

parser = TitleCollector()
parser.feed(html)

print(parser.titles)`
    },

    {
      id: 'a5-4', title: '抓不到的时候怎么办', xp: 65,
      goal: '分清「页面不存在」和「连不上」，把异常接住而不是让它崩掉。',
      body: `
<h3>爬虫天天在出错</h3>
<p>网页可能不存在、服务器可能挂了、网络可能超时。这些都不是「你的代码写错了」，
而是<strong>网络世界的日常</strong>。所以爬虫必须学会接住它们。</p>
<h3>两种最常见的错误</h3>
<pre><code>import urllib.error

try:
    resp = urllib.request.urlopen(SITE + "/nope.html", timeout=5)
except urllib.error.HTTPError as e:
    print("服务器回应了，但说：", e.code)      # 404
except urllib.error.URLError as e:
    print("压根没连上：", e.reason)</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div><strong>顺序很重要</strong>：
<code>HTTPError</code> 其实是 <code>URLError</code> 的子类。<code>except</code> 是按顺序匹配的，
如果把 <code>URLError</code> 写在前面，它就先把 <code>HTTPError</code> 截走了，
你永远进不了后面那个分支。所以<strong>具体的写前面，宽泛的写后面</strong>。</div></div>
<h3>这跟之前有什么不一样</h3>
<ul>
<li><code>HTTPError</code>：<strong>连上了</strong>，服务器也回话了，只是回的是「没有这个页面」。
这时 <code>e.code</code> 是状态码。</li>
<li><code>URLError</code>：<strong>根本没连上</strong>（域名解析不了、拒绝了、超时了）。
这时没有状态码，用 <code>e.reason</code> 看原因。</li>
</ul>
<p>分不清这两件事，排查问题时就会一直找错方向。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>顺带一提：一个能跑的爬虫，
抓每个页面都应该单独 try 一次。一页失败不该让整轮抓取全部作废。</div></div>
`,
      starter: `import urllib.request
import urllib.error

# 试着访问 SITE + "/nope.html"（这个页面不存在）
# 用 try/except 接住错误：
#   - 页面不存在 -> 把状态码存进 code，把 "页面不存在" 存进 kind
#   - 连不上     -> 把 0 存进 code，把 "连不上" 存进 kind
# 最后打印 code 和 kind

code = None
kind = ""
`,
      check: { type: 'tests', code: `assert code == 404, f"code 应该是 404，实际 {code!r}"
assert kind == "页面不存在", f"kind 应该是「页面不存在」，实际 {kind!r}"` },
      hint: '两个分支：<code>except urllib.error.HTTPError as e:</code> 里写 <code>code = e.code; kind = "页面不存在"</code>；<code>except urllib.error.URLError as e:</code> 里写 <code>code = 0; kind = "连不上"</code>。注意 HTTPError 一定要写在前面。',
      solution: `import urllib.request
import urllib.error

code = None
kind = ""

try:
    resp = urllib.request.urlopen(SITE + "/nope.html", timeout=5)
except urllib.error.HTTPError as e:
    code = e.code
    kind = "页面不存在"
except urllib.error.URLError as e:
    code = 0
    kind = "连不上"

print(code, kind)`
    },

    {
      id: 'a5-5', title: '翻页：把整站抓下来', xp: 70,
      goal: '顺着「下一页」链接循环抓取，把多页数据收集到一起。',
      body: `
<h3>一页装不下所有东西</h3>
<p>真实网站的列表都是分页的。要拿全数据，得能自己找到「下一页」在哪儿。</p>
<p>先看一眼分页区长什么样：</p>
<pre><code>&lt;a class="pager-next" href="/news-2.html"&gt;下一页 →&lt;/a&gt;</code></pre>
<p>注意 <code>href</code> 里是 <code>/news-2.html</code>，一个<strong>相对路径</strong>。
真正的地址要拼上站点前缀：<code>SITE + "/news-2.html"</code>。</p>
<h3>真实爬虫的走法：让页面自己带路</h3>
<p>不要在主程序里写死「一共两页」。更好的做法是：抓完当前页，从里面找「下一页」的链接；
找到了就继续，找不到就停。这样网站加到五页，你的代码不用改。</p>
<pre><code>next_link = re.search(r'class="pager-next" href="([^"]+)"', html)
if next_link:
    url = SITE + next_link.group(1)</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>务必写好终止条件！
如果「下一页」永远指向自己（或者你拼错了地址），<code>while</code> 会一直转下去。
一个稳妥的习惯是再加一个「最多抓 N 页」的上限兜底。</div></div>
<div class="tip tip-fun"><span class="tip-ico">🧠</span><div>这个「顺着链接一路走下去」的模式，
就是搜索引擎爬虫的基本工作原理。区别只是它从几万亿个链接里挑，而你现在只有两页。</div></div>
`,
      starter: `import urllib.request
import re

def titles_of(url):
    """抓一个列表页，返回这一页的所有标题。"""
    html = urllib.request.urlopen(url, timeout=5).read().decode("utf-8")
    return re.findall(r'class="news-title"[^>]*>([^<]+)<', html)

all_titles = []
url = SITE + "/news.html"

# 一页一页往下抓：
#   1) 抓当前页，把标题追加进 all_titles
#   2) 在这一页里找 "pager-next" 的 href
#   3) 找到就拼出下一页地址继续；找不到就停

print(all_titles)
`,
      check: { type: 'tests', code: `assert isinstance(all_titles, list), "all_titles 应该是列表"
assert len(all_titles) == 5, f"两页一共 5 条新闻，实际抓到 {len(all_titles)} 条：{all_titles!r}"
assert all_titles[0].startswith("Python 3.14"), "第一条不对"
assert "类型注解到底值不值得写" in all_titles, "第二页的内容没抓到"
assert len(set(all_titles)) == 5, "有重复的标题，说明某一页被抓了两次（终止条件有问题）"` },
      hint: '用 <code>while url:</code> 循环。每轮抓完当前页后，用 <code>re.search(r\'class="pager-next" href="([^"]+)"\', html)</code> 找下一页；找到就把 <code>url</code> 拼成新地址，找不到就 <code>url = None</code> 让循环自然结束。',
      solution: `import urllib.request
import re

def titles_of(url):
    """抓一个列表页，返回这一页的所有标题。"""
    html = urllib.request.urlopen(url, timeout=5).read().decode("utf-8")
    return re.findall(r'class="news-title"[^>]*>([^<]+)<', html)

all_titles = []
url = SITE + "/news.html"
pages = 0

while url:
    html = urllib.request.urlopen(url, timeout=5).read().decode("utf-8")
    all_titles.extend(re.findall(r'class="news-title"[^>]*>([^<]+)<', html))

    pages += 1
    if pages >= 10:          # 兜底：最多 10 页
        break

    nxt = re.search(r'class="pager-next" href="([^"]+)"', html)
    url = SITE + nxt.group(1) if nxt else None

print(all_titles)`
    },

    {
      id: 'a5-6', title: '做个守规矩的爬虫', xp: 65,
      goal: '读懂 robots.txt，知道抓之前该先问哪些事。',
      body: `
<h3>先讲清楚一件事</h3>
<p>前面五关你抓的都是本地练习站，怎么抓都没事。但<strong>真实网站是别人的服务器</strong>，
你每发一个请求都在花别人的带宽和电。</p>
<p>所以在你把爬虫指向任何真实网站之前，有三件事必须先做对。</p>
<h3>第一件：先读 robots.txt</h3>
<p>按约定，网站会在根目录放一个 <code>/robots.txt</code>，
写明「哪些路径不希望被自动抓取」。它长这样：</p>
<pre><code>User-agent: *
Allow: /news.html
Disallow: /about.html
Disallow: /admin/
Crawl-delay: 1</code></pre>
<p>练习靶场里也有一份，你可以真的抓下来读：</p>
<pre><code>robots = urllib.request.urlopen(SITE + "/robots.txt", timeout=5).read().decode("utf-8")</code></pre>
<p>逐行读，<code>Disallow:</code> 后面是被禁止的路径，<code>Crawl-delay:</code> 后面是建议的抓取间隔（秒）。</p>
<h3>第二件：控制速度</h3>
<p>就算 robots.txt 没写 Crawl-delay，也别连着猛发请求。一秒钟几十个请求跟攻击没区别，
轻则被封 IP，重则给人家服务器造成故障。抓到一半加个小停顿是最基本的礼貌：</p>
<pre><code>import time
time.sleep(1)      # 每抓一页歇一秒</code></pre>
<h3>第三件：想清楚边界</h3>
<ul>
<li><strong>公开数据</strong>（新闻、天气、公开榜单）一般没问题。</li>
<li><strong>需要登录才能看的内容</strong>、<strong>别人的个人隐私</strong>、<strong>付费内容</strong>，不要去抓。</li>
<li>抓之前先看网站的<strong>服务条款</strong>和 <code>robots.txt</code>。
很多网站还提供官方 API —— 有 API 就用 API，那才是给程序用的正规入口。</li>
<li>抓到的数据别原样转手发布，注意版权。</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>「技术上做得到」和「可以这么做」是两回事。
绕过登录、破解验证码、高频请求把人家打挂，这些在很多地方是违法的。
写爬虫的人自己心里要有这根线。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这一关的练习就是：真的抓一份 robots.txt，
把它里面「不让抓的路径」和「建议的间隔」解析出来 —— 这是每个爬虫开跑前都该做的第一件事。</div></div>
`,
      starter: `import urllib.request
import re

# 1) 抓 SITE + "/robots.txt"，解码成字符串
# 2) 把所有 "Disallow:" 后面的路径收进 disallowed 列表
# 3) 把 "Crawl-delay:" 后面的数字收进 delay（浮点数）

disallowed = []
delay = 0

print(disallowed, delay)
`,
      check: { type: 'tests', code: `assert isinstance(disallowed, list), "disallowed 应该是列表"
assert len(disallowed) == 2, f"robots.txt 里有 2 条 Disallow，实际收到 {len(disallowed)} 条：{disallowed!r}"
assert "/about.html" in disallowed and "/admin/" in disallowed, f"内容不对：{disallowed!r}"
assert abs(delay - 1.0) < 1e-6, f"Crawl-delay 应该是 1，实际 {delay!r}"` },
      hint: '用 <code>robots.splitlines()</code> 逐行看。行首是 <code>"Disallow:"</code> 就 <code>disallowed.append(line.split(":", 1)[1].strip())</code>；行首是 <code>"Crawl-delay:"</code> 就把后面的数字 <code>float()</code> 出来。注意先 <code>line.strip()</code> 再判断，因为行首可能有空格。',
      solution: `import urllib.request

robots = urllib.request.urlopen(SITE + "/robots.txt", timeout=5).read().decode("utf-8")

disallowed = []
delay = 0

for line in robots.splitlines():
    line = line.strip()
    if line.startswith("Disallow:"):
        disallowed.append(line.split(":", 1)[1].strip())
    elif line.startswith("Crawl-delay:"):
        delay = float(line.split(":", 1)[1].strip())

print(disallowed, delay)`
    }
  ]
    }
  ],
  projects: [
    {
      id: 't-crawl-1', emoji: '🕷', name: '新闻站全站抓取', sub: '请求 · 解析 · 翻页 · 存成 CSV', color: '#e8f0ff', diff: 2, tag: '爬虫实战',
      desc: '把练习靶场的新闻站整个抓下来，整理成一份能直接用的数据表。',
      intro: `
<p>前面六关分别练了「抓一页」「提取标题」「处理错误」「翻页」。
这个项目把它们串成一件事：<strong>把整个站抓完，输出成 CSV</strong>。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>在真实工作里，
爬虫的产出几乎总是「一张表」—— 因为它要交给后面的统计或分析环节。
所以「抓完能存成 CSV」才是这件事的终点，而不是「打印出来看一眼」。</div></div>`,
      steps: [
        '写一个 <code>fetch(url)</code>：发请求、解码，出错就返回 <code>None</code>（别让一页失败作废整轮）。',
        '写一个 <code>parse_list(html)</code>：从列表页提取出 <code>(标题, 日期, 链接)</code> 三元组。',
        '从 <code>SITE + "/news.html"</code> 开始，顺着 <code>pager-next</code> 一页页抓，把结果累加。',
        '对每条新闻，再抓一次详情页，把正文长度也记下来。',
        '用 <code>csv</code> 模块把 <code>标题, 日期, 链接, 正文长度</code> 写进 <code>news.csv</code>。'
      ],
      starter: `import urllib.request
import re
import csv

BASE = SITE + "/news.html"

def fetch(url):
    """抓一个页面，返回解码后的字符串；失败返回 None。"""
    pass

def parse_list(html):
    """从列表页返回 [(标题, 日期, 链接), ...]"""
    pass

rows = []
# 1) 从 BASE 开始逐页抓取，收集 (标题, 日期, 链接)
# 2) 对每条再抓详情页，量出正文字数
# 3) 写进 news.csv：标题, 日期, 链接, 正文字数

`,
      check: { type: 'tests', code: `import csv, os

assert os.path.exists("news.csv"), "没有生成 news.csv"
rows = list(csv.reader(open("news.csv", encoding="utf-8")))
assert len(rows) >= 6, f"CSV 里应该有表头 + 5 条数据，实际只有 {len(rows)} 行"
head = rows[0]
assert any("标题" in c for c in head), f"第一行应该是表头，实际是 {head!r}"
body = rows[1:]
assert len(body) == 5, f"两页一共 5 条新闻，实际写了 {len(body)} 条"
titles = " ".join(r[0] for r in body)
assert "Python 3.14" in titles, "第一条新闻没抓到"
assert "类型注解" in titles, "第二页的新闻没抓到"
lengths = [r[-1] for r in body]
assert all(str(n).isdigit() and int(n) > 20 for n in lengths), f"最后一列应该是正文长度，实际 {lengths!r}"` },
      hint: '<code>fetch</code> 里用 <code>try/except urllib.error.URLError</code> 包住；<code>parse_list</code> 用 <code>re.findall</code> 一次抠出标题和日期（可以用 <code>zip</code> 配对）；翻页还是找 <code>pager-next</code> 的 <code>href</code>；正文长度用 <code>len(re.sub(r"&lt;[^&gt;]+&gt;", "", body_html))</code> 粗算即可。',
      solution: `import urllib.request
import urllib.error
import re
import csv

BASE = SITE + "/news.html"

def fetch(url):
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.URLError:
        return None

def parse_list(html):
    titles = re.findall(r'class="news-title" href="([^"]+)"[^>]*>([^<]+)<', html)
    dates = re.findall(r'class="news-date">([^<]+)<', html)
    out = []
    for (href, title), date in zip(titles, dates):
        out.append((title.strip(), date.strip(), href.strip()))
    return out

rows = []
url = BASE
pages = 0

while url and pages < 10:
    html = fetch(url)
    if html is None:
        break
    for title, date, href in parse_list(html):
        detail = fetch(SITE + href)
        text = re.sub(r"<[^>]+>", "", detail or "")
        rows.append((title, date, href, len(text.strip())))

    pages += 1
    nxt = re.search(r'class="pager-next" href="([^"]+)"', html)
    url = SITE + nxt.group(1) if nxt else None

with open("news.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["标题", "日期", "链接", "正文字数"])
    for r in rows:
        w.writerow(r)

print(len(rows), "条已写入 news.csv")`
    }
  ]
},

/* ==================== 2. 数据分析与可视化 ==================== */
{
  id: 'data', icon: '📊', name: '数据分析与可视化',
  tag: '零依赖',
  desc: '把一堆数字变成能看懂的结论',
  intro: `
<p>数据分析的核心不是工具，是<strong>提问</strong>：这批数据里什么在变？变多少？有没有例外？</p>
<p>这个方向先用标准库（<code>csv</code> + <code>statistics</code>）把基本功练扎实 ——
怎么读数据、怎么算统计量、怎么把结果画成人能看懂的样子。
理解了这些，再上手 pandas 就只是换套更顺手的语法。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>你会手写一个「文字柱状图」。
在终端里画图听起来土，但它逼你想清楚<strong>每个数字该占多宽</strong>——
这件事想明白了，用 matplotlib 才不会是照着抄。</div></div>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'td1', icon: '📥', title: '读数据与算统计', subtitle: 'csv / 字典列表 / 平均数与中位数',
      lessons: [
        {
          id: 'td1-1', title: '把 CSV 读成字典列表', xp: 55,
          goal: '用 csv.DictReader 把表格读成「一行一个字典」，这是数据分析的通用入口。',
          body: `
<h3>为什么是「字典列表」</h3>
<p>数据分析里最常见的数据形状，就是<strong>一个列表，里面每个元素是一行数据，行内用字段名取值</strong>。
它读起来跟表格几乎一样，用起来又比二维列表清楚得多：</p>
<pre><code>rows = list(csv.DictReader(f))
rows[0]["城市"]      # 直接按列名取，不用记第几列</code></pre>
<p>关键在 <code>DictReader</code>：它会自动把第一行当表头，之后每行给你一个字典。</p>
<h3>一个小陷阱</h3>
<p><code>DictReader</code> 给你的值是<strong>字符串</strong>，哪怕那一列看起来全是数字。
要参与计算必须自己转：<code>int(row["销量"])</code>。忘了转，
你会得到 "12" + "3" = "123" 这种结果，而且不报错。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>还有两种情况要防：空字符串（<code>""</code>）和带千分位的数字（<code>"1,234"</code>）。
转之前先 <code>strip()</code>，遇到千分位先 <code>replace(",", "")</code>。</div></div>
`,
          starter: `import csv, io

DATA = """城市,月份,销量
北京,1月,120
上海,1月,98
北京,2月,135
上海,2月,110
广州,1月,76
"""

# 1) 用 csv.DictReader 读 DATA，转成列表存进 rows
# 2) 把每行的 "销量" 转成整数（记得先 strip）
# 3) 打印总销量

rows = []
`,
          check: { type: 'tests', code: `assert isinstance(rows, list) and len(rows) == 5, f"应该有 5 行，实际 {len(rows) if isinstance(rows, list) else type(rows)}"
assert isinstance(rows[0], dict), "每一行应该是字典（用 DictReader）"
assert set(rows[0].keys()) == {"城市", "月份", "销量"}, f"字段名不对：{rows[0].keys()!r}"
assert all(isinstance(r["销量"], int) for r in rows), "销量应该是整数，检查一下有没有转换"
assert sum(r["销量"] for r in rows) == 539, f"总销量应该是 539，实际 {sum(r['销量'] for r in rows)}"` },
          hint: '<code>reader = csv.DictReader(io.StringIO(DATA))</code>，然后 <code>for r in reader: r["销量"] = int(r["销量"].strip()); rows.append(r)</code>。',
          solution: `import csv, io

DATA = """城市,月份,销量
北京,1月,120
上海,1月,98
北京,2月,135
上海,2月,110
广州,1月,76
"""

rows = []
for r in csv.DictReader(io.StringIO(DATA)):
    r["销量"] = int(r["销量"].strip())
    rows.append(r)

print(sum(r["销量"] for r in rows))`
        },
        {
          id: 'td1-2', title: '平均数会骗人', xp: 60,
          goal: '分清平均数和中位数，知道什么时候该用哪个。',
          body: `
<h3>同样一组数，两个答案</h3>
<pre><code>data = [3, 4, 4, 5, 4, 100]

statistics.mean(data)     # 20.0   —— 平均数
statistics.median(data)   # 4      —— 中位数</code></pre>
<p>哪个对？都"对"，但<strong>中位数才反映真实情况</strong>。那个 100 把平均数整个抬走了，
而实际上大部分人都在 4 附近。</p>
<h3>什么时候用哪个</h3>
<ul>
<li><strong>平均数</strong>适合数据比较均匀、没有极端值的时候（比如全班身高的平均值）。</li>
<li><strong>中位数</strong>适合有极端值的时候。<strong>房价、收入</strong>这类数据永远看中位数 ——
少数几个天价房源能把平均数拉得毫无意义。</li>
<li>两个一起看，差得越远，说明数据里的极端值影响越大 —— 这本身就是一条重要结论。</li>
</ul>
<h3>标准库就够用</h3>
<pre><code>import statistics

statistics.mean(x)      # 平均
statistics.median(x)    # 中位数
statistics.pstdev(x)    # 总体标准差：数值越分散，它越大
min(x), max(x)</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>标准差看着抽象，你可以这样理解：
它回答「平均而言，每个数离平均数有多远」。所有数都一样时标准差是 0。</div></div>
`,
          starter: `import statistics

scores = [88, 92, 79, 95, 85, 90, 100000]

# 1) 分别算出平均数和中间数，存进 avg 和 mid
# 2) 算出标准差存进 sd
# 3) 打印这三个值

avg = 0
mid = 0
sd = 0
`,
          check: { type: 'tests', code: `assert abs(avg - statistics.mean(scores)) < 1e-6, f"平均数不对：{avg}"
assert mid == 90, f"中位数应该是 90，实际 {mid}"
assert abs(sd - statistics.pstdev(scores)) < 1e-6, f"标准差不对：{sd}"
assert avg > 1000, "平均数应该被那个 100000 拉得很大（这正是要点）"
assert mid < avg, "中位数应该远小于平均数"` },
          hint: '三个函数一一对应：<code>statistics.mean(scores)</code>、<code>statistics.median(scores)</code>、<code>statistics.pstdev(scores)</code>。中位数记得先把列表排序（<code>median</code> 自己会排）。',
          solution: `import statistics

scores = [88, 92, 79, 95, 85, 90, 100000]

avg = statistics.mean(scores)
mid = statistics.median(scores)
sd = statistics.pstdev(scores)

print(avg, mid, sd)`
        }
      ]
    },
    {
      id: 'td2', icon: '📊', title: '让数据看得见', subtitle: '分组统计 / 文字图表 / 排序',
      lessons: [
        {
          id: 'td2-1', title: '按维度分组汇总', xp: 60,
          goal: '用字典把「一堆明细」压成「几个分组」，这是分析最常见的动作。',
          body: `
<h3>分组：分析的第一个动作</h3>
<p>明细数据往往没用，你要的是<strong>按某个维度合起来看</strong>：每个城市总共卖了多少、每个月平均多少。</p>
<pre><code>total = {}
for r in rows:
    total[r["城市"]] = total.get(r["城市"], 0) + r["销量"]</code></pre>
<p><code>total.get(key, 0)</code> 是这里的关键：第一次遇到某个城市时它给你 0，
这样就不用先判断「这个键存在吗」。这个写法在进阶篇的 <code>Counter</code> 那关见过，
这里手写一遍是为了记住它到底在干什么。</p>
<h3>按时间分组要小心</h3>
<p>如果分组键是「1月」「2月」这种字符串，排序会按字典序：
"10月" 会排在 "2月" 前面。要么<strong>给月份补零</strong>（"01月"），
要么分完组再自己按想要的顺序排。</p>
<div class="tip tip-fun"><span class="tip-ico">🧠</span><div>换个角度想：「分组」就是<strong>把一个多的东西变成少的</strong>。
明细行数是「宽」，分组行数是「深」。分析报告基本都是深的 —— 因为人要的是结论，不是清单。</div></div>
`,
          starter: `rows = [
    {"城市": "北京", "销量": 120},
    {"城市": "上海", "销量": 98},
    {"城市": "北京", "销量": 135},
    {"城市": "上海", "销量": 110},
    {"城市": "广州", "销量": 76},
]

# 1) 按城市把销量加总，存进 total（一个字典）
# 2) 按销量从高到低排序，存进 ranked（列表，元素是 (城市, 总销量)）
# 3) 打印 ranked

total = {}
ranked = []
`,
          check: { type: 'tests', code: `assert isinstance(total, dict), "total 应该是字典"
assert total == {"北京": 255, "上海": 208, "广州": 76}, f"分组结果不对：{total!r}"
assert isinstance(ranked, list) and len(ranked) == 3, "ranked 应该是 3 个元素"
assert ranked[0][0] == "北京", f"排第一的应该是北京，实际 {ranked[0]!r}"
assert [n for _, n in ranked] == [255, 208, 76], f"排序不对：{ranked!r}"` },
          hint: '累加用 <code>total[c] = total.get(c, 0) + n</code>。排序用 <code>sorted(total.items(), key=lambda kv: kv[1], reverse=True)</code>。',
          solution: `rows = [
    {"城市": "北京", "销量": 120},
    {"城市": "上海", "销量": 98},
    {"城市": "北京", "销量": 135},
    {"城市": "上海", "销量": 110},
    {"城市": "广州", "销量": 76},
]

total = {}
for r in rows:
    c = r["城市"]
    total[c] = total.get(c, 0) + r["销量"]

ranked = sorted(total.items(), key=lambda kv: kv[1], reverse=True)

for name, n in ranked:
    print(name, n)`
        },
        {
          id: 'td2-2', title: '在终端里画柱状图', xp: 65,
          goal: '把数字映射成宽度，手绘一张能一眼看出差距的图。',
          body: `
<h3>图表的本质是「映射」</h3>
<p>一张柱状图做的事只有一件：<strong>把数值按比例映射成长度</strong>。</p>
<p>假设最大值是 255，你想让最长的柱子占 30 个字符，那每个单位就是
<code>30 / 255</code> 个字符。剩下的都是细节。</p>
<pre><code>scale = 30 / max_value
bar = "█" * round(value * scale)
print(f"{name:&lt;6}{bar} {value}")</code></pre>
<h3>三个让图变好看的小细节</h3>
<ul>
<li><code>round()</code> 之后至少留 1 个字符：否则很小的值会变成空柱子，看着像没数据。</li>
<li><code>f"{name:&lt;6}"</code> 让名字左对齐占 6 格，这样所有柱子起点对齐。</li>
<li>数值本身也打出来 —— 图给感觉，数字给精度，两者都要。</li>
</ul>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这套「映射」的思路和 matplotlib 完全一样，
只是它帮你做了坐标轴、刻度、颜色。<strong>先会算，再会调库</strong>，
遇到图表不对劲时你才知道该改哪儿。</div></div>
`,
          starter: `data = [("北京", 255), ("上海", 208), ("广州", 76), ("深圳", 190)]
WIDTH = 24

# 1) 找出最大值
# 2) 按比例把每个值映射成 WIDTH 以内的长度，用 "█" 拼成柱子
# 3) 打印成 "城市  柱形图 数值"，名字左对齐占 6 格

`,
          check: { type: 'tests', code: `assert isinstance(scale_ok, bool) and scale_ok, "柱子宽度比例不对"
assert chart.count("█") >= 40, f"图上柱子太少，检查一下映射：{chart!r}"
lines = [l for l in chart.splitlines() if l.strip()]
assert len(lines) == 4, f"应该有 4 行，实际 {len(lines)}"
assert "北京" in chart and "255" in chart, "每行都要有名字和数值"
assert lines[0].index("█") == lines[1].index("█"), "柱子起点没对齐，用 f-string 的左对齐"` },
          hint: '<code>mx = max(v for _, v in data)</code>；每行 <code>n = max(1, round(v * WIDTH / mx))</code>，然后 <code>print(f"{name:&lt;6}" + "█" * n + f" {v}")</code>。',
          solution: `data = [("北京", 255), ("上海", 208), ("广州", 76), ("深圳", 190)]
WIDTH = 24

mx = max(v for _, v in data)

chart = ""
for name, v in data:
    n = max(1, round(v * WIDTH / mx))
    line = f"{name:<6}" + "█" * n + f" {v}"
    chart += line + chr(10)

scale_ok = True
print(chart)`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-data-1', emoji: '📈', name: '销售数据清洗与可视化', sub: '清洗 · 汇总 · 中位数 · 图表', color: '#e3f8ef', diff: 2, tag: '数据实战',
      desc: '把一份脏销售数据洗干净，算出结论，并打印一张能直接贴进报告的图表。',
      intro: `
<p>真实数据很少是干净的。这一关给你的数据里塞了三种常见毛病：
带千分位的数字、空白的缺失值、以及前后带空格的字段名。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>数据分析有一条铁律：
<strong>清洗和计算分成两步做，每步都打印一下结果</strong>。
一锅里搅完，出了问题你根本不知道是读错了还是算错了。</div></div>`,
      steps: [
        '读 CSV，把每行的「销量」转成整数；空字符串当作 <code>None</code>（缺失）跳过，不要当成 0 —— 两者含义完全不同。',
        '按城市汇总总销量，顺便数一下每个城市有几条有效数据。',
        '按总销量从高到低排序。',
        '算出所有有效销量的中位数。',
        '打印图表：每个城市一行，柱子按比例，行尾跟上总销量。'
      ],
      starter: `import csv, io, statistics

DATA = """城市, 销量
北京,"1,200"
上海,980
北京,
广州,760
上海,"1,100"
北京,"1,050"
广州,820
"""

# 注意：字段名里有空格，取值前记得 strip

# 1) 读数据、清洗，得到 [{城市, 销量}]，缺数据的行丢掉
# 2) 汇总 total 与条数
# 3) 排序得到 ranked
# 4) 算出中位数 mid
# 5) 打印图表

total = {}
ranked = []
mid = 0
`,
      check: { type: 'tests', code: `assert total == {"北京": 2250, "上海": 2080, "广州": 1580}, f"汇总不对：{total!r}"
assert len(ranked) == 3 and ranked[0][0] == "北京", f"排序不对：{ranked!r}"
assert abs(mid - 1015) < 1e-6, f"中位数应该是 1015（980 和 1050 的平均），实际 {mid}"
assert chart.count("█") >= 30, "图表柱子太少"
assert "2250" in chart and "2080" in chart and "1580" in chart, "图表里要带数值"
assert chart.count(chr(10)) >= 3, "图表应该有 3 行"` },
      hint: '读的时候用 <code>DictReader</code>，字段名先 <code>strip()</code>：<code>{k.strip(): (v or "").strip() for k, v in row.items()}</code>。数字先去掉逗号再转 <code>int</code>，空字符串直接 <code>continue</code>。中位数用 <code>statistics.median</code> 对「所有有效销量」算 —— 注意是逐条明细，不是汇总值。',
      solution: `import csv, io, statistics

DATA = """城市, 销量
北京,"1,200"
上海,980
北京,
广州,760
上海,"1,100"
北京,"1,050"
广州,820
"""

clean = []
for row in csv.DictReader(io.StringIO(DATA)):
    row = {k.strip(): (v or "").strip() for k, v in row.items()}
    raw = row["销量"].replace(",", "")
    if raw == "":
        continue
    clean.append({"城市": row["城市"], "销量": int(raw)})

total = {}
for r in clean:
    c = r["城市"]
    total[c] = total.get(c, 0) + r["销量"]

ranked = sorted(total.items(), key=lambda kv: kv[1], reverse=True)
mid = statistics.median(r["销量"] for r in clean)

mx = max(n for _, n in ranked)
WIDTH = 20
chart = ""
for name, n in ranked:
    chart += f"{name:<6}" + "█" * max(1, round(n * WIDTH / mx)) + f" {n}" + chr(10)

print(chart)
print("中位数", mid)`
    }
  ]
},

/* ==================== 3. 数据库操作 ==================== */
{
  id: 'db', icon: '🗄️', name: '数据库操作',
  tag: '零依赖',
  desc: '让数据活过重启，还能一边存一边查',
  intro: `
<p>列表和字典只活在程序运行期间，关掉就没了。想让数据<strong>留下来</strong>、
而且能<strong>快速查</strong>，就需要数据库。</p>
<p>这个方向用 Python 标准库自带的 <code>sqlite3</code>。它不需要安装任何东西、
不用起服务，一个文件就是一个完整的数据库 —— 特别适合本地程序和小型项目。
学会它，以后换 MySQL / PostgreSQL，命令和思路几乎一样。</p>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'tdb1', icon: '🗃️', title: '用 SQL 存取数据', subtitle: 'sqlite3 / 建表 / 增删改查',
      lessons: [
        {
          id: 'tdb1-1', title: '建一张表，塞点数据进去', xp: 60,
          goal: '用 sqlite3 建表、插入、查询，理解「连接—游标—提交」这套流程。',
          body: `
<h3>四步走</h3>
<pre><code>import sqlite3

conn = sqlite3.connect("shop.db")     # 1. 连上数据库（文件不存在会自动建）
cur = conn.cursor()                   # 2. 拿一个游标，SQL 都从它发出去

cur.execute("CREATE TABLE IF NOT EXISTS goods (name TEXT, price INTEGER)")
cur.execute("INSERT INTO goods VALUES (?, ?)", ("键盘", 299))

conn.commit()                         # 3. 提交！不提交的话改动不会真正落盘
conn.close()                          # 4. 用完关掉</code></pre>
<h3>那个问号是干什么的</h3>
<p><code>VALUES (?, ?)</code> 里的 <code>?</code> 是<strong>占位符</strong>，
真正的值通过第二个参数传进去。别用字符串拼 SQL（<code>"... VALUES ('" + name + "')"</code>）——
那样遇到名字里带单引号就会出错，更严重的是会被 SQL 注入攻击。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>记住这三件事就不会乱：
<strong>改了数据要 commit</strong>；<strong>值用 <code>?</code> 传不要拼字符串</strong>；
<strong>用完 close</strong>。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>CREATE TABLE IF NOT EXISTS</code> 里的
<code>IF NOT EXISTS</code> 很重要：程序每次启动都会执行一次建表语句，
没有它第二次就报「表已存在」了。</div></div>
`,
          starter: `import sqlite3

conn = sqlite3.connect(":memory:")     # 内存数据库，练习用
cur = conn.cursor()

# 1) 建表 goods：name 是文本，price 是整数（用 IF NOT EXISTS）
# 2) 插入三件商品：键盘 299、鼠标 89、显示器 1099
# 3) 提交
# 4) 查一下一共有几件商品，打印出来

count = 0
`,
          check: { type: 'tests', code: `assert 'cur' in dir(), "没有看到 cur"
assert count == 3, f"应该有 3 件商品，实际 {count}"
rows = cur.execute("SELECT name, price FROM goods ORDER BY price").fetchall()
assert len(rows) == 3, f"表里应该有 3 行，实际 {len(rows)}"
assert rows[0] == ("鼠标", 89), f"最便宜的不对：{rows[0]!r}"
assert rows[2] == ("显示器", 1099), f"最贵的不对：{rows[2]!r}"` },
          hint: '建表：<code>cur.execute("CREATE TABLE IF NOT EXISTS goods (name TEXT, price INTEGER)")</code>。插入三行后别忘 <code>conn.commit()</code>。计数：<code>cur.execute("SELECT COUNT(*) FROM goods")</code> 然后 <code>fetchone()[0]</code>。',
          solution: `import sqlite3

conn = sqlite3.connect(":memory:")
cur = conn.cursor()

cur.execute("CREATE TABLE IF NOT EXISTS goods (name TEXT, price INTEGER)")

cur.execute("INSERT INTO goods VALUES (?, ?)", ("键盘", 299))
cur.execute("INSERT INTO goods VALUES (?, ?)", ("鼠标", 89))
cur.execute("INSERT INTO goods VALUES (?, ?)", ("显示器", 1099))

conn.commit()

count = cur.execute("SELECT COUNT(*) FROM goods").fetchone()[0]
print(count)`
        },
        {
          id: 'tdb1-2', title: '按条件查：WHERE 与聚合', xp: 65,
          goal: '把「筛选」和「统计」交给数据库做，而不是全读出来自己在 Python 里算。',
          body: `
<h3>让数据库干活</h3>
<p>新手常犯的错：把整张表读进 Python，再用 for 循环筛。数据一多就慢得离谱，
而且白白浪费了数据库最擅长的东西。</p>
<pre><code># 不推荐：全读出来自己筛
rows = cur.execute("SELECT * FROM goods").fetchall()
cheap = [r for r in rows if r[1] &lt; 300]

# 推荐：让数据库筛
cheap = cur.execute("SELECT name, price FROM goods WHERE price &lt; ?", (300,)).fetchall()</code></pre>
<h3>几条最常用的 SQL</h3>
<ul>
<li><code>WHERE 条件</code> —— 筛选。<code>AND</code> / <code>OR</code> 可以组合，
<code>LIKE '%键%'</code> 做模糊匹配。</li>
<li><code>ORDER BY 字段 DESC</code> —— 排序，<code>DESC</code> 是倒序。</li>
<li><code>LIMIT 3</code> —— 只要前几条。</li>
<li><code>COUNT(*)</code> / <code>SUM(字段)</code> / <code>AVG(字段)</code> —— 聚合，
它们<strong>返回的是结果本身，不是行</strong>。</li>
<li><code>GROUP BY 字段</code> —— 分组统计，配合聚合函数用。</li>
</ul>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>聚合函数的返回值在结果的第一行，
所以用 <code>fetchone()[0]</code> 取。这点和普通查询用 <code>fetchall()</code> 不太一样，容易记混。</div></div>
`,
          starter: `import sqlite3

conn = sqlite3.connect(":memory:")
cur = conn.cursor()
cur.execute("CREATE TABLE goods (name TEXT, price INTEGER, cat TEXT)")
data = [("键盘", 299, "外设"), ("鼠标", 89, "外设"), ("显示器", 1099, "屏幕"),
        ("音箱", 199, "音频"), ("摄像头", 259, "外设"), ("耳机", 449, "音频")]
cur.executemany("INSERT INTO goods VALUES (?, ?, ?)", data)
conn.commit()

# 1) 查出所有「外设」类、价格低于 300 的商品名，按价格升序，存进 cheap
# 2) 查出最贵的那件商品的 name，存进 priciest
# 3) 算出商品总价，存进 total_price

cheap = []
priciest = ""
total_price = 0
`,
          check: { type: 'tests', code: `assert cheap == ["鼠标", "摄像头", "键盘"], f"cheap 应该是 ['鼠标', '摄像头', '键盘']（按价格升序），实际 {cheap!r}"
assert priciest == "显示器", f"最贵的应该是显示器，实际 {priciest!r}"
assert total_price == 2394, f"总价应该是 2394，实际 {total_price}"` },
          hint: '<code>WHERE cat = ? AND price &lt; ? ORDER BY price</code>，参数传 <code>("外设", 300)</code>。最贵：<code>ORDER BY price DESC LIMIT 1</code>。总价：<code>SELECT SUM(price)</code> 然后 <code>fetchone()[0]</code>。',
          solution: `import sqlite3

conn = sqlite3.connect(":memory:")
cur = conn.cursor()
cur.execute("CREATE TABLE goods (name TEXT, price INTEGER, cat TEXT)")
data = [("键盘", 299, "外设"), ("鼠标", 89, "外设"), ("显示器", 1099, "屏幕"),
        ("音箱", 199, "音频"), ("摄像头", 259, "外设"), ("耳机", 449, "音频")]
cur.executemany("INSERT INTO goods VALUES (?, ?, ?)", data)
conn.commit()

cheap = [r[0] for r in cur.execute(
    "SELECT name FROM goods WHERE cat = ? AND price < ? ORDER BY price",
    ("外设", 300)).fetchall()]

priciest = cur.execute("SELECT name FROM goods ORDER BY price DESC LIMIT 1").fetchone()[0]

total_price = cur.execute("SELECT SUM(price) FROM goods").fetchone()[0]

print(cheap, priciest, total_price)`
        },
        {
          id: 'tdb1-3', title: '两张表连起来查：JOIN', xp: 70,
          goal: '用 JOIN 把拆开的两张表拼回一起，理解「关系型」数据库里的「关系」到底是什么。',
          body: `
<h3>为什么要把数据拆成两张表</h3>
<p>假设要记录「谁买了什么」。如果把客户名和订单写在同一张表里，
同一个客户买了 10 次，他的名字就要重复存 10 遍 —— 改名字的时候漏改一行，
数据就自相矛盾了。</p>
<p>所以拆成两张：<code>users</code> 存人，<code>orders</code> 存订单，
订单里只记一个 <code>user_id</code> 指向人。这个 <code>user_id</code> 就叫
<strong>外键</strong>。查的时候再把它们连起来 —— 这就是「关系型数据库」里
「关系」两个字的由来。</p>

<h3>JOIN：按条件把两行拼成一行</h3>
<pre><code>SELECT u.name, SUM(o.amount) AS total
FROM users u JOIN orders o ON o.user_id = u.id
GROUP BY u.name</code></pre>
<ul>
<li><code>users u</code> / <code>orders o</code> 是给表起<strong>别名</strong>。
两边的表都有 <code>id</code> 这种字段，不起别名就得写成 <code>users.id</code> 全称，很啰嗦。</li>
<li><code>ON</code> 后面写「两张表的行怎么配对」。这一句写错，结果会变成笛卡尔积 ——
行数翻着倍地涨，而且看上去还挺像回事，很容易蒙混过去。</li>
<li><code>JOIN</code> 默认等价于 <code>INNER JOIN</code>：<strong>两边都有的行才出现</strong>。
所以「一单都没下过的客户」会被直接丢掉。</li>
</ul>

<h3>不想丢掉怎么办：LEFT JOIN</h3>
<p><code>LEFT JOIN</code> 的意思是「左边这张表<strong>一行都不能少</strong>」，
右边没有配对的就填 <code>NULL</code>。于是没下过单的客户就能被单独找出来：</p>
<pre><code>SELECT u.name FROM users u LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>这里必须写
<code>IS NULL</code>，<strong>不能写 <code>= NULL</code></strong>。
SQL 里 <code>NULL</code> 表示「不知道」，和它做任何比较结果都是「不知道」，
所以 <code>= NULL</code> 永远筛不出任何一行 —— 这是 SQL 最经典的坑之一。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>聚合出来的列记得起个别名
（<code>AS total</code>），不然它在结果里的名字会是一长串表达式，读起来很难受。</div></div>
`,
          starter: `import sqlite3

conn = sqlite3.connect(":memory:")
cur = conn.cursor()
cur.execute("CREATE TABLE users (id INTEGER, name TEXT)")
cur.execute("CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER)")
cur.executemany("INSERT INTO users VALUES (?, ?)",
                [(1, "小雨"), (2, "阿哲"), (3, "老王"), (4, "小美")])
cur.executemany("INSERT INTO orders VALUES (?, ?, ?)",
                [(1, 1, 120), (2, 1, 80), (3, 2, 300), (4, 1, 50), (5, 3, 90)])
conn.commit()

# 1) 每个客户的总消费，按总额从高到低 -> totals，元素是 (名字, 总额)
#    注意：一单都没下的客户不该出现在这里
# 2) 一单都没下的客户名（按 id 从小到大）-> no_orders
# 3) 所有订单的总金额 -> grand_total

totals = []
no_orders = []
grand_total = 0
`,
          check: { type: 'tests', code: `assert totals == [("阿哲", 300), ("小雨", 250), ("老王", 90)], \\
    f"totals 不对：{totals!r}（要按总额从高到低）"
assert no_orders == ["小美"], f"no_orders 应该是 ['小美']，实际 {no_orders!r}"
assert grand_total == 640, f"总金额应该是 640，实际 {grand_total}"` },
          hint: '先用 <code>JOIN ... ON o.user_id = u.id</code> 再 <code>GROUP BY u.name</code>，排序写 <code>ORDER BY total DESC</code>。找没下过单的用 <code>LEFT JOIN</code> + <code>WHERE o.id IS NULL</code>。总金额不用 JOIN，<code>orders</code> 一张表的 <code>SUM(amount)</code> 就够了。',
          solution: `import sqlite3

conn = sqlite3.connect(":memory:")
cur = conn.cursor()
cur.execute("CREATE TABLE users (id INTEGER, name TEXT)")
cur.execute("CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER)")
cur.executemany("INSERT INTO users VALUES (?, ?)",
                [(1, "小雨"), (2, "阿哲"), (3, "老王"), (4, "小美")])
cur.executemany("INSERT INTO orders VALUES (?, ?, ?)",
                [(1, 1, 120), (2, 1, 80), (3, 2, 300), (4, 1, 50), (5, 3, 90)])
conn.commit()

totals = cur.execute(
    "SELECT u.name, SUM(o.amount) AS total "
    "FROM users u JOIN orders o ON o.user_id = u.id "
    "GROUP BY u.name ORDER BY total DESC").fetchall()

no_orders = [r[0] for r in cur.execute(
    "SELECT u.name FROM users u LEFT JOIN orders o ON o.user_id = u.id "
    "WHERE o.id IS NULL ORDER BY u.id").fetchall()]

grand_total = cur.execute("SELECT SUM(amount) FROM orders").fetchone()[0]

print(totals, no_orders, grand_total)`
        },
        {
          id: 'tdb1-4', title: '改与删，以及「要么全成、要么全不成」', xp: 75,
          goal: '掌握 UPDATE / DELETE，并用事务保证「一组改动要么全成功、要么全撤销」。',
          body: `
<h3>UPDATE 与 DELETE：WHERE 是省不得的</h3>
<pre><code>UPDATE accounts SET balance = balance + 100 WHERE balance &lt; 500
DELETE FROM accounts WHERE balance &lt; 100</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>这不是危言耸听：
漏写 <code>WHERE</code> 的 <code>UPDATE</code> 会把整张表这一列改成同一个值，
漏写 <code>WHERE</code> 的 <code>DELETE</code> 会清空整张表。
真实生产事故里这两种都发生过。</div></div>
<p>改完顺手看一眼 <code>cur.rowcount</code> —— 它告诉你「刚刚影响了几行」。
如果本以为是 3 行、结果是 300 行，你会立刻发现不对。</p>

<h3>事务：一组改动要么全成，要么全不成</h3>
<p>转账要做两件事：从甲的余额扣 500、给乙的余额加 500。
如果扣完钱之后程序崩了，会怎样？<strong>钱凭空消失了。</strong></p>
<p>所以这两步必须绑在一起 —— 这就是<strong>事务</strong>：
中间任何一步失败，前面已经做的全部撤销，回到开始前的样子。
撤销这个动作叫 <code>rollback()</code>：</p>
<pre><code>try:
    transfer(cur, "甲", "乙", 500)
    conn.commit()        # 两步都成功，才真正落地
except Exception:
    conn.rollback()      # 出任何错，全部退回去</code></pre>
<p><code>commit</code> 和 <code>rollback</code> 是事务的两端：一个确认，一个取消。
sqlite3 里执行一条改数据的语句就会自动开启事务，所以「先 commit 或 rollback，
再去做别的事」是必须的 —— 悬着的事务会一直锁着数据库。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>判断有没有真写进去，靠
<code>commit</code>；判断有没有真的退回去，靠 <code>rollback</code>。
写「先扣钱再加钱」这类逻辑时，先想清楚失败时该怎么办，再动手写代码。</div></div>
`,
          starter: `import sqlite3

conn = sqlite3.connect(":memory:")
cur = conn.cursor()
cur.execute("CREATE TABLE accounts (name TEXT, balance INTEGER)")
cur.executemany("INSERT INTO accounts VALUES (?, ?)",
                [("甲", 1000), ("乙", 300), ("丙", 20), ("丁", 0)])
conn.commit()


def transfer(cur, src, dst, amount, fail=False):
    """从 src 转 amount 给 dst。fail=True 模拟「扣完钱之后系统出错了」。"""
    cur.execute("UPDATE accounts SET balance = balance - ? WHERE name = ?", (amount, src))
    if fail:
        raise RuntimeError("模拟：转账进行到一半，系统出错了")
    cur.execute("UPDATE accounts SET balance = balance + ? WHERE name = ?", (amount, dst))


# 1) 把余额低于 500 的账户各加 100，影响的行数存进 raised
raised = 0

# 2) 删掉余额低于 110 的账户，删掉的行数存进 deleted
deleted = 0

# 3) 跑一次会失败的转账：transfer(cur, "甲", "乙", 500, fail=True)
#    出错就回滚，并把 rollback_worked 设为 True
#    想一想：不回滚的话，甲少了 500 而乙没多，钱去哪了？
rollback_worked = False

# 4) 重新读一遍余额，存进 balances（字典：名字 -> 余额）
balances = {}
`,
          check: { type: 'tests', code: `assert raised == 3, f"第一步应该影响 3 行（乙、丙、丁），实际 {raised}"
assert deleted == 1, f"第二步应该删掉 1 行（丁，加完是 100），实际 {deleted}"
assert rollback_worked is True, "转账失败后必须回滚"
assert balances == {"甲": 1000, "乙": 400, "丙": 120}, \\
    f"余额不对：{balances!r}（甲没回滚回 1000 的话，那 500 就真的丢了）"
assert cur.execute("SELECT COUNT(*) FROM accounts").fetchone()[0] == 3, "账户数不对"` },
          hint: '<code>cur.rowcount</code> 在 <code>execute</code> 之后立刻取，拿到的是刚影响的行数。事务用 <code>try / except RuntimeError: conn.rollback()</code>，成功分支里 <code>conn.commit()</code>。读余额用 <code>dict(cur.execute("SELECT name, balance FROM accounts").fetchall())</code> 一次搞定。',
          solution: `import sqlite3

conn = sqlite3.connect(":memory:")
cur = conn.cursor()
cur.execute("CREATE TABLE accounts (name TEXT, balance INTEGER)")
cur.executemany("INSERT INTO accounts VALUES (?, ?)",
                [("甲", 1000), ("乙", 300), ("丙", 20), ("丁", 0)])
conn.commit()


def transfer(cur, src, dst, amount, fail=False):
    cur.execute("UPDATE accounts SET balance = balance - ? WHERE name = ?", (amount, src))
    if fail:
        raise RuntimeError("模拟：转账进行到一半，系统出错了")
    cur.execute("UPDATE accounts SET balance = balance + ? WHERE name = ?", (amount, dst))


cur.execute("UPDATE accounts SET balance = balance + 100 WHERE balance < 500")
raised = cur.rowcount
conn.commit()

cur.execute("DELETE FROM accounts WHERE balance < 110")
deleted = cur.rowcount
conn.commit()

try:
    transfer(cur, "甲", "乙", 500, fail=True)
except RuntimeError:
    conn.rollback()
    rollback_worked = True
else:
    conn.commit()

balances = dict(cur.execute("SELECT name, balance FROM accounts").fetchall())

print(raised, deleted, rollback_worked, balances)`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-db-1', emoji: '📒', name: '小账本', sub: 'sqlite3 · 落盘 · 分组汇总', color: '#fff6de', diff: 2, tag: '数据库实战',
      desc: '做一个真的存到文件里的小账本：能记一笔、能按月汇总、关掉再打开数据还在。',
      intro: `
<p>这个项目会用到 <code>book.db</code> 这个真实文件。
关键点是：<strong>写进去之后关掉连接，再重新打开，数据还在</strong>——
这才是数据库区别于列表的地方。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>判断有没有真写进去，
你的判题会把连接关掉再重开一次来查。所以别用 <code>:memory:</code>。</div></div>`,
      steps: [
        '连到 <code>book.db</code>，建表 <code>records(month TEXT, item TEXT, amount INTEGER)</code>。',
        '先清空表（<code>DELETE FROM records</code>），保证反复跑结果一致。',
        '用 <code>executemany</code> 一次写入下面那几条记录。',
        '提交，然后 <strong>关闭连接</strong>。',
        '重新打开连接，按月汇总支出（<code>GROUP BY month</code>），存进 <code>by_month</code>。',
        '找出花得最多的那个月，存进 <code>top_month</code>。'
      ],
      starter: `import sqlite3

RECORDS = [
    ("2026-07", "房租", 3000),
    ("2026-07", "吃饭", 1200),
    ("2026-08", "房租", 3000),
    ("2026-08", "吃饭", 1450),
    ("2026-08", "买书", 260),
    ("2026-09", "房租", 3000),
    ("2026-09", "吃饭", 980),
]

DB = "book.db"

# 1) 建表 + 清空 + 写入 + 提交 + 关闭
# 2) 重新打开，按月汇总 -> by_month（列表或字典都行）
# 3) 找出支出最多的月份 -> top_month

by_month = []
top_month = ""
`,
      check: { type: 'tests', code: `import os, sqlite3

assert os.path.exists("book.db"), "没有生成 book.db，是不是用了 :memory:？"
assert by_month, "by_month 是空的"
d = dict(by_month) if not isinstance(by_month, dict) else by_month
assert d.get("2026-07") == 4200, f"7 月应该是 4200，实际 {d.get('2026-07')}"
assert d.get("2026-08") == 4710, f"8 月应该是 4710，实际 {d.get('2026-08')}"
assert d.get("2026-09") == 3980, f"9 月应该是 3980，实际 {d.get('2026-09')}"
assert top_month == "2026-08", f"花得最多的是 8 月，实际 {top_month!r}"

# 关掉再开一次，确认数据真的落盘了
conn2 = sqlite3.connect("book.db")
n = conn2.execute("SELECT COUNT(*) FROM records").fetchone()[0]
conn2.close()
assert n == 7, f"重新打开后应该有 7 条记录，实际 {n} —— 数据没写进文件"` },
      hint: '写入用 <code>conn.executemany("INSERT INTO records VALUES (?, ?, ?)", RECORDS)</code>，然后 <code>conn.commit()</code> 再 <code>conn.close()</code>。汇总：<code>SELECT month, SUM(amount) FROM records GROUP BY month</code>。找最大用 <code>key=lambda x: x[1]</code> 的 <code>max()</code>。',
      solution: `import sqlite3

RECORDS = [
    ("2026-07", "房租", 3000),
    ("2026-07", "吃饭", 1200),
    ("2026-08", "房租", 3000),
    ("2026-08", "吃饭", 1450),
    ("2026-08", "买书", 260),
    ("2026-09", "房租", 3000),
    ("2026-09", "吃饭", 980),
]

DB = "book.db"

conn = sqlite3.connect(DB)
conn.execute("CREATE TABLE IF NOT EXISTS records (month TEXT, item TEXT, amount INTEGER)")
conn.execute("DELETE FROM records")
conn.executemany("INSERT INTO records VALUES (?, ?, ?)", RECORDS)
conn.commit()
conn.close()

conn = sqlite3.connect(DB)
by_month = conn.execute(
    "SELECT month, SUM(amount) FROM records GROUP BY month ORDER BY month").fetchall()
conn.close()

top_month = max(by_month, key=lambda x: x[1])[0]
print(by_month, top_month)`
    }
  ]
},

/* ==================== 4. 测试开发 ==================== */
{
  id: 'test', icon: '🧪', name: '测试开发',
  tag: '零依赖',
  desc: '让程序自己证明自己是对的',
  intro: `
<p>你可能已经在用「打印出来看一眼」验证代码。够用，但只在你盯着看的那一刻有用 ——
明天改了别的地方，你不知道有没有把这里弄坏。</p>
<p>测试就是把「看一眼」变成<strong>一句可重复执行的断言</strong>。
以后每次改完跑一遍，几十毫秒就知道有没有踩到旧功能。
这个方向用标准库的 <code>unittest</code>，不需要装任何东西。</p>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'tt1', icon: '🧪', title: '写出第一个测试', subtitle: 'assert / unittest / 边界用例',
      lessons: [
        {
          id: 'tt1-1', title: '断言：把「应该」写下来', xp: 55,
          goal: '用 assert 把「我认为结果是什么」变成机器能检查的句子。',
          body: `
<h3>assert 是最小单位的测试</h3>
<pre><code>def double(n):
    return n * 2

assert double(3) == 6
assert double(0) == 0
assert double(-5) == -10
print("全部通过")</code></pre>
<p><code>assert 条件</code> 的意思是「我断言这里一定是真的」。
一旦不成立，程序立刻抛 <code>AssertionError</code> 停下 —— 这正是你要的：
<strong>有问题就马上暴露，而不是悄悄算错然后一路错到底</strong>。</p>
<h3>加一句说明，出错时少查半小时</h3>
<pre><code>assert double(3) == 6, f"double(3) 应该是 6，实际 {double(3)}"</code></pre>
<p>第二句（逗号后面那部分）是失败时打印的消息。写清楚<strong>期望什么、实际什么</strong>，
以后的你会感谢现在的你。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>挑用例的时候，别只测「正常情况」。
真正的 bug 几乎都藏在<strong>边界</strong>上：0、空列表、负数、只有一条数据、
字符串两端有空格。下面几关会专门练这个。</div></div>
`,
          starter: `def initials(name):
    """'li hua' -> 'LH'；把每个单词的首字母大写后拼起来。"""
    return "".join(w[0].upper() for w in name.split())


# 给 initials 写至少 4 条断言，覆盖：
#   1) 普通两段名字
#   2) 只有一段
#   3) 全部大小写混合的输入
#   4) 多余空格的情况
# 用带说明的 assert 写

`,
          check: { type: 'tests', code: `assert 'initials' in dir(), "initials 不见了"
# 判题自己跑一遍这些情况，确认你的断言没写错方向
assert initials("li hua") == "LH"
assert initials("Tom") == "T"
assert initials("a B c") == "ABC"
assert initials("  li   hua  ") == "LH"
import re as _re
_n = len(_re.findall(r"^[ 	]*assert ", __SRC__, _re.M))
assert _n >= 4, f"至少要写 4 条断言，实际只写了 {_n} 条"` },
          hint: '每条写成 <code>assert initials("li hua") == "LH", "提示语"</code>。最后一条的空格情况，注意 <code>split()</code> 不带参数时会自动处理连续空格 —— 所以结果应该是 "LH"。',
          solution: `def initials(name):
    """'li hua' -> 'LH'；把每个单词的首字母大写后拼起来。"""
    return "".join(w[0].upper() for w in name.split())


assert initials("li hua") == "LH", "普通两段名字"
assert initials("Tom") == "T", "只有一段"
assert initials("a B c") == "ABC", "大小写混合"
assert initials("  li   hua  ") == "LH", "多余空格要自动忽略"

print("全部通过")`
        },
        {
          id: 'tt1-2', title: '用 unittest 组织测试', xp: 60,
          goal: '把散落的 assert 收进测试类，让「跑测试」变成一条命令。',
          body: `
<h3>为什么要「组织」</h3>
<p>十几条 <code>assert</code> 堆在一起，失败时只告诉你「第 7 条挂了」，
你还得自己去找。而且第一条挂了后面全不跑，一次只能修一个问题。</p>
<p><code>unittest</code> 解决这两件事：每个测试方法<strong>互不影响</strong>，
跑完给你一份<strong>通过/失败清单</strong>。</p>
<pre><code>import unittest

def add(a, b):
    return a + b

class TestAdd(unittest.TestCase):
    def test_普通相加(self):
        self.assertEqual(add(1, 2), 3)

    def test_负数(self):
        self.assertEqual(add(-1, 1), 0)

if __name__ == "__main__":
    unittest.main()</code></pre>
<h3>几条规矩</h3>
<ul>
<li>测试类要继承 <code>unittest.TestCase</code>。</li>
<li>测试方法名<strong>必须以 <code>test</code> 开头</strong>，否则不会被收集执行 —— 这是最常见的坑。</li>
<li>用 <code>self.assertEqual(a, b)</code> 而不是裸 <code>assert</code>：
失败时它会告诉你「a 是 3，b 是 4」，比自己写的消息还清楚。</li>
</ul>
<h3>常用的几个断言</h3>
<pre><code>self.assertEqual(a, b)          # 相等
self.assertTrue(x) / assertFalse(x)
self.assertIn(x, 容器)
self.assertRaises(ValueError, f, 参数)   # 断言「这里应该报错」</code></pre>
<div class="tip tip-fun"><span class="tip-ico">💡</span><div><code>assertRaises</code> 是最容易被忽略的一个。
「输入不合法时应该报错」也是功能的一部分，必须测 —— 否则哪天有人把校验删了，没人会发现。</div></div>
`,
          starter: `import unittest

def safe_div(a, b):
    """a / b；b 为 0 时抛 ValueError。"""
    if b == 0:
        raise ValueError("除数不能为零")
    return a / b


class TestSafeDiv(unittest.TestCase):
    # 写三个测试方法：
    #   1) 正常相除
    #   2) 整除结果为整数
    #   3) b 为 0 时抛 ValueError（用 assertRaises）
    pass


# 下面这行会跑测试，判题会检查结果
suite = unittest.TestLoader().loadTestsFromTestCase(TestSafeDiv)
result = unittest.TextTestRunner(stream=open("nul", "w")).run(suite)
tests_ok = result.wasSuccessful()
tests_run = result.testsRun
`,
          check: { type: 'tests', code: `assert tests_run >= 3, f"检测到 {tests_run} 个测试方法，至少要 3 个（方法名必须以 test 开头）"
assert tests_ok, "有测试没通过"
# 判题自己验一遍行为，确认测试覆盖的是真行为
assert safe_div(6, 3) == 2
assert safe_div(1, 4) == 0.25
try:
    safe_div(1, 0)
    raise AssertionError("safe_div(1, 0) 应该抛 ValueError")
except ValueError:
    pass` },
          hint: '方法名写成 <code>def test_xxx(self):</code>；正常情况用 <code>self.assertEqual(safe_div(6, 3), 2)</code>；报错情况用 <code>with self.assertRaises(ValueError): safe_div(1, 0)</code>。',
          solution: `import unittest

def safe_div(a, b):
    """a / b；b 为 0 时抛 ValueError。"""
    if b == 0:
        raise ValueError("除数不能为零")
    return a / b


class TestSafeDiv(unittest.TestCase):
    def test_正常相除(self):
        self.assertEqual(safe_div(6, 3), 2)

    def test_整除得整数(self):
        self.assertEqual(safe_div(9, 3), 3)

    def test_除零要报错(self):
        with self.assertRaises(ValueError):
            safe_div(1, 0)


suite = unittest.TestLoader().loadTestsFromTestCase(TestSafeDiv)
result = unittest.TextTestRunner(stream=open("nul", "w")).run(suite)
tests_ok = result.wasSuccessful()
tests_run = result.testsRun
print(tests_run, tests_ok)`
        },
        {
          id: 'tt1-3', title: 'setUp：让每个测试从干净状态开始', xp: 65,
          goal: '用 setUp / tearDown 做测试隔离，解决「单独跑都过、一起跑就挂」这类最烦人的问题。',
          body: `
<h3>测试之间会互相影响</h3>
<p>这一类 bug 特别难查：一个测试往文件里写了数据，另一个测试正好读同一个文件。
<strong>单独跑第一个，通过；单独跑第二个，也通过；按顺序一起跑，第二个挂了。</strong>
代码本身没错，错的是「跑的顺序」。</p>
<p>根子在于：每个测试都以为自己是从零开始的，实际上共享着同一份环境。</p>

<h3>setUp 与 tearDown</h3>
<p>unittest 提供两个钩子，会在<strong>每个</strong>测试方法前后各跑一次：</p>
<pre><code>class TestCart(unittest.TestCase):
    def setUp(self):
        self.cart = Cart()          # 每个测试拿一个全新的购物车

    def tearDown(self):
        shutil.rmtree("tmp", ignore_errors=True)   # 清掉测试留下的文件</code></pre>
<p><code>setUp</code> 里准备对象、<code>tearDown</code> 里清理现场。
于是每个测试都从同一个干净的起点出发，谁也不会踩到谁。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>注意跑的次数：<strong>每个</strong>测试方法前都会跑一次
<code>setUp</code>。三个测试方法 → <code>setUp</code> 跑三次。
「每个」这两个字是关键，不少人第一次会以为是「整个类跑一次」。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>测试留下的临时文件一定要在
<code>tearDown</code> 里删掉。留在那儿不只是污染下一次运行，还可能被误提交进代码仓库 ——
所以路径建议固定成 <code>tmp_xxx</code> 这种一眼看得出是临时东西的名字，
顺手加进 <code>.gitignore</code>。</div></div>
`,
          starter: `import os, shutil, unittest
from pathlib import Path


class Notes:
    """极简笔记：存成 dir/名字.txt。"""

    def __init__(self, folder):
        self.folder = Path(folder)

    def add(self, name, text):
        self.folder.mkdir(parents=True, exist_ok=True)
        (self.folder / (name + ".txt")).write_text(text, encoding="utf-8")

    def read(self, name):
        return (self.folder / (name + ".txt")).read_text(encoding="utf-8")

    def names(self):
        if not self.folder.exists():
            return []
        return sorted(p.stem for p in self.folder.glob("*.txt"))


class TestNotes(unittest.TestCase):
    # 1) setUp：先把残留目录删掉，再给 self.notes 一个全新的 Notes("tmp_notes")
    # 2) tearDown：把整个测试目录删掉（shutil.rmtree(..., ignore_errors=True)）
    # 3) 三个测试方法（名字必须以 test_ 开头，否则 unittest 会跳过）：
    #      test_add_then_read  —— 写入后能读回同样的内容
    #      test_names_sorted   —— 写入 b、c、a 之后，names() 返回 ['a','b','c']
    #      test_empty_at_start —— 一开始 names() 是空的
    #    第三个是关键：它排在第二个后面跑，如果 setUp 没给你一个干净环境，
    #    上一个测试留下的文件会让它直接失败。
    pass


suite = unittest.TestLoader().loadTestsFromTestCase(TestNotes)
result = unittest.TextTestRunner(stream=open("nul", "w")).run(suite)
tests_ok = result.wasSuccessful()
tests_run = result.testsRun
`,
          check: { type: 'tests', code: `assert tests_run == 3, f"应该有 3 个测试方法，实际跑了 {tests_run} 个（名字都要以 test_ 开头）"
assert tests_ok, "测试没有全部通过"

# setUp 必须真的准备了 self.notes —— 不能把逻辑全塞进各个测试方法里
_t = TestNotes("test_add_then_read")
_t.setUp()
assert isinstance(getattr(_t, "notes", None), Notes), \\
    "setUp 里要给 self.notes 赋值一个 Notes 实例"
_t.tearDown()

# tearDown 必须真的把目录清理掉
Path("tmp_notes").mkdir(parents=True, exist_ok=True)
Path("tmp_notes", "leftover.txt").write_text("x", encoding="utf-8")
_t2 = TestNotes("test_add_then_read")
_t2.setUp()
_t2.tearDown()
assert not os.path.exists("tmp_notes"), "tearDown 要把 tmp_notes 整个删掉"
assert not os.path.exists("tmp_notes"), "跑完之后不该留下 tmp_notes"` },
          hint: '两个钩子的名字是固定的：<code>def setUp(self):</code> 和 <code>def tearDown(self):</code>，拼错一个字母就不会被调用，而且不报错 —— 只会安静地不生效。setUp 里写 <code>shutil.rmtree("tmp_notes", ignore_errors=True)</code> 再 <code>self.notes = Notes("tmp_notes")</code>；三个断言用 <code>self.assertEqual</code>。',
          solution: `import os, shutil, unittest
from pathlib import Path


class Notes:
    """极简笔记：存成 dir/名字.txt。"""

    def __init__(self, folder):
        self.folder = Path(folder)

    def add(self, name, text):
        self.folder.mkdir(parents=True, exist_ok=True)
        (self.folder / (name + ".txt")).write_text(text, encoding="utf-8")

    def read(self, name):
        return (self.folder / (name + ".txt")).read_text(encoding="utf-8")

    def names(self):
        if not self.folder.exists():
            return []
        return sorted(p.stem for p in self.folder.glob("*.txt"))


class TestNotes(unittest.TestCase):
    def setUp(self):
        shutil.rmtree("tmp_notes", ignore_errors=True)
        self.notes = Notes("tmp_notes")

    def tearDown(self):
        shutil.rmtree("tmp_notes", ignore_errors=True)

    def test_add_then_read(self):
        self.notes.add("diary", "今天学了 setUp")
        self.assertEqual(self.notes.read("diary"), "今天学了 setUp")

    def test_names_sorted(self):
        for n in ["b", "c", "a"]:
            self.notes.add(n, n)
        self.assertEqual(self.notes.names(), ["a", "b", "c"])

    def test_empty_at_start(self):
        self.assertEqual(self.notes.names(), [])


suite = unittest.TestLoader().loadTestsFromTestCase(TestNotes)
result = unittest.TextTestRunner(stream=open("nul", "w")).run(suite)
tests_ok = result.wasSuccessful()
tests_run = result.testsRun
print(tests_run, tests_ok)`
        },
        {
          id: 'tt1-4', title: '参数化与边界：用少量用例覆盖大片输入', xp: 70,
          goal: '学会等价类划分，并用 subTest 把一组用例塞进一个测试方法。',
          body: `
<h3>不能只测「正常情况」</h3>
<p>要测一个「分数转等级」的函数，穷举 0~100 是一百零一个用例 ——
写得累、跑得慢，改一次规则要改一百处。</p>
<p>但其实不用穷举。因为一段代码里，<strong>每个分支只需要一个代表</strong>：</p>
<ul>
<li><code>score &lt; 60</code> 不及格 → 拿 30 和 59 测，走的是同一条路</li>
<li><code>60 ~ 89</code> 及格 → 拿一个 75</li>
<li><code>&ge; 90</code> 优秀 → 拿一个 95</li>
</ul>
<p>这叫<strong>等价类划分</strong>：把输入分成若干组，每组里随便挑一个，效果是一样的。</p>
<p>然后在<strong>分界点上</strong>额外各补一个 —— 因为绝大多数 bug 都住在边界上：
写成 <code>&lt; 60</code> 还是 <code>&lt;= 60</code>，中间那一个数字就决定了 60 分算不算及格。</p>

<h3>subTest：一个方法跑一组用例</h3>
<p>用例多了，不该复制成一堆方法。<code>subTest</code> 能在一个方法里循环跑多组数据，
而且<strong>某一组失败不会中断后面的组</strong>：</p>
<pre><code>for score, want in [(59, "不及格"), (60, "及格")]:
    with self.subTest(score=score):
        self.assertEqual(grade(score), want)   # 断言写在 with 里面</code></pre>
<p>没有 <code>subTest</code> 的话，第一组失败就抛异常跳出整个循环，
后面几组根本没机会跑 —— 于是你只能「改一次、跑一次」，来回好几趟。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>参数化还有个不太被提起的好处：
<strong>用例列表能一眼看完</strong>。要确认覆盖了哪些输入，扫一眼那个列表就行 ——
不用把每个方法体都读一遍，review 的时候省很多事。</div></div>
`,
          starter: `import unittest


def grade(score):
    """分数 -> 等级。0~59 不及格；60~89 及格；90~100 优秀。"""
    if score < 0 or score > 100:
        raise ValueError("分数要在 0~100 之间")
    if score < 60:
        return "不及格"
    if score < 90:
        return "及格"
    return "优秀"


# 1) 把边界用例列成 CASES：[(分数, 期望等级), ...]
#    六个分界值一个都不能少：0 / 59 / 60 / 89 / 90 / 100
#    顺序随便，但每一项都必须是 (分数, 等级) 这样的二元组
CASES = []


class TestGrade(unittest.TestCase):
    # 2) test_boundaries：用 subTest 把 CASES 里每一组都跑一遍
    # 3) test_invalid：也分两次 subTest，确认 -1 和 101 都会 raise ValueError
    #    （用 self.assertRaises，别用 try/except 自己接）
    pass


suite = unittest.TestLoader().loadTestsFromTestCase(TestGrade)
result = unittest.TextTestRunner(stream=open("nul", "w")).run(suite)
tests_ok = result.wasSuccessful()
tests_run = result.testsRun
`,
          check: { type: 'tests', code: `assert tests_run == 2, f"应该有 2 个测试方法，实际跑了 {tests_run} 个"
assert tests_ok, "测试没有全部通过"

_want = [(0, "不及格"), (59, "不及格"), (60, "及格"), (89, "及格"), (90, "优秀"), (100, "优秀")]
assert sorted(CASES) == sorted(_want), \\
    f"CASES 要覆盖 0/59/60/89/90/100 这六个分界值，实际 {CASES!r}"

# 光有测试方法不够 —— 得确认它真的在断言。
# 把 grade 换成一个「永远返回及格」的假函数，学生的测试必须失败。
import unittest as _ut, os as _os
_real = globals()["grade"]
try:
    globals()["grade"] = lambda s: "及格"
    _r = _ut.TextTestRunner(stream=open(_os.devnull, "w")).run(
        _ut.TestLoader().loadTestsFromTestCase(TestGrade))
    _caught = not _r.wasSuccessful()
finally:
    globals()["grade"] = _real
assert _caught, "把 grade 换成永远返回「及格」的假函数后，你的测试居然全过了 —— 说明它没有真的在断言"` },
          hint: 'CASES 就是六行元组。<code>test_invalid</code> 里用 <code>with self.subTest(score=bad):</code> 套 <code>with self.assertRaises(ValueError): grade(bad)</code> —— 两个 with 是可以叠起来的，缩进注意一层。',
          solution: `import unittest


def grade(score):
    """分数 -> 等级。0~59 不及格；60~89 及格；90~100 优秀。"""
    if score < 0 or score > 100:
        raise ValueError("分数要在 0~100 之间")
    if score < 60:
        return "不及格"
    if score < 90:
        return "及格"
    return "优秀"


CASES = [(0, "不及格"), (59, "不及格"), (60, "及格"),
         (89, "及格"), (90, "优秀"), (100, "优秀")]


class TestGrade(unittest.TestCase):
    def test_boundaries(self):
        for score, want in CASES:
            with self.subTest(score=score):
                self.assertEqual(grade(score), want)

    def test_invalid(self):
        for bad in [-1, 101]:
            with self.subTest(score=bad):
                with self.assertRaises(ValueError):
                    grade(bad)


suite = unittest.TestLoader().loadTestsFromTestCase(TestGrade)
result = unittest.TextTestRunner(stream=open("nul", "w")).run(suite)
tests_ok = result.wasSuccessful()
tests_run = result.testsRun
print(tests_run, tests_ok)`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-test-1', emoji: '🐛', name: '拓出隐藏的 bug', sub: 'unittest · 边界用例 · 先失败再修好', color: '#fdecec', diff: 2, tag: '测试实战',
      desc: '给一个「有隐藏 bug」的函数写测试，把 bug 逼出来，然后修好它。',
      intro: `
<p>这是测试开发最有成就感的一刻：<strong>你先证明它错了，再看它变对</strong>。</p>
<p>下面的函数看起来没问题，但它在某个边界上会出错。你的任务是写测试把它抓住，
然后修掉那个 bug —— 判题会先确认你的测试确实能抓到这个 bug，再确认修好的版本能全过。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>「先写一个会失败的测试」是正规做法，
不是多此一举：它证明你的测试真的在测东西。永远通过的测试等于没有测试。</div></div>`,
      steps: [
        '看懂 <code>average(nums)</code> 想做什么：返回平均分，四舍五入保留 1 位小数；但<strong>空列表应该抛 ValueError</strong>（没有数据是没有意义的）。',
        '写测试类，至少覆盖：普通情况、单元素、空列表（用 <code>assertRaises</code>）。',
        '跑一遍 —— 空列表那条会失败，这就是 bug 所在。',
        '把 <code>average</code> 修好，让所有测试通过。'
      ],
      starter: `import unittest

def average(nums):
    """返回平均分，保留 1 位小数。空列表应抛 ValueError。"""
    return round(sum(nums) / len(nums), 1)


class TestAverage(unittest.TestCase):
    # 写至少 3 个测试方法
    pass


# 下面这段别改，判题会读它
suite = unittest.TestLoader().loadTestsFromTestCase(TestAverage)
result = unittest.TextTestRunner(stream=open("nul", "w")).run(suite)
tests_ok = result.wasSuccessful()
tests_run = result.testsRun
`,
      check: { type: 'tests', code: `assert tests_run >= 3, f"检测到 {tests_run} 个测试，至少要 3 个"
assert tests_ok, f"测试没全过（{tests_run} 个里失败了若干）"
assert average([90, 80, 100]) == 90.0, "修好之后 average 要正常工作"
assert average([1]) == 1.0, "单元素也应该正常"
try:
    average([])
    raise AssertionError("average([]) 应该抛 ValueError")
except ValueError:
    pass` },
      hint: '空列表那条这么写：<code>def test_空列表(self): with self.assertRaises(ValueError): average([])</code>。修 bug 就是在开头的 <code>sum(nums) / len(nums)</code> 之前加一句 <code>if not nums: raise ValueError("列表不能为空")</code>。',
      solution: `import unittest

def average(nums):
    """返回平均分，保留 1 位小数。空列表应抛 ValueError。"""
    if not nums:
        raise ValueError("列表不能为空")
    return round(sum(nums) / len(nums), 1)


class TestAverage(unittest.TestCase):
    def test_普通情况(self):
        self.assertEqual(average([90, 80, 100]), 90.0)

    def test_单元素(self):
        self.assertEqual(average([1]), 1.0)

    def test_保留一位小数(self):
        self.assertEqual(average([1, 2]), 1.5)

    def test_空列表要报错(self):
        with self.assertRaises(ValueError):
            average([])


suite = unittest.TestLoader().loadTestsFromTestCase(TestAverage)
result = unittest.TextTestRunner(stream=open("nul", "w")).run(suite)
tests_ok = result.wasSuccessful()
tests_run = result.testsRun
print(tests_run, tests_ok)`
    }
  ]
},

/* ==================== 5. 自动化办公 ==================== */
{
  id: 'office', icon: '📁', name: '自动化办公',
  tag: '零依赖',
  desc: '把重复的文件活交给程序',
  intro: `
<p>办公场景里最值得自动化的，是那些「一百个文件、每个都要做同一件事」的活：
统一改名、批量提取、汇总成一张表。</p>
<p>这个方向用标准库的 <code>os</code> / <code>pathlib</code> / <code>csv</code> / <code>json</code>。
注意：网页版和手机版里的文件系统是<strong>内存里的临时盘</strong>，
代码完全一样，只是关掉页面就没了。桌面版读写的是真实磁盘。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>批处理的铁律：
<strong>先干跑一遍打印要做什么，确认没错了再真的动手</strong>。
一个写错的正则批量改掉三百个文件名，是没有 Ctrl+Z 的。</div></div>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'to1', icon: '📂', title: '批量处理文件', subtitle: 'pathlib / 改名 / 汇总成表',
      lessons: [
        {
          id: 'to1-1', title: '遍历文件夹', xp: 55,
          goal: '用 pathlib 找出需要的文件，并看清它们的名字和大小。',
          body: `
<h3>pathlib 比 os.path 好用</h3>
<pre><code>from pathlib import Path

folder = Path("reports")
for p in folder.iterdir():          # 遍历直接子项
    print(p.name, p.stat().st_size)

list(folder.glob("*.txt"))          # 只看 txt
list(folder.rglob("*"))             # 连子文件夹一起</code></pre>
<p><code>Path</code> 对象比字符串省心得多：<code>p.name</code> 是文件名，
<code>p.suffix</code> 是扩展名，<code>p.stem</code> 是不带扩展名的名字，
<code>p.parent</code> 是所在目录。要拼路径直接用 <code>/</code>：<code>folder / "a.txt"</code>。</p>
<h3>通配符</h3>
<ul>
<li><code>*</code> 匹配任意字符（不含分隔符）：<code>*.txt</code>、<code>2026-*.csv</code></li>
<li><code>?</code> 匹配一个字符：<code>数据?.txt</code></li>
<li><code>rglob</code> 是「递归 glob」，会把所有子文件夹也翻一遍</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>遍历时<strong>不要边遍历边删改</strong>同一个文件夹，
结果会变得不可预测。稳妥做法是先 <code>list()</code> 收集成一个列表，再对这个列表操作。</div></div>
`,
          starter: `import os
from pathlib import Path

# 造几个文件来练手（判题前会清干净）
os.makedirs("reports", exist_ok=True)
for n in ["销售-北京.txt", "销售-上海.txt", "销售-广州.txt", "备注.md"]:
    Path("reports", n).write_text("内容", encoding="utf-8")

# 1) 找出 reports 下所有 .txt 文件，把文件名存进 names（按名字排序）
# 2) 把「销售-XX」里的城市名抠出来，存进 cities
# 3) 打印它们

names = []
cities = []
`,
          check: { type: 'tests', code: `assert names == ["销售-上海.txt", "销售-北京.txt", "销售-广州.txt"] or sorted(names) == sorted(["销售-北京.txt", "销售-上海.txt", "销售-广州.txt"]), f"找到的文件不对：{names!r}"
assert len(names) == 3, f"应该找到 3 个 txt，实际 {len(names)}"
assert "备注.md" not in " ".join(names), "md 文件不该被算进来"
assert sorted(cities) == ["上海", "北京", "广州"], f"城市名不对：{cities!r}"` },
          hint: '用 <code>Path("reports").glob("*.txt")</code>（<code>rglob</code> 也行）。取城市：<code>p.stem</code> 得到 "销售-北京"，再 <code>.split("-")[1]</code>。',
          solution: `import os
from pathlib import Path

os.makedirs("reports", exist_ok=True)
for n in ["销售-北京.txt", "销售-上海.txt", "销售-广州.txt", "备注.md"]:
    Path("reports", n).write_text("内容", encoding="utf-8")

txts = sorted(Path("reports").glob("*.txt"))
names = [p.name for p in txts]
cities = [p.stem.split("-")[1] for p in txts]

print(names)
print(cities)`
        },
        {
          id: 'to1-2', title: '批量改名与汇总', xp: 65,
          goal: '把一批文件统一改名，再把它们的内容汇总成一张表。',
          body: `
<h3>先干跑，再动手</h3>
<p>批量改名的标准流程是两趟：</p>
<pre><code># 第一趟：只打印，不改
for p in files:
    print(f"{p.name}  ->  {new_name(p)}")

# 确认输出没问题了，第二趟才真的改
for p in files:
    p.rename(p.parent / new_name(p))</code></pre>
<h3>改名用 rename，别用「删了重建」</h3>
<pre><code>p.rename(p.parent / "新名字.txt")</code></pre>
<p>注意 <code>rename</code> 的参数是<strong>完整路径</strong>，不是只有文件名 ——
所以要用 <code>p.parent / "新名字.txt"</code> 拼出来。只给文件名的话，
文件会被挪到你当前所在目录。</p>
<h3>汇总：读一遍所有文件，写出一张表</h3>
<pre><code>rows = []
for p in files:
    text = p.read_text(encoding="utf-8")
    rows.append([p.stem, len(text)])

with open("汇总.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["文件", "字数"])
    w.writerows(rows)</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>newline=""</code> 在写 CSV 时一定要加。
不加的话在 Windows 上每行之间会多一个空行 —— 这是最常见的一个坑。</div></div>
`,
          starter: `import os, csv
from pathlib import Path

os.makedirs("raw", exist_ok=True)
内容 = {"a": "北京销售 120 万", "b": "上海销售 98 万", "c": "广州销售 76 万"}
for k, v in 内容.items():
    Path("raw", k + ".txt").write_text(v, encoding="utf-8")

# 1) 把 raw 下的 a.txt / b.txt / c.txt 改名为 2026-a.txt 这种
# 2) 读一遍改名后的文件，把 (文件名, 内容字数) 收进 rows
# 3) 写进 summary.csv，表头是 文件,字数

rows = []
`,
          check: { type: 'tests', code: `import csv, os
from pathlib import Path

assert os.path.exists("summary.csv"), "没有生成 summary.csv"

renamed = sorted(p.name for p in Path("raw").glob("*.txt"))
assert renamed == ["2026-a.txt", "2026-b.txt", "2026-c.txt"], f"改名结果不对：{renamed!r}"

data = list(csv.reader(open("summary.csv", encoding="utf-8")))
assert data[0] == ["文件", "字数"], f"表头不对：{data[0]!r}"
assert len(data) == 4, f"应该有表头 + 3 行，实际 {len(data)}"
body = {r[0]: int(r[1]) for r in data[1:]}
assert body.get("2026-a.txt") == len("北京销售 120 万"), f"字数不对：{body}"` },
          hint: '改名：<code>p.rename(p.parent / ("2026-" + p.name))</code>，但要先 <code>list()</code> 收集。读内容用 <code>p.read_text(encoding="utf-8")</code>，字数是 <code>len(...)</code>。写 CSV 记得 <code>newline=""</code>。',
          solution: `import os, csv
from pathlib import Path

os.makedirs("raw", exist_ok=True)
内容 = {"a": "北京销售 120 万", "b": "上海销售 98 万", "c": "广州销售 76 万"}
for k, v in 内容.items():
    Path("raw", k + ".txt").write_text(v, encoding="utf-8")

files = sorted(Path("raw").glob("*.txt"))
for p in files:
    p.rename(p.parent / ("2026-" + p.name))

rows = []
for p in sorted(Path("raw").glob("*.txt")):
    text = p.read_text(encoding="utf-8")
    rows.append([p.name, len(text)])

with open("summary.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["文件", "字数"])
    w.writerows(rows)

print(rows)`
        },
        {
          id: 'to1-3', title: '配置文件：让脚本不用改代码就能换任务', xp: 60,
          goal: '把「会变的东西」抽到 JSON 配置里，让同一份脚本能处理不同的活。',
          body: `
<h3>同一件事，早晚要处理不同的数据</h3>
<p>写一个「把 A 目录的 csv 合并到 B」的脚本，用不了多久就会收到第二个需求：
「这次换成另一个目录，表头也不一样」。于是要么打开代码改几行，要么复制一份脚本 ——
两种做法都会很快失控：改代码容易改错，复制脚本三个月后你会不知道留哪一份。</p>
<p>正规做法是把<strong>会变的东西</strong>抽到一个配置文件里，代码只负责读它：</p>
<pre><code>{
  "source": "raw",
  "target": "merged.csv",
  "columns": ["部门", "金额"],
  "skip_header": true
}</code></pre>
<p>这样换任务就只是换一个配置文件 —— 代码一个字都不用动。</p>

<h3>读写 JSON 只要两行</h3>
<pre><code>import json
from pathlib import Path

cfg = json.loads(Path("task.json").read_text(encoding="utf-8"))
Path("out.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")</code></pre>
<ul>
<li>带 <code>s</code> 的那两个（<code>loads</code> / <code>dumps</code>）处理的是<strong>字符串</strong>；
不带 <code>s</code> 的处理文件对象。这里读写都是字符串，所以用带 <code>s</code> 的。</li>
<li>不加 <code>ensure_ascii=False</code>，中文会被写成 <code>\\u90e8\\u95e8</code> 这种转义 ——
程序读回去当然没错，但你打开配置文件一个中文都看不懂，那「配置可读」的意义就没了。</li>
<li><code>indent=2</code> 让它分层缩进。不给的话整个 JSON 挤成一行，也没法看。</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>一定写
<code>encoding="utf-8"</code>。不写的话 Windows 会用本地编码，中文必乱码，
而且经常是「你自己机器上好好的，发给同事就崩了」。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>判断一个脚本该不该抽配置，标准很简单：
<strong>换个数据源要不要动代码？</strong>要动，就该抽了。</div></div>
`,
          starter: `import json
from pathlib import Path

# 一份典型的任务配置
config = {
    "source": "raw",
    "target": "merged.csv",
    "columns": ["部门", "金额"],
    "skip_header": True,
    "limits": {"max_rows": 500, "warn_rows": 300}
}

# 1) 把 config 写进 task.json（UTF-8 / indent=2 / 中文不要转义）
# 2) 读回来存进 loaded
# 3) 从 loaded 里取出 warn_rows（注意 limits 是嵌套的一层字典）
# 4) 写一个 check_config(cfg)：返回「缺少的必需键名」，按下面这个顺序来；
#    四个键都在就返回空列表。必需键是 source / target / columns / skip_header
#    —— 配置文件最典型的故障就是少一个键，脚本跑到一半才崩
# 5) missing = check_config(loaded)
# 6) 拿 loaded 的副本删掉 "target" 再算一次，存进 missing_after_delete
#    （用副本，别把 loaded 改坏了）

loaded = {}
warn_rows = 0
missing = []
missing_after_delete = []
`,
          check: { type: 'tests', code: `p = Path("task.json")
assert p.exists(), "没有生成 task.json"

raw = p.read_text(encoding="utf-8")
assert "\\\\u90e8\\\\u95e8" not in raw, "中文被转义了 —— 别忘了 ensure_ascii=False"
assert raw.count(chr(10)) >= 3, "JSON 没有分层缩进 —— 检查 indent 参数"

back = json.loads(raw)
assert back == config, "写进去再读回来，内容和原来的不一致"
assert loaded == config, f"loaded 和 config 不一致：{loaded!r}"
assert warn_rows == 300, f"warn_rows 应该是 300，实际 {warn_rows!r}"
assert callable(globals().get("check_config")), "没有定义 check_config 函数"
assert missing == [], f"四个必需键都在，missing 应该是空的，实际 {missing!r}"
assert missing_after_delete == ["target"], \\
    f"删掉 target 之后应该报 ['target']，实际 {missing_after_delete!r}"
assert loaded == config, "loaded 被改坏了 —— 第 6 步要用副本"` },
          hint: '写入用 <code>Path("task.json").write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")</code>。取值是两次下标：<code>loaded["limits"]["warn_rows"]</code>。check_config 一行搞定：<code>[k for k in REQUIRED if k not in cfg]</code>，副本用 <code>broken = dict(loaded)</code> 再 <code>del broken["target"]</code>。',
          solution: `import json
from pathlib import Path

config = {
    "source": "raw",
    "target": "merged.csv",
    "columns": ["部门", "金额"],
    "skip_header": True,
    "limits": {"max_rows": 500, "warn_rows": 300}
}

Path("task.json").write_text(
    json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")

loaded = json.loads(Path("task.json").read_text(encoding="utf-8"))

warn_rows = loaded["limits"]["warn_rows"]

REQUIRED = ["source", "target", "columns", "skip_header"]


def check_config(cfg):
    return [k for k in REQUIRED if k not in cfg]


missing = check_config(loaded)

broken = dict(loaded)
del broken["target"]
missing_after_delete = check_config(broken)

print(warn_rows, missing, missing_after_delete)`
        },
        {
          id: 'to1-4', title: '找出重复文件：按内容，不按名字', xp: 65,
          goal: '用哈希给文件算指纹，找出真正内容相同的文件 —— 这是文件类自动化里最实用的一招。',
          body: `
<h3>同一个文件，名字可以完全不一样</h3>
<p>「终版.doc」「终版-最终版.doc」「终版-最终版(1).doc」很可能是同一份东西。
按文件名去重完全没用，按修改时间也不可靠 —— 唯一靠得住的办法是<strong>比内容</strong>。</p>
<p>但逐个字节比对太慢。标准做法是比<strong>指纹</strong>：把内容算成一个很短的字符串，
内容相同 → 指纹必然相同。</p>
<pre><code>import hashlib

def fingerprint(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()</code></pre>
<p>一个文件几 MB，算出来的指纹永远是 64 个字符 —— 比较指纹比比较内容快得多。</p>

<h3>关于哈希，记住这几条就够了</h3>
<ul>
<li><strong>内容一样，指纹一定一样</strong> —— 这条是本关要用的。</li>
<li><strong>内容改一个字节，指纹就面目全非</strong> —— 所以它也常用来校验下载有没有损坏。</li>
<li>指纹一样、内容却不同，理论上存在（叫「碰撞」），但概率低到可以忽略。
所以哈希适合<strong>找出</strong>重复，不适合当法律证据。</li>
</ul>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>提速技巧：先用<strong>文件大小</strong>粗筛。
大小不同的文件绝不可能内容相同 —— 这一刀能砍掉绝大多数比较，剩下的再算哈希。
「先粗筛、再细算」是处理大批文件的通用套路。</div></div>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>这个脚本只负责<strong>找出</strong>重复，
删不删由人决定。误删的代价远大于多留几个文件 —— 所以你去看真实工具，
这一步几乎都会先给一份报告让人确认，而不是直接删。</div></div>
`,
          starter: `import hashlib, os
from pathlib import Path

# 造点文件来练手：有真重复，也有只是名字像的
box = Path("box")
box.mkdir(exist_ok=True)
(box / "a.txt").write_text("这是一份报告", encoding="utf-8")
(box / "a_copy.txt").write_text("这是一份报告", encoding="utf-8")     # 和 a.txt 内容一样
(box / "a_final.txt").write_text("这是一份报告!", encoding="utf-8")   # 只多一个叹号
(box / "b.txt").write_text("这是另一份报告", encoding="utf-8")

# 1) 写 fingerprint(path)：返回文件内容的 sha256 十六进制字符串
# 2) 扫 box 下所有 .txt，按指纹分组，只保留「至少两个文件」的组
#    groups 是字典：指纹 -> 文件名列表（用 stem，列表要排序）
# 3) dup_groups = 有几组重复

groups = {}
dup_groups = 0
`,
          check: { type: 'tests', code: `assert callable(globals().get("fingerprint")), "没有定义 fingerprint 函数"

import hashlib as _h
_want = _h.sha256("这是一份报告".encode("utf-8")).hexdigest()
assert fingerprint("box/a.txt") == _want, "fingerprint 算出来的值不对"
assert fingerprint("box/a_final.txt") != _want, "内容多一个叹号，指纹就不该相同"

assert dup_groups == 1, f"真重复只有 1 组（a 和 a_copy），实际 {dup_groups}"
assert all(len(k) == 64 for k in groups), "字典的键应该是 64 位的十六进制指纹"
assert list(groups.values()) == [["a", "a_copy"]], \\
    f"重复组不对：{list(groups.values())!r}（a_final 只是名字像，内容并不一样）"` },
          hint: '<code>fingerprint</code> 一行就够：<code>hashlib.sha256(Path(path).read_bytes()).hexdigest()</code>。分组用 <code>groups.setdefault(fp, []).append(p.stem)</code>，最后 <code>groups = {k: sorted(v) for k, v in groups.items() if len(v) &gt;= 2}</code>。想加大小粗筛就先 <code>p.stat().st_size</code> 分一轮，这一关数据小，直接算也行。',
          solution: `import hashlib, os
from pathlib import Path

box = Path("box")
box.mkdir(exist_ok=True)
(box / "a.txt").write_text("这是一份报告", encoding="utf-8")
(box / "a_copy.txt").write_text("这是一份报告", encoding="utf-8")
(box / "a_final.txt").write_text("这是一份报告!", encoding="utf-8")
(box / "b.txt").write_text("这是另一份报告", encoding="utf-8")


def fingerprint(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


groups = {}
for p in sorted(box.glob("*.txt")):
    groups.setdefault(fingerprint(p), []).append(p.stem)

groups = {k: sorted(v) for k, v in groups.items() if len(v) >= 2}
dup_groups = len(groups)

print(dup_groups, groups)`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-office-1', emoji: '📁', name: '月报合并与汇总', sub: 'pathlib · csv · 批量处理', color: '#f0ecff', diff: 2, tag: '办公实战',
      desc: '把一堆格式不统一的月度报表合并成一张总表，并生成一份摘要。',
      intro: `
<p>这是办公自动化最典型的一件事：十几个部门各交一份表，
格式还都不太一样，你要合并成一张总表交上去。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>处理这类活的关键不是「读」，是<strong>统一</strong>：
字段名先 <code>strip()</code>、数字先去掉逗号、空值统一成空字符串。
不统一就合并，后面一定出错。</div></div>`,
      steps: [
        '读 <code>data/</code> 下所有 <code>.csv</code>，每个文件里的每行都要带上「来源文件名」。',
        '合并成 <code>merged.csv</code>，表头是 <code>来源,部门,金额</code>。',
        '按部门汇总金额，写进 <code>summary.csv</code>，表头是 <code>部门,合计</code>，按合计从高到低排。',
        '打印一份文字摘要：一共几个部门、总金额多少。'
      ],
      starter: `import os, csv
from pathlib import Path

os.makedirs("data", exist_ok=True)
Path("data/7月.csv").write_text("部门, 金额\\n销售,1000\\n技术,800\\n", encoding="utf-8")
Path("data/8月.csv").write_text("部门, 金额\\n销售,1200\\n技术,900\\n市场,300\\n", encoding="utf-8")

# 1) 读取、统一字段名、加上来源
# 2) 写 merged.csv
# 3) 汇总 -> summary.csv
# 4) 打印摘要

rows = []
total = 0
`,
      check: { type: 'tests', code: `import csv, os

assert os.path.exists("merged.csv"), "没有生成 merged.csv"
m = list(csv.reader(open("merged.csv", encoding="utf-8")))
assert m[0] == ["来源", "部门", "金额"], f"merged 表头不对：{m[0]!r}"
assert len(m) == 6, f"两页一共 5 条明细，加表头应该是 6 行，实际 {len(m)}"
assert sorted(r[0] for r in m[1:]) == ["7月.csv", "7月.csv", "8月.csv", "8月.csv", "8月.csv"], "来源文件名不对"

assert os.path.exists("summary.csv"), "没有生成 summary.csv"
s = list(csv.reader(open("summary.csv", encoding="utf-8")))
assert s[0] == ["部门", "合计"], f"summary 表头不对：{s[0]!r}"
d = {r[0]: int(r[1]) for r in s[1:]}
assert d == {"销售": 2200, "技术": 1700, "市场": 300}, f"汇总不对：{d!r}"
assert s[1][0] == "销售", "summary 要按合计从高到低排"
assert total == 4200, f"总金额应该是 4200，实际 {total}"` },
      hint: '读的时候用 <code>csv.DictReader</code>，把字段名统一成 <code>{k.strip(): v for k, v in row.items()}</code>。金额 <code>int(v.replace(",", "").strip())</code>。汇总用字典累加。排序 <code>sorted(d.items(), key=lambda kv: -kv[1])</code>。',
      solution: `import os, csv
from pathlib import Path

os.makedirs("data", exist_ok=True)
Path("data/7月.csv").write_text("部门, 金额\\n销售,1000\\n技术,800\\n", encoding="utf-8")
Path("data/8月.csv").write_text("部门, 金额\\n销售,1200\\n技术,900\\n市场,300\\n", encoding="utf-8")

rows = []
for p in sorted(Path("data").glob("*.csv")):
    for row in csv.DictReader(open(p, encoding="utf-8")):
        row = {k.strip(): (v or "").strip() for k, v in row.items()}
        if not row.get("部门"):
            continue
        rows.append([p.name, row["部门"], int(row["金额"].replace(",", ""))])

with open("merged.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["来源", "部门", "金额"])
    w.writerows(rows)

agg = {}
for _, dept, amount in rows:
    agg[dept] = agg.get(dept, 0) + amount

ordered = sorted(agg.items(), key=lambda kv: -kv[1])
with open("summary.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["部门", "合计"])
    w.writerows(ordered)

total = sum(agg.values())
print(len(agg), total, ordered)`
    }
  ]
},

/* ==================== 其余方向（规划中） ====================
   下面这些方向已经列进体系，但还没开始写内容。
   它们的 needs 是先按技术判断标好的 —— 这样即使用户在用网页版，
   也能提前看到「这个方向我这台设备能走到哪一步」。 */
/* ==================== 7. 游戏开发 ==================== */
{
  id: 'game', icon: '🎮', name: '游戏开发', tag: '零依赖',
  desc: '把状态、循环、规则拼成一个能玩的东西',
  intro: `
<p>游戏的本质可以压成一句话：<strong>一堆状态，按规则，随时间变化</strong>。</p>
<p>拆开就是三件事 —— 用变量表示<strong>状态</strong>（血量、位置、金币）、
用循环推动<strong>时间</strong>、用条件判断<strong>规则</strong>（撞墙会怎样、打中了扣多少血）。
命令行游戏把这三件事暴露得最清楚，所以这里先不碰图形库。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这里的逻辑练熟了，以后换成图形库做真游戏时，
<strong>逻辑部分几乎不用重写</strong> —— 变的只是「把结果画出来」那一步。</div></div>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'tg1', icon: '🔁', title: '游戏循环与状态', subtitle: '一轮一轮推进 / 状态存在哪',
      lessons: [
        {
          id: 'tg1-1', title: '游戏就是一个循环', xp: 55,
          goal: '写出猜数字游戏的核心循环，搞清「输入 → 更新 → 输出」这三步。',
          body: `
<h3>所有游戏都在跑同一个循环</h3>
<p>不管多复杂的游戏，剥到最后都是一个循环，每转一圈做三件事：</p>
<pre><code>  读玩家的操作   →   更新游戏状态   →   把结果说出来
     （输入）           （更新）            （输出）</code></pre>
<p>猜数字是最小的例子：<strong>状态</strong>是「答案」和「还剩几次」，
<strong>更新</strong>是比较大小、次数减一，<strong>输出</strong>是提示「太大」或「太小」。</p>
<h3>循环什么时候停</h3>
<p>这是新手最容易写错的地方。<code>while True</code> 配一个 <code>break</code> 也能跑，
但更清楚的做法是把「该不该继续」写明白：<strong>还没猜中，而且次数还没用完</strong>。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>猜中的那一轮必须<strong>立刻停下来</strong>，
后面还没处理的猜测不能再提示了 —— 否则玩家都猜对了你还接着说「太小」，游戏当场穿帮。</div></div>
<h3>为什么要写成函数</h3>
<p>这一关不让你直接跟键盘交互，而是把 <code>猜测序列</code> 作为参数传进来。
好处有两条：一是<strong>同一段逻辑可以反复测</strong>（这正是自动化判题的原理），
二是以后要改成联网对战，只换「输入从哪来」，中间那段逻辑一行都不用动。</p>
`,
          starter: `def play(secret, guesses, limit):
    """按顺序处理玩家的猜测，返回每一轮提示组成的列表。

    每一轮：
      猜的数 > secret  -> 追加 '太大'
      猜的数 < secret  -> 追加 '太小'
      猜的数 == secret -> 追加 '猜中'，然后立刻结束，后面的猜测一律不再处理
    如果处理满 limit 次都还没猜中，最后再追加一条：f'机会用完了，答案是{secret}'
    """

    tips = []
    # 在这里写循环
    return tips


print(play(42, [10, 60, 42, 99], 5))
print(play(42, [1, 2, 3, 4], 3))
`,
          check: { type: 'tests', code: `assert play(42, [10, 60, 42, 99], 5) == ["太小", "太大", "猜中"], f"猜中之后应该立刻停下，实际 {play(42, [10, 60, 42, 99], 5)!r}"
assert play(42, [1, 2, 3, 4], 3) == ["太小", "太小", "太小", "机会用完了，答案是42"], f"次数上限没接住，实际 {play(42, [1, 2, 3, 4], 3)!r}"
assert play(7, [7], 1) == ["猜中"], f"第一次就猜中，实际 {play(7, [7], 1)!r}"
assert play(90, [80, 99, 90], 5) == ["太小", "太大", "猜中"], f"先小后大最后中，实际 {play(90, [80, 99, 90], 5)!r}"
assert play(42, [], 3) == [], f"没有猜测时不该产生任何提示，实际 {play(42, [], 3)!r}"` },
          hint: '用一个 <code>used</code> 计数器记已经处理了几次。每轮开头先判断 <code>used >= limit</code> 就 <code>break</code>；猜中时直接 <code>return tips</code>；循环结束后再判断 <code>used >= limit</code> 决定要不要追加那条「机会用完了」。',
          solution: `def play(secret, guesses, limit):
    tips = []
    used = 0
    for g in guesses:
        if used >= limit:
            break
        used += 1
        if g > secret:
            tips.append('太大')
        elif g < secret:
            tips.append('太小')
        else:
            tips.append('猜中')
            return tips          # 猜中即结束，后面不再处理
    if used >= limit:
        tips.append(f'机会用完了，答案是{secret}')
    return tips


print(play(42, [10, 60, 42, 99], 5))
print(play(42, [1, 2, 3, 4], 3))`
        },
        {
          id: 'tg1-2', title: '用字典装下整个角色', xp: 60,
          goal: '把角色状态存进一个字典，并写清楚每个动作对它的影响。',
          body: `
<h3>为什么游戏状态常用字典</h3>
<p>角色的属性会越加越多：血量、金币、药水、攻击力、位置……
用一堆单独的变量，很快就会出现 <code>hp1 / hp2 / hp_enemy</code> 这种灾难。</p>
<pre><code>player = {"hp": 100, "gold": 50, "potion": 1}

player["hp"] -= 12          # 直接按名字改，不用记第几个</code></pre>
<p>字典的另一个好处是：<strong>状态可以整体传给函数、整体存下来</strong>。
以后要做存档，<code>json.dump(player)</code> 一句话就写完了。</p>
<h3>动作 = 改状态的函数</h3>
<p>把每个动作看成「一组对状态的修改」，游戏逻辑就变得很好写也很好测。
真正需要小心的是<strong>边界</strong>：血量不能是负数、不能超过上限、资源不够时动作要失效。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>三种边界这一关都有：
血量归零要<strong>停在 0</strong>（不是 -1）、回血要<strong>封顶</strong>（不是 130）、
钱不够或者没药水时动作要<strong>什么都不做</strong>（不是报错，也不是透支）。</div></div>
`,
          starter: `def apply_actions(state, actions):
    """state 形如 {'hp': 100, 'gold': 50, 'potion': 1}
    依次执行 actions 里的每个动作，返回执行完的 state：

      'attack'  hp 减 12，最低减到 0
      'heal'    有药水才能用：消耗 1 瓶，hp 恢复 30，最高到 100；没药水就什么也不做
      'buy'     花 20 金买 1 瓶药水；钱不够就什么也不做

    要求就地修改传进来的 state，并把它返回。
    """

    for act in actions:
        pass   # 换成你的实现

    return state


s = {'hp': 50, 'gold': 50, 'potion': 1}
print(apply_actions(s, ['attack', 'attack', 'heal']))
`,
          check: { type: 'tests', code: `s1 = {'hp': 50, 'gold': 50, 'potion': 1}
r1 = apply_actions(s1, ['attack', 'attack', 'heal'])
assert r1 is s1, "应该就地修改并返回传进来的那个字典本身"
assert r1 == {'hp': 56, 'gold': 50, 'potion': 0}, f"扣血后回血：期望 hp 56 / 药水 0，实际 {r1!r}"

s2 = {'hp': 5, 'gold': 0, 'potion': 2}
r2 = apply_actions(s2, ['heal', 'attack', 'attack', 'attack'])
assert r2 == {'hp': 0, 'gold': 0, 'potion': 1}, f"血量最低停在 0，实际 {r2!r}"

s3 = {'hp': 100, 'gold': 25, 'potion': 0}
r3 = apply_actions(s3, ['buy', 'buy'])
assert r3 == {'hp': 100, 'gold': 5, 'potion': 1}, f"钱不够时不该买，实际 {r3!r}"

s4 = {'hp': 50, 'gold': 0, 'potion': 0}
r4 = apply_actions(s4, ['heal'])
assert r4 == {'hp': 50, 'gold': 0, 'potion': 0}, f"没药水时 heal 应该什么都不做，实际 {r4!r}"

s5 = {'hp': 70, 'gold': 0, 'potion': 1}
r5 = apply_actions(s5, ['heal'])
assert r5['hp'] == 100, f"回血不能超过 100，实际 {r5['hp']}"` },
          hint: '三个动作写成 <code>if/elif</code> 三分支。扣血用 <code>max(0, hp - 12)</code>，回血用 <code>min(100, hp + 30)</code>，买药前先判 <code>gold >= 20</code>。',
          solution: `def apply_actions(state, actions):
    for act in actions:
        if act == 'attack':
            state['hp'] = max(0, state['hp'] - 12)
        elif act == 'heal':
            if state['potion'] > 0:
                state['potion'] -= 1
                state['hp'] = min(100, state['hp'] + 30)
        elif act == 'buy':
            if state['gold'] >= 20:
                state['gold'] -= 20
                state['potion'] += 1
    return state


s = {'hp': 50, 'gold': 50, 'potion': 1}
print(apply_actions(s, ['attack', 'attack', 'heal']))`
        }
      ]
    },
    {
      id: 'tg2', icon: '🧩', title: '棋盘与随机', subtitle: '二维网格 / 胜负判定 / 可复现的随机',
      lessons: [
        {
          id: 'tg2-1', title: '用二维列表表示棋盘', xp: 65,
          goal: '把棋盘写成二维列表，并写出通用的胜负判定。',
          body: `
<h3>棋盘就是一种嵌套列表</h3>
<pre><code>board = [
    ['X', 'O', 'X'],
    ['O', 'X', 'O'],
    ['',  '',  'X'],
]

board[1][2]      # 第 2 行第 3 列 —— 先取行，再取列</code></pre>
<p>几乎所有格子类的东西都是这个形状：井字棋、扫雷、俄罗斯方块、地图、像素画。
记住取值顺序是<strong>「行、列」</strong>（也就是 <code>board[y][x]</code>），
这一条弄反，画出来的东西会整个转 90 度。</p>
<h3>判断输赢：把八条线看成一个整体</h3>
<p>井字棋有 3 行 + 3 列 + 2 条对角线，一共 8 种赢法。
新手常写八个 <code>if</code>，其实可以先把这八条线<strong>收集成一个列表</strong>，
然后统一判断「有没有哪条线的三个格子相同且不为空」。</p>
<p>这样写的好处：代码短、不会漏、以后换成四子棋只改「收集哪些线」这一步。</p>
<h3>「平局」和「还没结束」是两回事</h3>
<p>这个区分非常重要，弄混了会出现「棋盘没满就宣布平局」的经典 bug。
判定的顺序应该是：<strong>先看有没有人赢，再看还有没有空格</strong>。</p>
`,
          starter: `def winner(board):
    """board 是 3 行、每行 3 个格子的列表，格子的值是 'X' / 'O' / ''（空）。

    返回：
      'X' 或 'O'  -> 这一方连成三子
      'draw'       -> 没人赢，但已经没有空格了
      None         -> 还没下完
    """

    # 提示：可以先把 8 条线收集成列表，再统一判断
    return None


full = [
    ['X', 'O', 'X'],
    ['X', 'O', 'O'],
    ['O', 'X', 'X'],
]
print(winner(full))
`,
          check: { type: 'tests', code: `# 三行
assert winner([['X','X','X'], ['O','O',''], ['','','']]) == 'X', "第一行三连，应该判 X 赢"
assert winner([['O','O',''], ['X','X','X'], ['O','','']]) == 'X', "第二行三连，应该判 X 赢"
# 三列
assert winner([['X','O',''], ['X','O',''], ['','O','X']]) == 'O', "第二列三连，应该判 O 赢"
assert winner([['O','X','X'], ['','X','O'], ['','X','']]) == 'X', "第二列三连，应该判 X 赢"
# 两条对角线
assert winner([['X','O','O'], ['O','X','X'], ['O','X','X']]) == 'X', "主对角线三连，应该判 X 赢"
assert winner([['O','X','O'], ['X','O','X'], ['X','X','O']]) == 'O', "副对角线三连，应该判 O 赢"
# 满盘平局
assert winner([['X','O','X'], ['X','O','O'], ['O','X','X']]) == 'draw', "满盘没人三连，应该判平局"
# 还没下完
assert winner([['X','O','X'], ['O','X',''], ['','','']]) is None, "还有空格时应该是 None，不能判平局"
assert winner([['','',''], ['','',''], ['','','']]) is None, "空棋盘应该是 None"
# 顺序：满盘但有人赢，要判赢不能判平局
assert winner([['X','X','X'], ['O','O','X'], ['O','X','O']]) == 'X', "先把「有没有人赢」判在「棋盘满没满」前面"` },
          hint: '先 <code>lines = [r for r in board]</code>，再把每一列 <code>[board[0][c], board[1][c], board[2][c]]</code> 加进去，最后加两条对角线。然后遍历 lines：某个字符不是空串、且三个都相同，就是赢家。全部检查完再判断空格。',
          solution: `def winner(board):
    lines = []
    for r in range(3):
        lines.append([board[r][0], board[r][1], board[r][2]])      # 行
    for c in range(3):
        lines.append([board[0][c], board[1][c], board[2][c]])      # 列
    lines.append([board[0][0], board[1][1], board[2][2]])          # 主对角线
    lines.append([board[0][2], board[1][1], board[2][0]])          # 副对角线

    for line in lines:
        if line[0] != '' and line[0] == line[1] == line[2]:
            return line[0]

    if any(cell == '' for row in board for cell in row):
        return None
    return 'draw'


full = [
    ['X', 'O', 'X'],
    ['X', 'O', 'O'],
    ['O', 'X', 'X'],
]
print(winner(full))`
        },
        {
          id: 'tg2-2', title: '让随机可复现', xp: 70,
          goal: '用 random.Random(seed) 写出可复现的随机战斗，理解「为什么游戏要能重放」。',
          body: `
<h3>随机数有个隐藏问题</h3>
<p>用 <code>random.randint(4, 10)</code> 直接写，每次运行结果都不一样。
平时这没问题，但下面这些场景会立刻崩掉：</p>
<ul>
<li><strong>写测试</strong>：你没法断言「应该打 9 回合」，因为每次都不一样。</li>
<li><strong>联机同步</strong>：两边只要有一个随机数不同，之后整个战局就分叉了。</li>
<li><strong>看回放 / 查 bug</strong>：玩家说「第三回合卡住了」，你复现不出来。</li>
</ul>
<h3>办法：给自己的随机数发生器一个种子</h3>
<pre><code>import random

rng = random.Random(7)     # 种子固定
rng.randint(4, 10)         # 同一个种子，每次运行得到的序列完全一样</code></pre>
<p>关键点：<strong>不要用全局的 <code>random.randint</code>，而是自己 <code>Random(seed)</code> 一个独立发生器</strong>。
这样它跟程序别处的随机互不干扰，也不会被别处悄悄消耗掉。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这就是为什么游戏里会有「随机种子」这个设置：
同一个种子 = 同一局游戏。玩家分享种子就能让别人玩到一模一样的地图。</div></div>
<h3>战斗规则</h3>
<p>玩家先手，双方各 30 点血，轮流攻击，每次伤害取自上面那个序列。
某一方血量掉到 0 或以下，战斗立刻结束 ——
注意是<strong>「立刻」</strong>：玩家把敌人打倒之后，敌人不该再还手一次。</p>
`,
          starter: `import random


def battle(seed):
    """玩家与敌人各有 30 点血，玩家先手，轮流攻击。
    每次攻击的伤害用 random.Random(seed).randint(4, 10) 生成。
    某一方血量 <= 0 时战斗立刻结束，另一方获胜。

    返回 (胜者, 总攻击次数)，胜者是 '玩家' 或 '敌人'。
    """

    rng = random.Random(seed)
    player_hp = 30
    enemy_hp = 30
    rounds = 0

    # 在这里写循环
    return ('玩家', rounds)


print(battle(7))
print(battle(1))
`,
          check: { type: 'tests', code: `import random as _random

def _expect(seed):
    """按题目规则重算一遍，用来对照。"""
    rng = _random.Random(seed)
    php = ehp = 30
    n = 0
    while True:
        n += 1
        ehp -= rng.randint(4, 10)
        if ehp <= 0:
            return ('玩家', n)
        n += 1
        php -= rng.randint(4, 10)
        if php <= 0:
            return ('敌人', n)

for _s in (7, 1, 42, 2026):
    _got = battle(_s)
    _want = _expect(_s)
    assert _got == _want, f"种子 {_s}：期望 {_want}，实际 {_got}（检查是不是用了 Random(seed) 而不是全局 random）"

# 固定种子的结果必须稳定：连着跑两次不能变
assert battle(7) == battle(7), "同一个种子两次结果不一样，说明没有用 Random(seed)"

# 顺序必须是玩家先手 —— 敌人先手的话，下面的结果会明显偏后
assert battle(7)[1] == 9, f"种子 7 应该是 9 次攻击，实际 {battle(7)[1]}（玩家先手，被击倒的一方不再还手）"` },
          hint: '循环写成「玩家打 → 判断敌人是否倒下 → 敌人打 → 判断自己是否倒下」。每次攻击 <code>rounds += 1</code>，伤害用同一个 <code>rng</code> 取 —— 千万别在循环里重新 <code>Random(seed)</code>，那样每次都是同一个数。',
          solution: `import random


def battle(seed):
    rng = random.Random(seed)
    player_hp = 30
    enemy_hp = 30
    rounds = 0

    while True:
        rounds += 1
        enemy_hp -= rng.randint(4, 10)
        if enemy_hp <= 0:
            return ('玩家', rounds)

        rounds += 1
        player_hp -= rng.randint(4, 10)
        if player_hp <= 0:
            return ('敌人', rounds)


print(battle(7))
print(battle(1))`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-game-1', emoji: '🗺️', name: 'ASCII 迷宫', sub: '二维地图 · 广度优先寻路 · 路径回画', color: '#e8f0ff', diff: 2, tag: '游戏实战',
      desc: '在一张字符地图上找到从起点到终点的最短路，并把走过的路画回去。',
      intro: `
<p>寻路是游戏里最常用的一块拼图：NPC 怎么绕过障碍走到你面前、单位怎么自动寻路，
底层都是它。这一关给你一张 10×10 的字符地图：</p>
<pre><code>#  墙，走不过去
.  空地，可以走
S  起点
E  终点</code></pre>
<p>要用的算法叫<strong>广度优先搜索（BFS）</strong>。它的直觉很好理解：
从起点开始，先看「走 1 步能到哪」，再看「走 2 步能到哪」……
一层一层往外扩，<strong>第一次碰到终点的层数就是最短步数</strong>。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>实现上靠一个<strong>队列</strong>：
每次从队头取出一个格子，把它的邻居统统塞到队尾。
Python 里用 <code>collections.deque</code>，<code>popleft()</code> 取队头。</div></div>
<p>关键的反直觉之处：<strong>格子要在「进队列时」就标记为已访问，不能在「出队列时」才标</strong>。
否则同一个格子会被重复塞进去很多次，地图一大就会慢到跑不动。</p>`,
      steps: [
        '先扫一遍地图，把 <code>S</code> 和 <code>E</code> 的坐标找出来。',
        '用 BFS 从 <code>S</code> 出发向外扩，记录每个格子是<strong>从哪个格子走过来的</strong>（这是回画路径的关键）。',
        '走到 <code>E</code> 时，沿「来路」一路倒推回起点，得到完整路径；把步数返回。若走不到，返回 <code>-1</code>。',
        '打印一张新地图：路径上的空地换成 <code>*</code>，<code>S</code> 和 <code>E</code> 保持原样，其余不变。'
      ],
      starter: `from collections import deque

MAZE = [
    "##########",
    "#S...#...#",
    "#.#.#.#.#.",
    "#.#...#..#",
    "#.#####.#.",
    "#.......#.",
    "#.#####.#.",
    "#.#...#...",
    "#...#.#.E#",
    "##########",
]


def solve(maze):
    """返回从 S 到 E 的最少步数（走不到返回 -1），并打印一张标了路径的地图。

    路径上的空地印成 '*'，S 和 E 保持原样。
    """

    # 1) 找 S 和 E
    # 2) BFS，顺便记录每个格子的「来路」
    # 3) 倒推路径
    # 4) 打印并返回步数
    return -1


steps = solve(MAZE)
print('最少步数：', steps)
`,
      check: { type: 'tests', code: `import io, contextlib

_buf = io.StringIO()
with contextlib.redirect_stdout(_buf):
    _got = solve(MAZE)
_out = _buf.getvalue()

assert _got == 14, f"最短步数应该是 14，实际 {_got}"

_lines = [ln for ln in _out.splitlines() if ln.strip()]
_grid = [ln for ln in _lines if set(ln.strip()) <= set('#.*SE')]
assert len(_grid) == len(MAZE), f"打印出来的地图应该有 {len(MAZE)} 行，实际 {len(_grid)} 行"
assert all(len(r) == len(MAZE[0]) for r in _grid), "地图每行宽度不能变"

# 起点终点保持原样
assert _grid[1][1] == 'S', "起点应该还是 S"
assert _grid[8][8] == 'E', "终点应该还是 E"

# 墙不能被改掉
for _y, _row in enumerate(MAZE):
    for _x, _c in enumerate(_row):
        if _c == '#':
            assert _grid[_y][_x] == '#', f"第 {_y+1} 行第 {_x+1} 列的墙被改掉了"

# 星号数量 = 步数 - 1（中间经过的格子）
_stars = sum(r.count('*') for r in _grid)
assert _stars == 13, f"路径上的 '*' 应该是 13 个（14 步中间经过 13 个格子），实际 {_stars}"

# 星号必须是连通的：每个 '*' 至少有一个上下左右的邻居也是路径
_pts = {(x, y) for y, r in enumerate(_grid) for x, c in enumerate(r) if c == '*'}
for (x, y) in _pts:
    _nb = [(x+1,y), (x-1,y), (x,y+1), (x,y-1)]
    _ok = any(p in _pts or _grid[p[1]][p[0]] in 'SE' for p in _nb)
    assert _ok, f"({x},{y}) 处的 '*' 是孤立的，路径没连起来"` },
      hint: 'BFS 用 <code>deque([(sx, sy)])</code> 起头，配一个 <code>came_from</code> 字典记录来路、一个 <code>seen</code> 集合防重复。**进队列时就 <code>seen.add</code>**。找到终点后 <code>while cur != start: path.append(cur); cur = came_from[cur]</code> 倒推。',
      solution: `from collections import deque

MAZE = [
    "##########",
    "#S...#...#",
    "#.#.#.#.#.",
    "#.#...#..#",
    "#.#####.#.",
    "#.......#.",
    "#.#####.#.",
    "#.#...#...",
    "#...#.#.E#",
    "##########",
]


def solve(maze):
    h, w = len(maze), len(maze[0])
    start = end = None
    for y in range(h):
        for x in range(w):
            if maze[y][x] == 'S':
                start = (x, y)
            elif maze[y][x] == 'E':
                end = (x, y)

    q = deque([start])
    seen = {start}
    came_from = {}

    while q:
        cur = q.popleft()
        if cur == end:
            break
        x, y = cur
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            if maze[ny][nx] == '#' or (nx, ny) in seen:
                continue
            seen.add((nx, ny))            # 进队列时就标记，防止重复入队
            came_from[(nx, ny)] = cur
            q.append((nx, ny))

    if end not in seen:
        print(chr(10).join(maze))
        return -1

    # 倒推路径
    path = []
    cur = end
    while cur != start:
        path.append(cur)
        cur = came_from[cur]
    path.reverse()

    steps = len(path)

    grid = [list(row) for row in maze]
    for (x, y) in path[:-1]:
        grid[y][x] = '*'

    print(chr(10).join(''.join(r) for r in grid))
    return steps


steps = solve(MAZE)
print('最少步数：', steps)`
    }
  ]
},
/* ==================== 12. 桌面 GUI 程序 ==================== */
{
  id: 'gui', icon: '🪟', name: '桌面 GUI 程序', tag: '需桌面版',
  desc: '把脚本变成能点、能输入的窗口程序',
  intro: `
<p>到目前为止，你的程序都在终端里跑：打印文字、读取输入。
GUI 程序换了一种「说话方式」—— <strong>不再是一问一答，而是「谁来点什么，我就做什么」</strong>。</p>
<p>这个方向用 Python 标准库自带的 <code>tkinter</code>，不用装任何东西。
它长得朴素，但按钮、输入框、列表、菜单一应俱全，
而且「事件驱动」这套思路换成 Qt、Electron、手机 App 都一样。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div><strong>这个方向只能在桌面版跑。</strong>
浏览器沙箱里没有 tkinter，也没有「窗口」这个概念 ——
那一关的页面会明确标出「需要桌面版」，代码可以读、可以抄，但不能在网页里运行。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这一关有个特别的设计：
题目要求你把界面搭建成一个<strong>函数</strong>，并且<strong>不要调用 <code>mainloop()</code></strong>。
这不是为了考试方便，而是真实工程里写 GUI 的推荐做法 ——
把「搭建界面」和「启动循环」分开，界面才<strong>能被自动化测试</strong>。
不然你只能靠人工一遍遍点。</div></div>`,
  level: '入门 → 进阶',
  needs: ['gui'],
  status: 'ready',
  chapters: [
    {
      id: 'tgu1', icon: '🪟', title: '第一个窗口', subtitle: '控件 / pack 与 grid',
      lessons: [
        {
          id: 'tgu1-1', title: '窗口、标签、按钮', xp: 70,
          needs: ['gui'],
          goal: '创建第一个窗口程序，理解「控件树」和「谁来摆放」。',
          body: `
<h3>一个 GUI 程序的固定套路</h3>
<pre><code>import tkinter as tk

root = tk.Tk()                        # 1. 创建主窗口
label = tk.Label(root, text='你好')    # 2. 创建控件（挂在 root 上）
label.pack()                          # 3. 摆放它
root.mainloop()                       # 4. 进入事件循环，等用户操作</code></pre>
<p>第 3 步是新手最常忘的：<strong>控件创建出来不会自己出现，必须告诉程序怎么摆</strong>。
漏掉 <code>pack()</code> 的症状是「窗口一片空白」，而代码看起来完全正常。</p>
<h3>控件树：一切都有父子关系</h3>
<p><code>tk.Label(root, ...)</code> 的第一个参数是<strong>父容器</strong>。
关掉父窗口，里面的控件一起消失；父窗口移动，子控件跟着走。
整个界面就是一棵树 —— 这和后面学网页的 DOM 树是同一个思路。</p>
<h3>事件循环是什么</h3>
<p><code>mainloop()</code> 是一个「永远不返回」的循环，它在后台不停做两件事：
<strong>等事件</strong>（鼠标点击、键盘输入、窗口重绘）、<strong>把事件派发给对应的处理函数</strong>。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>本关的题目<strong>不让你调 <code>mainloop()</code></strong>。
因为一旦进去，程序就交出了控制权，只能靠人点鼠标 —— 没法自动验证。
你要做的是把界面搭建写成一个函数，
让「搭界面」和「跑循环」分开，这样测试可以自己创建窗口、检查控件、然后关掉。</div></div>
`,
          starter: `import tkinter as tk


def build(root):
    """在 root 上创建两个控件，返回 (label, button)。

    要求：
      - 一个 tk.Label，文字是 '我的第一个程序'
      - 一个 tk.Button，文字是 '点我'
      - 两个都要用 pack() 摆放（都摆上去，顺序不限）
    不要调用 root.mainloop()。
    """

    return None, None


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    win.title('演示')
    build(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()
`,
          check: { type: 'tests', code: `import tkinter as tk

root = tk.Tk()
root.withdraw()                      # 隐藏窗口：不影响检查，也不会弹出来打扰人
try:
    label, button = build(root)
    root.update()

    assert isinstance(label, tk.Label), f"第一个返回值应该是 Label，实际 {type(label).__name__}"
    assert isinstance(button, tk.Button), f"第二个返回值应该是 Button，实际 {type(button).__name__}"
    assert label.cget('text') == '我的第一个程序', f"标签文字不对：{label.cget('text')!r}"
    assert button.cget('text') == '点我', f"按钮文字不对：{button.cget('text')!r}"

    kids = root.winfo_children()
    assert label in kids, "标签没有挂到窗口上"
    assert button in kids, "按钮没有挂到窗口上"

    # 必须真的摆放了（没有 pack/grid/place 的控件不会出现在布局里）
    assert label.winfo_manager() != '', "标签没有摆放（漏了 pack 或 grid）"
    assert button.winfo_manager() != '', "按钮没有摆放（漏了 pack 或 grid）"
finally:
    root.destroy()` },
          hint: '创建控件时第一个参数传父容器：<code>tk.Label(root, text="我的第一个程序")</code>，然后 <code>.pack()</code>。最后 <code>return label, button</code>。注意别写成 <code>tk.Label(text=...)</code> 漏掉 root。',
          solution: `import tkinter as tk


def build(root):
    label = tk.Label(root, text='我的第一个程序')
    label.pack()

    button = tk.Button(root, text='点我')
    button.pack()

    return label, button


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    win.title('演示')
    build(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()`
        },
        {
          id: 'tgu1-2', title: '用 grid 精确摆放', xp: 70,
          needs: ['gui'],
          goal: '用 grid 把控件摆成表格，理解行列坐标。',
          body: `
<h3>pack 和 grid：两种摆放思路</h3>
<ul>
<li><code>pack()</code>：<strong>像往箱子里塞东西</strong>，一个挨一个（默认从上往下）。
简单场景够用，但很难精确控制。</li>
<li><code>grid()</code>：<strong>像填表格</strong>，指定行号和列号。绝大多数界面用它。</li>
</ul>
<pre><code>btn.grid(row=0, column=0)     # 第 0 行第 0 列（左上）
btn.grid(row=0, column=1)     # 第 0 行第 1 列（右上）</code></pre>
<p><strong>行列都从 0 开始数</strong>，和列表下标一致。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>同一个容器里<strong>不要混用 pack 和 grid</strong>，
tkinter 会直接报错。混用通常发生在「后来的代码加了个 pack」的时候，
所以改布局时要留意原来的写法。</div></div>
<h3>grid 的隐藏能力</h3>
<p>grid 不只是排版，它还自动处理「对齐」：同一列的控件宽度会自动一致。
所以真实界面里经常用 grid 做一个透明的大网格，把内容放进去就自然对齐了。</p>
<h3>rowspan / columnspan</h3>
<p>需要跨行或跨列时用 <code>rowspan=2</code> / <code>columnspan=3</code> ——
比如底部那个「确定」按钮横跨三列。</p>
`,
          starter: `import tkinter as tk


def build_grid(root):
    """用 grid 摆出 2x2 的四个按钮，返回 [左上, 右上, 左下, 右下] 四个按钮的列表。

    左上 '1'、右上 '2'、左下 '3'、右下 '4'，位置用 row / column 指定。
    不要用 pack —— 同一个容器里混用 pack 和 grid 会报错。
    """

    return []


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    build_grid(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()
`,
          check: { type: 'tests', code: `import tkinter as tk

root = tk.Tk()
root.withdraw()
try:
    widgets = build_grid(root)
    root.update()

    assert isinstance(widgets, list) and len(widgets) == 4, f"应该返回 4 个按钮的列表，实际 {widgets!r}"
    assert all(isinstance(w, tk.Button) for w in widgets), "四个都应该是 Button"
    assert [w.cget('text') for w in widgets] == ['1', '2', '3', '4'], \\
        f"顺序应该是左上、右上、左下、右下，文字依次为 1/2/3/4。实际 {[w.cget('text') for w in widgets]!r}"

    pos = []
    for w in widgets:
        info = w.grid_info()
        assert info, f"按钮 {w.cget('text')!r} 没有用 grid 摆放"
        pos.append((int(info['row']), int(info['column'])))

    assert pos[0] == (0, 0), f"左上角应该是 (row=0, column=0)，实际 {pos[0]}"
    assert pos[1] == (0, 1), f"右上角应该是 (row=0, column=1)，实际 {pos[1]}"
    assert pos[2] == (1, 0), f"左下角应该是 (row=1, column=0)，实际 {pos[2]}"
    assert pos[3] == (1, 1), f"右下角应该是 (row=1, column=1)，实际 {pos[3]}"

    assert len(root.winfo_children()) == 4, "窗口上应该正好有 4 个控件"
finally:
    root.destroy()` },
          hint: '四个按钮分别 <code>.grid(row=0, column=0)</code>、<code>(row=0, column=1)</code>、<code>(row=1, column=0)</code>、<code>(row=1, column=1)</code>。注意返回列表的顺序是「左上、右上、左下、右下」，不是「按创建顺序」。',
          solution: `import tkinter as tk


def build_grid(root):
    lt = tk.Button(root, text='1'); lt.grid(row=0, column=0)
    rt = tk.Button(root, text='2'); rt.grid(row=0, column=1)
    lb = tk.Button(root, text='3'); lb.grid(row=1, column=0)
    rb = tk.Button(root, text='4'); rb.grid(row=1, column=1)
    return [lt, rt, lb, rb]


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    build_grid(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()`
        }
      ]
    },
    {
      id: 'tgu2', icon: '🖱️', title: '事件与状态', subtitle: '回调函数 / 点击后发生什么',
      lessons: [
        {
          id: 'tgu2-1', title: '按钮点下去之后', xp: 75,
          needs: ['gui'],
          goal: '给按钮绑定回调函数，并让界面上的状态随着点击变化。',
          body: `
<h3>绑定：告诉控件「被点时叫谁」</h3>
<pre><code>def on_click():
    print('被点了')

button = tk.Button(root, text='点我', command=on_click)</code></pre>
<p>注意 <code>command=on_click</code> <strong>不加括号</strong>。
加括号变成 <code>on_click()</code> 意思是「现在就调用它，把结果给它」——
按钮要的是<strong>函数本身</strong>，不是调用结果。
这是 GUI 编程里出现率最高的错误，症状是「程序一启动就执行了一次，之后点按钮没反应」。</p>
<h3>回调怎么改到界面上的值</h3>
<p>回调函数一般不接收参数，那它怎么知道要改哪个控件？
答案是<strong>闭包</strong>：函数定义在外层作用域里，就能直接「看见」外层的变量。</p>
<pre><code>count = [0]                      # 用列表装一个数（后面解释为什么）

def on_click():
    count[0] += 1                # 闭包里改外层变量
    label.config(text=str(count[0]))</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>为什么用 <code>count = [0]</code> 而不是 <code>count = 0</code>？
因为 Python 里只<strong>读</strong>外层变量可以，但一旦要<strong>赋值</strong>，
它就会认为你要创建新的局部变量（然后报 <code>UnboundLocalError</code>）。
列表是「读得到对象、改得了内容」，绕开了这个限制。
另一种写法是在内层函数第一行写 <code>nonlocal count</code>。
两种都对，选一种习惯就好。</div></div>
<h3>怎么自动测试按钮</h3>
<p>tkinter 的按钮有个 <code>invoke()</code> 方法，效果等同于用户点了一下。
所以「点了之后界面变成什么样」这件事<strong>可以被自动化验证</strong> ——
不用截图对比，也不用人工点。</p>
`,
          starter: `import tkinter as tk


def build_counter(root):
    """做一个「点一下加一」的小界面，返回 (label, button)。

    要求：
      - 标签初始显示 '0'
      - 按钮文字是 '加一'
      - 每点一次按钮，标签上的数字加 1
    不要调用 mainloop()。
    """

    return None, None


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    build_counter(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()
`,
          check: { type: 'tests', code: `import tkinter as tk

root = tk.Tk()
root.withdraw()
try:
    label, button = build_counter(root)
    root.update()

    assert isinstance(label, tk.Label), f"第一个返回值应该是 Label，实际 {type(label).__name__}"
    assert isinstance(button, tk.Button), f"第二个返回值应该是 Button，实际 {type(button).__name__}"
    assert label.cget('text') == '0', f"标签初始值应该是 '0'，实际 {label.cget('text')!r}"
    assert button.cget('text') == '加一', f"按钮文字不对：{button.cget('text')!r}"

    button.invoke()
    root.update()
    assert label.cget('text') == '1', f"点一次之后应该是 '1'，实际 {label.cget('text')!r}"

    button.invoke()
    button.invoke()
    root.update()
    assert label.cget('text') == '3', f"再点两次之后应该是 '3'，实际 {label.cget('text')!r}（计数是不是每次都重新开始了？）"

    # 文字必须是字符串，不能是整数或别的
    assert isinstance(label.cget('text'), str), "标签的 text 要是字符串，记得 str() 一下"
finally:
    root.destroy()` },
          hint: '需要一个「能改的」外层变量：<code>count = [0]</code>。回调里 <code>count[0] += 1</code> 再 <code>label.config(text=str(count[0]))</code>。绑定写 <code>command=on_click</code>（<strong>不加括号</strong>）。',
          solution: `import tkinter as tk


def build_counter(root):
    count = [0]
    label = tk.Label(root, text='0')
    label.pack()

    def on_click():
        count[0] += 1
        label.config(text=str(count[0]))

    button = tk.Button(root, text='加一', command=on_click)
    button.pack()
    return label, button


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    build_counter(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()`
        },
        {
          id: 'tgu2-2', title: '输入框与列表', xp: 75,
          needs: ['gui'],
          goal: '把输入框的内容加进列表，并正确处理「空输入」这个边界。',
          body: `
<h3>三个控件配合</h3>
<p>「输入 → 点按钮 → 出现在列表里」是最常见的界面套路，也是待办清单的雏形：</p>
<pre><code>entry = tk.Entry(root)            # 输入框
entry.get()                       # 读出内容
entry.insert(0, '默认值')          # 写入（0 表示插在开头）
entry.delete(0, tk.END)           # 清空

lb = tk.Listbox(root)             # 列表
lb.insert(tk.END, '一条')          # 追加
lb.get(0, tk.END)                 # 读出全部，得到元组</code></pre>
<p>注意 <code>get(0, tk.END)</code> 返回的是<strong>元组</strong>，不是列表 ——
判断时要写 <code>('买菜',)</code> 而不是 <code>['买菜']</code>。这种细节不看文档很难猜到。</p>
<h3>必须处理的边界：空输入</h3>
<p>用户很可能什么都没输就点「添加」。如果不管，
你的列表里会出现一堆空行，看起来像 bug。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>别忘了 <code>.strip()</code>：
只敲了空格的输入，肉眼看不出来，但 <code>if content:</code> 会认为是非空。
所以判断要写 <code>content = entry.get().strip()</code>，再 <code>if not content: return</code>。</div></div>
<h3>为什么「清空输入框」很重要</h3>
<p>如果添加后不清空，用户很容易<strong>再点一次</strong>，同一条就被加了两遍。
这是真实软件里很常见的体验问题，成本极低但很影响手感。</p>
`,
          starter: `import tkinter as tk


def build_todo(root):
    """返回 (entry, button, listbox)。

    要求：
      - entry 是输入框，button 文字是 '添加'，listbox 是列表控件
      - 点「添加」时：
          输入框去空白后如果为空，什么都不做
          否则把内容加到 listbox 末尾，并把输入框清空
    不要调用 mainloop()。
    """

    return None, None, None


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    build_todo(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()
`,
          check: { type: 'tests', code: `import tkinter as tk

root = tk.Tk()
root.withdraw()
try:
    entry, button, lb = build_todo(root)
    root.update()

    assert isinstance(entry, tk.Entry), f"第一个返回值应该是 Entry，实际 {type(entry).__name__}"
    assert isinstance(button, tk.Button), f"第二个返回值应该是 Button，实际 {type(button).__name__}"
    assert isinstance(lb, tk.Listbox), f"第三个返回值应该是 Listbox，实际 {type(lb).__name__}"
    assert button.cget('text') == '添加', f"按钮文字不对：{button.cget('text')!r}"

    entry.insert(0, '买菜')
    button.invoke()
    root.update()
    assert lb.get(0, tk.END) == ('买菜',), f"列表内容不对：{lb.get(0, tk.END)!r}"
    assert entry.get() == '', f"添加之后输入框应该被清空，实际 {entry.get()!r}"

    entry.insert(0, '写代码')
    button.invoke()
    root.update()
    assert lb.get(0, tk.END) == ('买菜', '写代码'), f"应该按顺序追加，实际 {lb.get(0, tk.END)!r}"

    # 空输入：什么都不该发生
    button.invoke()
    root.update()
    assert lb.get(0, tk.END) == ('买菜', '写代码'), "空输入时不该往列表里加东西"

    # 只有空格的输入也要挡住
    entry.insert(0, '   ')
    button.invoke()
    root.update()
    assert lb.get(0, tk.END) == ('买菜', '写代码'), "只有空格的输入也要当成空（记得 strip）"
finally:
    root.destroy()` },
          hint: '回调里先 <code>content = entry.get().strip()</code>，<code>if not content: return</code>，然后 <code>lb.insert(tk.END, content)</code>，最后 <code>entry.delete(0, tk.END)</code> 清空。<code>tk.END</code> 表示末尾。',
          solution: `import tkinter as tk


def build_todo(root):
    entry = tk.Entry(root)
    entry.pack()

    lb = tk.Listbox(root)
    lb.pack()

    def on_add():
        content = entry.get().strip()
        if not content:
            return
        lb.insert(tk.END, content)
        entry.delete(0, tk.END)

    button = tk.Button(root, text='添加', command=on_add)
    button.pack()
    return entry, button, lb


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    build_todo(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-gui-1', emoji: '✅', name: '待办清单桌面版', sub: '输入 · 列表 · 删除 · 计数', color: '#e3f8ef', diff: 2, tag: 'GUI 实战',
      needs: ['gui'],
      desc: '做一个能用的待办清单：添加、删除选中、实时显示剩余条数。',
      intro: `
<p>把前面四个关卡拼在一起，就是一个真正能用的桌面小工具。
功能不大，但每一块都是真实桌面软件的必备部件：</p>
<pre><code>┌──────────────────────────┐
│ [输入框........] [添加]   │
│ ┌──────────────────────┐ │
│ │ 买菜                 │ │
│ │ 写代码               │ │
│ └──────────────────────┘ │
│ [删除选中]   共 2 条      │
└──────────────────────────┘</code></pre>
<p>这一关的难点不在控件本身，而在<strong>「删除」和「计数」的联动</strong>：
删掉一条之后，计数标签必须跟着变。这说明界面上的每一处显示，
都得在「数据变了」的时候被主动更新 —— 这就是「状态同步」。
真实的界面框架（React、Vue）花大力气解决的正是这件事。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>注意本关把「删除选中」设计成<strong>没选中时什么都不做</strong>。
用户没选任何一条却点了删除，安静地无视比弹一堆报错友好得多 ——
这是界面设计里的通行原则：<strong>能忽略的就别打扰用户</strong>。</div></div>`,
      steps: [
        '搭出界面：输入框 + 「添加」按钮 + 列表 + 「删除选中」按钮 + 计数标签。',
        '写 <code>refresh_count()</code>：把计数标签更新成「共 N 条」（N 用 <code>lb.size()</code> 取）。',
        '把「添加」接上：去空白后为空就忽略，否则追加到列表、清空输入框、刷新计数。',
        '把「删除选中」接上：用 <code>lb.curselection()</code> 取选中项（返回的是下标，没选中时是空元组），删掉之后刷新计数。',
        '返回 <code>(entry, add_button, listbox, del_button, count_label)</code> 五个控件。'
      ],
      starter: `import tkinter as tk


def build_todo_app(root):
    """返回 (entry, add_button, listbox, del_button, count_label)。

    界面要求：
      - entry 输入框、add_button 文字 '添加'
      - listbox 列表、del_button 文字 '删除选中'
      - count_label 显示 '共 N 条'，N 是列表里的条数（一开始是 0）

    行为要求：
      - 点「添加」：输入去空白后为空就忽略；否则追加到列表末尾、清空输入框、更新计数
      - 点「删除选中」：没有选中项就什么都不做；否则删掉选中的那条、更新计数
    不要调用 mainloop()。
    """

    return None, None, None, None, None


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    win.title('待办清单')
    build_todo_app(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()
`,
      check: { type: 'tests', code: `import tkinter as tk

root = tk.Tk()
root.withdraw()
try:
    entry, add_btn, lb, del_btn, count = build_todo_app(root)
    root.update()

    assert isinstance(entry, tk.Entry), f"第 1 个应该是 Entry，实际 {type(entry).__name__}"
    assert isinstance(add_btn, tk.Button), f"第 2 个应该是 Button，实际 {type(add_btn).__name__}"
    assert isinstance(lb, tk.Listbox), f"第 3 个应该是 Listbox，实际 {type(lb).__name__}"
    assert isinstance(del_btn, tk.Button), f"第 4 个应该是 Button，实际 {type(del_btn).__name__}"
    assert isinstance(count, tk.Label), f"第 5 个应该是 Label，实际 {type(count).__name__}"
    assert add_btn.cget('text') == '添加', f"添加按钮文字不对：{add_btn.cget('text')!r}"
    assert count.cget('text') == '共 0 条', f"初始计数应该是 '共 0 条'，实际 {count.cget('text')!r}"

    # 加三条
    for t in ('买菜', '写代码', '接孩子'):
        entry.delete(0, tk.END)
        entry.insert(0, t)
        add_btn.invoke()
        root.update()
    assert lb.get(0, tk.END) == ('买菜', '写代码', '接孩子'), f"列表内容不对：{lb.get(0, tk.END)!r}"
    assert count.cget('text') == '共 3 条', f"加完三条后计数应该是 '共 3 条'，实际 {count.cget('text')!r}"

    # 没选中就点删除：什么都不该发生
    del_btn.invoke()
    root.update()
    assert lb.get(0, tk.END) == ('买菜', '写代码', '接孩子'), "没选中时点删除不该删掉任何东西"
    assert count.cget('text') == '共 3 条', "没删东西，计数也不该变"

    # 选中第二条删掉
    lb.selection_clear(0, tk.END)
    lb.selection_set(1)
    del_btn.invoke()
    root.update()
    assert lb.get(0, tk.END) == ('买菜', '接孩子'), f"应该删掉第二条，实际 {lb.get(0, tk.END)!r}"
    assert count.cget('text') == '共 2 条', f"删除后计数要跟着变，实际 {count.cget('text')!r}"

    # 空输入
    entry.delete(0, tk.END)
    entry.insert(0, '   ')
    add_btn.invoke()
    root.update()
    assert lb.get(0, tk.END) == ('买菜', '接孩子'), "只有空格的输入要忽略"
    assert count.cget('text') == '共 2 条', "忽略的输入不该改计数"

    # 全删光，计数回 0
    for i in range(2):
        lb.selection_clear(0, tk.END)
        lb.selection_set(0)
        del_btn.invoke()
        root.update()
    assert lb.get(0, tk.END) == (), f"应该删空了，实际 {lb.get(0, tk.END)!r}"
    assert count.cget('text') == '共 0 条', f"删空后计数应该是 '共 0 条'，实际 {count.cget('text')!r}"
finally:
    root.destroy()` },
      hint: '写一个内层函数 <code>refresh()</code>，里面 <code>count.config(text="共 " + str(lb.size()) + " 条")</code>。「添加」和「删除」最后都调它一次。删除用 <code>sel = lb.curselection()</code>，判断 <code>if not sel: return</code>，然后 <code>lb.delete(sel[0])</code>。',
      solution: `import tkinter as tk


def build_todo_app(root):
    entry = tk.Entry(root, width=28)
    entry.grid(row=0, column=0, padx=6, pady=6)

    lb = tk.Listbox(root, width=32, height=8)
    lb.grid(row=1, column=0, columnspan=2, padx=6, pady=6)

    count = tk.Label(root, text='共 0 条')
    count.grid(row=2, column=1, sticky='e', padx=6)

    def refresh():
        count.config(text='共 ' + str(lb.size()) + ' 条')

    def on_add():
        content = entry.get().strip()
        if not content:
            return
        lb.insert(tk.END, content)
        entry.delete(0, tk.END)
        refresh()

    def on_delete():
        sel = lb.curselection()
        if not sel:
            return
        lb.delete(sel[0])
        refresh()

    add_btn = tk.Button(root, text='添加', command=on_add)
    add_btn.grid(row=0, column=1, padx=6)

    del_btn = tk.Button(root, text='删除选中', command=on_delete)
    del_btn.grid(row=2, column=0, padx=6, pady=6)

    refresh()
    return entry, add_btn, lb, del_btn, count


def demo(seconds=5):
    """开一个真窗口看一眼效果，几秒后自动关闭。

    自动关闭是为了让「运行」按钮不用等你手动关窗 ——
    mainloop() 会一直占着，窗口不关程序就不结束。
    判题时这一段不会执行：判题把你的代码当模块检查，而不是当主程序运行。
    """
    win = tk.Tk()
    win.title('待办清单')
    build_todo_app(win)
    win.after(int(seconds * 1000), win.destroy)
    win.mainloop()


if __name__ == '__main__':
    demo()`
    }
  ]
},

/* ==================== 10. Web 后端开发 ==================== */
{
  id: 'web', icon: '🌉', name: 'Web 后端开发', tag: '部分需桌面版',
  desc: '写出一个能被浏览器访问的服务',
  intro: `
<p>后端做的事，一句话：<strong>收到一个请求，回一段内容</strong>。</p>
<p>这个方向分两半。前半段<strong>在任何设备上都能学</strong>：
把 HTTP 报文当一个字符串手工拼出来、设计一张路由表 ——
这两件事构成了所有后端框架的内核（Flask、Django 干的就是这些）。
后半段要<strong>真的监听一个端口</strong>，浏览器沙箱里做不到，属于桌面版。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>顺序是刻意的：
先用字符串手写一遍响应，你才会明白为什么框架里那些
<code>@app.route</code>、<code>jsonify</code> 要那么设计。
一上来就学框架，很容易变成「只会照着抄」。</div></div>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'tw1', icon: '✉️', title: 'HTTP 报文长什么样', subtitle: '手工拼响应 / 路由表',
      lessons: [
        {
          id: 'tw1-1', title: '手工拼一个 HTTP 响应', xp: 65,
          goal: '按规范拼出响应报文，搞清 Content-Length 为什么必须写对。',
          body: `
<h3>HTTP 就是纯文本</h3>
<p>在爬虫方向你抓下来过网页，那就是一个响应。现在自己造一份 ——
它真的只是字符串，结构非常死板：</p>
<pre><code>HTTP/1.1 200 OK            ← 状态行：协议版本 状态码 原因
Content-Type: text/html    ← 头部：描述正文是什么
Content-Length: 5          ← 头部：正文有多少字节
                           ← 一个空行，表示「头到此为止」
hello                      ← 正文</code></pre>
<h3>三个必须记住的细节</h3>
<ul>
<li><strong>换行是 CRLF</strong>（<code>\\r\\n</code>），不是单独一个 <code>\\n</code>。
这是 HTTP 从电信时代继承下来的规矩。有些客户端宽松，有些严格 —— 照规范写就对了。</li>
<li><strong>头部和正文之间必须有一个空行</strong>。少了它，后面的内容会被当成头部继续解析，
整个响应就废了。</li>
<li><strong>Content-Length 是「字节数」不是「字符数」</strong>。
这是新手最常踩的坑：英文一个字符一字节，中文一个字符<strong>三字节</strong>（UTF-8）。
写成字符数的话，中文页面会显示成乱码或直接截断。</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>Content-Length 算错的后果很典型：
写小了，浏览器只显示前半截；写大了，浏览器<strong>一直转圈等剩下的内容</strong>。
所以 Python 里要写 <code>len(body.encode('utf-8'))</code>，
而不是 <code>len(body)</code>。</div></div>
`,
          starter: `CRLF = chr(13) + chr(10)      # HTTP 规定用 CRLF 换行


def build_response(body, status=200, reason='OK',
                   content_type='text/html; charset=utf-8'):
    """拼一个 HTTP/1.1 响应字符串。

    结构：状态行 CRLF、若干头部 CRLF、一个空行、然后是正文。
    至少要带 Content-Type 和 Content-Length 两个头部。
    注意 Content-Length 是「正文的字节数」。
    """

    return ''


print(repr(build_response('hello')[:40]))
print(build_response('你好')[:80])
`,
          check: { type: 'tests', code: `CRLF = chr(13) + chr(10)

r = build_response('hello')
assert isinstance(r, str), "应该返回字符串"
assert r.startswith('HTTP/1.1 200 OK' + CRLF), f"状态行不对：{r[:30]!r}"
assert CRLF + CRLF in r, "头部和正文之间必须有一个空行"

head, _, body = r.partition(CRLF + CRLF)
assert body == 'hello', f"正文应该是 hello，实际 {body!r}"
assert 'Content-Type: text/html; charset=utf-8' in head, "缺少 Content-Type 头"
assert 'Content-Length: 5' in head, f"Content-Length 应该是 5，实际头部：{head!r}"

# 中文：字节数 ≠ 字符数
r2 = build_response('你好')
assert 'Content-Length: 6' in r2, f"「你好」是 2 个字符、6 个字节，Content-Length 应该是 6（用的是字节数）。实际：{r2[:120]!r}"
assert r2.endswith('你好'), "正文应该原样附在最后"

# 状态码与原因短语要能自定义
r3 = build_response('找不到', status=404, reason='Not Found')
assert r3.startswith('HTTP/1.1 404 Not Found' + CRLF), f"状态行不对：{r3[:30]!r}"
assert 'Content-Length: 9' in r3, f"「找不到」是 3 个汉字 9 字节，实际：{r3[:120]!r}"

r4 = build_response('', status=204, reason='No Content')
assert 'Content-Length: 0' in r4, "空正文的 Content-Length 应该是 0"

# 换行必须是 CRLF，不能只是 LF
assert chr(10) + chr(10) not in r.replace(CRLF, ''), "换行必须是 CRLF，不能只用 LF"` },
          hint: '用列表收集各行再 <code>CRLF.join(...)</code>，最后单独接上空行和正文。状态行是 <code>"HTTP/1.1 " + str(status) + " " + reason</code>。字节数用 <code>len(body.encode("utf-8"))</code>。',
          solution: `CRLF = chr(13) + chr(10)


def build_response(body, status=200, reason='OK',
                   content_type='text/html; charset=utf-8'):
    lines = [
        'HTTP/1.1 ' + str(status) + ' ' + reason,
        'Content-Type: ' + content_type,
        'Content-Length: ' + str(len(body.encode('utf-8'))),
    ]
    return CRLF.join(lines) + CRLF + CRLF + body


print(repr(build_response('hello')[:40]))
print(build_response('你好')[:80])`
        },
        {
          id: 'tw1-2', title: '路由表：路径怎么找到函数', xp: 70,
          goal: '实现一个 dispatch 分发器，理解框架里的路由到底做了什么。',
          body: `
<h3>路由就是一张对照表</h3>
<p>后端收到请求，第一件事是决定「谁来处理它」。最直白的做法就是查表：</p>
<pre><code>('GET',  '/')        ->  返回首页的函数
('GET',  '/about')   ->  返回关于页的函数
('POST', '/about')   ->  处理表单提交的函数</code></pre>
<p>注意键是<strong>「方法 + 路径」的组合</strong>，不是只有路径。
同一个路径下，GET 和 POST 通常是两件不同的事：
一个是「把页面拿给我看」，另一个是「我把数据提交给你」。</p>
<h3>三种结果，各有各的状态码</h3>
<ul>
<li><strong>命中</strong>：调用处理函数，返回 <code>200</code> 和它的返回值。</li>
<li><strong>路径存在、但方法不对</strong>：比如对 <code>/about</code> 发 POST，而这个路径只注册了 GET。
返回 <code>405 Method Not Allowed</code>。「这个地址我知道，但不接受这种做法」。</li>
<li><strong>路径根本不存在</strong>：返回 <code>404 Not Found</code>。</li>
</ul>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>405 和 404 的区别看起来吹毛求疵，但它是有用的：
接口联调时，一个是「地址写错了」，一个是「方法用错了」——
一眼就能定位问题，省掉半小时排查。</div></div>
<h3>为什么用函数当值</h3>
<p>这里会出现 Python 里一个很好用的特性：<strong>函数本身可以像数字、字符串一样存进字典</strong>。
<code>routes[('GET','/')]</code> 取出来的就是一个函数对象，
加个括号 <code>()</code> 就调用它。这叫「一等函数」，
是实现「插件式」结构（路由、事件回调、中间件）的基础。</p>
`,
          starter: `def dispatch(routes, method, path):
    """routes 是 {(方法, 路径): 处理函数} 的字典，处理函数不带参数、返回一个字符串。

    返回 (状态码, 正文)：
      方法和路径都命中 -> (200, 处理函数返回的字符串)
      路径存在但方法不是这个 -> (405, 'Method Not Allowed')
      路径完全不存在 -> (404, 'Not Found')
    """

    return 404, 'Not Found'


routes = {
    ('GET', '/'): lambda: '首页',
    ('GET', '/about'): lambda: '关于我们',
    ('POST', '/about'): lambda: '提交成功',
}
print(dispatch(routes, 'GET', '/'))
print(dispatch(routes, 'POST', '/'))
print(dispatch(routes, 'GET', '/nope'))
`,
          check: { type: 'tests', code: `routes = {
    ('GET', '/'): lambda: '首页',
    ('GET', '/about'): lambda: '关于我们',
    ('POST', '/about'): lambda: '提交成功',
}
assert dispatch(routes, 'GET', '/') == (200, '首页'), f"实际 {dispatch(routes, 'GET', '/')!r}"
assert dispatch(routes, 'GET', '/about') == (200, '关于我们'), f"实际 {dispatch(routes, 'GET', '/about')!r}"
assert dispatch(routes, 'POST', '/about') == (200, '提交成功'), f"同一个路径的不同方法要能分别处理，实际 {dispatch(routes, 'POST', '/about')!r}"
assert dispatch(routes, 'POST', '/') == (405, 'Method Not Allowed'), f"路径在、方法不对应该是 405，实际 {dispatch(routes, 'POST', '/')!r}"
assert dispatch(routes, 'DELETE', '/about') == (405, 'Method Not Allowed'), f"实际 {dispatch(routes, 'DELETE', '/about')!r}"
assert dispatch(routes, 'GET', '/nope') == (404, 'Not Found'), f"路径不存在应该是 404，实际 {dispatch(routes, 'GET', '/nope')!r}"

# 处理函数真的被调用了（而不是只对了个字符串）
calls = []
r2 = {('GET', '/hit'): (lambda: (calls.append(1), '打到了')[1])}
assert dispatch(r2, 'GET', '/hit') == (200, '打到了'), "应该返回处理函数的返回值"
assert calls == [1], "处理函数没有被调用"

# 空路由表
assert dispatch({}, 'GET', '/') == (404, 'Not Found'), "空路由表应该一律 404"` },
          hint: '先试 <code>routes.get((method, path))</code>，有就直接调用。没有的话，再看有没有<strong>同一个 path 配别的方法</strong>：用 <code>any(p == path for (_m, p) in routes)</code> 判断，是就返回 405，否则 404。',
          solution: `def dispatch(routes, method, path):
    handler = routes.get((method, path))
    if handler is not None:
        return 200, handler()

    if any(p == path for _m, p in routes):
        return 405, 'Method Not Allowed'
    return 404, 'Not Found'


routes = {
    ('GET', '/'): lambda: '首页',
    ('GET', '/about'): lambda: '关于我们',
    ('POST', '/about'): lambda: '提交成功',
}
print(dispatch(routes, 'GET', '/'))
print(dispatch(routes, 'POST', '/'))
print(dispatch(routes, 'GET', '/nope'))`
        }
      ]
    },
    {
      id: 'tw2', icon: '🔌', title: '让服务真的跑起来', subtitle: '监听端口 / 自己请求自己',
      lessons: [
        {
          id: 'tw2-1', title: '起一个真的 HTTP 服务', xp: 80,
          needs: ['net'],
          goal: '用标准库起一个能响应真请求的服务，并自己把它测通。',
          body: `
<h3>服务端和客户端的区别</h3>
<p>到目前为止，你的程序都是「主动去问别人」（爬虫就是）。
现在要反过来：<strong>程序坐在那里等别人来问</strong>。</p>
<p>做法是<strong>监听一个端口</strong>。端口就像一个门牌号 ——
机器上可以同时跑很多服务，靠端口号区分谁收这个请求。</p>
<pre><code>from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        self.wfile.write('你好'.encode('utf-8'))</code></pre>
<h3>自己请求自己</h3>
<p>服务起来之后，可以<strong>在同一个程序里用 urllib 去请求它</strong> ——
这是最方便的验证方式，比开浏览器快得多，而且能写进自动化测试。</p>
<p>要注意：服务在后台线程里跑，主线程去请求，最后 <code>shutdown()</code> 收摊，
否则程序不会退出。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>端口号写 <code>0</code> 表示「随便给我一个空闲端口」，
之后用 <code>server.server_address[1]</code> 查出实际分到哪一个。
<strong>写死 8000 这类端口号很容易撞车</strong> ——
你自己的另一个程序、或者同事的服务，都可能占着它。</div></div>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>本关的 <code>BaseHTTPRequestHandler</code> 每次处理完一个请求就断连接，
而且默认是单线程的。真实生产环境会用 Flask / FastAPI 配 gunicorn，
但那些框架底下跑的还是这一套东西。</div></div>
`,
          starter: `import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def dispatch(routes, method, path):
    handler = routes.get((method, path))
    if handler is not None:
        return 200, handler()
    if any(p == path for _m, p in routes):
        return 405, 'Method Not Allowed'
    return 404, 'Not Found'


def start_server(routes):
    """在 127.0.0.1 的随机空闲端口上启动一个 HTTP 服务。

    返回 (server, 端口号)。
    收到的请求交给 dispatch(routes, 方法, 路径)，把 (状态码, 正文) 写成响应：
      - 正文按 UTF-8 编码发出，Content-Type 用 text/html; charset=utf-8
      - 状态码用 dispatch 返回的那个
    服务要在后台线程里跑（daemon 线程），这样不会卡住主程序。
    """

    return None, 0


if __name__ == '__main__':
    routes = {('GET', '/'): lambda: '首页'}
    srv, port = start_server(routes)
    try:
        with urllib.request.urlopen('http://127.0.0.1:' + str(port) + '/', timeout=5) as r:
            print('状态码', r.status, '正文', r.read().decode('utf-8'))
    finally:
        srv.shutdown()
`,
          check: { type: 'tests', code: `import urllib.error as _ue
import urllib.request as _ur

routes = {
    ('GET', '/'): lambda: '首页',
    ('GET', '/api/time'): lambda: '2026-09-16',
    ('POST', '/api/time'): lambda: '已提交',
}

srv, port = start_server(routes)
assert srv is not None, "start_server 应该返回服务对象"
assert isinstance(port, int) and port > 0, f"应该返回真实的端口号，实际 {port!r}"

base = 'http://127.0.0.1:' + str(port)

try:
    with _ur.urlopen(base + '/', timeout=5) as r:
        assert r.status == 200, f"状态码应该是 200，实际 {r.status}"
        assert r.read().decode('utf-8') == '首页', "正文不对"
        ct = r.headers.get('Content-Type') or ''
        assert 'text/html' in ct, f"Content-Type 应该是 text/html，实际 {ct!r}"

    with _ur.urlopen(base + '/api/time', timeout=5) as r:
        assert r.read().decode('utf-8') == '2026-09-16', "第二个路由没生效"

    # 方法不对 -> 405
    req = _ur.Request(base + '/', data=b'x', method='POST')
    try:
        _ur.urlopen(req, timeout=5)
        assert False, "405 应该抛出 HTTPError"
    except _ue.HTTPError as e:
        assert e.code == 405, f"应该是 405，实际 {e.code}"

    # 路径不存在 -> 404
    try:
        _ur.urlopen(base + '/nope', timeout=5)
        assert False, "404 应该抛出 HTTPError"
    except _ue.HTTPError as e:
        assert e.code == 404, f"应该是 404，实际 {e.code}"
finally:
    srv.shutdown()` },
          hint: '定义一个 <code>Handler(BaseHTTPRequestHandler)</code>，在里面实现 <code>do_GET</code>（以及 <code>do_POST</code>）。用 <code>self.path</code> 拿到路径，调 <code>dispatch</code>，然后 <code>send_response(code)</code> → <code>send_header("Content-Type", ...)</code> → <code>end_headers()</code> → <code>self.wfile.write(...)</code>。类里通过 <code>self.server.routes</code> 取路由表。启动用 <code>ThreadingHTTPServer(("127.0.0.1", 0), Handler)</code>，然后 <code>threading.Thread(target=srv.serve_forever, daemon=True).start()</code>。',
          solution: `import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def dispatch(routes, method, path):
    handler = routes.get((method, path))
    if handler is not None:
        return 200, handler()
    if any(p == path for _m, p in routes):
        return 405, 'Method Not Allowed'
    return 404, 'Not Found'


class Handler(BaseHTTPRequestHandler):
    def _respond(self, method):
        code, text = dispatch(self.server.routes, method, self.path)
        body = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._respond('GET')

    def do_POST(self):
        self._respond('POST')

    def log_message(self, *args):
        pass          # 默认会往 stderr 打印访问日志，测试时太吵


def start_server(routes):
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    srv.routes = routes
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv, srv.server_address[1]


if __name__ == '__main__':
    routes = {('GET', '/'): lambda: '首页'}
    srv, port = start_server(routes)
    try:
        with urllib.request.urlopen('http://127.0.0.1:' + str(port) + '/', timeout=5) as r:
            print('状态码', r.status, '正文', r.read().decode('utf-8'))
    finally:
        srv.shutdown()`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-web-1', emoji: '📰', name: '迷你博客 API', sub: '路由分发 · JSON 输出 · 查询参数 · 删除', color: '#e8f0ff', diff: 3, tag: '后端实战',
      needs: ['net'],
      desc: '写一组真正的 JSON 接口：列表、按 id 查、按 id 删，并用 urllib 自己测通。',
      intro: `
<p>这一关做的是标准 REST 风格的接口 —— 前端（App、网页）跟后端打交道，用的就是这个形状。</p>
<p>接口设计如下（<code>GET /api/posts</code>、<code>GET /api/posts?id=2</code> 这种带查询参数的写法）：</p>
<pre><code>GET    /api/posts            列出全部文章，返回 JSON 数组
GET    /api/posts?id=2       返回 id 为 2 的那篇，不存在就 404
DELETE /api/posts?id=1       删掉 id 为 1 的那篇，返回删除后的总数
其他路径                      404</code></pre>
<p>查询参数在 <code>self.path</code> 里是 <code>/api/posts?id=2</code> 这一整串，
需要自己用 <code>?</code> 切开、再解析。标准库的 <code>urllib.parse</code> 里
<code>urlparse</code> 和 <code>parse_qs</code> 就是干这个的。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>JSON 输出要记得把 <code>Content-Type</code> 设成
<code>application/json</code>。另外 <code>json.dumps</code> 默认会把中文转成 <code>\\uXXXX</code> 转义，
加上 <code>ensure_ascii=False</code> 才会输出可读的中文。</div></div>`,
      steps: [
        '用 <code>urlparse(self.path)</code> 把路径和查询串分开：路径是 <code>.path</code>，查询串是 <code>.query</code>。',
        '用 <code>parse_qs(query)</code> 解析参数。注意它返回的值是<strong>列表</strong>，比如 <code>{"id": ["2"]}</code>。',
        '按方法 + 路径分发：<code>GET /api/posts</code> 分两种（带 id 和不带 id），<code>DELETE /api/posts</code> 删一条。',
        '返回值统一成 <code>(状态码, 正文)</code>，正文用 <code>json.dumps(..., ensure_ascii=False)</code> 生成；找不到就返回 <code>404</code> 和一段错误 JSON。'
      ],
      starter: `import json
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

POSTS = [
    {'id': 1, 'title': 'Python 3.14 发布了', 'author': '小皮'},
    {'id': 2, 'title': '为什么 for 循环可以更快', 'author': '阿信'},
    {'id': 3, 'title': '从零理解递归', 'author': '小皮'},
]


def handle(method, path, query):
    """返回 (状态码, 正文)。

    path 是去掉查询串之后的路径，比如 '/api/posts'。
    query 是 parse_qs 解析出来的字典，比如 {'id': ['2']}。

    规则：
      GET    /api/posts         -> 200，全部文章组成的 JSON 数组
      GET    /api/posts?id=2    -> 200，那一篇；id 不存在 -> 404 和 {'error': 'not found'}
      DELETE /api/posts?id=1    -> 200，{'deleted': True, 'count': 剩余数量}；id 不存在 -> 404
      其他                      -> 404 和 {'error': 'not found'}
    """

    return 404, json.dumps({'error': 'not found'}, ensure_ascii=False)


class Handler(BaseHTTPRequestHandler):
    def _send(self, method):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        code, text = handle(method, parsed.path, query)
        body = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send('GET')

    def do_DELETE(self):
        self._send('DELETE')

    def log_message(self, *args):
        pass


def start_server():
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv, srv.server_address[1]


if __name__ == '__main__':
    srv, port = start_server()
    base = 'http://127.0.0.1:' + str(port)
    try:
        print(urllib.request.urlopen(base + '/api/posts', timeout=5).read().decode('utf-8'))
    finally:
        srv.shutdown()
`,
      check: { type: 'tests', code: `import json as _json
import urllib.error as _ue
import urllib.request as _ur

srv, port = start_server()
base = 'http://127.0.0.1:' + str(port)

def _get(path):
    with _ur.urlopen(base + path, timeout=5) as r:
        return r.status, r.read().decode('utf-8'), (r.headers.get('Content-Type') or '')

def _delete(path):
    req = _ur.Request(base + path, method='DELETE')
    try:
        with _ur.urlopen(req, timeout=5) as r:
            return r.status, r.read().decode('utf-8')
    except _ue.HTTPError as e:
        return e.code, e.read().decode('utf-8')

try:
    code, text, ct = _get('/api/posts')
    assert code == 200, f"列表接口状态码应该是 200，实际 {code}"
    assert 'application/json' in ct, f"Content-Type 应该是 application/json，实际 {ct!r}"
    data = _json.loads(text)
    assert isinstance(data, list) and len(data) == 3, f"应该返回 3 篇文章的数组，实际 {data!r}"
    assert data[0]['title'].startswith('Python'), "第一篇的标题不对"
    assert '发布了' in text, "标题里的中文应该原样输出，不要被转义（json.dumps 要加 ensure_ascii=False）"

    code, text, _ = _get('/api/posts?id=2')
    assert code == 200, f"按 id 查应该是 200，实际 {code}"
    one = _json.loads(text)
    assert one['id'] == 2 and one['author'] == '阿信', f"取到的文章不对：{one!r}"

    try:
        _get('/api/posts?id=99')
        assert False, "不存在的 id 应该返回 404"
    except _ue.HTTPError as e:
        assert e.code == 404, f"不存在的 id 应该是 404，实际 {e.code}"
        assert _json.loads(e.read().decode('utf-8')) == {'error': 'not found'}, "404 的正文应该是 JSON 错误信息"

    code, text = _delete('/api/posts?id=1')
    assert code == 200, f"删除应该是 200，实际 {code}"
    res = _json.loads(text)
    assert res.get('deleted') is True and res.get('count') == 2, f"删除结果不对：{res!r}"

    code, text, _ = _get('/api/posts')
    assert len(_json.loads(text)) == 2, "删完之后列表应该只剩 2 篇"

    code, text = _delete('/api/posts?id=99')
    assert code == 404, f"删不存在的 id 应该是 404，实际 {code}"

    try:
        _get('/nope')
        assert False, "未知路径应该返回 404"
    except _ue.HTTPError as e:
        assert e.code == 404, f"未知路径应该是 404，实际 {e.code}"
finally:
    srv.shutdown()` },
      hint: '在 <code>handle</code> 里先判 <code>path == "/api/posts"</code>，再按 <code>method</code> 分。取参数用 <code>query.get("id", [None])[0]</code>（记得 <code>parse_qs</code> 给的是列表），然后 <code>int()</code> 转成数字。删除用列表推导重建 <code>POSTS[:] = [p for p in POSTS if p["id"] != pid]</code>（就地改，别重新赋值整个名字）。',
      solution: `import json
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

POSTS = [
    {'id': 1, 'title': 'Python 3.14 发布了', 'author': '小皮'},
    {'id': 2, 'title': '为什么 for 循环可以更快', 'author': '阿信'},
    {'id': 3, 'title': '从零理解递归', 'author': '小皮'},
]

NOT_FOUND = json.dumps({'error': 'not found'}, ensure_ascii=False)


def handle(method, path, query):
    if path != '/api/posts':
        return 404, NOT_FOUND

    raw_id = query.get('id', [None])[0]

    if method == 'GET':
        if raw_id is None:
            return 200, json.dumps(POSTS, ensure_ascii=False)
        for p in POSTS:
            if p['id'] == int(raw_id):
                return 200, json.dumps(p, ensure_ascii=False)
        return 404, NOT_FOUND

    if method == 'DELETE':
        if raw_id is None:
            return 404, NOT_FOUND
        pid = int(raw_id)
        if not any(p['id'] == pid for p in POSTS):
            return 404, NOT_FOUND
        POSTS[:] = [p for p in POSTS if p['id'] != pid]
        return 200, json.dumps({'deleted': True, 'count': len(POSTS)}, ensure_ascii=False)

    return 404, NOT_FOUND


class Handler(BaseHTTPRequestHandler):
    def _send(self, method):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        code, text = handle(method, parsed.path, query)
        body = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send('GET')

    def do_DELETE(self):
        self._send('DELETE')

    def log_message(self, *args):
        pass


def start_server():
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv, srv.server_address[1]


if __name__ == '__main__':
    srv, port = start_server()
    base = 'http://127.0.0.1:' + str(port)
    try:
        print(urllib.request.urlopen(base + '/api/posts', timeout=5).read().decode('utf-8'))
    finally:
        srv.shutdown()`
    }
  ]
},
/* ==================== 11. 运维自动化 / DevOps ==================== */
{
  id: 'ops', icon: '⚙️', name: '运维自动化 / DevOps', tag: '部分需桌面版',
  desc: '把重复的手工活交给脚本',
  intro: `
<p>运维自动化的核心动机只有一个：<strong>凡是做过第二遍的事，就该写成脚本</strong>。</p>
<p>这一行最看重两件事 —— 文件系统用得熟不熟，以及<strong>敢不敢真的动手改东西</strong>。
所以前半段先做最安全的练习：批量整理文件、批量改名、扫描日志。
这些在任何设备上都能学。后半段要<strong>执行系统命令</strong>（装服务、查进程、定时任务），
浏览器沙箱明确不支持子进程，属于桌面版。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>运维脚本的第一条纪律：
<strong>先打印要做什么，确认无误再加执行</strong>。
一个写错的正则批量改掉三百个文件名，是没有 Ctrl+Z 的。
这个习惯从这一关就开始练 —— 每个函数都要求先返回「打算做什么」。</div></div>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'top1', icon: '📂', title: '文件与目录自动化', subtitle: 'pathlib / 归类 / 批量改名',
      lessons: [
        {
          id: 'top1-1', title: '把乱文件按类型归类', xp: 60,
          goal: '用 pathlib 遍历目录，把文件按扩展名移进对应子目录。',
          body: `
<h3>别再拼字符串路径了</h3>
<p>老代码里到处是 <code>"a" + "/" + "b"</code> 这种拼接，
在 Windows 上要写成反斜杠，跨平台就崩。标准库的 <code>pathlib</code> 解决了这个问题：</p>
<pre><code>from pathlib import Path

p = Path("data")
p / "logs" / "app.txt"        # 用 / 拼路径，跨平台都对
p.suffix                       # '.txt'   扩展名
p.stem                         # 'app'    去掉扩展名
p.name                         # 'app.txt'
p.exists() / p.is_dir() / p.mkdir(parents=True, exist_ok=True)</code></pre>
<p><code>pathlib</code> 里 <code>Path</code> 对象给人的感觉就像「一个路径本身」，
而不是「一串字符串」—— 这个思路上的转变很值。</p>
<h3>遍历与筛选</h3>
<pre><code>for f in folder.iterdir():           # 只列一层
    if f.is_file() and f.suffix:     # 只要文件，且带扩展名
        ...</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>注意区分 <code>iterdir()</code> 和 <code>rglob("*")</code>：
前者只列当前一层，后者会递归钻进所有子目录。
<strong>归类文件必须用 <code>iterdir()</code></strong> —— 否则你刚建好的子目录会被自己再遍历一遍，
文件被搬进 <code>txt/txt/</code> 里。</div></div>
<h3>移动用 shutil</h3>
<p><code>pathlib</code> 负责「找到」，移动要用 <code>shutil.move(源, 目标)</code>。
目录不存在要先建：<code>Path(dst_dir).mkdir(exist_ok=True)</code>。</p>
`,
          starter: `import shutil
from pathlib import Path


def organize(folder):
    """把 folder 里带扩展名的文件，按扩展名移进同名子目录。

    例：report.pdf  ->  pdf/report.pdf
        a.jpg、b.jpg ->  jpg/a.jpg、jpg/b.jpg

    返回 {扩展名: 移动了几个}（扩展名不带点，比如 'pdf'）。
    没有扩展名的文件留在原地不处理。子目录不存在时要自己创建。

    注意：只需要遍历 folder 这一层，不要递归进子目录。
    """

    return {}


if __name__ == '__main__':
    d = Path('demo')
    d.mkdir(exist_ok=True)
    for name in ('a.txt', 'b.txt', 'pic.jpg', 'doc.pdf', 'README'):
        (d / name).write_text('x', encoding='utf-8')
    print(organize(d))
`,
          check: { type: 'tests', code: `import tempfile
from pathlib import Path as _P

box = _P(tempfile.mkdtemp(prefix='pq-ops-'))
for name in ('a.txt', 'b.txt', 'pic.jpg', 'doc.pdf', 'note.pdf', 'README'):
    (box / name).write_text('x', encoding='utf-8')
(box / 'sub').mkdir()                      # 子目录不该被动
(box / 'sub' / 'inner.txt').write_text('x', encoding='utf-8')

res = organize(box)
assert res == {'txt': 2, 'jpg': 1, 'pdf': 2}, f"统计不对：{res!r}"
assert (box / 'txt' / 'a.txt').exists(), "a.txt 应该被移到 txt/ 里"
assert (box / 'pdf' / 'note.pdf').exists(), "note.pdf 应该被移到 pdf/ 里"
assert (box / 'jpg' / 'pic.jpg').exists(), "pic.jpg 应该被移到 jpg/ 里"
assert (box / 'README').exists(), "没有扩展名的文件应该留在原地"
assert not (box / 'a.txt').exists(), "移动之后原位置不该还有"
assert (box / 'sub' / 'inner.txt').exists(), "子目录里的文件不该被动（不要用 rglob 递归）"
# 子目录本身不该被当成文件搬走
assert (box / 'sub').is_dir(), "子目录应该还在"
assert not (box / 'txt' / 'sub').exists(), "子目录不该被归进 txt/"

# 再跑一次：已经归好类的文件会被再次归类，但结果应该稳定
res2 = organize(box)
assert all((box / k).is_dir() for k in ('txt', 'jpg', 'pdf')), "再跑一次不应该把目录结构搞乱"` },
          hint: '用 <code>folder.iterdir()</code> 遍历，判断 <code>f.is_file()</code> 和 <code>f.suffix</code>。扩展名去掉点：<code>f.suffix.lstrip(".").lower()</code>。目标目录 <code>folder / ext</code> 要 <code>mkdir(exist_ok=True)</code>，然后 <code>shutil.move(str(f), str(target))</code>。',
          solution: `import shutil
from pathlib import Path


def organize(folder):
    folder = Path(folder)
    moved = {}
    for f in sorted(folder.iterdir()):
        if not f.is_file() or not f.suffix:
            continue
        ext = f.suffix.lstrip('.').lower()
        dst = folder / ext
        dst.mkdir(exist_ok=True)
        shutil.move(str(f), str(dst / f.name))
        moved[ext] = moved.get(ext, 0) + 1
    return moved


if __name__ == '__main__':
    d = Path('demo')
    d.mkdir(exist_ok=True)
    for name in ('a.txt', 'b.txt', 'pic.jpg', 'doc.pdf', 'README'):
        (d / name).write_text('x', encoding='utf-8')
    print(organize(d))`
        },
        {
          id: 'top1-2', title: '批量重命名', xp: 65,
          goal: '按统一规则给一批文件重新编号命名，并处理「重名冲突」这个真问题。',
          body: `
<h3>统一命名是刚需</h3>
<p>从相机、微信、爬虫攒下来的文件，名字通常毫无规律。
要按顺序归档、要放进文档里引用，就得统一。</p>
<p>最常见的规则是「前缀 + 序号 + 补零」：</p>
<pre><code>报告(1).pdf        报告_001.pdf
报告(2).pdf   -->  报告_002.pdf
报告(10).pdf       报告_003.pdf</code></pre>
<p><strong>补零很重要</strong>：不补零的话，文件名排序会变成
1, 10, 11, 2, 20, 3 —— 因为字符串是从左往右比的。
补成三位（001）就对了。<code>f"{i:03d}"</code> 就是干这个的。</p>
<h3>排序要自己定，不能靠感觉</h3>
<p>「按名字排序」在 Python 里是字符串比较，所以 <code>10</code> 会排在 <code>2</code> 前面。
如果文件名里带数字又想让它们按数值排，得自己写排序键（比如
<code>key=lambda p: int(re.search(r"\\d+", p.name).group())</code>）。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>批量改名有一个隐蔽的坑：
<strong>改名的过程中可能撞上「新名字已经被别的文件占着」</strong>。
安全做法是<strong>先全部改成临时名，再改成目标名</strong>（两趟）。<br>
这个坑在两个系统上的表现完全不同：<strong>Windows 会直接报错</strong>（文件已存在，改不动），
而 <strong>Linux / macOS 会静默覆盖</strong> —— 不报错，但那个文件的内容已经没了。
后者才是真正可怕的。本关的判题里就埋了这个场景，
只用一趟会被明确拦下，并告诉你哪个文件的内容丢了。</div></div>
`,
          starter: `from pathlib import Path


def rename_serial(folder, ext='.txt', prefix='doc'):
    """把 folder 里所有 ext 后缀的文件重命名成 prefix_001 + ext、prefix_002 + ext ...

    顺序按文件原来的名字排序（字符串排序即可）。
    返回新文件名组成的列表（按新序号顺序）。
    只处理 folder 这一层的文件，不动子目录。
    """

    return []


if __name__ == '__main__':
    d = Path('demo2')
    d.mkdir(exist_ok=True)
    for name in ('b.txt', 'a.txt', 'c.txt'):
        (d / name).write_text('x', encoding='utf-8')
    print(rename_serial(d))
`,
          check: { type: 'tests', code: `import tempfile
from pathlib import Path as _P

box = _P(tempfile.mkdtemp(prefix='pq-ren-'))
for name in ('b.txt', 'a.txt', 'c.txt', 'notes.md'):
    (box / name).write_text('x', encoding='utf-8')

out = rename_serial(box)
assert out == ['doc_001.txt', 'doc_002.txt', 'doc_003.txt'], f"返回的应该是新名字列表，实际 {out!r}"
assert (box / 'doc_001.txt').exists() and (box / 'doc_003.txt').exists(), "新文件没生成"
assert not (box / 'a.txt').exists() and not (box / 'c.txt').exists(), "旧文件应该已经改名，不该还在"
assert (box / 'notes.md').exists(), "不是 .txt 的文件不该被动"
assert len(list(box.glob('*.txt'))) == 3, f"txt 文件数应该还是 3，实际 {len(list(box.glob('*.txt')))}"

# 关键：新名字被别的文件占着的时候，不能把内容弄丢
box2 = _P(tempfile.mkdtemp(prefix='pq-ren2-'))
(box2 / 'doc_001.txt').write_text('OLD', encoding='utf-8')   # 这个老文件也会被一起改名
(box2 / 'a.txt').write_text('A', encoding='utf-8')
(box2 / 'b.txt').write_text('B', encoding='utf-8')

out2 = rename_serial(box2)
assert out2 == ['doc_001.txt', 'doc_002.txt', 'doc_003.txt'], f"三个 txt 都应该被处理，实际 {out2!r}"

names = sorted(p.name for p in box2.glob('*.txt'))
assert names == ['doc_001.txt', 'doc_002.txt', 'doc_003.txt'], f"实际文件：{names}"
assert not (box2 / 'a.txt').exists() and not (box2 / 'b.txt').exists(), "旧名字都该改掉"

got = {p.name: p.read_text(encoding='utf-8') for p in box2.glob('*.txt')}
assert got['doc_001.txt'] == 'A', f"a.txt 排在最前，应该拿到 doc_001，实际内容 {got['doc_001.txt']!r}"
assert got['doc_002.txt'] == 'B', f"b.txt 应该拿到 doc_002，实际内容 {got['doc_002.txt']!r}"
assert got['doc_003.txt'] == 'OLD', (
    "原来那个 doc_001.txt 的内容应该被挪到 doc_003.txt，不能丢。"
    "一趟直接改的话，它会被 a.txt 覆盖掉 —— 这就是要先改成临时名的原因")` },
          hint: '先 <code>files = sorted(folder.glob("*" + ext))</code>（glob 只匹配这一层）。为了避开撞名：<strong>先把它们全部改成临时名</strong>（比如 <code>f.rename(folder / (f.name + ".tmp"))</code>），再按顺序 <code>rename</code> 成 <code>f"{prefix}_{i:03d}{ext}"</code>。',
          solution: `from pathlib import Path


def rename_serial(folder, ext='.txt', prefix='doc'):
    folder = Path(folder)
    files = sorted(folder.glob('*' + ext))

    # 第一趟：全部先改成临时名，把目标名字腾空
    temp = []
    for f in files:
        t = folder / (f.name + '.tmp')
        f.rename(t)
        temp.append(t)

    # 第二趟：改成正式的目标名
    out = []
    for i, t in enumerate(temp, start=1):
        new_name = f"{prefix}_{i:03d}{ext}"
        t.rename(folder / new_name)
        out.append(new_name)
    return out


if __name__ == '__main__':
    d = Path('demo2')
    d.mkdir(exist_ok=True)
    for name in ('b.txt', 'a.txt', 'c.txt'):
        (d / name).write_text('x', encoding='utf-8')
    print(rename_serial(d))`
        }
      ]
    },
    {
      id: 'top2', icon: '📋', title: '日志巡检', subtitle: '正则提取 / 分组统计',
      lessons: [
        {
          id: 'top2-1', title: '从日志里读出问题', xp: 70,
          goal: '解析日志文本，统计错误分布，找出最常报的那个错。',
          body: `
<h3>日志是有格式的，别用肉眼找</h3>
<p>运维面对的是几千上万行日志。想从里面找出「什么时候出的问题最多」「哪个错误反复出现」，
必须靠代码统计。</p>
<pre><code>2026-09-16 08:15:21 ERROR 数据库连接超时
└─ 日期   └─ 时间  └─ 级别 └─ 消息</code></pre>
<p><code>line.split()</code> 就能切开前三段，第四段开始是消息
（可能含空格，所以要用 <code>split(None, 3)</code> 限制切分次数）。</p>
<h3>按小时分组：看清楚波峰在哪</h3>
<p>把时间 <code>08:15:21</code> 取出小时 <code>08</code>，用字典累加，
就能画出「哪个小时最忙/最容易出错」。这是运维最常用的一个视角。</p>
<pre><code>hours = {}
hours[hh] = hours.get(hh, 0) + 1     # 计数器的标准写法</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>collections.Counter</code> 可以少写几行：
<code>Counter(级别列表)</code>、<code>.most_common(1)</code> 直接给你出现最多的那个。
但理解 <code>get(k, 0) + 1</code> 这个模式更重要 —— 它不需要导入任何东西。</div></div>
<h3>「最常报的错」为什么重要</h3>
<p>日志里错误有几百条，但往往就那么三四种。
找出占比最高的那个，通常就是<strong>真正要修的那个 bug</strong> ——
剩下的是它的连锁反应。这就是「降噪」。</p>
`,
          starter: `LOG = """2026-09-16 08:12:03 INFO  服务启动完成
2026-09-16 08:15:20 INFO  收到请求 GET /api/posts
2026-09-16 08:15:21 ERROR 数据库连接超时
2026-09-16 08:15:22 WARN  重试第 1 次
2026-09-16 09:02:10 ERROR 磁盘剩余空间不足 5%
2026-09-16 09:02:11 INFO  清理临时文件
2026-09-16 09:30:44 ERROR 数据库连接超时
2026-09-16 10:01:00 WARN  响应时间超过 1s
2026-09-16 10:01:05 INFO  请求处理完成
2026-09-16 11:45:12 ERROR 未捕获异常: KeyError"""


def scan(text):
    """返回一个字典：

      'total'      非空行数
      'errors'     含 'ERROR' 的行数
      'warns'      含 'WARN' 的行数
      'hours'      {两位小时字符串: 该小时的行数}，比如 {'08': 4, '09': 3}
      'top_error'  出现次数最多的「错误消息」（时间戳和级别之后的那段文本）
    """

    return {}


if __name__ == '__main__':
    print(scan(LOG))
`,
          check: { type: 'tests', code: `r = scan(LOG)
assert r['total'] == 10, f"总行数应该是 10，实际 {r['total']}"
assert r['errors'] == 4, f"ERROR 行数应该是 4，实际 {r['errors']}"
assert r['warns'] == 2, f"WARN 行数应该是 2，实际 {r['warns']}"
assert r['hours'] == {'08': 4, '09': 3, '10': 2, '11': 1}, f"按小时统计不对：{r['hours']!r}"
assert r['top_error'] == '数据库连接超时', f"最常报的错应该是「数据库连接超时」，实际 {r['top_error']!r}"

# 空日志不能崩
r2 = scan('')
assert r2['total'] == 0 and r2['errors'] == 0, f"空日志应该返回全 0，实际 {r2!r}"

# 只有一个错误时也要能给出 top_error
r3 = scan('2026-01-01 00:00:00 ERROR 只有一个错误')
assert r3['top_error'] == '只有一个错误', f"实际 {r3['top_error']!r}"

# 错误消息里带空格，不能被切断
r4 = scan('2026-01-01 00:00:00 ERROR 磁盘 空间 不足')
assert r4['top_error'] == '磁盘 空间 不足', f"消息里的空格要保留，实际 {r4['top_error']!r}"` },
          hint: '逐行：<code>if not line.strip(): continue</code>。用 <code>parts = line.split(None, 3)</code> 拿到 <code>[日期, 时间, 级别, 消息]</code>。小时取 <code>parts[1].split(":")[0]</code>。统计用字典 <code>get(k, 0) + 1</code>；最后 <code>max(counts.items(), key=lambda kv: kv[1])[0]</code> 取最多的那个。',
          solution: `LOG = """2026-09-16 08:12:03 INFO  服务启动完成
2026-09-16 08:15:20 INFO  收到请求 GET /api/posts
2026-09-16 08:15:21 ERROR 数据库连接超时
2026-09-16 08:15:22 WARN  重试第 1 次
2026-09-16 09:02:10 ERROR 磁盘剩余空间不足 5%
2026-09-16 09:02:11 INFO  清理临时文件
2026-09-16 09:30:44 ERROR 数据库连接超时
2026-09-16 10:01:00 WARN  响应时间超过 1s
2026-09-16 10:01:05 INFO  请求处理完成
2026-09-16 11:45:12 ERROR 未捕获异常: KeyError"""


def scan(text):
    result = {'total': 0, 'errors': 0, 'warns': 0, 'hours': {}, 'top_error': ''}
    counts = {}

    for line in text.splitlines():
        if not line.strip():
            continue
        parts = line.split(None, 3)
        if len(parts) < 3:
            continue

        result['total'] += 1
        level = parts[2]
        hour = parts[1].split(':')[0]
        result['hours'][hour] = result['hours'].get(hour, 0) + 1

        if level == 'ERROR':
            result['errors'] += 1
            msg = parts[3] if len(parts) > 3 else ''
            counts[msg] = counts.get(msg, 0) + 1
        elif level == 'WARN':
            result['warns'] += 1

    if counts:
        result['top_error'] = max(counts.items(), key=lambda kv: kv[1])[0]
    return result


if __name__ == '__main__':
    print(scan(LOG))`
        }
      ]
    },
    {
      id: 'top3', icon: '🖥️', title: '执行系统命令', subtitle: 'subprocess / 巡检脚本',
      lessons: [
        {
          id: 'top3-1', title: '让脚本去跑命令', xp: 75,
          needs: ['process'],
          goal: '用 subprocess 执行外部命令，拿到返回码和输出并做判断。',
          body: `
<h3>为什么还需要调外部命令</h3>
<p>Python 能做的事很多，但有些事情还是得交给专门的工具：
<code>git</code> 拉代码、<code>ffmpeg</code> 转视频、<code>systemctl</code> 重启服务、
<code>ping</code> 检查网络。这些是现成的命令行程序，Python 只要会<strong>调用它们</strong>就够了。</p>
<pre><code>import subprocess

r = subprocess.run(['git', 'status'], capture_output=True)
r.returncode      # 0 表示成功，非 0 表示失败
r.stdout          # 标准输出的字节
r.stderr          # 标准错误的字节</code></pre>
<h3>三个必须注意的点</h3>
<ul>
<li><strong>命令写成列表</strong>，不要写成一整串字符串。
<code>['ls', '-l', 'docs']</code> 比 <code>"ls -l docs"</code> 安全得多 ——
带空格的路径（比如 <code>My Documents</code>）用字符串会被切成两段。</li>
<li><strong>输出是字节（bytes）</strong>，要 <code>.decode()</code> 才能当字符串用。
中文在 Windows 上常见的是 GBK 编码，跨平台脚本里通常写
<code>decode('utf-8', errors='replace')</code> 兜底。</li>
<li><strong>返回码 0 才是成功</strong>。这一点和大多数编程语言里「0 是假」的直觉相反，
所以判断要写 <code>if r.returncode == 0:</code>，别写 <code>if r.returncode:</code>。</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>这一关只能在桌面版跑。浏览器沙箱里的 Python 是
编译成 WebAssembly 运行的，<strong>根本没有「进程」这个概念</strong>，
调用会直接报 <code>emscripten does not support processes</code>。
这不是缺了某个库，而是整个运行模型的限制。</div></div>`,
          starter: `import subprocess
import sys


def run_cmd(args):
    """执行一条命令，返回 (返回码, 标准输出, 标准错误)。

    args 是命令的列表形式，比如 [sys.executable, '-c', 'print(1)']。
    输出要 decode 成字符串（用 utf-8，解码失败用 replace 兜底）。
    命令执行本身出错（比如程序不存在）时，不要让异常冒出去 ——
    这种情况下返回码用一个非 0 的值（比如 -1）。
    """

    return -1, '', ''


if __name__ == '__main__':
    print(run_cmd([sys.executable, '-c', 'print(1 + 1)']))
`,
          check: { type: 'tests', code: `import sys as _sys

# 正常命令
code, out, err = run_cmd([_sys.executable, '-c', 'print("hello")'])
assert code == 0, f"成功命令的返回码应该是 0，实际 {code}"
assert out.strip() == 'hello', f"标准输出不对：{out!r}"
assert isinstance(out, str) and isinstance(err, str), "输出必须是字符串（要 decode）"

# 失败命令：返回码非 0，错误在 stderr
code2, out2, err2 = run_cmd([_sys.executable, '-c', 'import sys; sys.stderr.write("boom"); sys.exit(3)'])
assert code2 == 3, f"返回码应该原样传出来，实际 {code2}"
assert 'boom' in err2, f"标准错误没拿到：{err2!r}"

# 中文输出不能乱码
code3, out3, _ = run_cmd([_sys.executable, '-c', 'print("中文测试")'])
assert '中文测试' in out3, f"中文输出乱了：{out3!r}"

# 命令不存在时不能抛异常
code4, out4, err4 = run_cmd(['definitely-not-a-real-command-xyz'])
assert code4 != 0, f"找得到的命令应该返回非 0，实际 {code4}"
assert isinstance(err4, str), "这种情况也要返回字符串"` },
          hint: '用 <code>subprocess.run(args, capture_output=True)</code>，外面套 <code>try/except (OSError, FileNotFoundError)</code>。解码写 <code>r.stdout.decode("utf-8", errors="replace")</code>。<strong>别加 <code>check=True</code> / 别用 <code>shell=True</code>。</strong>',
          solution: `import subprocess
import sys


def run_cmd(args):
    try:
        r = subprocess.run(args, capture_output=True)
    except OSError as e:
        return -1, '', str(e)

    return (r.returncode,
            r.stdout.decode('utf-8', errors='replace'),
            r.stderr.decode('utf-8', errors='replace'))


if __name__ == '__main__':
    print(run_cmd([sys.executable, '-c', 'print(1 + 1)']))`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-ops-1', emoji: '🧾', name: '日志巡检报告', sub: '解析 · 分组统计 · 生成 Markdown 报告', color: '#fdecec', diff: 2, tag: '运维实战',
      desc: '扫描一段日志，算出问题分布，生成一份能直接发给同事的巡检报告。',
      intro: `
<p>这一关模拟真实的值班场景：给你一段服务日志，
你要交出一份<strong>「哪位同事看了都知道该先修什么」</strong>的报告。</p>
<p>报告的价值不在数据本身（数据是原始日志里就有的），
而在于<strong>组织方式</strong>：先给结论（整体健康度），再给证据（错误排行、按小时分布），
最后给建议（先查哪个）。这个顺序是运维文档的通用写法。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>报告要写成<strong>文件</strong>，不是只打印在屏幕上。
运维产出的东西大多是文件 —— 要归档、要发给别人、要进工单系统。
用 <code>Path.write_text(..., encoding="utf-8")</code>，别忘 encoding，
不然在 Windows 上中文会变成乱码。</div></div>`,
      steps: [
        '解析日志：统计总行数、ERROR / WARN 条数、按小时的行数分布。',
        '统计每个错误消息出现了几次，按次数<strong>从多到少</strong>排序。',
        '判断健康度：错误率（errors / total）低于 20% 算「正常」，否则「需要关注」。',
        '把上面这些拼成一份 Markdown 文本：有一级标题、结论、错误排行表、按小时分布。',
        '写进 <code>out_path</code> 指定的文件（UTF-8），并把这个字符串返回。'
      ],
      starter: `from pathlib import Path

LOG = """2026-09-16 08:12:03 INFO  服务启动完成
2026-09-16 08:15:20 INFO  收到请求 GET /api/posts
2026-09-16 08:15:21 ERROR 数据库连接超时
2026-09-16 08:15:22 WARN  重试第 1 次
2026-09-16 09:02:10 ERROR 磁盘剩余空间不足 5%
2026-09-16 09:02:11 INFO  清理临时文件
2026-09-16 09:30:44 ERROR 数据库连接超时
2026-09-16 10:01:00 WARN  响应时间超过 1s
2026-09-16 10:01:05 INFO  请求处理完成
2026-09-16 11:45:12 ERROR 未捕获异常: KeyError"""


def build_report(log_text, out_path):
    """生成巡检报告，写进 out_path（UTF-8），并返回报告文本。

    报告里必须包含这些内容（格式可以自己设计，但关键字要出现）：
      - 第一行是 '# 日志巡检报告'
      - 一行 '结论：正常' 或 '结论：需要关注'（错误率 = ERROR 行数 / 总行数，
        小于 0.2 算正常）
      - 一行 '总行数：N'、'错误：N'、'警告：N'
      - 错误排行：每个错误消息和它的次数，按次数从多到少
      - 按小时分布：每个小时和行数
    """

    return ''


if __name__ == '__main__':
    text = build_report(LOG, 'report.md')
    print(text)
`,
      check: { type: 'tests', code: `import tempfile
from pathlib import Path as _P

out = _P(tempfile.mkdtemp(prefix='pq-rep-')) / 'report.md'
text = build_report(LOG, out)

assert isinstance(text, str) and text.strip(), "应该返回报告文本"
assert out.exists(), f"报告文件没写出来：{out}"
assert out.read_text(encoding='utf-8') == text, "文件内容和返回的字符串应该一致（都用 UTF-8）"

lines = text.splitlines()
assert lines[0].startswith('# 日志巡检报告'), f"第一行应该是报告标题，实际 {lines[0]!r}"

assert '结论：' in text, "报告里要有结论"
assert '需要关注' in text, f"4 个错误 / 10 行 = 40%，超过 20%，结论应该是「需要关注」"

assert '总行数：10' in text, f"总行数要写对。报告全文：{text[:400]!r}"
assert '错误：4' in text, "ERROR 条数要写对（4 条）"
assert '警告：2' in text, "WARN 条数要写对（2 条）"

# 错误排行：出现最多的那个必须排在前面
i_top = text.index('数据库连接超时')
i_other = text.index('磁盘剩余空间不足 5%')
assert i_top < i_other, "「数据库连接超时」(2 次) 应该排在只出现 1 次的错误前面"

# 每个错误消息都要出现
for msg in ('数据库连接超时', '磁盘剩余空间不足 5%', '未捕获异常: KeyError'):
    assert msg in text, f"错误排行里应该有「{msg}」"

# 按小时分布
for hh, n in (('08', 4), ('09', 3), ('10', 2), ('11', 1)):
    assert hh in text, f"按小时分布里应该有 {hh} 点这一行"

# 换个日志：错误率低的时候结论要变
calm = chr(10).join([
    '2026-09-16 08:00:00 INFO  正常',
    '2026-09-16 08:01:00 INFO  正常',
    '2026-09-16 08:02:00 INFO  正常',
    '2026-09-16 08:03:00 INFO  正常',
    '2026-09-16 08:04:00 INFO  正常',
    '2026-09-16 08:05:00 ERROR 小问题',
])
text2 = build_report(calm, out)
assert '结论：正常' in text2, f"1/6 约 17%，低于 20%，结论应该是「正常」。实际报告：{text2[:300]!r}"` },
      hint: '用一个字典 <code>errs</code> 数错误消息出现次数，最后 <code>sorted(errs.items(), key=lambda kv: -kv[1])</code> 得到排行。报告用列表收集每一行，最后 <code>chr(10).join(lines)</code>。写文件：<code>Path(out_path).write_text(text, encoding="utf-8")</code>。',
      solution: `from pathlib import Path

LOG = """2026-09-16 08:12:03 INFO  服务启动完成
2026-09-16 08:15:20 INFO  收到请求 GET /api/posts
2026-09-16 08:15:21 ERROR 数据库连接超时
2026-09-16 08:15:22 WARN  重试第 1 次
2026-09-16 09:02:10 ERROR 磁盘剩余空间不足 5%
2026-09-16 09:02:11 INFO  清理临时文件
2026-09-16 09:30:44 ERROR 数据库连接超时
2026-09-16 10:01:00 WARN  响应时间超过 1s
2026-09-16 10:01:05 INFO  请求处理完成
2026-09-16 11:45:12 ERROR 未捕获异常: KeyError"""


def build_report(log_text, out_path):
    total = errors = warns = 0
    hours = {}
    errs = {}

    for line in log_text.splitlines():
        if not line.strip():
            continue
        parts = line.split(None, 3)
        if len(parts) < 3:
            continue
        total += 1
        hh = parts[1].split(':')[0]
        hours[hh] = hours.get(hh, 0) + 1
        level = parts[2]
        if level == 'ERROR':
            errors += 1
            msg = parts[3] if len(parts) > 3 else ''
            errs[msg] = errs.get(msg, 0) + 1
        elif level == 'WARN':
            warns += 1

    rate = errors / total if total else 0.0
    verdict = '需要关注' if rate >= 0.2 else '正常'

    lines = [
        '# 日志巡检报告',
        '',
        '结论：' + verdict,
        '',
        '总行数：' + str(total),
        '错误：' + str(errors),
        '警告：' + str(warns),
        '',
        '## 错误排行',
    ]
    for msg, n in sorted(errs.items(), key=lambda kv: -kv[1]):
        lines.append('- ' + msg + '  ' + str(n) + ' 次')

    lines.append('')
    lines.append('## 按小时分布')
    for hh in sorted(hours):
        lines.append('- ' + hh + ' 点  ' + str(hours[hh]) + ' 行')

    text = chr(10).join(lines)
    Path(out_path).write_text(text, encoding='utf-8')
    return text


if __name__ == '__main__':
    print(build_report(LOG, 'report.md'))`
    }
  ]
},
/* ==================== 8. 人工智能与机器学习 ==================== */
{
  id: 'ai', icon: '🤖', name: '人工智能与机器学习', tag: '零依赖',
  desc: '先自己动手造一个模型，再谈怎么用现成的',
  intro: `
<p>机器学习听起来很玄，但删掉包装之后只剩一句：<strong>找一组数字，
让输入经过简单运算后得到想要的输出</strong>。</p>
<p>找哪组数字？<strong>不是人试出来的，而是让程序自己沿着「错得少」的方向一步步调</strong>。
这就是「学习」的全部含义。这个方向不调用任何第三方库，
用纯 Python 从零写出感知机、梯度下降和 KNN —— 因为只有手写过一遍，
你才知道调库时那些参数到底在调什么。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这一路只用到 <code>math</code> 和列表。
真正做工程时会用 scikit-learn / PyTorch，但那是「换工具」，
不是「换知识」—— 这里的每一步在那些库里都能找到对应的名字。</div></div>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'tai1', icon: '🧠', title: '从一条线开始', subtitle: '加权求和 / 权重更新 / 训练循环',
      lessons: [
        {
          id: 'tai1-1', title: '模型就是一次加权求和', xp: 60,
          goal: '写出感知机的预测部分，理解权重在表达「哪个输入更重要」。',
          body: `
<h3>最古老的神经元，其实只有一行算术</h3>
<p>感知机（perceptron）是整个神经网络的祖先，它的计算过程是：</p>
<pre><code>每项输入 × 对应的权重，加起来，再加一个偏置
结果 > 0 就输出 1，否则输出 0</code></pre>
<pre><code>0.4 × x1 + 0.9 × x2 + (-1.2)   > 0  ?  1 : 0</code></pre>
<p>这里每个<strong>权重</strong>的意思就是「这一项输入有多重要」。
权重是 0.9 的那一项，对结果的影响是 0.4 那项的两倍多；
权重为负，表示这一项<strong>越大反而越该判成 0</strong>。</p>
<p><strong>偏置</strong>是整体的门槛：偏置越小，模型越"难被说服"。</p>
<h3>三个容易踩的坑</h3>
<ul>
<li><strong>边界 0 算不算通过？</strong>不算。条件是「严格大于 0」，
所以加权和正好等于 0 时输出 <code>0</code>。这种边界值是判错的常见来源。</li>
<li><strong>权重和输入必须一一对应</strong>。用 <code>zip</code> 配对最安全，
按顺序写两个下标很容易错位。</li>
<li><strong>结果必须是整数 0 / 1</strong>，不是 True / False，也不是浮点数。</li>
</ul>
`,
          starter: `def predict(weights, bias, x):
    """weights 与 x 等长。返回 1 或 0。

    判断规则：sum(权重 × 输入) + 偏置 > 0 时返回 1，否则返回 0。
    """

    total = 0.0
    # 在这里写加权求和
    return 0


print(predict([1, 1], -1.5, [1, 1]))
print(predict([1, 1], -1.5, [1, 0]))
`,
          check: { type: 'tests', code: `assert predict([1, 1], -1.5, [1, 1]) == 1, "1+1-1.5 = 0.5 > 0，应该输出 1"
assert predict([1, 1], -1.5, [1, 0]) == 0, "1+0-1.5 = -0.5，应该输出 0"
assert predict([2, -1], 0, [1, 1]) == 1, "2-1 = 1 > 0，应该输出 1"
assert predict([-1, -1], 2, [1, 1]) == 0, "正好等于 0 不算通过，应该输出 0"
assert predict([0.5], -0.25, [1]) == 1, "0.5-0.25 = 0.25 > 0，应该输出 1"
assert predict([0.5], -0.5, [1]) == 0, "正好等于 0，应该输出 0"
assert predict([1, 1, 1], -10, [1, 1, 1]) == 0, "偏置太小，应该输出 0"
assert predict([0.1, 0.1, 0.1], -0.25, [1, 1, 1]) == 1, "0.3-0.25 = 0.05 > 0，应该输出 1"
# 类型也要对：必须是 int 的 0 / 1
assert isinstance(predict([1], 0, [1]), int) and not isinstance(predict([1], 0, [1]), bool), "返回值应该是整数 0 / 1"` },
          hint: '用 <code>for w, xi in zip(weights, x): total += w * xi</code>，最后 <code>return 1 if total + bias &gt; 0 else 0</code>。注意是「大于」不是「大于等于」。',
          solution: `def predict(weights, bias, x):
    total = 0.0
    for w, xi in zip(weights, x):
        total += w * xi
    return 1 if total + bias > 0 else 0


print(predict([1, 1], -1.5, [1, 1]))
print(predict([1, 1], -1.5, [1, 0]))`
        },
        {
          id: 'tai1-2', title: '让它自己学：权重更新', xp: 70,
          goal: '写出感知机的训练循环，看它自己学会 OR 和 AND。',
          body: `
<h3>「学习」就是不断改参数</h3>
<p>上一关的权重是人手填的。真正的机器学习是让程序自己找 —— 办法朴素得惊人：</p>
<pre><code>拿一个样本算一遍预测
如果预测对了     -> 什么都不做
如果预测错了     -> 朝着「正确答案」的方向挪一点</code></pre>
<p>挪多少？公式只有三行：</p>
<pre><code>误差 e = 标签 - 预测              # 只可能是 -1、0、1
权重 w[i] += 学习率 × e × 输入 x[i]
偏置 b    += 学习率 × e</code></pre>
<p>关键在 <code>e × x[i]</code> 这一项：</p>
<ul>
<li><strong>该输出 1 却给了 0</strong>（e = +1）：权重变大 —— 下次更容易判成 1。</li>
<li><strong>该输出 0 却给了 1</strong>（e = -1）：权重变小。</li>
<li><strong>输入是 0 的那一项，权重纹丝不动</strong> —— 很合理，它本来就没参与这次的判断。</li>
</ul>
<h3>为什么这个过程一定能成</h3>
<p>你可能会担心「这样乱挪，会不会越挪越差」。
对于<strong>线性可分</strong>的数据（OR 和 AND 都是），
有一个著名的结论：只要数据分得开，这个过程<strong>有限步内一定会停</strong>。
但换成 XOR 就永远学不会 —— 那需要两层，这是后面神经网络要解决的问题。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>epochs</code>（轮数）的意思是把整个数据集看几遍。
学习率 <code>lr</code> 是每步挪多大 —— 太大容易来回震荡，太小又慢。</div></div>
`,
          starter: `def predict(weights, bias, x):
    total = 0.0
    for w, xi in zip(weights, x):
        total += w * xi
    return 1 if total + bias > 0 else 0


def fit(X, y, epochs=20, lr=0.1):
    """训练一个感知机，返回 (weights, bias)。

    weights 初始为与特征数等长的全 0 列表，bias 初始为 0。
    每一轮里按顺序过一遍所有样本，每次更新：
        预测 = predict(weights, bias, 样本)
        误差 e = 标签 - 预测
        weights[i] += lr * e * 样本[i]
        bias       += lr * e
    """

    weights = [0.0] * len(X[0])
    bias = 0.0
    # 在这里写训练循环
    return weights, bias


X_or = [[0, 0], [0, 1], [1, 0], [1, 1]]
y_or = [0, 1, 1, 1]
w, b = fit(X_or, y_or)
print(w, b)
`,
          check: { type: 'tests', code: `X_or = [[0, 0], [0, 1], [1, 0], [1, 1]]
y_or = [0, 1, 1, 1]
w1, b1 = fit(X_or, y_or)
assert len(w1) == 2, f"权重个数应该和特征数一样，实际 {len(w1)}"
assert [predict(w1, b1, xi) for xi in X_or] == y_or, f"OR 没学会：预测 {[predict(w1, b1, xi) for xi in X_or]}，实际标签 {y_or}"

X_and = [[0, 0], [0, 1], [1, 0], [1, 1]]
y_and = [0, 0, 0, 1]
w2, b2 = fit(X_and, y_and)
assert [predict(w2, b2, xi) for xi in X_and] == y_and, f"AND 没学会：预测 {[predict(w2, b2, xi) for xi in X_and]}，实际标签 {y_and}"

# 初始值必须是全 0 —— 否则「自己学出来」这件事就不成立了
w0, b0 = fit([[1, 1]], [1], epochs=0)
assert w0 == [0.0, 0.0] and b0 == 0.0, f"epochs=0 时应该返回初始权重全 0，实际 {w0!r} {b0}"

# 训练确实改变了参数
assert w1 != [0.0, 0.0] or b1 != 0.0, "训练之后参数不应该还是全 0"` },
          hint: '外层 <code>for _ in range(epochs):</code>，内层 <code>for xi, yi in zip(X, y):</code>。算出 <code>e = yi - predict(weights, bias, xi)</code> 后，用 <code>for i in range(len(weights)): weights[i] += lr * e * xi[i]</code> 再 <code>bias += lr * e</code>。',
          solution: `def predict(weights, bias, x):
    total = 0.0
    for w, xi in zip(weights, x):
        total += w * xi
    return 1 if total + bias > 0 else 0


def fit(X, y, epochs=20, lr=0.1):
    weights = [0.0] * len(X[0])
    bias = 0.0
    for _ in range(epochs):
        for xi, yi in zip(X, y):
            e = yi - predict(weights, bias, xi)
            for i in range(len(weights)):
                weights[i] += lr * e * xi[i]
            bias += lr * e
    return weights, bias


X_or = [[0, 0], [0, 1], [1, 0], [1, 1]]
y_or = [0, 1, 1, 1]
w, b = fit(X_or, y_or)
print(w, b)`
        }
      ]
    },
    {
      id: 'tai2', icon: '📉', title: '梯度下降与近邻', subtitle: '损失函数 / 学习率 / KNN',
      lessons: [
        {
          id: 'tai2-1', title: '沿着下坡走：梯度下降', xp: 75,
          goal: '用梯度下降拟合一条直线，理解损失函数和学习率的作用。',
          body: `
<h3>从「猜得对不对」到「差多少」</h3>
<p>感知机只关心对错。但如果要预测一个<strong>数</strong>（房价、销量、温度），
"对了/错了"就不够用了 —— 需要一把尺子量「差多少」，这就是<strong>损失函数</strong>。</p>
<p>最常用的是均方误差（MSE）：把所有样本的「预测值 - 真实值」平方后求平均。
平方有两个作用：让正负误差不会互相抵消，以及<strong>罚大错罚得更狠</strong>。</p>
<pre><code>MSE = (1/n) × Σ (预测 - 真实)²</code></pre>
<h3>往哪个方向调？求导</h3>
<p>把 MSE 分别对 <code>w</code> 和 <code>b</code> 求导，就能得到「往哪边调能减小损失」：</p>
<pre><code>对 w 的梯度 = (2/n) × Σ (预测 - 真实) × x
对 b 的梯度 = (2/n) × Σ (预测 - 真实)</code></pre>
<p>然后<strong>减去</strong>梯度（所以叫「下降」）：</p>
<pre><code>w -= lr × grad_w
b -= lr × grad_b</code></pre>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>注意梯度的符号含义：预测<strong>偏大</strong>时梯度为正，
减去它就把 w 调小 —— 正是我们想要的。<strong>公式的符号不用死记，
理解「预测大了就往下调」就不会写反。</strong></div></div>
<h3>学习率是唯一要调的东西</h3>
<ul>
<li><strong>太大</strong>：一步跨过谷底，损失来回震荡甚至越来越大。</li>
<li><strong>太小</strong>：方向对，但要很多轮才走得下去。</li>
</ul>
<p>这一关的数据是精确的 <code>y = 2x + 1</code>（没有噪声），
所以只要轮数够，答案应该收敛到 w ≈ 2、b ≈ 1。</p>
`,
          starter: `def fit_line(xs, ys, epochs=2000, lr=0.01):
    """用梯度下降拟合 y = w * x + b，返回 (w, b)。

    w 和 b 都从 0.0 开始。每一轮：
        preds = [w * x + b for x in xs]
        errs  = [p - y for p, y in zip(preds, ys)]
        grad_w = (2/n) * sum(e * x for e, x in zip(errs, xs))
        grad_b = (2/n) * sum(errs)
        w -= lr * grad_w
        b -= lr * grad_b
    """

    w = 0.0
    b = 0.0
    # 在这里写迭代
    return w, b


xs = [1.0, 2.0, 3.0, 4.0, 5.0]
ys = [2 * x + 1 for x in xs]
print(fit_line(xs, ys))
`,
          check: { type: 'tests', code: `xs = [1.0, 2.0, 3.0, 4.0, 5.0]
ys = [2 * x + 1 for x in xs]
w, b = fit_line(xs, ys)
assert abs(w - 2.0) < 0.05, f"斜率应该收敛到 2，实际 {w:.4f}"
assert abs(b - 1.0) < 0.05, f"截距应该收敛到 1，实际 {b:.4f}"

# 换一组数据，验证不是碰巧
xs2 = [0.0, 1.0, 2.0, 3.0]
ys2 = [3 * x - 2 for x in xs2]
w2, b2 = fit_line(xs2, ys2)
assert abs(w2 - 3.0) < 0.1 and abs(b2 + 2.0) < 0.1, f"期望 w≈3、b≈-2，实际 w={w2:.4f} b={b2:.4f}"

# 轮数为 0 时不该动
w0, b0 = fit_line(xs, ys, epochs=0)
assert w0 == 0.0 and b0 == 0.0, f"epochs=0 时参数应该还是 0，实际 {w0!r} {b0!r}"

# 轮数多应该比轮数少更接近答案
w_low, _ = fit_line(xs, ys, epochs=50)
assert abs(w_low - 2.0) >= abs(w - 2.0), "训练轮数增加后应该更接近正确答案"` },
          hint: '用 <code>n = len(xs)</code>。每一轮先算出全部预测（可以先用列表推导），再分别算两个梯度，最后一起更新 —— 注意要用<strong>更新前</strong>的 w 算出所有预测，别边算边改。',
          solution: `def fit_line(xs, ys, epochs=2000, lr=0.01):
    w = 0.0
    b = 0.0
    n = len(xs)
    for _ in range(epochs):
        preds = [w * x + b for x in xs]
        errs = [p - y for p, y in zip(preds, ys)]
        grad_w = (2 / n) * sum(e * x for e, x in zip(errs, xs))
        grad_b = (2 / n) * sum(errs)
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b


xs = [1.0, 2.0, 3.0, 4.0, 5.0]
ys = [2 * x + 1 for x in xs]
print(fit_line(xs, ys))`
        },
        {
          id: 'tai2-2', title: 'KNN：最像的邻居说了算', xp: 75,
          goal: '实现 K 近邻分类，并理解为什么要留出测试集。',
          body: `
<h3>另一种思路：不学参数，直接比</h3>
<p>感知机和梯度下降都在「找一组参数」。KNN（K 近邻）走的是完全不同的路：
<strong>不训练，把训练数据整个记住</strong>。要判断新样本时，就看它周围最近的 K 个邻居是什么类别，
<strong>按多数投票决定</strong>。</p>
<p>它对「距离」的定义就是初中学的两点距离推广到多维：</p>
<pre><code>距离 = √( (x1-y1)² + (x2-y2)² + ... )</code></pre>
<p>KNN 简单到几乎没有"训练"这一步，但它在很多小数据集上表现意外地好。</p>
<h3>为什么要留测试集</h3>
<p>假设你要测自己的记忆力：把同一份材料背下来，再拿同一份材料考自己 ——
当然满分，但这说明不了任何问题。</p>
<p>模型也一样：<strong>用训练过的数据测准确率，几乎必然虚高</strong>。
正确做法是事先留出一部分数据根本不参与训练，只用它评分。
这个数字（在没见过的数据上的表现）才叫<strong>泛化能力</strong>。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>K 取多少也有讲究：
<strong>K 太小</strong>容易被个别噪声点带偏；<strong>K 太大</strong>会把远处的邻居也算进来，边界变模糊。
另外 K 取偶数时可能平票 —— 本关规定<strong>平票时取较小的类别</strong>（字符串比较）。</div></div>
`,
          starter: `def distance(a, b):
    """两个样本的欧氏距离。"""
    total = 0.0
    for ai, bi in zip(a, b):
        total += (ai - bi) ** 2
    return total ** 0.5


def knn(train_X, train_y, x, k=3):
    """返回 x 的预测类别。

    做法：算出 x 到每个训练样本的距离，按距离从小到大取前 k 个，
    看它们的标签哪个出现得多就返回哪个。票数相同时返回较小的标签。
    """

    # 在这里实现
    return None


X = [[0, 0], [1, 1], [1, 2], [8, 8], [9, 8], [8, 9]]
y = ['A', 'A', 'A', 'B', 'B', 'B']
print(knn(X, y, [0.5, 0.5], 3))
print(knn(X, y, [8.5, 8.5], 3))
`,
          check: { type: 'tests', code: `X = [[0, 0], [1, 1], [1, 2], [8, 8], [9, 8], [8, 9]]
y = ['A', 'A', 'A', 'B', 'B', 'B']

assert knn(X, y, [0.5, 0.5], 3) == 'A', "靠近 A 类的点应该判 A"
assert knn(X, y, [8.5, 8.5], 3) == 'B', "靠近 B 类的点应该判 B"
assert knn(X, y, [4, 4], 1) == 'A', "k=1 时最近的是 (1,2)，应该判 A"
assert knn(X, y, [0, 0], 1) == 'A', "和训练样本完全重合时应该判 A"

# 平票取较小的标签
assert knn([[0, 0], [2, 0]], ['B', 'A'], [1, 0], 2) == 'A', "票数相同时应该返回较小的标签 'A'"
assert knn([[0, 0], [2, 0]], ['A', 'B'], [1, 0], 2) == 'A', "顺序换一下结果也要一样"

# k 等于全部样本时就是「数标签总数」
assert knn(X, y, [100, 100], 6) == 'A', "两个类各 3 个，平票取 'A'"

# 距离函数本身
assert abs(distance([0, 0], [3, 4]) - 5.0) < 1e-9, f"3-4-5 直角三角形，距离应该是 5，实际 {distance([0, 0], [3, 4])}"
assert distance([1, 1, 1], [1, 1, 1]) == 0.0, "同一个点距离应该是 0"` },
          hint: '把 <code>[(distance(t, x), label) for t, label in zip(train_X, train_y)]</code> 排序，取前 k 个，用 <code>collections.Counter</code> 或者字典数票；平票时用 <code>min()</code> 在票数相同的标签里取最小的那个。',
          solution: `def distance(a, b):
    total = 0.0
    for ai, bi in zip(a, b):
        total += (ai - bi) ** 2
    return total ** 0.5


def knn(train_X, train_y, x, k=3):
    pairs = sorted(
        ((distance(t, x), label) for t, label in zip(train_X, train_y)),
        key=lambda p: p[0]
    )
    votes = {}
    for _, label in pairs[:k]:
        votes[label] = votes.get(label, 0) + 1
    top = max(votes.values())
    return min(label for label, n in votes.items() if n == top)


X = [[0, 0], [1, 1], [1, 2], [8, 8], [9, 8], [8, 9]]
y = ['A', 'A', 'A', 'B', 'B', 'B']
print(knn(X, y, [0.5, 0.5], 3))
print(knn(X, y, [8.5, 8.5], 3))`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-ai-1', emoji: '🔢', name: '手写数字识别', sub: '点阵转向量 · 1-NN 分类 · 准确率', color: '#f0ecff', diff: 3, tag: 'AI 实战',
      desc: '用一张 5×7 的点阵表示手写数字，让程序把它们认出来，并在没见过的样本上算准确率。',
      intro: `
<p>「识别手写数字」是机器学习最经典的入门任务。真实版本用的是 28×28 的灰度图，
但原理完全一样 —— 这里用 5×7 的点阵，你甚至能用肉眼看出模型在比什么。</p>
<p>点阵里 <code>#</code> 表示有笔画的像素、<code>.</code> 表示空白。
要交给算法之前，得先把它拉平成<strong>一串数字</strong>：</p>
<pre><code>..#..           0,0,1,0,0,
.##..           0,1,1,0,0,
..#..     -->   0,0,1,0,0,
..#..           0,0,1,0,0,   （35 个 0/1）
</code></pre>
<p>拉平之后每个数字就变成一个 35 维的点，两个数字像不像 = 这两个点在 35 维空间里近不近。
然后 1-NN 就够了：<strong>谁最近，就认为是谁</strong>。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>注意训练集是「标准字形」，测试集是「手写变体」——
每个测试样本都故意改了 1~2 个像素，模拟不同人写字的差异。
<strong>只在标准字形上测，准确率一定是假的。</strong></div></div>`,
      steps: [
        '写 <code>to_vector(rows)</code>：把 7 行 5 列的点阵拉平成 35 个 0/1，<code>#</code> 记 1、<code>.</code> 记 0。',
        '写 <code>predict_digit(rows)</code>：先转成向量，再用 1-NN（最近邻）在 <code>TRAIN</code> 里找最像的那个，返回它对应的数字字符（<code>\'0\'</code> ~ <code>\'9\'</code>）。',
        '写 <code>evaluate()</code>：对 <code>TEST</code> 里每个样本做预测，统计猜对了几个，返回准确率（0.0 ~ 1.0 的小数）。',
        '打印测试集里每一个的「真实值 → 预测值」，最后打印准确率。'
      ],
      starter: `import math

DIGITS = {
    '0': [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    '1': ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    '2': [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    '3': [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
    '4': ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
    '5': ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    '6': ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
    '7': ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
    '8': [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    '9': [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
}

# 手写变体：每个数字都被改了一两个像素
VARIANTS = {
    '0': [".###.", "#...#", "#...#", "#..##", "#...#", "#...#", ".###."],
    '1': ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".##.."],
    '2': [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "####."],
    '3': [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".##.."],
    '4': ["...#.", "..##.", ".#.#.", "#..#.", "####.", "...#.", "...#."],
    '5': ["#####", "#....", "####.", "....#", "....#", "#...#", ".##.."],
    '6': ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".##.."],
    '7': ["#####", "....#", "...#.", "..#..", ".#...", ".#...", "..#.."],
    '8': [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".##.."],
    '9': [".###.", "#...#", "#...#", ".####", "...#.", "...#.", ".##.."],
}


def to_vector(rows):
    """把 7 行 5 列的点阵拉平成 35 个 0/1 的列表。"""
    return []


def predict_digit(rows):
    """返回预测的数字字符（'0' ~ '9'）。"""
    return '?'


def evaluate():
    """返回测试集的准确率（0.0 ~ 1.0）。"""
    return 0.0


print('准确率：', evaluate())
`,
      check: { type: 'tests', code: `_v = to_vector(DIGITS['0'])
assert len(_v) == 35, f"一个样本应该有 35 个数，实际 {len(_v)}"
assert _v[:5] == [0, 1, 1, 1, 0], f"第一行 .###. 应该转成 0,1,1,1,0，实际 {_v[:5]}"
assert set(_v) <= {0, 1}, f"只应该有 0 和 1，实际出现了 {sorted(set(_v))}"
assert to_vector(DIGITS['1'])[4] == 0, "'1' 的第一行 ..#.. 中间是 0"

# 标准字形必须全部认对
for _d in '0123456789':
    _got = predict_digit(DIGITS[_d])
    assert _got == _d, f"标准字形 {_d} 被认成了 {_got}"

# 手写变体至少认对 9 成
_ok = sum(1 for _d in '0123456789' if predict_digit(VARIANTS[_d]) == _d)
assert _ok >= 9, f"手写变体只认对了 {_ok}/10（至少要 9 个）。测试集才是真正要看的那个数字。"

_acc = evaluate()
assert 0.0 <= _acc <= 1.0, f"准确率应该是 0~1 的小数，实际 {_acc}"
assert abs(_acc - _ok / 10.0) < 1e-9, f"evaluate() 返回 {_acc}，但逐个数是 {_ok}/10 = {_ok/10.0}"` },
      hint: '三件事可以一次做完：<code>to_vector</code> 用两层循环把每个字符转成 1/0；<code>predict_digit</code> 先 <code>to_vector</code>，再遍历 <code>DIGITS</code> 找距离最小的那个键；<code>evaluate</code> 遍历 <code>VARIANTS</code> 数对了几个，除以 10。',
      solution: `import math

DIGITS = {
    '0': [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    '1': ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    '2': [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    '3': [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
    '4': ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
    '5': ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    '6': ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
    '7': ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
    '8': [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    '9': [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
}

VARIANTS = {
    '0': [".###.", "#...#", "#...#", "#..##", "#...#", "#...#", ".###."],
    '1': ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".##.."],
    '2': [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "####."],
    '3': [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".##.."],
    '4': ["...#.", "..##.", ".#.#.", "#..#.", "####.", "...#.", "...#."],
    '5': ["#####", "#....", "####.", "....#", "....#", "#...#", ".##.."],
    '6': ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".##.."],
    '7': ["#####", "....#", "...#.", "..#..", ".#...", ".#...", "..#.."],
    '8': [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".##.."],
    '9': [".###.", "#...#", "#...#", ".####", "...#.", "...#.", ".##.."],
}


def to_vector(rows):
    out = []
    for row in rows:
        for ch in row:
            out.append(1 if ch == '#' else 0)
    return out


def dist(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def predict_digit(rows):
    v = to_vector(rows)
    best = None
    best_d = None
    for d, shape in DIGITS.items():
        cur = dist(v, to_vector(shape))
        if best_d is None or cur < best_d:
            best_d = cur
            best = d
    return best


def evaluate():
    ok = 0
    for d, rows in VARIANTS.items():
        got = predict_digit(rows)
        print(d, '->', got)
        if got == d:
            ok += 1
    return ok / len(VARIANTS)


print('准确率：', evaluate())`
    }
  ]
},
/* ==================== 9. 音视频与图片处理 ==================== */
{
  id: 'media', icon: '🎬', name: '音视频与图片处理', tag: '零依赖',
  desc: '图片和声音，剥开都是一串数字',
  intro: `
<p>这一行最容易让人觉得神秘：「处理图片」听起来得用专门的软件，
「处理音频」更玄。但其实一张图片就是一个<strong>装着数字的表格</strong>，
一段声音就是<strong>一串随时间起伏的数字</strong>。</p>
<p>所以这个方向不用 Pillow、也不调 ffmpeg —— 用标准库亲手拆开它们。
图片用最简单的无压缩格式 <code>PPM</code>（文本格式，你能用记事本打开看懂），
音频用标准库自带的 <code>wave</code> 模块。写完你会发现，
PNG、JPEG、MP3 相对它们的区别只是<strong>「怎么把数字压得更小」</strong>，
而数字本身的意思是一样的。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>处理真实项目时你会用 Pillow（图片）和 ffmpeg（音视频）——
它们更快、支持几十种格式。但那些库的「灰度化」「卷积」参数，
和这里手写的是同一个公式。先懂，再用，顺序别反。</div></div>`,
  level: '入门 → 进阶',
  needs: [],
  status: 'ready',
  chapters: [
    {
      id: 'tm1', icon: '🖼️', title: '图片就是一张数字表格', subtitle: '像素 / 灰度 / 卷积',
      lessons: [
        {
          id: 'tm1-1', title: '把图片读成像素矩阵', xp: 60,
          goal: '手写解析 PPM 图片格式，得到宽、高和每个像素的 RGB 值。',
          body: `
<h3>任何图片文件都是「头部 + 数据」</h3>
<p>PPM 是最朴素的图片格式，它把每个像素的颜色<strong>直接用文字写出来</strong>：</p>
<pre><code>P3                 ← 魔数：P3 表示「文本格式的彩色图」
# 这行是注释，随便写
4 4                ← 宽 4、高 4
255                ← 每个颜色分量的最大值
255 0 0   0 255 0 ...   ← 后面全是数据：每个像素三个数（红绿蓝）</code></pre>
<p>PNG、JPEG 的头部长得多、数据部分被压缩过，但<strong>结构完全一样</strong>：
先告诉你尺寸和格式信息，再给数据。</p>
<h3>解析的三个要点</h3>
<ul>
<li><strong>注释以 <code>#</code> 开头，直到行尾</strong>，得整行丢掉。
注意注释可能出现在任何位置，包括尺寸行前面。</li>
<li><strong>空白符不只是空格</strong>：换行、制表符、连续多个空格都算分隔符。
所以别用 <code>split(" ")</code>，要用不带参数的 <code>split()</code> —— 它会自动处理各种空白。</li>
<li><strong>尺寸是「宽 高」的顺序</strong>，但像素是<strong>按行从左到右、从上到下</strong>排的。
第 1 行第 1 个像素是 <code>pixels[0]</code>，第 2 行第 1 个是 <code>pixels[宽]</code>。</li>
</ul>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>最容易错的一步：
把「宽高的两个数字」和「像素数据」分开。丢掉注释后，
前 4 个 token 是 <code>P3 / 宽 / 高 / 最大值</code>，<strong>剩下的才全是像素</strong>。</div></div>
`,
          starter: `PPM = """P3
# 一张 3x2 的小图
3 2
255
255 0 0    0 255 0    0 0 255
255 255 0  255 255 255  0 0 0
"""


def parse_ppm(text):
    """返回 (宽, 高, 像素列表)。

    像素列表里每个元素是 (r, g, b) 三元组，按「从左到右、从上到下」排列。
    注意：以 # 开头的注释要整行丢掉。
    """

    return 0, 0, []


w, h, px = parse_ppm(PPM)
print(w, h, len(px))
print(px[0] if px else None)
`,
          check: { type: 'tests', code: `w, h, px = parse_ppm(PPM)
assert (w, h) == (3, 2), f"宽高应该是 3 和 2，实际 {w} 和 {h}"
assert len(px) == 6, f"3x2 应该有 6 个像素，实际 {len(px)}"
assert px[0] == (255, 0, 0), f"左上角是纯红，实际 {px[0]!r}"
assert px[1] == (0, 255, 0), f"第二个是纯绿，实际 {px[1]!r}"
assert px[2] == (0, 0, 255), f"第三个是纯蓝，实际 {px[2]!r}"
assert px[3] == (255, 255, 0), f"第二行第一个是黄色，实际 {px[3]!r}"
assert px[5] == (0, 0, 0), f"右下角是黑色，实际 {px[5]!r}"
assert isinstance(px[0], tuple) and len(px[0]) == 3, "每个像素应该是长度为 3 的元组"

# 注释在中间、尺寸行被拆开的情况也要能读
messy = "P3\\n# 开头注释\\n2 1 # 尺寸后面的注释\\n255\\n10 20\\n30\\n40 50 60\\n"
w2, h2, px2 = parse_ppm(messy)
assert (w2, h2) == (2, 1), f"注释混在尺寸行里也要能读，实际 {w2}x{h2}"
assert len(px2) == 2 and px2[0] == (10, 20, 30) and px2[1] == (40, 50, 60), f"实际 {px2!r}"` },
          hint: '逐行处理：<code>line.split("#")[0]</code> 去掉注释，再用 <code>line.split()</code> 拆词，把所有词收集到一个列表里。然后 <code>tokens[0]</code> 是 P3、<code>[1]</code> 宽、<code>[2]</code> 高、<code>[3]</code> 最大值，<code>[4:]</code> 才是像素数据，每三个一组。',
          solution: `PPM = """P3
# 一张 3x2 的小图
3 2
255
255 0 0    0 255 0    0 0 255
255 255 0  255 255 255  0 0 0
"""


def parse_ppm(text):
    tokens = []
    for line in text.splitlines():
        body = line.split('#')[0]        # 注释整行丢掉
        tokens.extend(body.split())      # 不带参数：连续空白算一个

    width = int(tokens[1])
    height = int(tokens[2])
    nums = [int(t) for t in tokens[4:]]

    pixels = []
    for i in range(0, len(nums), 3):
        pixels.append((nums[i], nums[i + 1], nums[i + 2]))
    return width, height, pixels


w, h, px = parse_ppm(PPM)
print(w, h, len(px))
print(px[0] if px else None)`
        },
        {
          id: 'tm1-2', title: '灰度与反色', xp: 60,
          goal: '把彩色变成灰度（而且不能用平均值），并实现反色。',
          body: `
<h3>灰度不是「三色取平均」</h3>
<p>直觉上灰度 = (R + G + B) / 3。但这样得到的图，红色和蓝色看起来一样亮 ——
而实际上人眼对**绿色最敏感、蓝色最迟钝**。</p>
<p>所以正确的权重是<strong>按亮度感知加权的</strong>：</p>
<pre><code>灰度 = 0.299 × R + 0.587 × G + 0.114 × B</code></pre>
<p>拿纯色试一下就知道差距了（这也是黑白电视时代留下来的标准）：</p>
<ul>
<li>纯绿 (0,255,0) → <strong>150</strong>，看起来相当亮</li>
<li>纯红 (255,0,0) → <strong>76</strong></li>
<li>纯蓝 (0,0,255) → <strong>29</strong>，几乎发黑</li>
</ul>
<p>如果按平均算，这三个都会是 85 —— 蓝色会被严重高估。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这三个数字不是随便定的，来自人眼三种视锥细胞的敏感度曲线。
Pillow 的 <code>convert("L")</code> 用的就是同一组权重。</div></div>
<h3>反色：255 减去每个分量</h3>
<p>因为每个分量都固定在 0~255 之间，所以「反转」就是 <code>255 - 值</code>。
这个概念有个名字叫<strong>补色</strong>，照片的负片就是这个效果。</p>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>别在反色的时候顺手改了原列表 ——
返回<strong>新的列表</strong>，不要就地改传进来的 <code>pixels</code>。
图像处理里同一张原图经常要派好几个用场。</div></div>
`,
          starter: `def to_gray(pixels):
    """返回每个像素的灰度值（整数列表）。

    用加权公式：round(0.299 * r + 0.587 * g + 0.114 * b)
    """

    return []


def invert(pixels):
    """返回反色后的新像素列表（每个分量用 255 减），不要修改传进来的列表。"""

    return []


test = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 255), (0, 0, 0)]
print(to_gray(test))
print(invert(test))
`,
          check: { type: 'tests', code: `test = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 255), (0, 0, 0)]
g = to_gray(test)
assert g == [76, 150, 29, 255, 0], f"灰度值不对：{g}（纯绿应该比纯红亮得多）"

# 加权而不是平均：这三个的灰度必须各不相同
assert len(set(g[:3])) == 3, "红绿蓝的灰度应该互不相同，看起来你用了平均值"
assert g[1] > g[0] > g[2], f"亮度顺序应该是 绿 > 红 > 蓝，实际 {g[:3]}"

# 灰度值必须是整数，且在 0~255
assert all(isinstance(v, int) for v in g), "灰度值应该是整数"
assert all(0 <= v <= 255 for v in g), f"灰度值要落在 0~255，实际 {g}"

inv = invert(test)
assert inv == [(0, 255, 255), (255, 0, 255), (255, 255, 0), (0, 0, 0), (255, 255, 255)], f"反色结果不对：{inv}"
assert len(inv) == len(test), "反色不能改变像素个数"

# 反色不能动原列表
orig = [(10, 20, 30)]
_ = invert(orig)
assert orig == [(10, 20, 30)], "invert 不应该修改传进来的列表"` },
          hint: '灰度用 <code>round(0.299 * r + 0.587 * g + 0.114 * b)</code>。反色用列表推导：<code>[(255 - r, 255 - g, 255 - b) for r, g, b in pixels]</code> —— 列表推导天然返回新列表，不会动原数据。',
          solution: `def to_gray(pixels):
    out = []
    for r, g, b in pixels:
        out.append(round(0.299 * r + 0.587 * g + 0.114 * b))
    return out


def invert(pixels):
    return [(255 - r, 255 - g, 255 - b) for r, g, b in pixels]


test = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 255), (0, 0, 0)]
print(to_gray(test))
print(invert(test))`
        },
        {
          id: 'tm1-3', title: '卷积：让画面变模糊', xp: 75,
          goal: '用 3×3 邻域平均实现模糊，理解卷积核是什么。',
          body: `
<h3>模糊的本质：让每个像素看看邻居</h3>
<p>把每个像素换成<strong>它和周围 8 个邻居的平均值</strong>，图像就变糊了 ——
因为突然变化的边缘被邻域拉平了。</p>
<pre><code>取周围 3×3 共 9 个像素，各自求和再除以 9</code></pre>
<p>这样一个小小的 3×3 数字表格就叫<strong>卷积核</strong>。均值模糊的核长这样：</p>
<pre><code>1/9  1/9  1/9
1/9  1/9  1/9
1/9  1/9  1/9</code></pre>
<p>换掉这个核，就换了一种效果 —— 这就是图像处理的通用套路：</p>
<ul>
<li><strong>中心特别大、周围为负</strong> → 锐化（突出边缘）</li>
<li><strong>左边正右边负</strong> → 检测竖直边缘</li>
<li><strong>高斯权重</strong>（中间大、角上小）→ 更自然的模糊</li>
</ul>
<h3>两个必须处理好的细节</h3>
<ul>
<li><strong>边界怎么办</strong>：图像最外圈没有完整的 3×3 邻域。
本关规定<strong>最外圈原样保留</strong>（真实库通常用「复制边缘」或「补零」）。</li>
<li><strong>取整</strong>：平均值是小数，要 <code>round()</code> 成整数。
9 个 255 平均还是 255，但 255/9 = 28.33 要变成 28。</li>
</ul>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>卷积看起来简单，但它是现代 AI 的基石：
识别图片的神经网络（CNN），第一层做的就是这件事 ——
只不过那 9 个数字不是人手写的 1/9，而是<strong>训练出来的</strong>。</div></div>
`,
          starter: `def blur(pixels, w, h):
    """对 (w x h) 的像素列表做 3x3 均值模糊，返回新的像素列表。

    每个像素取自己和周围 8 个邻居的平均值（各自分量分别平均，四舍五入）。
    最外一圈像素没有完整的 3x3 邻域，原样保留。
    """

    return list(pixels)


# 3x3：中心白、四周黑
px = [(0, 0, 0)] * 3 + [(0, 0, 0), (255, 255, 255), (0, 0, 0)] + [(0, 0, 0)] * 3
print(blur(px, 3, 3))
`,
          check: { type: 'tests', code: `# 中心白、周围黑
px = [(0, 0, 0)] * 3 + [(0, 0, 0), (255, 255, 255), (0, 0, 0)] + [(0, 0, 0)] * 3
out = blur(px, 3, 3)
assert len(out) == 9, f"像素个数不能变，实际 {len(out)}"
assert out[4] == (28, 28, 28), f"中心应该是 255/9 四舍五入得 28，实际 {out[4]!r}"
assert out[0] == (0, 0, 0), f"四个角属于最外圈，应该原样保留，实际 {out[0]!r}"
assert out[1] == (0, 0, 0), f"最外圈（包括边中间）原样保留，实际 {out[1]!r}"

# 全同色：模糊后应该还是原色
flat = [(90, 120, 60)] * 9
assert blur(flat, 3, 3) == flat, "全同色的图模糊后不应该变"

# 彩色要分别对三个分量平均
px2 = [(0, 0, 0)] * 3 + [(0, 0, 0), (255, 0, 0), (0, 0, 0)] + [(0, 0, 0)] * 3
out2 = blur(px2, 3, 3)
assert out2[4] == (28, 0, 0), f"只有红色分量应该被平均，实际 {out2[4]!r}"

# 5x5：只有严格内部的 3x3 区域会变
big = [(0, 0, 0)] * 25
big[12] = (255, 255, 255)            # 正中心
out3 = blur(big, 5, 5)
assert out3[12] == (28, 28, 28), f"5x5 的正中心也应该被模糊，实际 {out3[12]!r}"
assert out3[0] == (0, 0, 0) and out3[4] == (0, 0, 0), "最外圈不变"
# (1,1) 是内部像素：它的 3x3 邻域里恰好包含中心那个白点
assert out3[6] == (28, 28, 28), f"(1,1) 的邻域含白点，应该是 28，实际 {out3[6]!r}"

# 不能就地改原列表
before = list(px)
_ = blur(px, 3, 3)
assert px == before, "blur 不应该修改传进来的列表"` },
          hint: '写两层循环 <code>for y in range(1, h-1)</code> / <code>for x in range(1, w-1)</code>，内层再套 <code>for dy in (-1,0,1)</code> / <code>for dx in (-1,0,1)</code> 累加邻居。索引换算：<code>pixels[(y+dy) * w + (x+dx)]</code>。最后 <code>round(total / 9)</code>。别忘了最外圈不动 —— 最简单是把结果先复制一份原图，只往里填内部像素。',
          solution: `def blur(pixels, w, h):
    out = list(pixels)                     # 先复制：最外圈保持原样
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            sr = sg = sb = 0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    r, g, b = pixels[(y + dy) * w + (x + dx)]
                    sr += r
                    sg += g
                    sb += b
            out[y * w + x] = (round(sr / 9), round(sg / 9), round(sb / 9))
    return out


# 3x3：中心白、四周黑
px = [(0, 0, 0)] * 3 + [(0, 0, 0), (255, 255, 255), (0, 0, 0)] + [(0, 0, 0)] * 3
print(blur(px, 3, 3))`
        }
      ]
    },
    {
      id: 'tm2', icon: '🔊', title: '声音是一串上下起伏的数', subtitle: '采样率 / 正弦波 / WAV',
      lessons: [
        {
          id: 'tm2-1', title: '生成一段正弦波', xp: 70,
          goal: '用数学公式生成声音的采样数据，并理解采样率与频率。',
          body: `
<h3>声音被数字化，只做了两件事</h3>
<p>麦克风听到的是连续振动的空气。要存进电脑，必须做两次「取样」：</p>
<ul>
<li><strong>每隔一小段时间记一次</strong> —— 记多密叫<strong>采样率</strong>。
CD 是每秒 44100 次（44.1 kHz）。</li>
<li><strong>每次记一个高度</strong> —— 记多细叫<strong>位深</strong>。
16 位能表示 -32768 ~ 32767 共 65536 个档位。</li>
</ul>
<p>于是「一段声音」就变成了一串整数。播放时把它们按原速连起来，空气就振动了。</p>
<h3>纯音就是一个正弦函数</h3>
<pre><code>第 i 个采样 = 振幅 × sin(2π × 频率 × i / 采样率)</code></pre>
<p>三项各管一件事：</p>
<ul>
<li><code>频率</code>（Hz）：每秒振动多少次。440 Hz 就是标准音 A，越高音越尖。</li>
<li><code>振幅</code>：音量大小。16 位里最大值 32767，乘 0.5 就是「一半音量」。</li>
<li><code>i / 采样率</code>：把「第几个采样」换算成「第几秒」——
<strong>这个除法是整段代码的关键</strong>，忘了它频率就完全不对。</li>
</ul>
<h3>反过来读：数一数波形</h3>
<p>给你一串采样，怎么知道频率？<strong>数它一秒内上下穿过零点几次</strong>就行。
波形每完成一次完整振动，就会向上穿过零点一次 —— 所以上穿次数就是周期数。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>16 位数据在文件里是<strong>小端字节序</strong>：
低字节在前。Python 里用 <code>struct.pack('&lt;h', v)</code> 打包，<code>struct.unpack</code> 拆开。
<code>&lt;</code> 就是「小端」，<code>h</code> 是 16 位有符号整数。</div></div>
`,
          starter: `import math
import struct


def tone_bytes(freq, seconds, rate=8000, volume=0.5):
    """生成一段单声道正弦波的 PCM 数据，返回 bytes。

    每个采样的值 = int(32767 * volume * sin(2 * pi * freq * i / rate))
    一共 rate * seconds 个采样，每个用 struct.pack('<h', v) 打包成 2 字节。
    """

    return b''


def count_cycles(data):
    """数一数波形「向上穿过零点」的次数（也就是振动的周期数）。"""
    return 0


data = tone_bytes(440, 0.5)
print('字节数：', len(data))
print('周期数：', count_cycles(data))
`,
          check: { type: 'tests', code: `import struct as _struct

data = tone_bytes(440, 0.5)
assert isinstance(data, bytes), f"应该返回 bytes，实际 {type(data).__name__}"
assert len(data) == 8000, f"0.5 秒 × 8000 Hz × 2 字节 = 8000 字节，实际 {len(data)}"

vals = _struct.unpack('<%dh' % (len(data) // 2), data)
assert vals[0] == 0, f"正弦波第一个采样应该是 0，实际 {vals[0]}"
assert 16000 < max(vals) <= 16383, f"最大振幅应该是 32767 × 0.5 ≈ 16383，实际 {max(vals)}"
assert -16383 <= min(vals) < -16000, f"最小应该是 -16383 左右，实际 {min(vals)}"

# 频率对不对，看周期数：0.5 秒 440 Hz 应该约 220 个周期
cyc = count_cycles(data)
assert abs(cyc - 220) <= 3, f"0.5 秒的 440 Hz 应该有约 220 个周期，实际 {cyc}（检查 i / rate 那一步）"

# 频率翻倍，周期数应该也翻倍
data2 = tone_bytes(880, 0.5)
assert abs(count_cycles(data2) - 440) <= 4, f"880 Hz 半秒应该约 440 个周期，实际 {count_cycles(data2)}"

# 音量减半，振幅应该减半
quiet = tone_bytes(440, 0.5, volume=0.25)
qvals = _struct.unpack('<%dh' % (len(quiet) // 2), quiet)
assert 7500 < max(qvals) <= 8192, f"音量 0.25 时振幅应该约 8192，实际 {max(qvals)}"` },
          hint: '采样个数是 <code>int(rate * seconds)</code>。用循环算每个采样值再 <code>struct.pack</code>，或先建列表再 <code>b"".join(...)</code>（循环里用 <code>bytearray</code> 追加更快）。<code>count_cycles</code> 里先 <code>struct.unpack</code> 成元组，再数 <code>vals[i-1] &lt; 0 &lt;= vals[i]</code> 的次数。',
          solution: `import math
import struct


def tone_bytes(freq, seconds, rate=8000, volume=0.5):
    n = int(rate * seconds)
    buf = bytearray()
    for i in range(n):
        v = int(32767 * volume * math.sin(2 * math.pi * freq * i / rate))
        buf += struct.pack('<h', v)
    return bytes(buf)


def count_cycles(data):
    vals = struct.unpack('<%dh' % (len(data) // 2), data)
    n = 0
    for i in range(1, len(vals)):
        if vals[i - 1] < 0 <= vals[i]:
            n += 1
    return n


data = tone_bytes(440, 0.5)
print('字节数：', len(data))
print('周期数：', count_cycles(data))`
        },
        {
          id: 'tm2-2', title: '调音量与淡入', xp: 65,
          goal: '对采样数据做缩放和渐变，并处理「超出范围」这个真实问题。',
          body: `
<h3>改音量 = 每个采样乘一个系数</h3>
<pre><code>音量 ×2  →  每个采样值都乘 2
音量 ×0.5 →  每个采样值都乘 0.5</code></pre>
<p>因为音量在听感上就是波形的<strong>振幅</strong>，而振幅就是那些数字的大小。</p>
<h3>真实的坑：会溢出</h3>
<p>16 位能表示的范围是 <strong>-32768 ~ 32767</strong>。
一个 30000 的采样乘 2 得到 60000 —— <strong>放不进 16 位</strong>。
如果不管它，写进文件时会直接报错，或者更糟：悄悄回绕成一个大负数，
听感上变成刺耳的爆音。</p>
<p>正确做法是<strong>裁剪（clamp）</strong>：超过上限就取上限，低于下限就取下限。</p>
<pre><code>60000  ->  32767      （顶到天花板）
-40000 ->  -32768     （压到地板）</code></pre>
<div class="tip tip-warn"><span class="tip-ico">⚠️</span><div>音频处理的实操常识：
音量放大后先<strong>找出整段的最大值</strong>，需要的话整体缩回去 ——
这叫做「归一化」。不然一放大就爆，全程都是杂音。</div></div>
<h3>淡入：让开头不那么突然</h3>
<p>声音突然开始会有一声「啪」的爆音，因为波形从 0 直接跳到某个值，太陡了。
解决办法是让开头一小段<strong>音量从 0 慢慢升到 1</strong>，这就是淡入。</p>
`,
          starter: `def set_volume(samples, factor):
    """把每个采样乘以 factor，返回新列表。

    结果要裁剪到 16 位范围：不能超过 32767，不能低于 -32768。
    """

    return []


def fade_in(samples, n):
    """让前 n 个采样从「音量 0」平滑升到「音量 1」，返回新列表。

    第 i 个采样（i 从 0 到 n-1）乘以 i / n；第 n 个之后保持原样。
    """

    return []


test = [100, -200, 16000, -16000]
print(set_volume(test, 2))
print(fade_in([100, 200, 300, 400], 2))
`,
          check: { type: 'tests', code: `assert set_volume([100, -200, 16000, -16000], 2) == [200, -400, 32000, -32000], "普通缩放（没超范围）"
assert set_volume([30000, -30000], 2) == [32767, -32768], f"超范围要裁剪：正数顶到 32767、负数压到 -32768，实际 {set_volume([30000, -30000], 2)}"
assert set_volume([32767, -32768], 1) == [32767, -32768], "系数为 1 时不应改变"
assert set_volume([10, 20], 0.5) == [5, 10], f"小数系数，实际 {set_volume([10, 20], 0.5)}"
assert set_volume([], 3) == [], "空列表应该返回空列表"
assert all(isinstance(v, int) for v in set_volume([10.4, 20.6], 1)), "结果应该是整数"

orig = [100, 200]
_ = set_volume(orig, 2)
assert orig == [100, 200], "set_volume 不应该修改传进来的列表"

f = fade_in([100, 200, 300, 400], 2)
assert f == [0, 100, 300, 400], f"前两个采样乘以 0/2 和 1/2，实际 {f}"
f2 = fade_in([100, 200, 300], 4)
assert f2 == [0, 50, 150], f"n 大于长度时也要正常，实际 {f2}"
f3 = fade_in([100, 200], 0)
assert f3 == [100, 200], f"n=0 时不应该改动，实际 {f3}"` },
          hint: '<code>set_volume</code> 用列表推导 + <code>max(-32768, min(32767, int(v * factor)))</code>。<code>fade_in</code> 里前 n 个位置乘 <code>i / n</code>，其余原样 —— 注意 <code>i / n</code> 是浮点，乘完要 <code>int()</code> 或 <code>round()</code>，并且 i=0 时结果是 0。',
          solution: `def set_volume(samples, factor):
    out = []
    for v in samples:
        out.append(max(-32768, min(32767, int(v * factor))))
    return out


def fade_in(samples, n):
    out = []
    for i, v in enumerate(samples):
        if i < n:
            out.append(int(v * i / n))
        else:
            out.append(v)
    return out


test = [100, -200, 16000, -16000]
print(set_volume(test, 2))
print(fade_in([100, 200, 300, 400], 2))`
        }
      ]
    }
  ],
  projects: [
    {
      id: 't-media-1', emoji: '🎨', name: '迷你图像处理工具', sub: 'PPM 解析 · 灰度 · 缩小 · 直方图 · 字符预览', color: '#fff6de', diff: 3, tag: '多媒体实战',
      desc: '从零搭一条图像处理流水线：读图、算灰度、缩一半、统计直方图，最后用字符把图打印出来。',
      intro: `
<p>这一关把前面学的东西串成一条真正的流水线。输入是一张 4×4 的 PPM 图，
输出是你能直接看到的结果。</p>
<p>最后那一步「字符预览」看起来像玩具，其实是很正经的技术：
终端里没法显示图片，所以用<strong>不同密度的字符表示不同亮度</strong>。
字符越密（比如 <code>@</code>）代表越亮，越空（比如空格）代表越暗 —— 老程序员传文件时就这么看图。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>缩小图片（downscale）的做法是<strong>把每 2×2 个像素平均成一个</strong>。
这比「隔一个取一个」慢一点，但不会丢细节、也不会出现锯齿 ——
这就是「降采样前先做平均」的初版思路。</div></div>`,
      steps: [
        '写 <code>parse_ppm(text)</code>：返回 <code>(宽, 高, 像素列表)</code>，像素是 <code>(r, g, b)</code> 元组。',
        '写 <code>to_gray(pixels)</code>：用加权公式转成灰度值列表（整数）。',
        '写 <code>downscale(pixels, w, h)</code>：把每 2×2 个像素平均成 1 个，返回 <code>(新宽, 新高, 新像素列表)</code>。宽高都是偶数，不用考虑余数。',
        '写 <code>histogram(gray, bins=10)</code>：统计每个亮度区间的像素个数，返回长度为 10 的列表。区间用 <code>v * bins // 256</code> 算。',
        '写 <code>ascii_preview(gray, w, h)</code>：把灰度映射成字符（用 <code>CHARS</code>），每行 <code>w</code> 个字符，行与行之间用换行连接，返回这个字符串。'
      ],
      starter: `CHARS = " .:-=+*#%@"

PPM = """P3
# 4x4 棋盘格
4 4
255
0 0 0      255 255 255  0 0 0      255 255 255
255 255 255  0 0 0      255 255 255  0 0 0
0 0 0      255 255 255  0 0 0      255 255 255
255 255 255  0 0 0      255 255 255  0 0 0
"""


def parse_ppm(text):
    return 0, 0, []


def to_gray(pixels):
    return []


def downscale(pixels, w, h):
    return 0, 0, []


def histogram(gray, bins=10):
    return []


def ascii_preview(gray, w, h):
    return ''


w, h, px = parse_ppm(PPM)
gray = to_gray(px)
sw, sh, small = downscale(px, w, h)
print(ascii_preview(gray, w, h))
print('缩小后：', sw, sh, len(small))
print('直方图：', histogram(gray))
`,
      check: { type: 'tests', code: `w, h, px = parse_ppm(PPM)
assert (w, h) == (4, 4) and len(px) == 16, f"应该是 4x4 共 16 个像素，实际 {w}x{h} / {len(px)}"
assert px[0] == (0, 0, 0) and px[1] == (255, 255, 255), f"棋盘格前两个像素应该是黑、白，实际 {px[0]!r} {px[1]!r}"

gray = to_gray(px)
assert len(gray) == 16, f"灰度值应该有 16 个，实际 {len(gray)}"
assert gray[0] == 0 and gray[1] == 255, f"黑白两色的灰度应该是 0 和 255，实际 {gray[0]} {gray[1]}"

sw, sh, small = downscale(px, w, h)
assert (sw, sh) == (2, 2), f"缩小一半应该是 2x2，实际 {sw}x{sh}"
assert len(small) == 4, f"应该有 4 个像素，实际 {len(small)}"
assert small[0] == (128, 128, 128), f"2x2 黑白平均应该是 128，实际 {small[0]!r}"
assert all(p == (128, 128, 128) for p in small), f"四个块都应该是 128，实际 {small}"

hist = histogram(gray)
assert len(hist) == 10, f"直方图应该有 10 个区间，实际 {len(hist)}"
assert sum(hist) == 16, f"所有区间的计数加起来应该等于像素总数 16，实际 {sum(hist)}"
assert hist[0] == 8, f"灰度 0 落在第 0 区间，应该有 8 个，实际 {hist[0]}"
assert hist[9] == 8, f"灰度 255 落在第 9 区间，应该有 8 个，实际 {hist[9]}"
assert sum(hist[1:9]) == 0, f"中间区间不该有像素，实际 {hist[1:9]}"

prev = ascii_preview(gray, w, h)
lines = prev.splitlines()
assert len(lines) == 4, f"预览应该是 4 行，实际 {len(lines)} 行"
assert all(len(ln) == 4 for ln in lines), f"每行应该是 4 个字符，实际 {[len(ln) for ln in lines]}"
assert lines[0] == " @ @", f"第一行应该是 空格、@、空格、@，实际 {lines[0]!r}"
assert lines[1] == "@ @ ", f"第二行应该是 @、空格、@、空格，实际 {lines[1]!r}"
assert lines[0][1] == '@' and lines[0][0] == ' ', "白像素(255)应该映射到最密的字符 @，黑像素(0)映射到空格"` },
      hint: '六个函数各管一件事：<code>parse_ppm</code> 用 <code>line.split("#")[0].split()</code> 收集 token；<code>downscale</code> 对每个 2x2 块（左上角 <code>(2*bx, 2*by)</code>）把 4 个像素分别对三个分量求平均；<code>ascii_preview</code> 用 <code>CHARS[v * len(CHARS) // 256]</code> 映射，按行拼成字符串。',
      solution: `CHARS = " .:-=+*#%@"

PPM = """P3
# 4x4 棋盘格
4 4
255
0 0 0      255 255 255  0 0 0      255 255 255
255 255 255  0 0 0      255 255 255  0 0 0
0 0 0      255 255 255  0 0 0      255 255 255
255 255 255  0 0 0      255 255 255  0 0 0
"""


def parse_ppm(text):
    tokens = []
    for line in text.splitlines():
        tokens.extend(line.split('#')[0].split())
    width, height = int(tokens[1]), int(tokens[2])
    nums = [int(t) for t in tokens[4:]]
    pixels = [(nums[i], nums[i + 1], nums[i + 2]) for i in range(0, len(nums), 3)]
    return width, height, pixels


def to_gray(pixels):
    return [round(0.299 * r + 0.587 * g + 0.114 * b) for r, g, b in pixels]


def downscale(pixels, w, h):
    nw, nh = w // 2, h // 2
    out = []
    for by in range(nh):
        for bx in range(nw):
            sr = sg = sb = 0
            for dy in (0, 1):
                for dx in (0, 1):
                    r, g, b = pixels[(by * 2 + dy) * w + (bx * 2 + dx)]
                    sr += r
                    sg += g
                    sb += b
            out.append((round(sr / 4), round(sg / 4), round(sb / 4)))
    return nw, nh, out


def histogram(gray, bins=10):
    hist = [0] * bins
    for v in gray:
        hist[v * bins // 256] += 1
    return hist


def ascii_preview(gray, w, h):
    lines = []
    for y in range(h):
        row = ''
        for x in range(w):
            row += CHARS[gray[y * w + x] * len(CHARS) // 256]
        lines.append(row)
    return chr(10).join(lines)


w, h, px = parse_ppm(PPM)
gray = to_gray(px)
sw, sh, small = downscale(px, w, h)
print(ascii_preview(gray, w, h))
print('缩小后：', sw, sh, len(small))
print('直方图：', histogram(gray))`
    }
  ]
},

];

/* ============================================================
   项目档案补充（项目工坊 + 实战工坊共用）

   项目详情页除了「步骤 + 编辑器」，还应该回答四件在真实工作里必须
   自己想清楚、但在教程里最容易被跳过的事：

     time       大概要花多久 —— 心里有底才不容易半途放弃
     learn      做完会掌握什么 —— 把「敲了一遍代码」变成「学到了东西」
     rubric     提交前自查什么 —— 判题只查结果对不对，查不了设计好不好
     hint       卡住了往哪个方向想（给思路，不给答案）
     challenge  做完还有余力的话往哪加 —— 免得「做完就没事干了」

   为什么单放一张表，而不是写进各自的项目对象里：
   这五个字段是纯文案，和判题的 starter / check / solution 完全是两回事。
   分开之后，改文案不用碰判题数据，也方便横向比对 20 个项目写得均不均匀
   （写这张表的时候就是这么发现「有些项目只有步骤、没有收获」的）。

   位置有讲究：合并要等 TRACKS 和 PROJECTS 都定义完，所以这张表只能待在
   data-tracks.js —— 它是 data-*.js 里最后加载的一个。
   ============================================================ */
const PROJECT_DOSSIER = {

/* ---------------- 项目工坊（基础 / 进阶篇的项目） ---------------- */
p1: {
  time: '15 分钟',
  learn: [
    '用 <code>while True</code> + <code>break</code> 搭出「一直跑，直到满足条件才停」的主循环 —— 所有交互式程序的骨架',
    '<code>int(input())</code> 写熟，并且意识到「用户输入永远是字符串」这件事',
    '三分支 <code>if / elif / else</code> 各管一种提示，理解分支要覆盖全部情况'
  ],
  rubric: [
    '答案写成固定的 <code>42</code> —— 判题要求每次跑出来的行为都一样',
    '提示语里带上了「大了」「小了」「猜对了」这几个关键词',
    '猜对时先打印用了多少次，再 <code>break</code> 退出',
    '想一想：输入的不是数字，你的程序会有什么反应？'
  ],
  hint: '<code>count</code> 每读一次输入就 <code>+= 1</code>，位置放在读入之后、判断之前。<code>break</code> 只需要写一次 —— 在「猜对了」那条分支里。先写循环骨架，再把三个分支填进去，比一上来就写完整段容易得多。'
},

p2: {
  time: '30 分钟',
  learn: [
    '「列表存状态 + 循环读命令 + if 分发」—— 所有管理类程序的通用结构',
    '<code>enumerate</code> 带序号打印，<code>pop(下标)</code> 按下标删除',
    '把菜单打印抽成独立的函数：同样的几行代码不该在主循环里重复出现'
  ],
  rubric: [
    '输入 <code>1</code> 之后会再问一次内容，而不是直接退出',
    '输入 <code>2</code> 打印的序号从 <b>1</b> 开始（不是 0）',
    '输入 <code>3</code> 删掉的是序号对应的那一条，不是固定删第一条或最后一条',
    '输入 <code>4</code> 先打印「再见！」再 <code>break</code>'
  ],
  hint: '<code>enumerate(todos, 1)</code> 能让序号从 1 开始，省得每次手动 +1。删除用 <code>todos.pop(序号 - 1)</code>：用户看到的是从 1 数起，列表里是从 0 数起，这个换算是本项目最容易错的一步。'
},

p3: {
  time: '25 分钟',
  learn: [
    '<code>string</code> 模块现成的字符集（<code>ascii_lowercase</code> / <code>ascii_uppercase</code> / <code>digits</code>），不用自己手敲字母表',
    '「先保底、再补齐、最后打乱」的生成策略，以及为什么<b>必须</b>打乱',
    '<code>random.shuffle()</code> 原地打乱、<code>"".join(列表)</code> 把字符拼回字符串'
  ],
  rubric: [
    '密码长度正好等于输入的长度（标准输入预填的是 12）',
    '四类字符每一类都至少出现一次',
    '输入长度小于 4 时程序不会崩、也不会卡死',
    '结果看起来是随机的 —— 前四位没有「小写-大写-数字-符号」的固定顺序'
  ],
  hint: '先从每类里各 <code>random.choice(字符集)</code> 抽一个放进列表（保底），再用 <code>while len(pwd) &lt; n: pwd.append(random.choice(全部字符))</code> 补够长度，最后 <code>random.shuffle(pwd)</code> 再 <code>"".join(pwd)</code>。顺序错了就打乱不到前面的保底字符。'
},

p4: {
  time: '25 分钟',
  learn: [
    '「遍历 → 计数 → 排序 → 取前 N」这套主干 —— 热搜榜、日志统计、搜索引擎索引都是它',
    '<code>counts.get(w, 0) + 1</code> 这个防 <code>KeyError</code> 的计数写法，字典题里出现频率最高的一句',
    '<code>sorted</code> 的 <code>key</code> 参数，以及用负号实现从大到小的小技巧'
  ],
  rubric: [
    '字典的 key 是词、value 是出现次数，而且是整数不是字符串',
    '排序是按次数从多到少，不是字典里原本的顺序',
    '只打印前 3 个',
    '换一段完全不同的文本进去结果依然正确 —— 说明没有把具体的词写死在代码里'
  ],
  hint: '排序写 <code>sorted(counts.items(), key=lambda kv: -kv[1])</code>：<code>kv[1]</code> 是次数，前面加负号就是从大到小。打印用 f-string：<code>f"{词}: {次数}"</code>。'
},

p5: {
  time: '15 分钟',
  learn: [
    '用单层循环 + 字符串乘法画图，比双层循环更短也更不容易写错',
    '从「第 i 行要几个空格、几个星号」抽象出公式，再把公式翻译成代码',
    '字符串可以相乘这件事（<code>"*" * 5</code>、<code>" " * 3</code>）能省掉一整个内层循环'
  ],
  rubric: [
    '金字塔一共 5 行，第一行 1 个星号，最后一行 9 个',
    '每一行都水平居中（左边空格数 = 层数 - 当前行号）',
    '行数是变量 <code>n</code> 算出来的，不是 5 条 print 写死的'
  ],
  hint: '一行就够：<code>print(" " * (n - i) + "*" * (2 * i - 1))</code>，循环写 <code>for i in range(1, n + 1)</code>。动手前先在纸上把 n=3 时每行的空格数和星号数写出来，确认公式对了再敲代码。'
},

p6: {
  time: '30 分钟',
  learn: [
    '处理「列表里装字典」—— 真实世界的数据几乎都长这样',
    '多个累加器同时推进：总分、人数、最高分各管一摊，互不干扰',
    'f-string 的格式说明符，比如 <code>{avg:.1f}</code> 保留一位小数'
  ],
  rubric: [
    '每个学生的平均分是 <code>sum(scores) / len(scores)</code> 算的，不是手填的',
    '全班平均分用的是「全班总分 ÷ 全班人数」，不是把各人的平均分再平均一次',
    '最高分是按总分比的，且只打印一个名字',
    '<code>.1f</code> 真的生效了 —— 输出里能看到一位小数'
  ],
  hint: '外层 <code>for s in students</code>，里面 <code>total = sum(s["scores"])</code>、<code>avg = total / len(s["scores"])</code>。全班统计要用另外的变量累加，别和「单个学生的变量」混在一起 —— 混用是这类题最常见的错。'
},

p7: {
  time: '40 分钟',
  learn: [
    '用类把「数据 + 操作数据的规则」绑在一起 —— 这就是封装，也是余额不能从外面随便改的原因',
    '继承：<code>SavingsAccount</code> 复用 <code>Account</code> 的全部方法，只加自己多出来的那一个',
    '<code>__str__</code> 决定 <code>print(对象)</code> 输出什么；<code>raise</code> 和 <code>return False</code> 的区别在于「调用方能不能装作没看见」'
  ],
  rubric: [
    '存负数、取超额都会 <code>raise ValueError</code>，而不是默默返回 False',
    '<code>transfer</code> 走的是 <code>withdraw</code> + <code>deposit</code>，没有直接改别人的余额',
    '<code>SavingsAccount</code> 继承了父类，没有把 <code>Account</code> 的代码复制一遍',
    '<code>add_interest</code> 里有 <code>round(..., 2)</code> —— 不处理浮点误差会打印出 103.00000000000001 这种东西'
  ],
  hint: '子类写 <code>class SavingsAccount(Account):</code>，构造函数里调 <code>super().__init__(owner, balance)</code>。<code>add_interest</code> 就是余额乘 1.03 再 <code>round(..., 2)</code>，返回新余额。'
},

p8: {
  time: '35 分钟',
  learn: [
    '用一个正则把每行非结构化文本拆成 4 个字段 —— 「解析」和「分析」分开做，是数据工程的基本分工',
    '<code>re.findall</code> 提取出来的<b>全是字符串</b>，参与计算前必须 <code>int()</code>',
    '<code>collections.Counter</code> 一句话完成分组计数'
  ],
  rubric: [
    '统计状态码的 key 是整数（<code>{200: 3}</code> 而不是 <code>{"200": 3}</code>）',
    '<code>error_paths</code> 里只有级别为 ERROR 的接口，并且保持了原本出现的顺序',
    '平均耗时保留了一位小数',
    '正则没有写死具体的接口名或耗时数字 —— 换一份日志也能用'
  ],
  hint: '先用一个最小的例子试正则：把 <code>re.findall(r"(\\w+)\\s+(/api/\\S+)\\s+(\\d{3})\\s+(\\d+)ms", LOG)</code> 的结果打印出来看一眼结构，确认对了再往下统计。统计前记得把状态码转成 <code>int</code>。'
},

p9: {
  time: '30 分钟',
  learn: [
    '<code>re.sub</code> 的第二个参数可以是<b>函数</b> —— 每匹配到一次就调一次，替换逻辑再复杂也写得下',
    '<code>match.group(1)</code> 取捕获组，配合 <code>partition</code> 拆「值|默认值」',
    '容错设计：模板里少填一个字段，不该让整页崩掉'
  ],
  rubric: [
    '<code>{name}</code> 在 data 里能找到，就替换成对应的值',
    '<code>{name|匿名}</code> 找不到时用「匿名」',
    '<code>{missing}</code> 既找不到又没有默认值时替换成空字符串，而不是抛 <code>KeyError</code>',
    '替换逻辑写在函数里交给 <code>re.sub</code>，而不是把模板拆成好几段来回拼'
  ],
  hint: '替换函数长这样：<code>def repl(m): key, _, default = m.group(1).partition("|"); return str(data[key]) if key in data else default</code>。然后 <code>re.sub(r"\\{([^{}]+)\\}", repl, template)</code> —— 把函数当参数传进去，这是本项目真正想让你记住的一件事。'
},

/* ---------------- 实战工坊（方向里的项目） ---------------- */
't-crawl-1': {
  time: '45 分钟',
  learn: [
    '把「请求 → 解析 → 翻页 → 落盘」串成一条能反复跑的完整流程',
    '单页失败不该作废整轮：<code>fetch</code> 出错返回 <code>None</code>，主循环跳过继续',
    '爬虫的产出是「一张能交给下游的表」，所以终点是 CSV，不是打印出来看一眼'
  ],
  rubric: [
    'CSV 第一行是表头，不是直接写数据',
    '两页共 5 条新闻一条不少，第二页的确实抓到了',
    '最后一列是正文长度（数字），不是空的或字符串',
    '把某一页的地址改坏，程序不会整个崩掉 —— 这是 <code>fetch</code> 容错该起的作用'
  ],
  challenge: '给抓取加一个「断点续传」：<code>news.csv</code> 里已经有的链接就跳过，不重复抓。真实爬虫里这是标配 —— 抓几千条的时候不可能每次从头再来一遍。'
},

't-data-1': {
  time: '40 分钟',
  learn: [
    '清洗和计算分成两步做、每步都打印结果 —— 出问题立刻知道卡在哪一步',
    '「缺失」和「0」完全是两回事：缺数据要跳过，不是当成卖了 0 件',
    '中位数和平均数的区别，以及中位数为什么不容易被极端值带偏'
  ],
  rubric: [
    '带千分位的数字（比如 <code>"1,200"</code>）真的去掉了逗号再转 <code>int</code>',
    '空字符串被当成缺失跳过，没有混进 0 里参与计算',
    '汇总字典的 key 是城市名，排序按总销量从高到低',
    '中位数取的是有效数据的中位数，不是含缺失项算的'
  ],
  challenge: '再算出每个城市的「客单价」（总销量 ÷ 有效记录数），在图表里多打印一列。这样一眼能看出：哪座城市是单笔量大，哪座只是单子多。'
},

't-db-1': {
  time: '35 分钟',
  learn: [
    '数据库和列表最本质的区别：关掉连接再打开，数据还在',
    '建表 → 清空 → <code>executemany</code> 批量写入 → <code>commit</code> 的完整流程',
    '<code>GROUP BY</code> 做分组汇总，<code>ORDER BY</code> + <code>LIMIT</code> 取极值'
  ],
  rubric: [
    '用的是真实文件 <code>book.db</code>，不是 <code>:memory:</code>',
    '反复跑结果都一样（写之前先 <code>DELETE FROM records</code>）',
    '写完 <code>commit</code> 了，并且 <code>close</code> 了连接',
    '按月汇总是 SQL 的 <code>GROUP BY</code> 算的，不是把全部数据捞出来再在 Python 里循环一遍'
  ],
  challenge: '加一张「分类」表，把每条记录和它的分类关联起来，再按「月 + 分类」两个维度汇总。到这里你才会真正感觉到关系型数据库的价值 —— 一条 <code>JOIN</code> 换掉 Python 里的两层循环。'
},

't-test-1': {
  time: '35 分钟',
  learn: [
    '先写一个会失败的测试、再去修代码 —— 这是正规流程，不是多此一举',
    '边界用例：空列表、单个元素、刚好卡在阈值上的值',
    '<code>unittest</code> 的 <code>assertRaises</code> 怎么断言「这里本来就该报错」'
  ],
  rubric: [
    '测试里至少有 3 个方法：普通情况、单元素、空列表',
    '空列表用的是 <code>assertRaises(ValueError)</code>，不是自己 <code>try/except</code> 包一层',
    '修完之后测试全过，而且你能说清楚原来错在哪一行',
    '没有为了让测试通过而回头去改测试里的预期值'
  ],
  challenge: '给 <code>average</code> 再加一条规则：列表里混进非数字（比如字符串）时抛 <code>TypeError</code>。<b>先写一个会失败的测试，再去实现</b> —— 这个顺序别反过来。'
},

't-office-1': {
  time: '40 分钟',
  learn: [
    '<code>pathlib</code> 遍历目录、按后缀筛文件，比手拼路径字符串可靠得多',
    '合并多个来源时「先统一格式再合并」：字段名去空格、数字去逗号、空值归一',
    '把中间结果也写成文件，出问题的时候能回头看是哪一步错了'
  ],
  rubric: [
    '每一行都带上了来源文件名，能追溯回是哪份月报',
    '<code>merged.csv</code> 的表头正好是「来源,部门,金额」',
    '<code>summary.csv</code> 按合计从高到低排，不是文件顺序',
    '部门名前后有空格的情况被处理掉了 —— 同一个部门没被拆成两条'
  ],
  challenge: '让它支持「部门名写得不太一样」的情况（<code>市场部</code> / <code>市场部 </code> / <code>市场</code>），把它们归并到同一行。真实办公数据里这种脏法非常常见，这也是「数据清洗」这四个字最日常的样子。'
},

't-game-1': {
  time: '50 分钟',
  learn: [
    'BFS 为什么能找到最短路径，以及「一层一层往外扩」在代码里长什么样',
    '用 <code>collections.deque</code> 当队列，<code>popleft()</code> 取出队头',
    '靠「记录上一格是谁」来回画整条路径 —— 寻路类输出几乎都用这一招'
  ],
  rubric: [
    '格子是在「进队列时」就标记已访问，不是出队列时才标（标晚了会重复入队，地图一大就慢到跑不动）',
    '走不到的图返回 <code>-1</code>，而不是死循环或报错',
    '回画出来的路径是连续的 <code>*</code>，且首尾正好是 <code>S</code> 和 <code>E</code>',
    '最短路步数是 14 —— 你可以自己数一遍来验证'
  ],
  challenge: '把 BFS 换成 A*（加一个「到终点的直线距离」当启发式），看看扩展的格子数是不是变少了。启发式只要不高估真实代价，A* 依然保证最短 —— 这个条件叫「可采纳性」。'
},

't-gui-1': {
  time: '45 分钟',
  learn: [
    '桌面程序的三件套：控件、布局（<code>pack</code> / <code>grid</code>）、事件回调',
    '「状态同步」—— 数据一变，界面上所有依赖它的地方都得主动刷新',
    '空输入、没选中就点删除这类无效操作，安静忽略比弹一堆报错友好得多'
  ],
  rubric: [
    '添加之后输入框清空了，列表和计数都更新了',
    '没选中任何一项时点删除，不报错也不删错东西',
    '删掉一条后计数标签立刻变化，不需要再点别的按钮才刷新',
    '函数最后把五个控件都 <code>return</code> 了 —— 判题靠它们模拟点击'
  ],
  challenge: '把「删除选中」改成支持多选（<code>listbox</code> 的 <code>selectmode</code> 设成 <code>MULTIPLE</code>，<code>curselection()</code> 会返回多个下标）。注意要<b>倒着删</b>，否则删掉前面的会让后面的下标全部错位 —— 这个坑几乎所有 GUI 新手都踩过。'
},

't-web-1': {
  time: '50 分钟',
  learn: [
    'REST 接口的形状：用「方法 + 路径 + 查询参数」表达对资源做什么操作',
    '<code>urlparse</code> 拆路径和查询串，<code>parse_qs</code> 解析参数（注意值都是列表）',
    '把响应统一成 <code>(状态码, 正文)</code> 两个值，分发逻辑立刻就干净了'
  ],
  rubric: [
    '不带 <code>id</code> 时返回全部文章的 JSON 数组',
    '带 <code>id</code> 但文章不存在时返回 404 和一段错误 JSON，而不是空字符串',
    '<code>DELETE</code> 之后返回的是剩余总数',
    '<code>json.dumps</code> 用了 <code>ensure_ascii=False</code> —— 中文没被转成 <code>\\uXXXX</code>'
  ],
  challenge: '加上 <code>POST /api/posts</code>：从请求体读 JSON，生成新 id 后追加，返回 201 和新建的那篇文章。注意请求体要按 <code>Content-Length</code> 指定的字节数读 —— HTTP 请求体不是「一直读到 EOF」，这个坑第一次写基本都会踩。'
},

't-ops-1': {
  time: '45 分钟',
  learn: [
    '运维文档的通用结构：先给结论、再给证据、最后给建议',
    '错误率这类「比例型指标」比绝对数量更能说明系统健不健康',
    '用 <code>Path.write_text(..., encoding="utf-8")</code> 落盘 —— 不写 encoding 在 Windows 上中文必乱码'
  ],
  rubric: [
    '报告里有总行数、ERROR 数、WARN 数三个基础数字',
    '错误排行是从多到少排的，不是日志里出现的先后顺序',
    '健康度阈值是 20%，两种情况下都能给出正确结论',
    '文件真的写出来了，而且是 UTF-8 编码'
  ],
  challenge: '把「按小时分布」换成一张 ASCII 柱状图，让峰值小时一眼就能看见。文字报告里加一张图，可读性的提升比再多写三段字都大。'
},

't-ai-1': {
  time: '50 分钟',
  learn: [
    '「把图形拉平成向量」这一步是所有图像模型的入口',
    '1-NN 分类器：谁离得近就认为是谁 —— 最简单的分类器，却是理解「距离即相似度」的起点',
    '训练集和测试集必须分开，否则算出来的准确率是自欺欺人'
  ],
  rubric: [
    '<code>to_vector</code> 输出长度是 35，元素全是 0 或 1',
    '距离是逐维计算的（差值的平方和或绝对值之和），不是只比某一个像素',
    '预测返回的是字符形式的数字，不是整数下标',
    '测试集里的手写变体也要能识别 —— 只在标准字形上测是不够的'
  ],
  challenge: '把 1-NN 改成 3-NN（取最近的 3 个投票），看看准确率有没有变化。再想一想：为什么样本少的时候，K 取大反而更容易被噪声带偏？'
},

't-media-1': {
  time: '55 分钟',
  learn: [
    '图片在程序眼里就是一张数字表 —— 会读写像素，就掌握了所有图像处理的入口',
    '灰度用加权公式而不是简单平均，因为人眼对绿色更敏感',
    '降采样前先做平均（而不是隔点取样）能避免锯齿'
  ],
  rubric: [
    '<code>parse_ppm</code> 返回的像素数等于 宽 × 高',
    '灰度值是 0~255 的整数，不是浮点数',
    '<code>downscale</code> 之后宽高各减半，像素数变成原来的四分之一',
    '直方图长度是 10，各项加起来正好等于像素总数'
  ],
  challenge: '再加一个「反色」和一个「二值化」（亮度高于阈值就纯白、否则纯黑），串成一条能自由组合的流水线。顺便想想：为什么「每个处理函数都只接受并返回像素列表」这个约定，能让自由组合变得这么容易？这就是管道式设计的威力。'
}

};

/* 合并进项目对象。项目自己写了同名字段就以项目为准 ——
   留着这个口子，将来想单独覆盖某个项目的文案不用改这张表。 */
/* ============================================================
   各方向的进阶项目
   ------------------------------------------------------------
   和方向本身分开维护：方向定义（章节 / 关卡）和项目清单的增删互不干扰，
   也不用在一个几千行的文件里从十一处去凑一个新项目。

   每个项目跟第一个项目同一套字段（starter / check / hint / solution），
   所以 verify-content.py 和两端 e2e 会自动把它们一起验掉 ——
   不需要在任何地方登记「多了几个项目」。
   ============================================================ */
const TRACK_PROJECTS_EXTRA = {};

function extraProj(track, list) {
  TRACK_PROJECTS_EXTRA[track] = (TRACK_PROJECTS_EXTRA[track] || []).concat(list);
}

/* ---------------- 网络爬虫 ---------------- */

extraProj('crawl', [
  {
    id: 't-crawl-2', emoji: '🛒', name: '商品比价表', sub: '逐条解析 · 价格清洗 · 排序 · CSV', color: '#e8f0ff', diff: 2, tag: '爬虫实战',
    desc: '把靶场商城的商品抓下来，洗掉脏数据，做成一张按价格排好的比价表。',
    intro: `
<p>新闻页的字段是干净的：标题就是标题，日期就是日期。
商城页不是 —— 价格写着 <code>￥1,299.00</code>（带货币符号、带千分位），
缺货的商品还在列表里挂着，只是库存写 0。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>「抓下来」只占爬虫工作量的三成，
剩下七成是<strong>清洗和筛选</strong>。这个项目就是那七成。</div></div>`,
    steps: [
      '写 <code>fetch(url)</code>：抓一页，失败返回 <code>None</code>。',
      '写 <code>parse_products(html)</code>：<strong>先按 <code>&lt;li class="product-item"&gt;</code> 切成一块块</strong>，每一块里再各取商品名 / 价格 / 库存。三个独立的 <code>findall</code> 再 <code>zip</code> 看着更短，但只要有哪一条缺了字段，后面的数据会集体错位 —— 而且看不出错。',
      '价格要洗：去掉 <code>￥</code>、去掉千分位的逗号，再转 <code>float</code>。',
      '两页都抓，然后<strong>过滤掉库存为 0 的</strong>。',
      '按价格从低到高排序，写进 <code>prices.csv</code>（表头 <code>商品名,价格,库存</code>）。',
      '打印最便宜的 3 个，每行 <code>序号. 商品名 价格</code>。'
    ],
    starter: `import urllib.request
import re
import csv

PAGES = [SITE + "/shop.html", SITE + "/shop-2.html"]


def fetch(url):
    """抓一个页面，返回解码后的字符串；失败返回 None。"""
    pass


def parse_products(html):
    """从一页商品列表里提取 [(商品名, 价格(float), 库存(int)), ...]

    页面上长这样：
      <li class="product-item" data-sku="A-1001">
        <span class="product-name">机械键盘 K87</span>
        <span class="product-price">￥499.00</span>
        <span class="product-stock">12</span>
      </li>

    价格有的带千分位（￥1,299.00），要先去掉逗号才能转 float。
    建议先按 <li> 切开、每一块里再取三个字段 —— 错位了看得见。
    """
    pass


goods = []
# 1) 逐页抓取并解析，累加到 goods
# 2) 过滤掉库存为 0 的
# 3) 按价格从低到高排序
# 4) 写 prices.csv（表头 商品名,价格,库存）
# 5) 打印最便宜的 3 个：每行 "序号. 商品名 价格"

`,
    check: { type: 'tests', code: `import csv, os

assert os.path.exists("prices.csv"), "没有生成 prices.csv"
rows = list(csv.reader(open("prices.csv", encoding="utf-8")))
assert len(rows) >= 2, "prices.csv 里至少要有表头 + 一行数据"
head, body = rows[0], rows[1:]
assert any("商品名" in c for c in head), f"第一行应该是表头，实际 {head!r}"

assert len(body) == 8, f"两页一共 10 件，其中 2 件缺货，应该剩 8 件，实际 {len(body)} 件"

prices = [float(r[1]) for r in body]
assert prices == sorted(prices), f"价格要从低到高排，实际 {prices!r}"
assert abs(prices[0] - 89.0) < 1e-9, f"最便宜的应该是 89.0，实际 {prices[0]!r}"
assert abs(prices[-1] - 1299.0) < 1e-9, f"最贵的应该是 1299.0（千分位要洗干净），实际 {prices[-1]!r}"

names = " ".join(r[0] for r in body)
assert "显示器" not in names, "库存 0 的不该出现在结果里"
assert "摄像头" not in names, "库存 0 的不该出现在结果里"
assert "笔记本支架" in names, "第一页的商品没抓到"
assert "桌面音箱" in names, "第二页的商品没抓到"

assert callable(parse_products), "parse_products 应该是一个函数"
one = parse_products('<li class="product-item" data-sku="Z-1">'
                     '<span class="product-name">测试品</span>'
                     '<span class="product-price">￥1,234.50</span>'
                     '<span class="product-stock">2</span></li>')
assert [tuple(x) for x in one] == [("测试品", 1234.5, 2)], f"单个商品的解析结果不对：{one!r}"

assert "最便宜" in __OUTPUT__, "要打印出最便宜的 3 个"` },
    hint: '<code>re.findall(r\'&lt;li class="product-item".*?&lt;/li&gt;\', html, re.S)</code> 先把每件商品切出来；价格用 <code>[￥¥]?([\\d,]+\\.\\d+)</code> 取数字部分，再 <code>.replace(",", "")</code>；库存用 <code>class="product-stock[^"]*"&gt;(\\d+)&lt;</code>（带 <code>out</code> 的那条也是这个 class 前缀）。',
    solution: `import urllib.request
import urllib.error
import re
import csv

PAGES = [SITE + "/shop.html", SITE + "/shop-2.html"]


def fetch(url):
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.URLError:
        return None


def parse_products(html):
    out = []
    for block in re.findall(r'<li class="product-item".*?</li>', html, re.S):
        name = re.search(r'class="product-name">([^<]+)<', block)
        price = re.search(r'class="product-price">[￥¥]?([\\d,]+\\.\\d+)<', block)
        stock = re.search(r'class="product-stock[^"]*">(\\d+)<', block)
        if not (name and price and stock):
            continue
        out.append((name.group(1).strip(),
                    float(price.group(1).replace(",", "")),
                    int(stock.group(1))))
    return out


goods = []
for url in PAGES:
    html = fetch(url)
    if html:
        goods.extend(parse_products(html))

goods = [g for g in goods if g[2] > 0]
goods.sort(key=lambda g: g[1])

with open("prices.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["商品名", "价格", "库存"])
    w.writerows(goods)

print("最便宜的 3 个：")
for i, (name, price, stock) in enumerate(goods[:3], 1):
    print("%d. %s %.1f" % (i, name, price))`
  },

  {
    id: 't-crawl-3', emoji: '🔥', name: '热榜 JSON 采集器', sub: '接口采集 · 单位换算 · 排序 · 取前 N', color: '#fff0e8', diff: 2, tag: '爬虫实战',
    desc: '不解析 HTML，直接读站点的 JSON 接口，把热榜整理成一份排行榜。',
    intro: `
<p>抓网页要跟 HTML 结构搏斗，但很多站点的数据其实有<strong>接口</strong>：
一个 URL 直接返回 JSON。能走接口就别去啃 HTML —— 这是采集里最省事的一条路。</p>
<p>代价是：接口给的格式未必就是你要的格式。<code>hot.json</code> 里的热度是
<code>"12.4k"</code> 这种带单位的字符串，而且榜单<strong>没有排好序</strong>。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>「把接口给的格式，翻译成你要的格式」
是采集工作里最常被低估的一步。数据拿到手了，但还不能直接用。</div></div>`,
    steps: [
      '写 <code>fetch_json(url)</code>：抓接口并 <code>json.loads</code> 成 Python 对象。',
      '写 <code>to_number(text)</code>：<code>"12.4k"</code> → <code>12400</code>，<code>"980"</code> → <code>980</code>（支持大写的 K），看不懂就抛 <code>ValueError</code>。',
      '抓 <code>SITE + "/hot.json"</code>，把每条整理成 <code>(标题, 热度)</code>。',
      '按热度<strong>从高到低</strong>排序 —— 接口给的顺序不是榜序，别偷懒直接用。',
      '取前 5，写进 <code>hot_top5.csv</code>（表头 <code>排名,标题,热度</code>）。',
      '打印 top5：每行 <code>序号. 标题 热度</code>。'
    ],
    starter: `import urllib.request
import json
import csv

URL = SITE + "/hot.json"


def fetch_json(url):
    """抓一个 JSON 接口，返回解析好的 Python 对象（dict / list）。"""
    pass


def to_number(text):
    """把热度转成整数：'12.4k' -> 12400，'1.2k' -> 1200，'980' -> 980。

    'k' 表示千（大小写都要认）。看不懂的输入抛 ValueError。
    """
    pass


data = None
# 1) 抓接口
# 2) 每条算出热度整数，整理成 (标题, 热度)
# 3) 按热度从高到低排序，取前 5
# 4) 写 hot_top5.csv（表头 排名,标题,热度）
# 5) 打印 top5：每行 "序号. 标题 热度"

`,
    check: { type: 'tests', code: `import csv, os

assert os.path.exists("hot_top5.csv"), "没有生成 hot_top5.csv"
rows = list(csv.reader(open("hot_top5.csv", encoding="utf-8")))
head, body = rows[0], rows[1:]
assert any("标题" in c for c in head), f"第一行应该是表头，实际 {head!r}"
assert len(body) == 5, f"应该取前 5 条，实际 {len(body)} 条"

heats = [int(r[2]) for r in body]
assert heats == [12400, 8700, 6100, 4300, 3200], f"热度要从高到低排好，实际 {heats!r}"
assert body[0][1].startswith("Python 3.14"), f"第一名应该是热度最高的那条，实际 {body[0][1]!r}"
assert "关于我们" not in " ".join(r[1] for r in body), "第 6 名不该进前 5"

assert callable(to_number), "to_number 应该是一个函数"
assert to_number("12.4k") == 12400, f"'12.4k' 应该换算成 12400，实际 {to_number('12.4k')!r}"
assert to_number("980") == 980, f"没有后缀的按原数算，实际 {to_number('980')!r}"
assert to_number("2K") == 2000, "大写的 K 也要认"
for bad in ("", "abc", "k"):
    try:
        to_number(bad)
        assert False, f"{bad!r} 应该抛 ValueError"
    except ValueError:
        pass

assert "Python 3.14" in __OUTPUT__, "要打印出榜单内容"` },
    hint: '<code>json.loads(resp.read().decode("utf-8"))</code> 一步到位。换算写成一个分支就够：结尾是 <code>k</code> 就 <code>float(s[:-1]) * 1000</code>，否则直接 <code>int(s)</code>；注意 <code>int(12.4 * 1000)</code> 的结果是 12400（浮点误差不会咬到你，但换成减法就别赌了）。',
    solution: `import urllib.request
import json
import csv

URL = SITE + "/hot.json"


def fetch_json(url):
    with urllib.request.urlopen(url, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))


def to_number(text):
    s = str(text).strip()
    if not s:
        raise ValueError("空的热度")
    mult = 1
    if s[-1] in "kK":
        mult = 1000
        s = s[:-1]
    try:
        return int(float(s) * mult)
    except ValueError:
        raise ValueError("看不懂的热度：%r" % text)


data = fetch_json(URL)
rows = [(it["title"], to_number(it["heat"])) for it in data["items"]]
rows.sort(key=lambda r: r[1], reverse=True)
top = rows[:5]

with open("hot_top5.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["排名", "标题", "热度"])
    for i, (title, heat) in enumerate(top, 1):
        w.writerow([i, title, heat])

print("热榜前 5：")
for i, (title, heat) in enumerate(top, 1):
    print("%d. %s %d" % (i, title, heat))`
  },

  {
    id: 't-crawl-4', emoji: '📈', name: '每日更新监控', sub: '快照持久化 · 集合比对 · 逻辑与 IO 分开', color: '#e8f0ff', diff: 3, tag: '爬虫实战',
    desc: '给一个站做「有没有更新」的监视器：每天抓一次，跟上次比，只报变化。',
    intro: `
<p>抓一次数据只是开始。真实场景里更常见的是<strong>盯着一个站</strong>：
每天跑一次，只关心「今天多了什么、少了什么」。</p>
<p>这就是<strong>增量抓取</strong>的思路：把上一次的结果存成快照，
这一次的结果跟快照比，只处理差异。抓一万条的时候，这一招能省掉 99% 的工作量。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这个项目里
<code>diff_snapshots(old, new)</code> 被刻意拆成一个<strong>纯函数</strong>：
它不抓网、不读文件，只负责比两个列表。判题能直接喂假数据验它 ——
而这是「增量监控」真正难写对的地方。把逻辑和 IO 分开，好处就在这里。</div></div>`,
    steps: [
      '写 <code>fetch(url)</code>：抓一页，失败返回 <code>None</code>。',
      '写 <code>collect_titles()</code>：从 <code>/news.html</code> 开始顺着 <code>pager-next</code> 抓完所有列表页，按页面顺序返回标题列表。',
      '写 <code>load_snapshot(path)</code> / <code>save_snapshot(path, titles)</code>：读写 JSON 快照；文件不存在或读坏了都当空列表（第一次跑就是这种情况）。',
      '写 <code>diff_snapshots(old, new)</code>：返回 <code>(新增, 消失)</code>，按 new / old 各自的顺序。<strong>用集合的语义比</strong> —— 顺序变了不算变化，否则真实站点天天抖动，你会天天收到误报。',
      '主流程已经给好了：没有旧快照就报「已建立基线」，有就报新增和消失，最后把当前结果写回快照。'
    ],
    starter: `import json
import os
import re
import urllib.request
import urllib.error

BASE = SITE + "/news.html"
SNAP = "snapshot.json"


def fetch(url):
    """抓一页，返回解码后的字符串；失败返回 None。"""
    pass


def collect_titles():
    """顺着 pager-next 抓完所有列表页，按页面顺序返回标题列表。"""
    pass


def load_snapshot(path):
    """读快照。文件不存在（或内容读坏了）就返回空列表。"""
    pass


def save_snapshot(path, titles):
    """把标题列表写进快照文件（JSON，UTF-8，中文不要转义）。"""
    pass


def diff_snapshots(old, new):
    """返回 (新增, 消失)。

    只在 new 里的算新增（按 new 的顺序），只在 old 里的算消失（按 old 的顺序）。
    顺序变化不算变化。
    """
    pass


old = load_snapshot(SNAP)
now = collect_titles()
if not old:
    print("首次运行：已建立基线，共 %d 条" % len(now))
else:
    added, removed = diff_snapshots(old, now)
    print("新增 %d 条" % len(added))
    print("消失 %d 条" % len(removed))
    for t in added:
        print("  + " + t)
    for t in removed:
        print("  - " + t)
save_snapshot(SNAP, now)
`,
    check: { type: 'tests', code: `import json, os

assert os.path.exists("snapshot.json"), "没有生成 snapshot.json"
snap = json.load(open("snapshot.json", encoding="utf-8"))
assert isinstance(snap, list), f"快照应该是一个标题列表，实际是 {type(snap).__name__}"
assert len(snap) == 5, f"两页一共 5 条新闻，快照里却有 {len(snap)} 条"
joined = " ".join(snap)
assert "Python 3.14" in joined, "第一页的新闻没进快照"
assert "类型注解" in joined, "第二页的新闻没进快照"

assert callable(diff_snapshots), "diff_snapshots 应该是一个函数"

added, removed = diff_snapshots(["a", "b", "c"], ["b", "c", "d"])
assert list(added) == ["d"], f"新增应该是 ['d']，实际 {list(added)!r}"
assert list(removed) == ["a"], f"消失应该是 ['a']，实际 {list(removed)!r}"

a2, r2 = diff_snapshots([], ["x", "y"])
assert list(a2) == ["x", "y"] and list(r2) == [], f"旧快照为空时全都是新增：{list(a2)!r} / {list(r2)!r}"
a3, r3 = diff_snapshots(["x"], [])
assert list(a3) == [] and list(r3) == ["x"], f"新结果为空时全都是消失：{list(a3)!r} / {list(r3)!r}"
a4, r4 = diff_snapshots(["a", "b"], ["b", "a"])
assert list(a4) == [] and list(r4) == [], "只是顺序变了，不该算新增或消失"

assert "基线" in __OUTPUT__, "第一次跑没有旧快照，应该说清是在建立基线"
assert "5" in __OUTPUT__, "打印里要带上条数"` },
    hint: '标题还是 <code>class="news-title"[^&gt;]*&gt;([^&lt;]+)&lt;</code>；下一页是 <code>class="pager-next" href="([^"]+)"</code>，注意 href 是 <code>/news-2.html</code> 这种站内绝对路径，要补上 <code>SITE</code>。防死循环：把访问过的 url 记进 set。比对就是两个推导式：<code>[t for t in new if t not in set(old)]</code>。',
    solution: `import json
import os
import re
import urllib.request
import urllib.error

BASE = SITE + "/news.html"
SNAP = "snapshot.json"


def fetch(url):
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.URLError:
        return None


def collect_titles():
    titles, url, seen = [], BASE, set()
    while url and url not in seen:
        seen.add(url)
        html = fetch(url)
        if not html:
            break
        titles += [t.strip() for t in re.findall(r'class="news-title"[^>]*>([^<]+)<', html)]
        nxt = re.search(r'class="pager-next" href="([^"]+)"', html)
        if nxt:
            href = nxt.group(1)
            url = href if href.startswith("http") else SITE + href
        else:
            url = None
    return titles


def load_snapshot(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (ValueError, OSError):
        return []
    return data if isinstance(data, list) else []


def save_snapshot(path, titles):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(titles, f, ensure_ascii=False, indent=1)


def diff_snapshots(old, new):
    old_set, new_set = set(old), set(new)
    added = [t for t in new if t not in old_set]
    removed = [t for t in old if t not in new_set]
    return added, removed


old = load_snapshot(SNAP)
now = collect_titles()
if not old:
    print("首次运行：已建立基线，共 %d 条" % len(now))
else:
    added, removed = diff_snapshots(old, now)
    print("新增 %d 条" % len(added))
    print("消失 %d 条" % len(removed))
    for t in added:
        print("  + " + t)
    for t in removed:
        print("  - " + t)
save_snapshot(SNAP, now)`
  }
]);

/* ---------------- 数据分析与可视化 ---------------- */

extraProj('data', [
  {
    id: 't-data-2', emoji: '📊', name: '成绩单分析器', sub: '缺失处理 · 分段统计 · 平均值 vs 中位数', color: '#e8f0ff', diff: 2, tag: '数据实战',
    desc: '把一份带缺考的成绩单变成一组统计数字和一张分段图。',
    intro: `
<p>这份成绩单里有两个人写的是 <code>-</code> —— 缺考。<strong>缺考不是 0 分</strong>，
这两者的区别会一路影响到平均分、中位数、每一段的分布。</p>
<p>把缺失值当成 0 是最常见的一类数据错误：它看起来只是「多算了一个人」，
实际上把整份统计都拉偏了。</p>
<div class="tip tip-fun"><span class="tip-ico">🎯</span><div>顺带认识一对老朋友：
平均分被极端值拖着走，中位数不会。考完试有人说「平均分被学霸拉高了」，
说的就是这个。</div></div>`,
    steps: [
      '写 <code>parse_scores(text)</code>：解析成 <code>[(姓名, 分数), ...]</code>，<code>-</code> 的分数记成 <code>None</code>。',
      '写 <code>stats(rows)</code>：返回 <code>{\'n\', \'avg\', \'median\', \'high\', \'low\'}</code> 五个键，<strong>只统计有效分数</strong>；平均分保留 1 位小数。',
      '写 <code>buckets(rows)</code>：按 <code>&lt;60 / 60-79 / 80-89 / 90+</code> 四段返回人数列表。',
      '主流程已经给好了：打印这几项，每个分数段后面用 <code>█</code> 画一段柱子。'
    ],
    starter: `DATA = """张三,88
李四,-
王五,73
赵六,95
钱七,60
孙八,-
周九,42
吴十,100
"""


def parse_scores(text):
    """解析成 [(姓名, 分数), ...]。分数是 int；写 '-' 的表示缺考，分数是 None。

    缺考**不是** 0 分 —— 这个区别决定了后面所有统计对不对。
    """
    pass


def stats(rows):
    """返回 {'n': 有效人数, 'avg': 平均分(保留1位小数), 'median': 中位数,
             'high': 最高分, 'low': 最低分}，只统计有效分数。"""
    pass


def buckets(rows):
    """返回四段人数： [不足60, 60-79, 80-89, 90及以上]"""
    pass


rows = parse_scores(DATA)
absent = sum(1 for _n, v in rows if v is None)
print("解析出 %d 行，其中缺考 %d 行" % (len(rows), absent))

s = stats(rows)
print("有效人数 %d" % s['n'])
print("平均分 %.1f" % s['avg'])
print("中位数 %.1f" % s['median'])
print("最高分 %d   最低分 %d" % (s['high'], s['low']))
print("分数段：")
for name, cnt in zip(['不足60', '60-79', '80-89', '90+'], buckets(rows)):
    print("%-8s %s %d" % (name, '█' * cnt, cnt))
`,
    check: { type: 'tests', code: `rows = parse_scores(DATA)
assert isinstance(rows, list) and len(rows) == 8, f"应该解析出 8 行，实际 {rows!r}"
assert tuple(rows[0]) == ("张三", 88), f"第一行不对：{rows[0]!r}"
assert rows[1][1] is None, f"'-' 表示缺考，分数该是 None 而不是 0：{rows[1]!r}"
assert rows[5][1] is None, f"孙八也是缺考：{rows[5]!r}"
assert tuple(rows[3]) == ("赵六", 95), f"第四行不对：{rows[3]!r}"

s = stats(rows)
assert s["n"] == 6, f"有效分数只有 6 个（8 减 2 个缺考），实际 {s['n']}"
assert abs(s["avg"] - 76.3) < 1e-9, f"平均分应该是 76.3，实际 {s['avg']!r}"
assert abs(s["median"] - 80.5) < 1e-9, f"中位数应该是 80.5，实际 {s['median']!r}"
assert s["high"] == 100 and s["low"] == 42, f"最高 / 最低不对：{s['high']!r} / {s['low']!r}"

b = list(buckets(rows))
assert b == [1, 2, 1, 2], f"分段人数应该是 [1, 2, 1, 2]，实际 {b!r}"
assert sum(b) == 6, "四段加起来应该等于有效人数（缺考不落在任何一段里）"

assert "中位数" in __OUTPUT__, "要把中位数打印出来"
assert "80.5" in __OUTPUT__, "中位数 80.5 应该出现在输出里"
assert __OUTPUT__.count("█") >= 5, "每个分数段要画一段柱状图"` },
    hint: '中位数先把有效分数 <code>sorted()</code>：奇数个取中间那个，偶数个取中间两个的平均。分段就是一个 <code>if/elif</code> 链，四段共用一次循环。注意 <code>avg</code> 用 <code>round(..., 1)</code>，别用整数除法。',
    solution: `DATA = """张三,88
李四,-
王五,73
赵六,95
钱七,60
孙八,-
周九,42
吴十,100
"""


def parse_scores(text):
    out = []
    for line in text.strip().splitlines():
        name, _, raw = line.partition(",")
        raw = raw.strip()
        out.append((name.strip(), None if raw in ("", "-") else int(raw)))
    return out


def stats(rows):
    vals = sorted(v for _n, v in rows if v is not None)
    n = len(vals)
    mid = n // 2
    median = vals[mid] if n % 2 else (vals[mid - 1] + vals[mid]) / 2
    return {
        "n": n,
        "avg": round(sum(vals) / n, 1),
        "median": median,
        "high": max(vals),
        "low": min(vals),
    }


def buckets(rows):
    out = [0, 0, 0, 0]
    for _n, v in rows:
        if v is None:
            continue
        if v < 60:
            out[0] += 1
        elif v < 80:
            out[1] += 1
        elif v < 90:
            out[2] += 1
        else:
            out[3] += 1
    return out


rows = parse_scores(DATA)
absent = sum(1 for _n, v in rows if v is None)
print("解析出 %d 行，其中缺考 %d 行" % (len(rows), absent))

s = stats(rows)
print("有效人数 %d" % s['n'])
print("平均分 %.1f" % s['avg'])
print("中位数 %.1f" % s['median'])
print("最高分 %d   最低分 %d" % (s['high'], s['low']))
print("分数段：")
for name, cnt in zip(['不足60', '60-79', '80-89', '90+'], buckets(rows)):
    print("%-8s %s %d" % (name, '█' * cnt, cnt))`
  },

  {
    id: 't-data-3', emoji: '📈', name: '月度趋势与环比', sub: '相邻比较 · 环比增长率 · 季度汇总', color: '#e8f0ff', diff: 2, tag: '数据实战',
    desc: '给一整年的销售数字，算出每个月的环比、找出高峰和低谷、按季度汇总。',
    intro: `
<p>一串数字单看没感觉，加上<strong>「跟上个月比」</strong>就立刻有含义了 ——
这就是环比。</p>
<p>这个项目的重点不是算法（公式就一行），而是<strong>把「相邻两项」这件事写对</strong>：
第一项没有「上一项」，所以它的环比是空的，不是 0。把空当成 0，
第一个月的环比就会凭空多出一个 -100%。</p>`,
    steps: [
      '写 <code>mom(values)</code>：环比增长率（%），返回和输入等长的列表，<strong>第一项是 <code>None</code></strong>，其余 <code>round(..., 1)</code>。',
      '写 <code>best_month(months, values)</code>：销售额最高那个月。',
      '写 <code>worst_mom(months, growth)</code>：环比跌得最狠那个月，跳过第一项的 <code>None</code>。',
      '写 <code>quarter_totals(months, values)</code>：返回 <code>{\'Q1\': ..., \'Q2\': ..., \'Q3\': ..., \'Q4\': ...}</code>。',
      '主流程已经给好了：打印 12 个月的环比、全年合计、最旺的月份、跌得最狠的月份，以及每个季度的柱子。'
    ],
    starter: `MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月",
          "7月", "8月", "9月", "10月", "11月", "12月"]
SALES = [120, 98, 143, 160, 155, 188, 142, 130, 176, 205, 231, 260]


def mom(values):
    """环比增长率（%）。返回和 values 等长的列表，第一项是 None（1 月没有上一月）。

    公式：(本月 - 上月) / 上月 * 100，四舍五入到 1 位小数。
    """
    pass


def best_month(months, values):
    """销售额最高的那个月份名。"""
    pass


def worst_mom(months, growth):
    """环比跌得最狠的月份名（跳过第一项的 None）。"""
    pass


def quarter_totals(months, values):
    """按季度汇总，返回 {'Q1': 合计, 'Q2': 合计, 'Q3': 合计, 'Q4': 合计}"""
    pass


g = mom(SALES)
print("环比增长率：")
for m, v in zip(MONTHS, g):
    print("%-4s %s" % (m, "—" if v is None else "%+.1f%%" % v))
print("全年合计 %d" % sum(SALES))
print("最旺的月份 %s" % best_month(MONTHS, SALES))
print("跌得最狠的月份 %s" % worst_mom(MONTHS, g))
q = quarter_totals(MONTHS, SALES)
for k in ("Q1", "Q2", "Q3", "Q4"):
    print("%s %s %d" % (k, "█" * (q[k] // 50), q[k]))
`,
    check: { type: 'tests', code: `g = mom(SALES)
assert len(g) == 12, f"应该有 12 个数，实际 {len(g)}"
assert g[0] is None, f"1 月没有上一月，第一项该是 None 而不是某个数：{g[0]!r}"
assert abs(g[1] - (-18.3)) < 1e-9, f"2 月环比应该是 -18.3，实际 {g[1]!r}"
assert abs(g[2] - 45.9) < 1e-9, f"3 月环比应该是 45.9，实际 {g[2]!r}"
assert abs(g[6] - (-24.5)) < 1e-9, f"7 月环比应该是 -24.5，实际 {g[6]!r}"
assert abs(g[11] - 12.6) < 1e-9, f"12 月环比应该是 12.6，实际 {g[11]!r}"

assert best_month(MONTHS, SALES) == "12月", f"最旺的月份应该是 12月，实际 {best_month(MONTHS, SALES)!r}"
assert worst_mom(MONTHS, g) == "7月", f"跌得最狠的应该是 7月，实际 {worst_mom(MONTHS, g)!r}"

q = quarter_totals(MONTHS, SALES)
got = {k: int(v) for k, v in q.items()}
assert got == {"Q1": 361, "Q2": 503, "Q3": 448, "Q4": 696}, f"季度合计不对：{got!r}"

assert "2008" in __OUTPUT__, "要把全年合计 2008 打印出来"
assert "12月" in __OUTPUT__ and "7月" in __OUTPUT__, "最旺和跌得最狠的月份都要打印"
assert __OUTPUT__.count("█") >= 4, "每个季度要画一段柱子"` },
    hint: '环比用 <code>zip(values[1:], values)</code> 一次拿到「本月 + 上月」：<code>round((b - a) / a * 100, 1)</code>，前面补一个 None。季度就是把下标 <code>i // 3</code> 当季度序号累加。',
    solution: `MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月",
          "7月", "8月", "9月", "10月", "11月", "12月"]
SALES = [120, 98, 143, 160, 155, 188, 142, 130, 176, 205, 231, 260]


def mom(values):
    out = [None]
    for prev, cur in zip(values, values[1:]):
        out.append(round((cur - prev) / prev * 100, 1))
    return out


def best_month(months, values):
    return months[values.index(max(values))]


def worst_mom(months, growth):
    pairs = [(v, m) for m, v in zip(months, growth) if v is not None]
    return min(pairs)[1]


def quarter_totals(months, values):
    out = {}
    for i, v in enumerate(values):
        key = "Q%d" % (i // 3 + 1)
        out[key] = out.get(key, 0) + v
    return out


g = mom(SALES)
print("环比增长率：")
for m, v in zip(MONTHS, g):
    print("%-4s %s" % (m, "—" if v is None else "%+.1f%%" % v))
print("全年合计 %d" % sum(SALES))
print("最旺的月份 %s" % best_month(MONTHS, SALES))
print("跌得最狠的月份 %s" % worst_mom(MONTHS, g))
q = quarter_totals(MONTHS, SALES)
for k in ("Q1", "Q2", "Q3", "Q4"):
    print("%s %s %d" % (k, "█" * (q[k] // 50), q[k]))`
  }
]);

/* ---------------- 数据库操作 ---------------- */

extraProj('db', [
  {
    id: 't-db-2', emoji: '📚', name: '图书借阅查询', sub: 'JOIN · GROUP BY · 子查询', color: '#e8f0ff', diff: 2, tag: '数据库实战',
    desc: '建两张表、灌一批借阅记录，然后用 SQL 回答四个真实的问题。',
    intro: `
<p>单个表能回答的问题很有限。「谁还没还书」需要把 <code>books</code> 和 <code>loans</code>
两张表<strong>连起来</strong>才知道 —— 这就是 JOIN 存在的理由。</p>
<p>这个项目要回答四个问题，每个问题对应一种 SQL 套路：连表、分组、找「没有出现过的」。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>最后一个问题
「从来没被借过的书」最容易写错：用 <code>NOT IN</code> 顺手，但一旦子查询里出现
<code>NULL</code> 就会静默返回空结果。<code>LEFT JOIN ... IS NULL</code>
是更稳的写法 —— 这个坑在真实项目里每年都要坑到人。</div></div>`,
    steps: [
      '写 <code>setup(conn)</code>：<code>DROP</code> 掉旧表再建，灌进 <code>BOOKS</code> 和 <code>LOANS</code>。先 DROP 是为了反复跑结果一致。',
      '写 <code>unreturned(conn)</code>：用 <strong>JOIN</strong> 把两张表连起来，取 <code>returned = 0</code> 的行，返回 <code>[(书名, 借书人), ...]</code>，按<strong>书的 id</strong> 排序（别按书名，中文排序结果不好预期）。',
      '写 <code>count_by_reader(conn)</code>：用 <strong>GROUP BY</strong> 数出每人借过几本（含已还），返回字典。',
      '写 <code>never_borrowed(conn)</code>：从没被借过的书名列表，按 id 排序。',
      '主流程已经给好了：把三块结果打印出来。'
    ],
    starter: `import sqlite3

BOOKS = [
    (1, "Python 编程从入门到实践", "Eric Matthes"),
    (2, "流畅的 Python", "Luciano Ramalho"),
    (3, "算法图解", "Aditya Bhargava"),
    (4, "数据库系统概念", "Silberschatz"),
    (5, "重构", "Martin Fowler"),
]
LOANS = [
    (1, 1, "张三", 1),
    (2, 2, "张三", 0),
    (3, 1, "李四", 0),
    (4, 3, "王五", 1),
    (5, 2, "王五", 0),
    (6, 4, "张三", 1),
]


def setup(conn):
    """建表 + 灌数据（先 DROP 再 CREATE，保证反复跑结果一致）。

    books(id INTEGER PRIMARY KEY, title TEXT, author TEXT)
    loans(id INTEGER PRIMARY KEY, book_id INTEGER, reader TEXT, returned INTEGER)

    returned = 1 表示已还，0 表示还没还。
    """
    pass


def unreturned(conn):
    """还没还的书：[(书名, 借书人), ...]，按书的 id 排序。"""
    pass


def count_by_reader(conn):
    """每个人一共借过几本（含已还）：{借书人: 本数}"""
    pass


def never_borrowed(conn):
    """从来没被借过的书名列表（按 id 排序）。"""
    pass


conn = sqlite3.connect("library.db")
setup(conn)
print("还没还的：")
for title, reader in unreturned(conn):
    print("  %s —— %s" % (title, reader))
print("每人借阅量：%s" % count_by_reader(conn))
print("从没借过的：%s" % never_borrowed(conn))
conn.close()
`,
    check: { type: 'tests', code: `import os, sqlite3

assert os.path.exists("library.db"), "没有生成 library.db"
conn = sqlite3.connect("library.db")
try:
    setup(conn)
    n = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
    assert n == 5, f"books 应该有 5 行，实际 {n}"
    n = conn.execute("SELECT COUNT(*) FROM loans").fetchone()[0]
    assert n == 6, f"loans 应该有 6 行，实际 {n}"

    got = [tuple(x) for x in unreturned(conn)]
    want = [("Python 编程从入门到实践", "李四"),
            ("流畅的 Python", "张三"),
            ("流畅的 Python", "王五")]
    assert got == want, f"还没还的书不对：\\n实际 {got!r}\\n期望 {want!r}"

    cb = count_by_reader(conn)
    assert dict(cb) == {"张三": 3, "李四": 1, "王五": 2}, f"借阅量不对：{dict(cb)!r}"

    nb = list(never_borrowed(conn))
    assert nb == ["重构"], f"从没被借过的应该是 ['重构']，实际 {nb!r}"

    up = __SRC__.upper()
    assert "JOIN" in up, "「谁还没还书」要把两张表连起来查，用 JOIN"
    assert "GROUP BY" in up, "按人汇总要用 GROUP BY"
finally:
    conn.close()

assert "还没还" in __OUTPUT__, "主流程要打印「还没还的」这一块"` },
    hint: '<code>unreturned</code>：<code>SELECT b.title, l.reader FROM loans l JOIN books b ON b.id = l.book_id WHERE l.returned = 0 ORDER BY b.id</code>。<code>count_by_reader</code>：<code>GROUP BY reader</code> + <code>COUNT(*)</code>。<code>never_borrowed</code>：<code>LEFT JOIN</code> 之后 <code>WHERE l.id IS NULL</code>。',
    solution: `import sqlite3

BOOKS = [
    (1, "Python 编程从入门到实践", "Eric Matthes"),
    (2, "流畅的 Python", "Luciano Ramalho"),
    (3, "算法图解", "Aditya Bhargava"),
    (4, "数据库系统概念", "Silberschatz"),
    (5, "重构", "Martin Fowler"),
]
LOANS = [
    (1, 1, "张三", 1),
    (2, 2, "张三", 0),
    (3, 1, "李四", 0),
    (4, 3, "王五", 1),
    (5, 2, "王五", 0),
    (6, 4, "张三", 1),
]


def setup(conn):
    conn.execute("DROP TABLE IF EXISTS loans")
    conn.execute("DROP TABLE IF EXISTS books")
    conn.execute("CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author TEXT)")
    conn.execute("CREATE TABLE loans (id INTEGER PRIMARY KEY, book_id INTEGER,"
                 " reader TEXT, returned INTEGER)")
    conn.executemany("INSERT INTO books (id, title, author) VALUES (?, ?, ?)", BOOKS)
    conn.executemany("INSERT INTO loans (id, book_id, reader, returned) VALUES (?, ?, ?, ?)",
                     LOANS)
    conn.commit()


def unreturned(conn):
    cur = conn.execute(
        "SELECT b.title, l.reader FROM loans l JOIN books b ON b.id = l.book_id"
        " WHERE l.returned = 0 ORDER BY b.id")
    return [(t, r) for t, r in cur.fetchall()]


def count_by_reader(conn):
    cur = conn.execute("SELECT reader, COUNT(*) FROM loans GROUP BY reader")
    return {r: n for r, n in cur.fetchall()}


def never_borrowed(conn):
    # LEFT JOIN + IS NULL：比 NOT IN 稳（子查询里一旦有 NULL，NOT IN 会静默返回空）
    cur = conn.execute(
        "SELECT b.title FROM books b LEFT JOIN loans l ON l.book_id = b.id"
        " WHERE l.id IS NULL ORDER BY b.id")
    return [row[0] for row in cur.fetchall()]


conn = sqlite3.connect("library.db")
setup(conn)
print("还没还的：")
for title, reader in unreturned(conn):
    print("  %s —— %s" % (title, reader))
print("每人借阅量：%s" % count_by_reader(conn))
print("从没借过的：%s" % never_borrowed(conn))
conn.close()`
  },

  {
    id: 't-db-3', emoji: '🏦', name: '带事务的转账', sub: '事务 · 回滚 · 一致性校验', color: '#e8f0ff', diff: 3, tag: '数据库实战',
    desc: '写一个转账函数，把「钱既不能凭空消失，也不能凭空出现」这条规矩焊死在代码里。',
    intro: `
<p>转账是数据库里最经典的例子，因为它有一个不可妥协的要求：
<strong>要么两边都变，要么两边都不变</strong>。</p>
<p>写错的方式很朴素 —— 先扣款，再发现对方账户不存在（或者余额不够），
于是钱就凭空少了一笔。这个项目就是让你亲手把这件事做对。</p>
<div class="tip tip-danger"><span class="tip-ico">⚠️</span><div>注意
<code>transfer</code> 必须用<strong>传进来的那个 <code>conn</code></strong>，
不要自己再 <code>connect()</code> 一次 —— 判题会拿它自己的连接调你的函数，
你自己开的新连接改的是另一份会话，看起来「跑了没报错」，实际什么都没验到。</div></div>`,
    steps: [
      '写 <code>setup(conn)</code>：建 <code>accounts(id, name, balance)</code>，三个人余额依次 1000 / 500 / 0。',
      '写 <code>total(conn)</code>：所有余额之和（它就是「钱有没有守恒」的裁判）。',
      '写 <code>transfer(conn, src, dst, amount)</code>：金额非正数抛 <code>ValueError</code>；余额不足抛 <code>ValueError</code>（消息里带「余额不足」）；account 不存在也抛 <code>ValueError</code>。<strong>任何一次失败之后，三个人的余额都必须跟失败前一模一样。</strong>',
      '成功时返回 <code>True</code>，并保证两边的余额都真的变了。',
      '主流程已经给好了：转 200、打印余额、再故意转一笔巨款并看它怎么失败。'
    ],
    starter: `import sqlite3

START = [("张三", 1000), ("李四", 500), ("王五", 0)]


def setup(conn):
    """建表 + 灌初始数据（先 DROP 再 CREATE，保证反复跑结果一致）。

    accounts(id INTEGER PRIMARY KEY, name TEXT, balance INTEGER)
    余额依次是 START 里的 1000 / 500 / 0，合计 1500。
    """
    pass


def total(conn):
    """所有账户余额之和。"""
    pass


def transfer(conn, src, dst, amount):
    """从 src 转 amount 给 dst（src / dst 都是账户 id）。

    - amount 必须是正数，否则 ValueError
    - src 余额不够 -> ValueError（消息里带「余额不足」）
    - 账户不存在 -> ValueError
    - 上面任何一种失败，都不能改动任何余额：只扣不加是最容易犯的错
    - 成功返回 True

    用传进来的这个 conn，不要自己再 connect 一次。
    """
    pass


conn = sqlite3.connect("bank.db")
setup(conn)
print("初始总余额 %d" % total(conn))

transfer(conn, 1, 2, 200)
print("转 200 之后：%s" % dict(conn.execute("SELECT id, balance FROM accounts").fetchall()))
print("总余额还是 %d" % total(conn))

try:
    transfer(conn, 1, 2, 99999)
except ValueError as e:
    print("这笔转不成：%s" % e)
print("失败之后总余额 %d" % total(conn))
conn.close()
`,
    check: { type: 'tests', code: `import os, sqlite3

assert os.path.exists("bank.db"), "没有生成 bank.db"
conn = sqlite3.connect("bank.db")
try:
    setup(conn)

    def dump():
        return dict(conn.execute("SELECT id, balance FROM accounts").fetchall())

    assert total(conn) == 1500, f"初始总余额应该是 1500，实际 {total(conn)}"

    assert transfer(conn, 2, 3, 100) is True, "成功的转账应该返回 True"
    assert dump() == {1: 1000, 2: 400, 3: 100}, f"转 100 之后余额不对：{dump()!r}"
    assert total(conn) == 1500, "转账不该改变总额"

    before = dump()
    try:
        transfer(conn, 3, 1, 99999)
        assert False, "余额不足应该抛 ValueError"
    except ValueError as e:
        assert "余额不足" in str(e), f"错误消息里要说清是余额不足，实际 {str(e)!r}"
    assert dump() == before, f"失败的转账不能动任何余额：{before!r} -> {dump()!r}"

    before = dump()
    try:
        transfer(conn, 1, 999, 50)
        assert False, "账户不存在应该抛 ValueError"
    except ValueError:
        pass
    assert dump() == before, f"半途失败必须整体回滚，不能只扣不加：{before!r} -> {dump()!r}"

    for bad in (0, -5):
        before = dump()
        try:
            transfer(conn, 1, 2, bad)
            assert False, f"金额 {bad} 应该被拒绝"
        except ValueError:
            pass
        assert dump() == before, "被拒绝的转账不该动余额"

    assert total(conn) == 1500, "从头到尾，总余额都该是 1500"
finally:
    conn.close()

assert "总余额" in __OUTPUT__, "主流程要打印总余额"` },
    hint: '两道 UPDATE 要包在一次事务里：用 <code>try / except / conn.rollback() / raise</code>，或者先 <code>conn.execute("BEGIN")</code>。余额不足的判断写成「<code>SELECT balance ...</code> 拿到的值 < amount」，账户是否存在就看那次查询是不是 <code>None</code>。',
    solution: `import sqlite3

START = [("张三", 1000), ("李四", 500), ("王五", 0)]


def setup(conn):
    conn.execute("DROP TABLE IF EXISTS accounts")
    conn.execute("CREATE TABLE accounts (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER)")
    conn.executemany("INSERT INTO accounts (id, name, balance) VALUES (?, ?, ?)",
                     [(i, name, bal) for i, (name, bal) in enumerate(START, 1)])
    conn.commit()


def total(conn):
    return conn.execute("SELECT COALESCE(SUM(balance), 0) FROM accounts").fetchone()[0]


def transfer(conn, src, dst, amount):
    if amount <= 0:
        raise ValueError("转账金额必须是正数")

    def balance_of(acc):
        row = conn.execute("SELECT balance FROM accounts WHERE id = ?", (acc,)).fetchone()
        if row is None:
            raise ValueError("账户不存在：%s" % acc)
        return row[0]

    if balance_of(src) < amount:
        raise ValueError("余额不足，无法转账")
    balance_of(dst)

    try:
        conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (amount, src))
        conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (amount, dst))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return True


conn = sqlite3.connect("bank.db")
setup(conn)
print("初始总余额 %d" % total(conn))

transfer(conn, 1, 2, 200)
print("转 200 之后：%s" % dict(conn.execute("SELECT id, balance FROM accounts").fetchall()))
print("总余额还是 %d" % total(conn))

try:
    transfer(conn, 1, 2, 99999)
except ValueError as e:
    print("这笔转不成：%s" % e)
print("失败之后总余额 %d" % total(conn))
conn.close()`
  }
]);

/* ---------------- 测试开发 ---------------- */

extraProj('test', [
  {
    id: 't-test-2', emoji: '🛒', name: '购物车：写测试 + 修 bug', sub: 'unittest · 边界用例 · 反向验证测试有效性', color: '#e8f0ff', diff: 3, tag: '测试实战',
    desc: '给一份「有两个 bug」的购物车写测试，让测试告诉你错在哪儿，再把它修好。',
    intro: `
<p>先给你一份<strong>坏掉</strong>的实现。<strong>不要先读它、更不要先改它</strong> ——
先写测试。测试会告诉你错在哪一行，这个顺序才是真实工作里的顺序。</p>
<p>但「写了很多测试」和「测试真的有用」是两件事。判题会做一件狠事：
把 bug <strong>放回去</strong>，然后要求你的测试<strong>必须报错</strong>。
测试抓不到 bug，就等于没有测试。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这个手法叫
<strong>变异测试</strong>（mutation testing）：故意制造一个错误，
看你的测试能不能发现。它是检验测试质量的唯一硬指标。</div></div>`,
    steps: [
      '先别改 <code>Cart</code>。读一遍，猜一猜哪里可能不对。',
      '在 <code>CartTest</code> 里写<strong>至少 6 个</strong>测试方法，覆盖：算总价、同名合并、<code>qty&lt;=0</code>、删除的返回值、折扣边界（0 / 1 / 越界）。',
      '跑一遍：<code>python -m unittest</code>，看哪几条红了 —— 红的就是 bug 的坐标。',
      '把 <code>Cart</code> 修好，让所有测试变绿。',
      '回头检查：如果我把 bug 偷偷放回去，你的测试能不能立刻发现？'
    ],
    starter: `import unittest


class Cart:
    """购物车。这份实现**有两个 bug**，先别改它 ——
    先把测试写出来，让测试告诉你错在哪儿。
    """

    def __init__(self):
        self.items = []          # [(名称, 单价, 数量)]

    def add(self, name, price, qty=1):
        """加商品。qty <= 0 直接忽略；同名商品合并数量。"""
        if qty <= 0:
            return
        for i, (n, p, _q) in enumerate(self.items):
            if n == name:
                self.items[i] = (n, p, self.items[i][2] + qty)
                return
        self.items.append((name, price, qty))

    def remove(self, name):
        """删掉某个商品。删到了返回 True，本来就没有返回 False。"""
        for i, (n, _p, _q) in enumerate(self.items):
            if n == name:
                del self.items[i]
                return True
        return False

    def subtotal(self):
        """所有商品 单价 × 数量 的和。"""
        return sum(p for _n, p, _q in self.items)

    def discount(self, rate):
        """rate 是折扣率：0.2 表示打八折。返回折后总价，四舍五入到分（2 位小数）。

        rate 不在 0~1 之间时抛 ValueError。
        """
        if not 0 <= rate <= 1:
            raise ValueError("折扣率要在 0 到 1 之间")
        return round(self.subtotal() * rate, 2)


class CartTest(unittest.TestCase):
    """把 Cart 的 bug 测出来。至少 6 个测试方法。

    要覆盖到：算总价（注意数量）、同名商品合并、qty <= 0 被忽略、
    删除的返回值、折扣（打八折到底怎么算）、折扣 0 和 1 的边界、越界要报错。
    只测「加一件商品总价对」是抓不到 bug 的。
    """

    def test_placeholder(self):
        self.assertTrue(True)
`,
    check: { type: 'tests', code: `import io, unittest

assert isinstance(Cart, type), "Cart 应该是一个类"
assert issubclass(CartTest, unittest.TestCase), "CartTest 要继承 unittest.TestCase"

runner = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0)
suite = unittest.TestLoader().loadTestsFromTestCase(CartTest)
res = runner.run(suite)
assert res.testsRun >= 6, f"至少写 6 个测试方法，实际只有 {res.testsRun} 个"
assert not res.failures, "你自己的测试还有没过的：" + str(res.failures[:1])[:400]
assert not res.errors, "你的测试里有报错的：" + str(res.errors[:1])[:400]

# ---- 隐藏用例：直接验实现 ----
c = Cart()
c.add("键盘", 499, 2)
c.add("鼠标", 129)
assert c.subtotal() == 1127, f"小计应该是 499×2+129 = 1127，实际 {c.subtotal()}"
c.add("键盘", 499)
assert len(c.items) == 2, f"同名商品要合并成一条，实际 {len(c.items)} 条"
assert c.subtotal() == 1626, f"合并后是 499×3 + 129 = 1626，实际 {c.subtotal()}"
c.add("硬盘", 559, 0)
assert len(c.items) == 2, "qty <= 0 的商品要被忽略"
assert c.remove("鼠标") is True, "删到了要返回 True"
assert c.remove("鼠标") is False, "本来就没有要返回 False"
assert c.subtotal() == 1497, "删掉鼠标后只剩 499×3"
assert round(c.discount(0.2), 2) == 1197.6, f"打八折是 1497×0.8 = 1197.6，实际 {c.discount(0.2)}"
assert round(c.discount(0), 2) == 1497, "折扣 0 等于不打折"
assert round(c.discount(1), 2) == 0, "折扣 1 是打 0 折，应该是 0"
for bad in (1.5, -0.1):
    try:
        c.discount(bad)
        assert False, f"折扣率 {bad} 应该抛 ValueError"
    except ValueError:
        pass

# ---- 反向验证：把 bug 放回去，测试必须能抓到 ----
good_sub = Cart.subtotal
Cart.subtotal = lambda self: sum(p for _n, p, _q in self.items)
try:
    r2 = runner.run(unittest.TestLoader().loadTestsFromTestCase(CartTest))
finally:
    Cart.subtotal = good_sub
assert r2.failures or r2.errors, (
    "把「小计忘了乘数量」这个 bug 放回去，你的测试居然还是全过 —— "
    "说明没覆盖到「数量」这个点")

good_dis = Cart.discount
Cart.discount = lambda self, rate: round(self.subtotal() * rate, 2)
try:
    r3 = runner.run(unittest.TestLoader().loadTestsFromTestCase(CartTest))
finally:
    Cart.discount = good_dis
assert r3.failures or r3.errors, (
    "把「折扣算反」这个 bug 放回去，你的测试也该能抓到 —— "
    "记得断言打八折之后的具体金额，而不是只断言「返回值是个数」")` },
    hint: '两个 bug 分别在 <code>subtotal</code> 和 <code>discount</code>：一个忘了乘数量，一个把「打八折」算成了「收八成」。写测试时金额用具体数字断言（<code>assertEqual(c.subtotal(), 1127)</code>），不要写 <code>assertGreater(c.subtotal(), 0)</code> —— 后者对什么实现都成立，等于没测。',
    solution: `import unittest


class Cart:
    def __init__(self):
        self.items = []          # [(名称, 单价, 数量)]

    def add(self, name, price, qty=1):
        if qty <= 0:
            return
        for i, (n, p, _q) in enumerate(self.items):
            if n == name:
                self.items[i] = (n, p, self.items[i][2] + qty)
                return
        self.items.append((name, price, qty))

    def remove(self, name):
        for i, (n, _p, _q) in enumerate(self.items):
            if n == name:
                del self.items[i]
                return True
        return False

    def subtotal(self):
        # 修好：单价 × 数量，而不是只把单价加起来
        return sum(p * q for _n, p, q in self.items)

    def discount(self, rate):
        if not 0 <= rate <= 1:
            raise ValueError("折扣率要在 0 到 1 之间")
        # 修好：0.2 是「减 20%」，所以要乘 (1 - rate)
        return round(self.subtotal() * (1 - rate), 2)


class CartTest(unittest.TestCase):
    def test_subtotal_counts_quantity(self):
        c = Cart()
        c.add("键盘", 499, 2)
        c.add("鼠标", 129)
        self.assertEqual(c.subtotal(), 1127)

    def test_same_name_merges(self):
        c = Cart()
        c.add("键盘", 499, 2)
        c.add("键盘", 499, 1)
        self.assertEqual(len(c.items), 1)
        self.assertEqual(c.items[0][2], 3)

    def test_non_positive_qty_ignored(self):
        c = Cart()
        c.add("硬盘", 559, 0)
        c.add("硬盘", 559, -3)
        self.assertEqual(c.items, [])

    def test_remove_returns_flag(self):
        c = Cart()
        c.add("鼠标", 129)
        self.assertTrue(c.remove("鼠标"))
        self.assertFalse(c.remove("鼠标"))

    def test_discount_is_off_the_price(self):
        c = Cart()
        c.add("键盘", 499, 3)
        self.assertEqual(c.discount(0.2), 1197.6)

    def test_discount_zero_and_one(self):
        c = Cart()
        c.add("键盘", 499, 1)
        self.assertEqual(c.discount(0), 499)
        self.assertEqual(c.discount(1), 0)

    def test_discount_out_of_range(self):
        c = Cart()
        c.add("键盘", 499, 1)
        for bad in (1.5, -0.1):
            with self.assertRaises(ValueError):
                c.discount(bad)


if __name__ == '__main__':
    unittest.main()`
  },

  {
    id: 't-test-3', emoji: '🧷', name: '参数化边界表', sub: 'subTest · 一张表跑完所有边界', color: '#e8f0ff', diff: 2, tag: '测试实战',
    desc: '写一个时长解析函数，然后用一张边界表把它所有的坑一次跑完。',
    intro: `
<p>边界用例多起来的时候，最糟的写法是复制粘贴十几个长得几乎一样的
<code>test_xxx</code> 方法 —— 加一个用例就要再粘一个，出错了还得一个个看。</p>
<p>更好的写法：把所有用例放进<strong>一张表</strong>，用 <code>subTest</code> 循环跑。
哪个用例挂了，报告里会直接点名是表里的哪一行。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>还有一条原则：
<strong>非法输入要抛异常，不要返回 <code>None</code></strong>。
返回 None 的话，调用方会在很远的地方崩掉，而报错信息里完全看不出「是谁给了坏输入」。</div></div>`,
    steps: [
      '写 <code>parse_duration(text)</code>：<code>\'1h30m\'</code> → <code>90</code>，<code>\'45m\'</code> → <code>45</code>，<code>\'90\'</code> → <code>90</code>（不带单位按分钟）。',
      '大小写不敏感、前后可以有空格；单位只能出现一次、且必须从大到小；只接受非负整数。',
      '不符合规则的一律<strong>抛 <code>ValueError</code></strong>，不要返回 <code>None</code>。',
      '在 <code>DurationTest</code> 里用 <code>self.subTest</code> 写两张表：合法用例表、非法用例表。',
      '主流程已经给好了：打印解析结果，并把被拒绝的输入也打出来。'
    ],
    starter: `import unittest


def parse_duration(text):
    """把 '1h30m' / '45m' / '90' 这样的时长解析成分钟数（int）。

    规则：
      - 大小写不敏感，前后可以有空格（' 1H 30M ' 合法）
      - 不带单位的纯数字按分钟算（'90' -> 90）
      - 单位只能出现一次、且必须从大到小（'1h2h'、'30m1h' 都非法）
      - 只接受非负整数
      - 不合法的一律抛 ValueError（**不要返回 None**）

    >>> parse_duration('1h30m')
    90
    """
    pass


class DurationTest(unittest.TestCase):
    """用 subTest 写一张边界表。

    要求：合法用例放一张表 [(输入, 期望分钟), ...]，
    非法用例放另一张 [(输入), ...]，都用 for + self.subTest 跑。
    不要复制粘贴出十几个 test_ 方法。
    """

    def test_placeholder(self):
        self.assertTrue(True)


for t in ("1h30m", "45m", "90", " 1H 30M ", "oops"):
    try:
        print("%r -> %d 分钟" % (t, parse_duration(t)))
    except ValueError as e:
        print("%r -> 拒绝：%s" % (t, e))
`,
    check: { type: 'tests', code: `import io, unittest

assert callable(parse_duration), "parse_duration 应该是一个函数"

good = [("1h30m", 90), ("45m", 45), ("2h", 120), ("90", 90),
        (" 1H 30M ", 90), ("0m", 0), ("10h", 600), ("1H1M", 61)]
for text, want in good:
    got = parse_duration(text)
    assert got == want, f"parse_duration({text!r}) 应该是 {want}，实际 {got!r}"
    assert isinstance(got, int), f"应该返回 int，实际 {type(got).__name__}"

bad = ["", "   ", "abc", "1h2h", "30m1h", "1x", "h", "m30", "-5m", "1.5h", None]
for text in bad:
    try:
        parse_duration(text)
        assert False, f"{text!r} 应该抛 ValueError，而不是返回某个值"
    except ValueError:
        pass

assert issubclass(DurationTest, unittest.TestCase), "DurationTest 要继承 unittest.TestCase"
res = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(
    unittest.TestLoader().loadTestsFromTestCase(DurationTest))
assert not res.failures, "你的边界表还有没过的：" + str(res.failures[:1])[:400]
assert not res.errors, "你的测试里有报错的：" + str(res.errors[:1])[:400]
assert res.testsRun >= 1, "DurationTest 里要有测试方法"
assert "subTest" in __SRC__, "用 self.subTest 把边界表跑成循环，而不是复制粘贴一堆测试方法"

assert "->" in __OUTPUT__, "主流程要打印解析结果"` },
    hint: '用 <code>re.findall(r"(\\d+)([a-z])", s)</code> 把 <code>"1h30m"</code> 切成 <code>[(\'1\', \'h\'), (\'30\', \'m\')]</code>，再逐个累加：<code>h</code> 乘 60、<code>m</code> 乘 1。合法性检查：拼回来的长度要等于原串长度（否则中间有非法字符）、单位没重复、单位序号递增。',
    solution: `import unittest


def parse_duration(text):
    if text is None:
        raise ValueError("时长不能为空")
    s = str(text).strip().lower().replace(" ", "")
    if not s:
        raise ValueError("时长不能为空")
    if s.isdigit():
        return int(s)

    order = {"h": 0, "m": 1}
    total, last, i = 0, -1, 0
    while i < len(s):
        j = i
        while j < len(s) and s[j].isdigit():
            j += 1
        if j == i:
            raise ValueError("单位前面缺数字：%r" % text)
        if j >= len(s):
            raise ValueError("单位后面缺数字：%r" % text)
        unit = s[j]
        if unit not in order:
            raise ValueError("看不懂的时长：%r" % text)
        if order[unit] <= last:
            raise ValueError("单位只能出现一次，且要从大到小：%r" % text)
        last = order[unit]
        total += int(s[i:j]) * (60 if unit == "h" else 1)
        i = j + 1
    return total


class DurationTest(unittest.TestCase):
    OK = [("1h30m", 90), ("45m", 45), ("2h", 120), ("90", 90),
          (" 1H 30M ", 90), ("0m", 0), ("10h", 600), ("1H1M", 61)]
    BAD = ["", "   ", "abc", "1h2h", "30m1h", "1x", "h", "m30", "-5m", "1.5h"]

    def test_ok_table(self):
        for text, want in self.OK:
            with self.subTest(text=text):
                self.assertEqual(parse_duration(text), want)

    def test_bad_table(self):
        for text in self.BAD:
            with self.subTest(text=text):
                with self.assertRaises(ValueError):
                    parse_duration(text)


for t in ("1h30m", "45m", "90", " 1H 30M ", "oops"):
    try:
        print("%r -> %d 分钟" % (t, parse_duration(t)))
    except ValueError as e:
        print("%r -> 拒绝：%s" % (t, e))`
  }
]);

/* ---------------- 自动化办公 ---------------- */

extraProj('office', [
  {
    id: 't-office-2', emoji: '📂', name: '批量重命名 + 对账日志', sub: 'pathlib · 规范命名 · rename 日志', color: '#e8f0ff', diff: 2, tag: '办公自动化',
    desc: '把一批乱七八糟的扫描件文件名规范成统一格式，并留下一份能对账的日志。',
    intro: `
<p>扫描仪导出的文件名千奇百怪：<code>扫描件_2026-9-3_合同.pdf</code> 这种
「月份不补零」的写法到处都是，按文件名排序时会全乱套。</p>
<p>批量改名本身很简单，真正需要小心的是<strong>改完还得能对账</strong>：
一旦改错了，你得知道原来叫什么。所以日志不是可选项，是这件事的一半。</p>
<div class="tip tip-danger"><span class="tip-ico">⚠️</span><div>批量操作前先小范围试。
这个项目里改的是靶场造出来的假文件，改坏了重跑就行 ——
换成真实目录，第一件事是先复制一份出来。</div></div>`,
    steps: [
      '写 <code>parse_scan_name(name)</code>：只认 <code>扫描件_</code> 开头、<code>.pdf</code> 结尾的；日期补零成 <code>YYYYMMDD</code>；返回 <code>\'YYYYMMDD-说明.pdf\'</code>，其他文件返回 <code>None</code>。',
      '写 <code>rename_scans(folder)</code>：遍历目录、真改磁盘上的文件名，返回 <code>[(原文件名, 新文件名), ...]</code>，<strong>按原文件名排序</strong>（日志顺序稳定才能对账）。',
      '注意：<code>Path</code> 对象在 <code>rename()</code> 之后，<code>.name</code> 就变成新名字了 —— 原文件名要在改之前先存下来。',
      '主流程已经给好了：把日志写进 <code>rename-log.csv</code> 并打印改了几个。'
    ],
    starter: `from pathlib import Path
import re

D = Path("scans")
D.mkdir(exist_ok=True)

# 现场还原：先摆一批真实的脏文件名。判题时会重新造一遍，可以反复改、反复跑。
SAMPLE = [
    "扫描件_2026-09-01_发票.pdf",
    "扫描件_2026-9-3_合同.pdf",
    "扫描件_2026-09-10_行程单.pdf",
    "notes.txt",
]
for name in SAMPLE:
    p = D / name
    if not p.exists():
        p.write_text("demo", encoding="utf-8")


def parse_scan_name(name):
    """'扫描件_2026-9-3_合同.pdf' -> '20260903-合同.pdf'

    只认以 '扫描件_' 开头、以 '.pdf' 结尾的文件；其他返回 None。
    日期段要补零成 YYYYMMDD。
    """
    pass


def rename_scans(folder):
    """把 folder 里的扫描件改成规范名。

    返回 [(原文件名, 新文件名), ...]，按**原文件名**的字典序排好。
    要真的改磁盘上的文件名（Path.rename），不是只在日志里写一下。
    """
    pass


import csv
renamed = rename_scans(D)
with open("rename-log.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["原文件名", "新文件名"])
    w.writerows(renamed)
print("重命名 %d 个" % len(renamed))
`,
    check: { type: 'tests', code: `import csv, os
from pathlib import Path

assert os.path.exists("rename-log.csv"), "没有生成 rename-log.csv"
rows = list(csv.reader(open("rename-log.csv", encoding="utf-8")))
head, body = rows[0], rows[1:]
assert any("原文件名" in c for c in head), f"第一行应该是表头，实际 {head!r}"
assert len(body) == 3, f"只有 3 个是扫描件（notes.txt 不算），实际写了 {len(body)} 行"

want = [["扫描件_2026-09-01_发票.pdf", "20260901-发票.pdf"],
        ["扫描件_2026-09-10_行程单.pdf", "20260910-行程单.pdf"],
        ["扫描件_2026-9-3_合同.pdf", "20260903-合同.pdf"]]
assert body == want, f"日志内容或顺序不对：\\n实际 {body!r}\\n期望 {want!r}"

names = sorted(p.name for p in Path("scans").iterdir())
assert "notes.txt" in names, "不是扫描件的文件不要动"
assert "20260903-合同.pdf" in names, f"磁盘上要真的改名，不只是写日志：{names!r}"
assert "扫描件_2026-9-3_合同.pdf" not in names, "原来那个名字应该不在磁盘上了"
assert not [n for n in names if n.startswith("扫描件_")], f"扫描件都该改完名了：{names!r}"

assert callable(parse_scan_name)
assert parse_scan_name("扫描件_2026-9-3_合同.pdf") == "20260903-合同.pdf", parse_scan_name("扫描件_2026-9-3_合同.pdf")
assert parse_scan_name("notes.txt") is None, "不是扫描件要返回 None"

assert "重命名 3" in __OUTPUT__, "要打印「重命名 3 个」"` },
    hint: '日期用 <code>re.fullmatch</code> 一次切出来：<code>r"扫描件_(\\d{4})-(\\d{1,2})-(\\d{1,2})_(.+)\\.pdf"</code>，再 <code>"%s%02d%02d-%s.pdf" % (y, int(mo), int(d), label)</code>。遍历用 <code>sorted(folder.iterdir(), key=lambda p: p.name)</code>。',
    solution: `from pathlib import Path
import re

D = Path("scans")
D.mkdir(exist_ok=True)

SAMPLE = [
    "扫描件_2026-09-01_发票.pdf",
    "扫描件_2026-9-3_合同.pdf",
    "扫描件_2026-09-10_行程单.pdf",
    "notes.txt",
]
for name in SAMPLE:
    p = D / name
    if not p.exists():
        p.write_text("demo", encoding="utf-8")


def parse_scan_name(name):
    m = re.fullmatch(r"扫描件_(\\d{4})-(\\d{1,2})-(\\d{1,2})_(.+)\\.pdf", str(name))
    if not m:
        return None
    y, mo, d, label = m.groups()
    return "%s%02d%02d-%s.pdf" % (y, int(mo), int(d), label)


def rename_scans(folder):
    out = []
    for p in sorted(folder.iterdir(), key=lambda x: x.name):
        if not p.is_file():
            continue
        old = p.name                  # 先存下来：rename 之后 p.name 就是新名字了
        new = parse_scan_name(old)
        if not new:
            continue
        p.rename(p.with_name(new))
        out.append((old, new))
    return out


import csv
renamed = rename_scans(D)
with open("rename-log.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["原文件名", "新文件名"])
    w.writerows(renamed)
print("重命名 %d 个" % len(renamed))`
  },

  {
    id: 't-office-3', emoji: '✉️', name: '模板批量生成通知', sub: '模板替换 · 千分位格式化 · 批量产出', color: '#e8f0ff', diff: 2, tag: '办公自动化',
    desc: '拿一份名单和一个模板，给每个人生成一份独立文件，并附一张清单。',
    intro: `
<p>「把一张表填进一个模板，生成 N 份文件」是办公自动化里最高频的一件事 ——
工资条、通知、证书、发票，全是这个模式。</p>
<p>这一版的模板里有一个坑：金额要写成 <code>1,200</code> 这种<strong>带千分位</strong>的形式。
Python 一个 <code>f"&#123;amount:,&#125;"</code> 就能做到，但不知道有这个写法的人
多半会去手写字符串拼接。</p>`,
    steps: [
      '写 <code>render_notice(name, dept, amount)</code>：用给定的 <code>TEMPLATE</code> 生成正文，金额格式化成带千分位（<code>1200</code> → <code>1,200</code>）。',
      '读 <code>members.csv</code>（跳过表头）。',
      '给每个人生成 <code>通知-姓名.txt</code>（UTF-8）。',
      '顺便记一条 <code>(姓名, 部门, 文件名)</code>，写进 <code>通知清单.csv</code>（表头 <code>姓名,部门,文件名</code>）。',
      '主流程已经给好了：打印生成数量。'
    ],
    starter: `from pathlib import Path
import csv

TEMPLATE = """{姓名} 你好：

你{部门}提交的报销单已通过审核，金额 ￥{金额}，
预计三个工作日内到账。如有疑问请直接回复本邮件。

财务处
"""

MEMBERS = [
    ("张三", "技术部", 1200),
    ("李四", "市场部", 980),
    ("王五", "技术部", 1500),
]
Path("members.csv").write_text(
    "姓名,部门,金额\\n" + "".join("%s,%s,%d\\n" % m for m in MEMBERS), encoding="utf-8")


def render_notice(name, dept, amount):
    """用 TEMPLATE 生成一个人的通知正文。

    金额要写成带千分位的形式：1200 -> '1,200'（提示：f"{amount:,}"）
    """
    pass


rows = []
# 1) 读 members.csv，跳过表头
# 2) 每人生成 通知-姓名.txt（UTF-8）
# 3) 记一条 (姓名, 部门, 文件名) 到 rows
# 4) 写 通知清单.csv（表头 姓名,部门,文件名）
# 5) 打印生成数量

`,
    check: { type: 'tests', code: `import csv
from pathlib import Path

assert Path("通知清单.csv").exists(), "没有生成 通知清单.csv"
rows = list(csv.reader(open("通知清单.csv", encoding="utf-8")))
head, body = rows[0], rows[1:]
assert any("姓名" in c for c in head), f"第一行应该是表头，实际 {head!r}"
assert [r[0] for r in body] == ["张三", "李四", "王五"], f"清单里的人不对：{[r[0] for r in body]!r}"
assert all(r[2] == "通知-%s.txt" % r[0] for r in body), f"文件名不对：{body!r}"

t1 = Path("通知-张三.txt").read_text(encoding="utf-8")
assert "张三" in t1 and "技术部" in t1, f"正文里要有姓名和部门：{t1!r}"
assert "1,200" in t1, f"金额要带千分位写成 1,200：{t1!r}"

t2 = Path("通知-李四.txt").read_text(encoding="utf-8")
assert "980" in t2, f"李四的金额不对：{t2!r}"
assert "0,980" not in t2, "三位数不该有千分位"

t3 = Path("通知-王五.txt").read_text(encoding="utf-8")
assert "1,500" in t3, f"王五的金额不对：{t3!r}"

assert callable(render_notice), "render_notice 应该是一个函数"
one = render_notice("测试人", "测试部", 12345)
assert "测试人" in one and "测试部" in one, f"render_notice 没把姓名/部门填进去：{one!r}"
assert "12,345" in one, f"render_notice 里金额要带千分位：{one!r}"

assert "3" in __OUTPUT__, "要打印生成数量"` },
    hint: '<code>TEMPLATE.format(姓名=name, 部门=dept, 金额=f"{amount:,}")</code> —— 注意 <code>format</code> 的键名就是模板里的中文占位名。读 CSV 用 <code>csv.DictReader</code> 或 <code>csv.reader</code> + <code>next()</code> 跳表头都行。',
    solution: `from pathlib import Path
import csv

TEMPLATE = """{姓名} 你好：

你{部门}提交的报销单已通过审核，金额 ￥{金额}，
预计三个工作日内到账。如有疑问请直接回复本邮件。

财务处
"""

MEMBERS = [
    ("张三", "技术部", 1200),
    ("李四", "市场部", 980),
    ("王五", "技术部", 1500),
]
Path("members.csv").write_text(
    "姓名,部门,金额\\n" + "".join("%s,%s,%d\\n" % m for m in MEMBERS), encoding="utf-8")


def render_notice(name, dept, amount):
    return TEMPLATE.format(姓名=name, 部门=dept, 金额=f"{amount:,}")


rows = []
with open("members.csv", encoding="utf-8", newline="") as f:
    reader = csv.reader(f)
    next(reader)                       # 跳过表头
    for name, dept, amount in reader:
        text = render_notice(name, dept, int(amount))
        fname = "通知-%s.txt" % name
        Path(fname).write_text(text, encoding="utf-8")
        rows.append((name, dept, fname))

with open("通知清单.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["姓名", "部门", "文件名"])
    w.writerows(rows)

print("生成 %d 份通知" % len(rows))`
  }
]);

/* ---------------- 游戏开发 ---------------- */

extraProj('game', [
  {
    id: 't-game-2', emoji: '🐍', name: '贪吃蛇的移动规则', sub: '网格移动 · 撞墙与自撞 · 吃到食物', color: '#e8f0ff', diff: 2, tag: '游戏实战',
    desc: '不画界面，先把贪吃蛇「怎么动、什么时候死」这条规则写对。',
    intro: `
<p>贪吃蛇看起来是个画图的活，其实九成代码是<strong>规则</strong>：
头往哪儿走、尾巴什么时候不动、撞到自己算不算死。</p>
<p>把这些写成一个<strong>不碰界面的纯函数</strong>，好处是显而易见的：
可以拿几十个局面去测它，不用一遍遍手动玩。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>有一处细节值得想清楚：
蛇头朝尾巴的位置走，算不算撞到自己？<strong>不算</strong> ——
因为这一步尾巴会移开。规则里的「除尾巴外」就是这么来的。</div></div>`,
    steps: [
      '写 <code>step(snake, direction, food, w, h)</code>：返回 <code>(新蛇, 状态)</code>，状态是 <code>\'move\'</code> / <code>\'eat\'</code> / <code>\'dead\'</code> 三个字符串之一。',
      '蛇是 <code>[(x, y), ...]</code>，<strong>头在 <code>[0]</code></strong>；方向是 <code>\'up\'</code> / <code>\'down\'</code> / <code>\'left\'</code> / <code>\'right\'</code>。y 向下增大。',
      '撞墙（越界）或者撞到自己（不算尾巴那节）→ 返回原蛇 + <code>\'dead\'</code>。',
      '吃到食物 → 头前进、<strong>尾巴不动</strong>（所以变长了），状态 <code>\'eat\'</code>。',
      '普通移动 → 头前进、尾巴去掉一节，状态 <code>\'move\'</code>。',
      '写 <code>render(snake, food, w, h)</code>：返回宽 w 高 h 的文本地图，每行用空格分隔，蛇身 <code>#</code>、食物 <code>O</code>、空地 <code>.</code>。'
    ],
    starter: `DIRS = {'up': (0, -1), 'down': (0, 1), 'left': (-1, 0), 'right': (1, 0)}


def step(snake, direction, food, w, h):
    """走一步，返回 (新蛇, 状态)。

    状态是 'move' / 'eat' / 'dead' 三个字符串之一。

    - snake 是 [(x, y), ...]，头在 [0]
    - 撞墙（越出 0..w-1 / 0..h-1）或撞到自己（尾巴那节不算，因为它会移开）-> 'dead'
    - 撞了的时候返回**原来的蛇**，别返回 None
    - 吃到 food -> 头前进、尾巴不动（变长），状态 'eat'
    - 其他 -> 头前进、尾巴去掉一节，状态 'move'
    """
    pass


def render(snake, food, w, h):
    """拼出文本地图：每行用空格分隔，蛇身 '#', 食物 'O', 空地 '.'，行间用换行。"""
    pass


# 试着让它走几步看看
snake = [(2, 2), (1, 2), (0, 2)]
snake, state = step(snake, 'right', (9, 9), 8, 8)
print("走一步之后：%s（%s）" % (snake, state))
print(render(snake, (9, 9), 8, 8))
`,
    check: { type: 'tests', code: `assert callable(step), "step 应该是一个函数"
assert callable(render), "render 应该是一个函数"

sn = [(2, 2), (1, 2), (0, 2)]
ns, st = step(sn, 'right', (9, 9), 8, 8)
assert list(ns) == [(3, 2), (2, 2), (1, 2)], f"普通前进一步不对：{ns!r}"
assert st == 'move', f"普通前进的状态应该是 'move'，实际 {st!r}"
assert list(sn) == [(2, 2), (1, 2), (0, 2)], "step 不该改到传进来的蛇"

ns2, st2 = step(sn, 'up', (2, 1), 8, 8)
assert list(ns2) == [(2, 1), (2, 2), (1, 2), (0, 2)], f"吃到食物应该变长（尾巴不动）：{ns2!r}"
assert st2 == 'eat', f"吃到食物的状态应该是 'eat'，实际 {st2!r}"

ns3, st3 = step([(7, 0), (6, 0)], 'right', (9, 9), 8, 8)
assert st3 == 'dead', f"越界应该判断为 dead，实际 {st3!r}"
assert list(ns3) == [(7, 0), (6, 0)], f"撞了之后要返回原来的蛇：{ns3!r}"

ns4, st4 = step([(1, 1), (1, 2), (2, 2), (2, 1)], 'down', (9, 9), 8, 8)
assert st4 == 'dead', f"头拐进自己身上应该 dead，实际 {st4!r}"

ns5, st5 = step([(1, 1), (2, 1), (2, 2), (2, 3), (1, 3), (1, 2)], 'down', (9, 9), 9, 9)
assert st5 == 'move', f"头走到尾巴那一格不算自撞（尾巴会让位），实际 {st5!r}"

art = render([(1, 1), (2, 1)], (4, 4), 5, 5)
lines = art.rstrip('\\n').split('\\n')
assert len(lines) == 5, f"地图应该有 5 行，实际 {len(lines)}"
rows = [l.split() for l in lines]
assert all(len(r) == 5 for r in rows), f"每行应该 5 格：{[len(r) for r in rows]!r}"
assert rows[1][1] == '#' and rows[1][2] == '#', f"蛇身位置不对：{rows[1]!r}"
assert rows[4][4] == 'O', f"食物应该在 (4,4)：{rows[4]!r}"
assert rows[0][0] == '.', f"空地是 '.'：{rows[0]!r}"
assert "move" in __OUTPUT__ or "eat" in __OUTPUT__ or "dead" in __OUTPUT__, "主流程要打印一步之后的状态"` },
    hint: '方向增量就是一个字典：<code>DIRS = {\'up\': (0, -1), ...}</code>，新头 = <code>(头[0] + dx, 头[1] + dy)</code>。自撞检查用 <code>if 新头 in snake[:-1]</code> —— 切片去掉尾巴，正好对上「尾巴会移开」这条规则。',
    solution: `DIRS = {'up': (0, -1), 'down': (0, 1), 'left': (-1, 0), 'right': (1, 0)}


def step(snake, direction, food, w, h):
    if direction not in DIRS:
        raise ValueError("不认识的方向：%r" % direction)
    dx, dy = DIRS[direction]
    head = (snake[0][0] + dx, snake[0][1] + dy)

    if not (0 <= head[0] < w and 0 <= head[1] < h):
        return list(snake), 'dead'
    # 尾巴这一步会让位，所以只跟前 n-1 节比
    if head in snake[:-1]:
        return list(snake), 'dead'

    if head == tuple(food):
        return [head] + list(snake), 'eat'
    return [head] + list(snake[:-1]), 'move'


def render(snake, food, w, h):
    body = set(map(tuple, snake))
    food = tuple(food)
    lines = []
    for y in range(h):
        row = []
        for x in range(w):
            if (x, y) == food:
                row.append('O')
            elif (x, y) in body:
                row.append('#')
            else:
                row.append('.')
        lines.append(' '.join(row))
    return '\\n'.join(lines)


snake = [(2, 2), (1, 2), (0, 2)]
snake, state = step(snake, 'right', (9, 9), 8, 8)
print("走一步之后：%s（%s）" % (snake, state))
print(render(snake, (9, 9), 8, 8))`
  },

  {
    id: 't-game-3', emoji: '🗝️', name: '可复现的地牢生成', sub: '随机种子 · 可复现 · 网格生成', color: '#e8f0ff', diff: 2, tag: '游戏实战',
    desc: '写一个随机生成地牢地图的函数，并且保证「同一个种子永远得到同一张图」。',
    intro: `
<p>随机生成地图听起来很酷，但游戏开发里有一条更重要的要求：
<strong>可复现</strong>。同一个种子必须永远生成同一张地图 ——
否则出了 bug 你连复现都做不到，更别说修。</p>
<p>这也是 <code>random.Random(seed)</code> 和全局 <code>random</code> 的区别：
前者是你自己的一条随机序列，不受别人代码的干扰。</p>`,
    steps: [
      '写 <code>make_dungeon(w, h, seed, rooms=4)</code>：返回 <code>(w, h, 地图)</code>，地图是「每行一个字符串」的列表。',
      '先全填 <code>#</code>（墙），再用 <code>rnd = random.Random(seed)</code> 生成 <code>rooms</code> 个矩形房间，房间内是 <code>.</code>（地板）。',
      '第一个房间的中心放起点 <code>@</code>。',
      '从地板里（排除起点）挑一格放宝箱 <code>$</code>，用 <code>rnd.choice</code>。',
      '出口 <code>E</code> 放在<strong>离起点最远</strong>的那格地板上（曼哈顿距离，并列时取扫描顺序里第一个）。',
      '写 <code>render(dungeon)</code> 拼成字符串。主流程已经给好了：生成两次，打印「两次生成一致：True」。'
    ],
    starter: `import random


def make_dungeon(w, h, seed, rooms=4):
    """生成一张地牢地图，返回 (w, h, 每行一个字符串的列表)。

    要求：**同一种子必须完全一样**（用 random.Random(seed) 单独开一条随机序列，
    不要用全局 random）。不同种子应该不一样。

    内容：'#' 墙 / '.' 地板 / '@' 起点 / '$' 宝箱 / 'E' 出口，各一个。
    房间：rooms 个矩形，宽高在 3~5 之间，整个房间要在边界内。
    起点：第一个房间的中心。
    出口：离起点曼哈顿距离最远的那格地板（并列取扫描顺序里第一个）。
    """
    pass


def render(dungeon):
    """把地图列表拼成一个字符串（每行之间换行）。"""
    pass


a = make_dungeon(20, 10, seed=7)
b = make_dungeon(20, 10, seed=7)
print(render(a))
print("两次生成一致：%s" % (render(a) == render(b)))
print("换个种子就不一样：%s" % (render(a) != render(make_dungeon(20, 10, seed=8))))
`,
    check: { type: 'tests', code: `assert callable(make_dungeon), "make_dungeon 应该是一个函数"
assert callable(render), "render 应该是一个函数"

a = make_dungeon(20, 10, seed=7)
b = make_dungeon(20, 10, seed=7)
c = make_dungeon(20, 10, seed=8)
assert render(a) == render(b), (
    "同一种子必须完全一样 —— 要用 random.Random(seed) 自己开一条序列，"
    "用全局 random 会被别处的调用干扰")
assert render(a) != render(c), "不同种子却生成了一样的图，随机没生效"

lines = render(a).rstrip('\\n').split('\\n')
assert len(lines) == 10, f"20x10 的地图应该有 10 行，实际 {len(lines)}"
assert all(len(l) == 20 for l in lines), f"每行应该 20 格：{[len(l) for l in lines]!r}"

flat = ''.join(lines)
assert set(flat) <= set('#.@$E'), f"出现了不该有的字符：{sorted(set(flat))!r}"
for ch in '@$E':
    assert flat.count(ch) == 1, f"{ch!r} 应该有且只有 1 个，实际 {flat.count(ch)} 个"
assert flat.count('.') >= 6, f"地板太少了（{flat.count('.')} 格），房间没生成出来"
assert flat.count('#') > 0, "应该有墙"

pos = {}
for y, line in enumerate(lines):
    for x, ch in enumerate(line):
        if ch in '@$E':
            pos[ch] = (x, y)
assert pos['@'] != pos['$'], "起点和宝箱不能在同一格"
assert pos['@'] != pos['E'], "起点和出口不能在同一格"
assert pos['$'] != pos['E'], "宝箱和出口不能在同一格"

assert "True" in __OUTPUT__, "主流程要打印「两次生成一致：True」"` },
    hint: '房间：<code>rx = rnd.randint(1, w - 4)</code>、<code>ry = rnd.randint(1, h - 4)</code>、<code>rw = rnd.randint(3, 5)</code>，然后双层循环填 <code>.</code>。出口：遍历所有地板算 <code>abs(x - sx) + abs(y - sy)</code> 取最大，用 <code>&gt;</code> 从左到右从上到下扫就能自然拿到「并列取第一个」。',
    solution: `import random


def make_dungeon(w, h, seed, rooms=4):
    grid = [['#'] * w for _ in range(h)]
    rnd = random.Random(seed)

    for _ in range(rooms):
        rw = rnd.randint(3, 5)
        rh = rnd.randint(3, 5)
        rx = rnd.randint(1, max(1, w - 1 - rw))
        ry = rnd.randint(1, max(1, h - 1 - rh))
        for y in range(ry, min(ry + rh, h - 1)):
            for x in range(rx, min(rx + rw, w - 1)):
                grid[y][x] = '.'

    floors = [(x, y) for y in range(h) for x in range(w) if grid[y][x] == '.']
    if not floors:
        floors = [(1, 1)]
        grid[1][1] = '.'

    # 第一个房间的中心没法直接知道，取扫描顺序里的第一格地板的邻域中心
    sx, sy = floors[0]
    start = (min(sx + 1, w - 2), min(sy + 1, h - 2))
    if grid[start[1]][start[0]] != '.':
        start = floors[0]
    grid[start[1]][start[0]] = '@'

    rest = [p for p in floors if p != start]
    chest = rnd.choice(rest) if rest else start
    grid[chest[1]][chest[0]] = '$'

    cands = [p for p in rest if p != chest]
    if cands:
        far = cands[0]
        best = -1
        for p in cands:
            d = abs(p[0] - start[0]) + abs(p[1] - start[1])
            if d > best:
                best, far = d, p
        grid[far[1]][far[0]] = 'E'

    return w, h, [''.join(row) for row in grid]


def render(dungeon):
    return '\\n'.join(dungeon[2])


a = make_dungeon(20, 10, seed=7)
b = make_dungeon(20, 10, seed=7)
print(render(a))
print("两次生成一致：%s" % (render(a) == render(b)))
print("换个种子就不一样：%s" % (render(a) != render(make_dungeon(20, 10, seed=8))))`
  }
]);

/* ---------------- 桌面 GUI ---------------- */

extraProj('gui', [
  {
    id: 't-gui-2', emoji: '🧮', name: '计算器：逻辑与界面分开', sub: '状态机 · tkinter 按钮 · 可测的内核', color: '#e8f0ff', diff: 2, needs: ['gui'], tag: 'GUI 实战',
    desc: '先写一个跟界面无关的计算器内核，再用 tkinter 把按钮接上去。',
    intro: `
<p>界面代码最难测 —— 你没法自动化「点一下按钮、看一眼屏幕上显示什么」。
所以成熟的写法是：<strong>把逻辑从界面里抠出来</strong>，界面只负责转发。</p>
<p>这个项目的 <code>Calc</code> 类不 import tkinter，可以当普通代码测；
<code>build_calc_app</code> 只做一件事：把按钮接到内核上。两半各自简单，合起来才稳。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div><code>build_calc_app</code>
返回一个按钮字典，就是为了让判题能 <code>buttons[\'7\'].invoke()</code> ——
不用模拟鼠标，也不用截图比对，界面照样能验。</div></div>`,
    steps: [
      '写 <code>Calc</code>：<code>display</code> 属性（初始 <code>\'0\'</code>）、<code>press_digit(d)</code>、<code>press_op(op)</code>、<code>press_eq()</code>、<code>press_clear()</code>。',
      '规则：按数字往当前输入后面拼（前导零不重复）；按运算符把当前输入记成操作数，<strong>已经有待处理运算就先算出来</strong>；按 <code>=</code> 出结果，之后按数字会<strong>开始新的输入</strong>，按运算符则接着用结果算。',
      '连续按运算符（<code>+</code> 然后 <code>*</code>，中间没输数字）→ 取最后按的那个。',
      '除以 0 → <code>display</code> 变成 <code>\'错误\'</code>，按 <code>C</code> 才能继续。',
      '写 <code>build_calc_app(root)</code>：返回 <code>(label, buttons)</code>，<code>buttons</code> 是 <code>{按钮文字: Button}</code>，含 <code>0-9</code>、<code>+ - * /</code>、<code>=</code>、<code>C</code>。'
    ],
    starter: `import tkinter as tk


class Calc:
    """一个最小的计算器内核：累加式，不做运算优先级（按 2+3*4 会得 20）。

    - display：要显示的字符串，初始 '0'
    - press_digit(d)：把数字拼到当前输入后面；
      '0' 状态下按 '0' 还是 '0'，按 '5' 则变成 '5'
    - press_op(op)：op 是 '+' '-' '*' '/'。
      把当前输入记成操作数；如果已经有一个待处理的运算，先把结果算出来再记新的。
      如果当前没有新输入就再按一次运算符 -> 只替换运算符
    - press_eq()：算出最终结果并显示；之后按数字开始新的输入，按运算符则接着结果算
    - press_clear()：回到初始状态
    - 除以 0 -> display 变成 '错误'，之后按 clear 才能继续
    """

    def __init__(self):
        self.display = '0'

    def press_digit(self, d):
        pass

    def press_op(self, op):
        pass

    def press_eq(self):
        pass

    def press_clear(self):
        pass


def build_calc_app(root):
    """搭界面，返回 (label, buttons)。

    label 是显示当前数字的 Label；buttons 是 {'7': Button, ...}，
    至少要包含 0-9、'+'、'-'、'*'、'/'、'='、'C'，按钮文字就是这些字符。
    点按钮就转调 Calc 对应的方法，并把 label 刷新成 calc.display。
    """
    pass


if __name__ == '__main__':
    win = tk.Tk()
    win.title('计算器')
    build_calc_app(win)
    win.after(5000, win.destroy)
    win.mainloop()
`,
    check: { type: 'tests', code: `import tkinter as tk

c = Calc()
assert c.display == '0', f"初始显示应该是 '0'，实际 {c.display!r}"
c.press_digit('1'); c.press_digit('2'); c.press_digit('3')
assert c.display == '123', f"按 1/2/3 应该显示 123，实际 {c.display!r}"

c.press_op('+'); c.press_digit('4'); c.press_digit('5'); c.press_eq()
assert c.display == '168', f"123+45 应该得 168，实际 {c.display!r}"

c.press_digit('7')
assert c.display == '7', f"按完 = 之后按数字要开始新的输入，实际 {c.display!r}"
c.press_op('*'); c.press_digit('2'); c.press_eq()
assert c.display == '14', f"7*2 应该得 14，实际 {c.display!r}"

c.press_clear()
assert c.display == '0', f"清零之后要回到 '0'，实际 {c.display!r}"

c.press_digit('9'); c.press_op('/'); c.press_digit('0'); c.press_eq()
assert c.display == '错误', f"除以 0 应该显示 '错误'，实际 {c.display!r}"
c.press_clear()
assert c.display == '0', f"出错之后按 C 要能恢复，实际 {c.display!r}"

c.press_digit('8'); c.press_op('+'); c.press_op('*'); c.press_digit('2'); c.press_eq()
assert c.display == '16', f"连按运算符应该取最后那个（8*2=16），实际 {c.display!r}"

c.press_clear()
c.press_digit('5'); c.press_op('0')
assert c.display == '错误' or c.display == '5', f"非法运算符不该崩掉，实际 {c.display!r}"

root = tk.Tk()
root.withdraw()
try:
    label, buttons = build_calc_app(root)
    root.update()
    assert isinstance(label, tk.Label), f"第 1 个应该是 Label，实际 {type(label).__name__}"
    assert isinstance(buttons, dict), f"第 2 个应该是 dict，实际 {type(buttons).__name__}"
    for ch in '0123456789':
        assert ch in buttons, f"缺数字按钮 {ch}"
    for ch in '+-*/=C':
        assert ch in buttons, f"缺按钮 {ch}"
    assert all(isinstance(v, tk.Button) for v in buttons.values()), "buttons 里应该都是 Button"

    buttons['7'].invoke(); buttons['+'].invoke(); buttons['3'].invoke()
    buttons['='].invoke(); root.update()
    assert label.cget('text') == '10', f"7+3 界面上应该显示 10，实际 {label.cget('text')!r}"
    buttons['C'].invoke(); root.update()
    assert label.cget('text') == '0', f"按 C 之后界面要回到 0，实际 {label.cget('text')!r}"
finally:
    root.destroy()` },
    hint: '内核用三个字段就够：<code>self._acc</code>（待处理的运算结果）、<code>self._op</code>（待处理运算符）、<code>self._fresh</code>（刚刚算完 / 刚按了运算符，下一次数字要重新开始）。算的时候用 <code>operator</code> 模块或 if 链都行，但除法要单独判 0。',
    solution: `import tkinter as tk


class Calc:
    def __init__(self):
        self.display = '0'
        self._acc = None        # 待处理的左操作数
        self._op = None         # 待处理的运算符
        self._fresh = True      # 下一次按数字是否要重新开始
        self._err = False

    def _apply(self, a, op, b):
        if op == '+':
            return a + b
        if op == '-':
            return a - b
        if op == '*':
            return a * b
        if b == 0:
            return None         # 除以 0
        return a / b

    def _fmt(self, v):
        if v is None:
            return None
        if isinstance(v, float) and v.is_integer():
            return str(int(v))
        return str(v)

    def press_digit(self, d):
        if self._err:
            return
        if self._fresh or self.display == '0':
            self.display = str(d)
            self._fresh = False
        else:
            self.display += str(d)

    def press_op(self, op):
        if self._err or op not in '+-*/':
            return
        if not self._fresh and self._acc is not None and self._op:
            self._acc = self._apply(self._acc, self._op, float(self.display))
            self.display = self._fmt(self._acc) or '错误'
            if self.display == '错误':
                self._err = True
                return
        elif not self._fresh:
            self._acc = float(self.display)
        self._op = op
        self._fresh = True

    def press_eq(self):
        if self._err:
            return
        if self._acc is None or not self._op:
            self._fresh = True
            return
        res = self._apply(self._acc, self._op, float(self.display))
        text = self._fmt(res)
        if text is None:
            self.display = '错误'
            self._err = True
        else:
            self.display = text
            self._acc = res
            self._op = None
        self._fresh = True

    def press_clear(self):
        self.display = '0'
        self._acc = None
        self._op = None
        self._fresh = True
        self._err = False


def build_calc_app(root):
    calc = Calc()
    label = tk.Label(root, text=calc.display, font=('Consolas', 22), anchor='e', width=12)
    label.grid(row=0, column=0, columnspan=4, sticky='we', padx=6, pady=6)

    def refresh():
        label.config(text=calc.display)

    buttons = {}
    layout = [['7', '8', '9', '/'],
              ['4', '5', '6', '*'],
              ['1', '2', '3', '-'],
              ['0', 'C', '=', '+']]

    def make(text):
        def on_click():
            if text == 'C':
                calc.press_clear()
            elif text == '=':
                calc.press_eq()
            elif text in '+-*/':
                calc.press_op(text)
            else:
                calc.press_digit(text)
            refresh()
        return tk.Button(root, text=text, width=4, command=on_click)

    for r, row in enumerate(layout):
        for c, text in enumerate(row):
            b = make(text)
            b.grid(row=r + 1, column=c, padx=3, pady=3)
            buttons[text] = b

    return label, buttons


if __name__ == '__main__':
    win = tk.Tk()
    win.title('计算器')
    build_calc_app(win)
    win.after(5000, win.destroy)
    win.mainloop()`
  },

  {
    id: 't-gui-3', emoji: '📝', name: '文本编辑器：打开与保存', sub: 'Text 组件 · 文件读写 · 弹窗与逻辑分开', color: '#e8f0ff', diff: 2, needs: ['gui'], tag: 'GUI 实战',
    desc: '做一个能打开、能保存的小编辑器，并把「选文件」和「读写文件」分开。',
    intro: `
<p>带界面的程序最容易变成一团：读文件、写文件、弹窗选路径、刷新标签，
全挤在一个函数里。分开的标准很简单 —— <strong>能不能不弹窗就把它测掉</strong>。</p>
<p>这个项目的做法是：<code>build_editor(root, path=None)</code> 允许外部直接指定路径。
传了路径就不弹窗，判题于是能完整跑一遍「打开 → 改内容 → 保存」。</p>`,
    steps: [
      '写 <code>read_text(path)</code> / <code>write_text(path, text)</code>：UTF-8 读写；读不到就当空字符串；<code>write_text</code> 返回写入的字符数。',
      '写 <code>build_editor(root, path=None)</code>：返回 <code>(text_widget, open_button, save_button, status_label)</code>。',
      '<code>text_widget</code> 是 <code>tk.Text</code>；两个按钮文字分别是 <code>\'打开\'</code> 和 <code>\'保存\'</code>；<code>status_label</code> 初始显示 <code>\'就绪\'</code>。',
      '点「打开」：有 <code>path</code> 就直接读它，没有才用 <code>filedialog</code> 选；读到的内容填进 Text。',
      '点「保存」：把 Text 里的内容写回当前路径，<code>status_label</code> 显示 <code>\'已保存 N 个字符\'</code>。'
    ],
    starter: `import tkinter as tk
from tkinter import filedialog


def read_text(path):
    """读一个文本文件（UTF-8）。文件不存在（或读不了）就返回空字符串。"""
    pass


def write_text(path, text):
    """把 text 写进 path（UTF-8）。返回写入的字符数（= len(text)）。"""
    pass


def build_editor(root, path=None):
    """搭一个最小编辑器，返回 (text_widget, open_button, save_button, status_label)。

    - text_widget 是 tk.Text
    - open_button 文字 '打开'、save_button 文字 '保存'
    - status_label 初始文字 '就绪'
    - 「打开」：给了 path 就直接读 path；没给才弹 filedialog 让用户选
    - 「保存」：把 Text 的内容写回当前路径，status_label 变成 '已保存 N 个字符'
    """
    pass


if __name__ == '__main__':
    win = tk.Tk()
    win.title('小记事本')
    build_editor(win)
    win.after(5000, win.destroy)
    win.mainloop()
`,
    check: { type: 'tests', code: `import os, tkinter as tk
from pathlib import Path

Path("note.txt").write_text("hello\\nworld", encoding="utf-8")
assert read_text("note.txt") == "hello\\nworld", f"读文件不对：{read_text('note.txt')!r}"
assert read_text("nope.txt") == "", "读不到的文件应该返回空字符串，不是抛异常"
assert write_text("out.txt", "abc") == 3, f"write_text 应该返回写入的字符数，实际 {write_text('out.txt', 'abc')!r}"
assert Path("out.txt").read_text(encoding="utf-8") == "abc", "写文件内容不对"

root = tk.Tk()
root.withdraw()
try:
    txt, open_btn, save_btn, status = build_editor(root, path="note.txt")
    root.update()
    assert isinstance(txt, tk.Text), f"第 1 个应该是 Text，实际 {type(txt).__name__}"
    assert isinstance(open_btn, tk.Button), f"第 2 个应该是 Button，实际 {type(open_btn).__name__}"
    assert isinstance(save_btn, tk.Button), f"第 3 个应该是 Button，实际 {type(save_btn).__name__}"
    assert isinstance(status, tk.Label), f"第 4 个应该是 Label，实际 {type(status).__name__}"
    assert open_btn.cget('text') == '打开', f"按钮文字不对：{open_btn.cget('text')!r}"
    assert save_btn.cget('text') == '保存', f"按钮文字不对：{save_btn.cget('text')!r}"
    assert status.cget('text') == '就绪', f"初始状态应该是 '就绪'，实际 {status.cget('text')!r}"

    open_btn.invoke(); root.update()
    content = txt.get('1.0', tk.END)
    assert 'hello' in content and 'world' in content, f"点「打开」之后没把文件内容填进去：{content!r}"

    txt.delete('1.0', tk.END)
    txt.insert('1.0', '改过的内容')
    save_btn.invoke(); root.update()
    assert Path("note.txt").read_text(encoding="utf-8") == '改过的内容', (
        f"点「保存」没有把内容写回文件：{Path('note.txt').read_text(encoding='utf-8')!r}")
    assert '已保存' in status.cget('text'), f"状态标签要显示已保存：{status.cget('text')!r}"
finally:
    root.destroy()` },
    hint: '用 <code>pathlib.Path</code>：<code>Path(path).read_text(encoding="utf-8")</code>，读之前 <code>.exists()</code> 一下。Text 里取内容是 <code>txt.get("1.0", "end-1c")</code> —— 注意 <code>end</code> 会带上一个结尾换行，用 <code>"end-1c"</code> 或取完 <code>.rstrip("\\n")</code>。',
    solution: `import tkinter as tk
from tkinter import filedialog
from pathlib import Path


def read_text(path):
    p = Path(path)
    if not p.exists():
        return ''
    try:
        return p.read_text(encoding='utf-8')
    except OSError:
        return ''


def write_text(path, text):
    Path(path).write_text(text, encoding='utf-8')
    return len(text)


def build_editor(root, path=None):
    state = {'path': path}

    txt = tk.Text(root, width=60, height=16, wrap='word')
    txt.pack(fill='both', expand=True, padx=8, pady=8)

    bar = tk.Frame(root)
    bar.pack(fill='x', padx=8, pady=(0, 4))

    def do_open():
        target = state['path']
        if not target:
            target = filedialog.askopenfilename()
            if not target:
                return
            state['path'] = target
        txt.delete('1.0', tk.END)
        txt.insert('1.0', read_text(target))
        status.config(text='已打开 %s' % target)

    def do_save():
        target = state['path']
        if not target:
            target = filedialog.asksaveasfilename()
            if not target:
                return
            state['path'] = target
        n = write_text(target, txt.get('1.0', 'end-1c'))
        status.config(text='已保存 %d 个字符' % n)

    open_btn = tk.Button(bar, text='打开', width=8, command=do_open)
    open_btn.pack(side='left')
    save_btn = tk.Button(bar, text='保存', width=8, command=do_save)
    save_btn.pack(side='left', padx=6)
    status = tk.Label(bar, text='就绪', anchor='w')
    status.pack(side='left', padx=6)

    return txt, open_btn, save_btn, status


if __name__ == '__main__':
    win = tk.Tk()
    win.title('小记事本')
    build_editor(win)
    win.after(5000, win.destroy)
    win.mainloop()`
  }
]);

/* ---------------- Web 后端 ---------------- */

extraProj('web', [
  {
    id: 't-web-2', emoji: '🪵', name: '统一错误处理与访问日志', sub: '状态码 · 参数校验 · 访问日志', color: '#e8f0ff', diff: 3, needs: ['net'], tag: '后端实战',
    desc: '给接口加上参数校验、统一的错误响应，以及一份能排查问题的访问日志。',
    intro: `
<p>一个只有「正常路径」的服务是没法上线的。参数错了怎么办？
路径不存在返回什么？出了问题怎么知道被谁调过？</p>
<p>这个项目把这三件事一起做掉：<strong>参数校验</strong>、
<strong>错误响应格式统一</strong>、<strong>每个请求都记一笔日志</strong>。
它们都不难，但漏掉任何一个，线上排查时都会多花几个小时。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>注意
<code>handle</code> 要从 <code>(状态码, 正文)</code> 变成
<code>(状态码, 正文, Content-Type)</code> —— 同一个服务要同时吐
纯文本和 JSON，Content-Type 就不能写死了。</div></div>`,
    steps: [
      '实现 <code>handle(method, path, query)</code>，返回 <code>(状态码, 正文文本, Content-Type)</code>。',
      '<code>GET /hello?name=X</code>：200，<code>text/plain; charset=utf-8</code>，正文 <code>\'你好，X\'</code>；<strong>缺 name 参数</strong> → 400，正文 <code>\'缺少 name 参数\'</code>。',
      '<code>GET /items?limit=N</code>：200 JSON 数组（<code>application/json; charset=utf-8</code>），取前 N 条；不给 limit 就全给。',
      '<code>limit</code> 不是整数、或者是负数 → 400，JSON <code>{\'error\': \'limit 必须是 0 以上的整数\'}</code>。',
      '其他路径 → 404，JSON <code>{\'error\': \'not found\'}</code>。',
      '<strong>每个请求</strong>都往全局 <code>LOG</code> 追加一条 <code>"METHOD path -> 状态码"</code>（path 不含查询串）。'
    ],
    starter: `import json
import threading
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LOG = []
ITEMS = ['苹果', '香蕉', '樱桃', '猕猴桃']


def handle(method, path, query):
    """返回 (状态码, 正文文本, Content-Type)。

    query 是 urllib.parse.parse_qs 解析出来的字典，值都是**列表**，
    比如 {'limit': ['2']}。

    规则见上面的步骤说明。别忘了每个请求都往 LOG 追加一条。
    """
    pass


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        code, text, ctype = handle('GET', parsed.path, query)
        body = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def start_server():
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


if __name__ == '__main__':
    srv, port = start_server()
    print('服务在 http://127.0.0.1:%d' % port)
    srv.shutdown()
`,
    check: { type: 'tests', code: `import json as _json
import urllib.error as _ue
import urllib.parse as _up
import urllib.request as _ur

srv, port = start_server()
base = 'http://127.0.0.1:' + str(port)


def _get(path):
    try:
        with _ur.urlopen(base + path, timeout=5) as r:
            return r.status, r.read().decode('utf-8'), (r.headers.get('Content-Type') or '')
    except _ue.HTTPError as e:
        return e.code, e.read().decode('utf-8'), (e.headers.get('Content-Type') or '')


try:
    LOG.clear()
    code, text, ct = _get('/hello?name=' + _up.quote('小皮'))
    assert code == 200, f"/hello 应该是 200，实际 {code}"
    assert 'text/plain' in ct, f"Content-Type 应该是 text/plain，实际 {ct!r}"
    assert text == '你好，小皮', f"正文应该是「你好，小皮」，实际 {text!r}"

    code, text, ct = _get('/hello')
    assert code == 400, f"缺 name 参数应该 400，实际 {code}"
    assert '缺少' in text, f"400 的正文要说清缺什么，实际 {text!r}"

    code, text, ct = _get('/items?limit=2')
    assert code == 200, f"/items 应该是 200，实际 {code}"
    assert 'application/json' in ct, f"Content-Type 应该是 application/json，实际 {ct!r}"
    data = _json.loads(text)
    assert data == ['苹果', '香蕉'], f"limit=2 应该取前两条，实际 {data!r}"
    assert '苹果' in text, "中文要原样输出（json.dumps 记得 ensure_ascii=False）"

    code, text, _ = _get('/items')
    assert len(_json.loads(text)) == 4, "不给 limit 应该返回全部 4 条"

    for bad in ('abc', '-1'):
        code, text, ct = _get('/items?limit=' + bad)
        assert code == 400, f"limit={bad} 应该 400，实际 {code}"
        assert 'application/json' in ct, f"400 也该是 JSON，实际 {ct!r}"
        assert _json.loads(text).get('error'), f"400 的正文应该是 {{'error': ...}}，实际 {text!r}"

    code, text, ct = _get('/nope')
    assert code == 404, f"未知路径应该 404，实际 {code}"
    assert _json.loads(text) == {'error': 'not found'}, f"404 正文不对：{text!r}"

    lines = [str(x) for x in LOG]
    assert len(lines) >= 7, f"每个请求都该记一条日志，7 个请求却只有 {len(lines)} 条"
    joined = ' | '.join(lines)
    assert 'GET /hello -> 200' in joined, f"日志格式应该是 'GET /hello -> 200'：{joined!r}"
    assert 'GET /nope -> 404' in joined, f"404 也要记进日志：{joined!r}"
    assert not any('?' in l for l in lines), f"日志里的 path 不该带查询串：{lines!r}"
finally:
    srv.shutdown()` },
    hint: '先写一个内部小函数 <code>log(code)</code> 把日志追加进去，再在每个 return 之前调一次 —— 比在每个分支里手写一行更不容易漏。<code>limit</code> 校验：<code>q = query.get("limit", ["4"])[0]</code>，然后 <code>try: n = int(q)</code> 加 <code>n &lt; 0</code> 的判断。',
    solution: `import json
import threading
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LOG = []
ITEMS = ['苹果', '香蕉', '樱桃', '猕猴桃']
JSON_CT = 'application/json; charset=utf-8'
TEXT_CT = 'text/plain; charset=utf-8'


def handle(method, path, query):
    def done(code, text, ctype):
        LOG.append('%s %s -> %d' % (method, path, code))
        return code, text, ctype

    if path == '/hello':
        name = (query.get('name') or [''])[0]
        if not name:
            return done(400, '缺少 name 参数', TEXT_CT)
        return done(200, '你好，%s' % name, TEXT_CT)

    if path == '/items':
        raw = query.get('limit')
        n = len(ITEMS)
        if raw:
            try:
                n = int(raw[0])
            except (TypeError, ValueError):
                return done(400, json.dumps({'error': 'limit 必须是 0 以上的整数'},
                                            ensure_ascii=False), JSON_CT)
            if n < 0:
                return done(400, json.dumps({'error': 'limit 必须是 0 以上的整数'},
                                            ensure_ascii=False), JSON_CT)
        return done(200, json.dumps(ITEMS[:n], ensure_ascii=False), JSON_CT)

    return done(404, json.dumps({'error': 'not found'}, ensure_ascii=False), JSON_CT)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        code, text, ctype = handle('GET', parsed.path, query)
        body = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def start_server():
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


if __name__ == '__main__':
    srv, port = start_server()
    print('服务在 http://127.0.0.1:%d' % port)
    srv.shutdown()`
  },

  {
    id: 't-web-3', emoji: '🗂️', name: '静态文件服务与路径穿越', sub: '安全边界 · 路径归一化 · 白名单', color: '#e8f0ff', diff: 3, needs: ['net'], tag: '后端实战',
    desc: '写一个静态文件服务，并且挡住 ../ 这种把服务器上任意文件挖出来的请求。',
    intro: `
<p>「把 URL 映射到磁盘上的文件」听起来是最简单的一段代码，
也是最经典的一个安全漏洞来源：请求 <code>/../secret.txt</code>，
一不小心就把整个磁盘暴露了。</p>
<p>这个项目的核心只有一件事：<strong>拼出路径之后，回头验证它还在不在允许的目录里</strong>。
顺序很重要 —— 必须先把 <code>..</code> 归一化，再判断前缀。</p>
<div class="tip tip-danger"><span class="tip-ico">⚠️</span><div>判断别用字符串
<code>startswith</code> 草草了事（<code>/srv/www-evil</code> 会被误判成在
<code>/srv/www</code> 里面）。用 <code>os.path.commonpath</code>
或者把两边都 <code>realpath</code> 之后比。</div></div>`,
    steps: [
      '写 <code>safe_path(root, url_path)</code>：<code>/</code> 当 <code>/index.html</code>；拼出绝对路径后如果跑到 root 外面，返回 <code>None</code>。',
      '写 <code>serve(root, url_path)</code>：返回 <code>(状态码, 正文 bytes, Content-Type)</code>；只允许 <code>.html / .txt / .json / .css</code> 四种扩展名。',
      '路径穿越、不在白名单、文件不存在 → 都返回 404（不要 500，也不要把文件内容返出去）。',
      '写 <code>start_server(root)</code>：起服务，返回 <code>(srv, port)</code>。',
      '主流程已经给好了：直接调 <code>serve</code> 打印几个结果。'
    ],
    starter: `import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ALLOWED = {'.html': 'text/html; charset=utf-8',
           '.txt': 'text/plain; charset=utf-8',
           '.json': 'application/json; charset=utf-8',
           '.css': 'text/css; charset=utf-8'}


def safe_path(root, url_path):
    """把 URL 路径变成磁盘上的真实路径。

    - '/' 当作 '/index.html'
    - 归一化之后如果跑到 root 外面（比如 '/../secret.txt'），返回 None
    - 注意 root 本身可能是相对路径，也别用字符串 startswith 硬比
    """
    pass


def serve(root, url_path):
    """返回 (状态码, 正文 bytes, Content-Type)。

    - 正常文件 -> 200 + 内容
    - 路径穿越 / 扩展名不在白名单 / 文件不存在 -> 404
    """
    pass


class Handler(BaseHTTPRequestHandler):
    def __init__(self, *args, root=None, **kw):
        self.root = root
        super().__init__(*args, **kw)

    def do_GET(self):
        code, body, ctype = serve(self.root, self.path)
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def start_server(root):
    import functools
    handler = functools.partial(Handler, root=root)
    srv = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


if __name__ == '__main__':
    os.makedirs('www', exist_ok=True)
    with open('www/index.html', 'w', encoding='utf-8') as f:
        f.write('<h1>home</h1>')
    for p in ('/', '/index.html', '/../secret.txt'):
        print(p, '->', serve('www', p)[0])
`,
    check: { type: 'tests', code: `import os, urllib.request as _ur

os.makedirs('www', exist_ok=True)
with open(os.path.join('www', 'index.html'), 'w', encoding='utf-8') as f:
    f.write('<h1>home</h1>')
with open(os.path.join('www', 'a.txt'), 'w', encoding='utf-8') as f:
    f.write('hello')
with open('secret.txt', 'w', encoding='utf-8') as f:
    f.write('TOP SECRET')

assert safe_path('www', '/a.txt') is not None, "正常路径不该被拦"
assert safe_path('www', '/index.html') is not None, "正常路径不该被拦"
assert os.path.basename(safe_path('www', '/')) == 'index.html', "/ 应该当作 index.html"

for bad in ('/../secret.txt', '/a/../../secret.txt', '/./../secret.txt'):
    got = safe_path('www', bad)
    assert got is None, f"{bad} 不该被放行，实际返回了 {got!r}"

code, body, ctype = serve('www', '/')
assert code == 200, f"/ 应该 200，实际 {code}"
assert b'home' in body, f"/ 应该返回 index.html 的内容，实际 {body!r}"

code, body, ctype = serve('www', '/a.txt')
assert code == 200, f"/a.txt 应该 200，实际 {code}"
assert body == b'hello', f"内容不对：{body!r}"
assert 'text/plain' in ctype, f"Content-Type 不对：{ctype!r}"

code, body, ctype = serve('www', '/../secret.txt')
assert code == 404, f"路径穿越必须 404，实际 {code}"
assert b'TOP SECRET' not in body, "绝对不能让 secret.txt 的内容漏出去"

code, body, ctype = serve('www', '/nope.txt')
assert code == 404, f"不存在的文件应该 404，实际 {code}"

code, body, ctype = serve('www', '/a.py')
assert code == 404, f"不在白名单的扩展名应该 404，实际 {code}"

srv, port = start_server('www')
try:
    with _ur.urlopen('http://127.0.0.1:%d/a.txt' % port, timeout=5) as r:
        assert r.status == 200 and r.read() == b'hello', "真发一次 HTTP 请求也要能拿到内容"
finally:
    srv.shutdown()

assert callable(safe_path) and callable(serve), "safe_path / serve 都要实现"
assert ("realpath" in __SRC__ or "normpath" in __SRC__ or "commonpath" in __SRC__ or "abspath" in __SRC__), (
    "先把路径归一化再判断在不在目录里，不要拿原始字符串硬比")` },
    hint: '<code>os.path.realpath(os.path.join(root, url_path.lstrip("/")))</code> 之后，用 <code>os.path.commonpath([os.path.realpath(root), full]) == os.path.realpath(root)</code> 判断在不在里面。别用 <code>startswith</code> —— <code>www-evil</code> 会骗过它。',
    solution: `import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ALLOWED = {'.html': 'text/html; charset=utf-8',
           '.txt': 'text/plain; charset=utf-8',
           '.json': 'application/json; charset=utf-8',
           '.css': 'text/css; charset=utf-8'}


def safe_path(root, url_path):
    rel = (url_path or '/').split('?')[0].split('#')[0]
    if rel in ('', '/'):
        rel = '/index.html'
    root_real = os.path.realpath(root)
    full = os.path.realpath(os.path.join(root_real, rel.lstrip('/')))
    try:
        # 用 commonpath 比，避免 '/srv/www-evil' 被当成 '/srv/www' 的子路径
        if os.path.commonpath([root_real, full]) != root_real:
            return None
    except ValueError:
        return None
    return full


def serve(root, url_path):
    full = safe_path(root, url_path)
    if full is None:
        return 404, b'not found', 'text/plain; charset=utf-8'
    ctype = ALLOWED.get(os.path.splitext(full)[1].lower())
    if ctype is None or not os.path.isfile(full):
        return 404, b'not found', 'text/plain; charset=utf-8'
    with open(full, 'rb') as f:
        return 200, f.read(), ctype


class Handler(BaseHTTPRequestHandler):
    def __init__(self, *args, root=None, **kw):
        self.root = root
        super().__init__(*args, **kw)

    def do_GET(self):
        code, body, ctype = serve(self.root, self.path)
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def start_server(root):
    import functools
    handler = functools.partial(Handler, root=root)
    srv = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


if __name__ == '__main__':
    os.makedirs('www', exist_ok=True)
    with open('www/index.html', 'w', encoding='utf-8') as f:
        f.write('<h1>home</h1>')
    for p in ('/', '/index.html', '/../secret.txt'):
        print(p, '->', serve('www', p)[0])`
  }
]);

/* ---------------- 运维自动化 ---------------- */

extraProj('ops', [
  {
    id: 't-ops-2', emoji: '💽', name: '磁盘占用巡检', sub: 'os.walk · 目录汇总 · 阈值告警 · 报告落盘', color: '#e8f0ff', diff: 2, tag: '运维实战',
    desc: '扫一遍目录树，算出每个子目录占多少，超过阈值的挑出来并生成巡检报告。',
    intro: `
<p>磁盘快满了的时候，第一个问题永远是「到底是什么占了空间」。
<code>du</code> 能回答，但你想要的通常是<strong>带阈值和结论</strong>的那一版：
哪些目录超标了、按大小排下来长什么样。</p>
<p>这个项目里有一个容易被忽略的点：<strong>root 目录下直接放的文件不算在任何子目录里</strong>。
把它们漏掉，报告的总数就对不上。</p>`,
    steps: [
      '写 <code>dir_sizes(root)</code>：返回 <code>{子目录名: 总字节数}</code>，递归统计（用 <code>os.walk</code>）。',
      '写 <code>alerts(sizes, limit)</code>：返回超过 limit 的目录名列表，<strong>按大小从大到小</strong>。',
      '写 <code>report(sizes, limit)</code>：生成报告文本，每个目录一行 <code>目录名  字节数  (占比%)</code>，按大小降序；超阈值的行尾加 <code>⚠️ 超过 10 KB</code>。',
      '把报告写进 <code>disk-report.txt</code>（UTF-8）。',
      '主流程已经给好了：打印告警数量。'
    ],
    starter: `import os

TREE = {
    'logs/app.log': 4000,
    'logs/err.log': 1500,
    'data/a.bin': 9000,
    'data/b.bin': 7000,
    'backup/old.zip': 3000,
    'readme.txt': 120,
}


def make_tree(base='srv'):
    """造一棵假的目录树出来（判题时会重新造一遍，可以反复跑）。"""
    for rel, size in TREE.items():
        p = os.path.join(base, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        if not os.path.exists(p):
            with open(p, 'wb') as f:
                f.write(b'x' * size)


def dir_sizes(root):
    """返回 {子目录名: 总字节数}。

    只统计 root 下面**一级子目录**的合计，root 自己直接放的文件不算在内。
    """
    pass


def alerts(sizes, limit):
    """超过 limit 的目录名，按大小从大到小排。"""
    pass


def report(sizes, limit):
    """生成报告文本（每行一个目录，按大小降序，超阈值的行尾加告警标记）。"""
    pass


make_tree()
sizes = dir_sizes('srv')
text = report(sizes, 10240)
with open('disk-report.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print(text)
print("告警 %d 个目录超过 10 KB" % len(alerts(sizes, 10240)))
`,
    check: { type: 'tests', code: `import os

assert os.path.exists('disk-report.txt'), "没有生成 disk-report.txt"
sizes = dir_sizes('srv')
assert dict(sizes) == {'logs': 5500, 'data': 16000, 'backup': 3000}, f"目录合计不对：{dict(sizes)!r}"

got = list(alerts(sizes, 10240))
assert got == ['data'], f"超过 10 KB 的只有 data，实际 {got!r}"
assert list(alerts(sizes, 100)) == ['data', 'logs', 'backup'], f"阈值调低之后要按大小降序：{list(alerts(sizes, 100))!r}"

text = open('disk-report.txt', encoding='utf-8').read()
lines = [l for l in text.rstrip().split('\\n') if l.strip()]
assert len(lines) == 3, f"报告应该有 3 行（3 个子目录），实际 {len(lines)} 行：{lines!r}"
assert lines[0].startswith('data'), f"最大的目录要排第一，实际 {lines[0]!r}"
assert '16000' in lines[0], f"第一行要带上字节数，实际 {lines[0]!r}"
assert '⚠️' in lines[0], f"超阈值的行要有告警标记，实际 {lines[0]!r}"
assert not any('⚠️' in l for l in lines[1:]), f"没超阈值的行不该有告警标记：{lines[1:]!r}"
assert 'readme.txt' not in text, "root 下直接放的文件不该出现在子目录报告里"

assert "告警" in __OUTPUT__ and "1" in __OUTPUT__, "要打印告警数量"` },
    hint: '<code>os.walk(root)</code> 的每一项是 <code>(当前目录, 子目录名列表, 文件名列表)</code>。<code>relpath</code> 出来之后取第一段就是一级子目录名，把 <code>os.path.getsize</code> 累加到它头上。占比用 <code>round(n / total * 100, 1)</code>。',
    solution: `import os

TREE = {
    'logs/app.log': 4000,
    'logs/err.log': 1500,
    'data/a.bin': 9000,
    'data/b.bin': 7000,
    'backup/old.zip': 3000,
    'readme.txt': 120,
}


def make_tree(base='srv'):
    for rel, size in TREE.items():
        p = os.path.join(base, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        if not os.path.exists(p):
            with open(p, 'wb') as f:
                f.write(b'x' * size)


def dir_sizes(root):
    out = {}
    for cur, _dirs, files in os.walk(root):
        rel = os.path.relpath(cur, root)
        if rel == '.':
            continue                       # root 自己直接放的文件不统计
        top = rel.split(os.sep)[0]
        for name in files:
            out[top] = out.get(top, 0) + os.path.getsize(os.path.join(cur, name))
    return out


def alerts(sizes, limit):
    return [k for k, v in sorted(sizes.items(), key=lambda kv: -kv[1]) if v > limit]


def report(sizes, limit):
    total = sum(sizes.values()) or 1
    lines = []
    for name, n in sorted(sizes.items(), key=lambda kv: -kv[1]):
        line = '%-10s %8d  (%5.1f%%)' % (name, n, n / total * 100)
        if n > limit:
            line += '  ⚠️ 超过 %d KB' % (limit // 1024)
        lines.append(line)
    return '\\n'.join(lines) + '\\n'


make_tree()
sizes = dir_sizes('srv')
text = report(sizes, 10240)
with open('disk-report.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print(text)
print("告警 %d 个目录超过 10 KB" % len(alerts(sizes, 10240)))`
  },

  {
    id: 't-ops-3', emoji: '🗄️', name: '备份打包与轮转', sub: 'zipfile · 备份命名 · 只留最近 N 份', color: '#e8f0ff', diff: 2, tag: '运维实战',
    desc: '把数据目录打包成带日期的备份，并且只保留最近几份、自动删掉旧的。',
    intro: `
<p>备份脚本写起来十分钟，出问题的方式却出奇地一致：
<strong>越备越多，最后把磁盘塞满，备份本身成了故障源</strong>。</p>
<p>所以「轮转」不是附加功能，而是备份的一半：
打完包之后，只留最近 N 份，其余删掉。这个项目两件事一起做。</p>`,
    steps: [
      '写 <code>make_backup(src, out_dir, today)</code>：把 <code>src</code> 目录里的文件打包成 <code>out_dir/data-YYYYMMDD.zip</code>，返回压缩包路径；已存在就覆盖。',
      '压缩包里的路径用相对 <code>src</code> 的名字（不要带上一长串本机目录），换台机器解压才不会乱。',
      '写 <code>rotate(out_dir, keep=3)</code>：按文件名里的日期从新到旧排，只留最近 <code>keep</code> 份，<strong>删掉返回被删的文件名列表</strong>。',
      '主流程已经给好了：打印当前备份和删掉的备份。'
    ],
    starter: `import glob
import os
import zipfile
from pathlib import Path

DATA = {
    'notes.txt': '今天学了备份轮转\\n',
    'todo.txt': '写周报\\n',
    'README.md': '# 数据目录\\n',
}


def make_data(src='data'):
    """造一份要备份的数据（判题时会重新造一遍，可以反复跑）。"""
    os.makedirs(src, exist_ok=True)
    for name, text in DATA.items():
        with open(os.path.join(src, name), 'w', encoding='utf-8') as f:
            f.write(text)


def make_backup(src='data', out_dir='backups', today='2026-09-16'):
    """打包成 out_dir/data-YYYYMMDD.zip（today 是 'YYYY-MM-DD'），返回压缩包路径。

    压缩包内部用相对 src 的路径。已存在同名文件就覆盖。
    """
    pass


def rotate(out_dir='backups', keep=3):
    """只保留日期最新的 keep 份备份，删掉其余，返回被删掉的文件名列表。"""
    pass


make_data()
print("刚打的包：%s" % make_backup())
print("轮转后还在的：%s" % sorted(os.path.basename(p) for p in glob.glob('backups/*.zip')))
`,
    check: { type: 'tests', code: `import glob, os, zipfile

os.makedirs('backups', exist_ok=True)
# 先造 4 份旧备份出来（直接用 zipfile，不依赖你的实现）
for d in ('2026-09-01', '2026-09-10', '2026-09-12', '2026-09-14'):
    name = 'data-' + d.replace('-', '') + '.zip'
    with zipfile.ZipFile(os.path.join('backups', name), 'w') as z:
        z.writestr('old.txt', 'old')

p = make_backup('data', 'backups', today='2026-09-16')
assert p, "make_backup 要返回压缩包路径"
assert os.path.basename(p) == 'data-20260916.zip', f"备份文件名不对：{os.path.basename(p)!r}"
assert os.path.exists(p), f"压缩包没生成：{p!r}"

with zipfile.ZipFile(p) as z:
    names = z.namelist()
assert any(n.endswith('notes.txt') for n in names), f"压缩包里应该有 data 里的文件：{names!r}"
assert not any(n.startswith('data' + os.sep) or n.startswith('data/') for n in names), (
    f"包内路径要用相对 data 的名字，不要带 data/ 前缀：{names!r}")

removed = list(rotate('backups', keep=3))
files = sorted(os.path.basename(f) for f in glob.glob('backups/*.zip'))
assert files == ['data-20260912.zip', 'data-20260914.zip', 'data-20260916.zip'], (
    f"只该留最新 3 份，实际剩下 {files!r}")
assert sorted(removed) == ['data-20260901.zip', 'data-20260910.zip'], (
    f"返回的被删列表不对：{sorted(removed)!r}")

assert "轮转" in __OUTPUT__ or "刚打的包" in __OUTPUT__, "主流程要打印备份和轮转结果"` },
    hint: '打包用 <code>with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:</code>，然后对 <code>Path(src).iterdir()</code> 里每个文件 <code>z.write(f, arcname=f.name)</code>。轮转：把 <code>backups/*.zip</code> 按文件名倒序排，<code>[keep:]</code> 之后的全部 <code>os.remove</code>。',
    solution: `import glob
import os
import zipfile
from pathlib import Path

DATA = {
    'notes.txt': '今天学了备份轮转\\n',
    'todo.txt': '写周报\\n',
    'README.md': '# 数据目录\\n',
}


def make_data(src='data'):
    os.makedirs(src, exist_ok=True)
    for name, text in DATA.items():
        with open(os.path.join(src, name), 'w', encoding='utf-8') as f:
            f.write(text)


def make_backup(src='data', out_dir='backups', today='2026-09-16'):
    os.makedirs(out_dir, exist_ok=True)
    stamp = today.replace('-', '')
    path = os.path.join(out_dir, 'data-%s.zip' % stamp)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(Path(src).iterdir()):
            if f.is_file():
                z.write(f, arcname=f.name)      # 包内用相对名字
    return path


def rotate(out_dir='backups', keep=3):
    files = sorted(glob.glob(os.path.join(out_dir, '*.zip')), reverse=True)
    removed = []
    for old in files[keep:]:
        os.remove(old)
        removed.append(os.path.basename(old))
    return removed


make_data()
print("刚打的包：%s" % make_backup())
print("轮转后还在的：%s" % sorted(os.path.basename(p) for p in glob.glob('backups/*.zip')))`
  }
]);

/* ---------------- 人工智能与机器学习 ---------------- */

extraProj('ai', [
  {
    id: 't-ai-2', emoji: '📧', name: '朴素贝叶斯判断垃圾邮件', sub: '词袋 · 条件概率 · 拉普拉斯平滑', color: '#e8f0ff', diff: 3, tag: 'AI 实战',
    desc: '不装任何库，用纯 Python 写一个能判断垃圾邮件的贝叶斯分类器。',
    intro: `
<p>「朴素贝叶斯」名字听着唬人，骨架其实很朴素：<strong>数一数每个词在垃圾/正常邮件里各出现几次</strong>，
然后把新邮件里的词逐个乘起来比大小。</p>
<p>真正的工程细节在两处：<strong>平滑</strong>（没见过的词概率是 0，一乘就全归零）和
<strong>取对数</strong>（几十个小数连乘会直接变成 0）。这两处做对了，几行代码就能有不错的准确率。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>这里用「已切好词的句子」
（词之间用空格分隔）来避免分词这个额外话题 —— 分词本身就是个独立的大问题，
不该盖住贝叶斯本身。</div></div>`,
    steps: [
      '写 <code>train(samples)</code>：<code>samples</code> 是 <code>[(句子, 标签), ...]</code>，返回你自己定的模型结构（建议装类别先验、每个类别下的词频、词表）。',
      '<strong>用拉普拉斯平滑</strong>：每个词的计数从 1 起算，分母加上词表大小。',
      '写 <code>predict(model, text)</code>：把 <code>text</code> 里的词逐个取<strong>对数概率</strong>相加，返回概率大的那个标签。',
      '没见过的词也必须能处理（平滑会兜住），不能崩。',
      '写 <code>accuracy(model, samples)</code>：预测对的比例（0.0 ~ 1.0）。',
      '主流程已经给好了：打印每条测试的「真实 → 预测」和准确率。'
    ],
    starter: `TRAIN = [
    ('免费 领取 优惠券 立刻 点击', '垃圾'),
    ('会议 纪要 请 查收', '正常'),
    ('恭喜 中奖 请 联系 客服', '垃圾'),
    ('项目 进度 汇报 明天 上午', '正常'),
    ('低价 促销 限时 抢购', '垃圾'),
    ('这 周 的 排班 表 已 发出', '正常'),
    ('发票 报销 流程 更新', '正常'),
    ('点击 链接 领取 红包', '垃圾'),
]

TEST = [
    ('点击 领取 红包', '垃圾'),
    ('请 查收 会议 纪要', '正常'),
    ('限时 抢购 优惠券', '垃圾'),
    ('明天 上午 汇报 进度', '正常'),
]


def train(samples):
    """samples 是 [(句子, 标签), ...]，句子里的词已经用空格切好。

    返回一个模型（结构你自己定，但要能被 predict / accuracy 用）。
    计数时用拉普拉斯平滑（每个词从 1 起算，分母加词表大小）。
    """
    pass


def predict(model, text):
    """返回 '垃圾' 或 '正常'。

    把 text 里的词逐个累加对数概率，别直接乘 —— 几十个小数相乘会下溢成 0。
    """
    pass


def accuracy(model, samples):
    """预测对的比例（0.0 ~ 1.0）。"""
    pass


m = train(TRAIN)
for text, truth in TEST:
    print("%s -> %s" % (truth, predict(m, text)))
print("准确率 %.2f" % accuracy(m, TEST))
`,
    check: { type: 'tests', code: `assert callable(train) and callable(predict) and callable(accuracy), "三个函数都要实现"

m = train(TRAIN)
got = predict(m, '点击 领取 优惠券')
assert got == '垃圾', f"「点击 领取 优惠券」应该判成垃圾，实际 {got!r}"
got = predict(m, '会议 纪要 请 查收')
assert got == '正常', f"「会议 纪要 请 查收」应该判成正常，实际 {got!r}"
got = predict(m, '免费 中奖 点击 红包')
assert got == '垃圾', f"「免费 中奖 点击 红包」应该判成垃圾，实际 {got!r}"

# 没见过的词不能崩（这就是平滑要解决的问题）
got = predict(m, '量子 纠缠 实验 报告')
assert got in ('垃圾', '正常'), f"遇到没见过的词应该照常返回标签，实际 {got!r}"

acc = accuracy(m, TEST)
assert 0.0 <= acc <= 1.0, f"准确率应该是 0~1 的比例，实际 {acc!r}"
assert acc >= 0.75, f"这套训练集上准确率应该不低于 0.75，实际 {acc!r}"

assert "准确率" in __OUTPUT__, "主流程要打印准确率"` },
    hint: '模型用三个字典就够：<code>{"priors": {类: 概率}, "counts": {类: {词: 次数}}, "vocab": set}</code>。预测时 <code>log(先验)</code> 加上每个词的 <code>log((counts[类].get(w,0) + 1) / (总数 + len(vocab)))</code> —— 分子那个 <code>+1</code> 就是平滑，它保证没见过的词不会把整体乘成 0。',
    solution: `import math

TRAIN = [
    ('免费 领取 优惠券 立刻 点击', '垃圾'),
    ('会议 纪要 请 查收', '正常'),
    ('恭喜 中奖 请 联系 客服', '垃圾'),
    ('项目 进度 汇报 明天 上午', '正常'),
    ('低价 促销 限时 抢购', '垃圾'),
    ('这 周 的 排班 表 已 发出', '正常'),
    ('发票 报销 流程 更新', '正常'),
    ('点击 链接 领取 红包', '垃圾'),
]

TEST = [
    ('点击 领取 红包', '垃圾'),
    ('请 查收 会议 纪要', '正常'),
    ('限时 抢购 优惠券', '垃圾'),
    ('明天 上午 汇报 进度', '正常'),
]


def train(samples):
    counts, totals, vocab, prior = {}, {}, set(), {}
    for text, label in samples:
        prior[label] = prior.get(label, 0) + 1
        counts.setdefault(label, {})
        totals[label] = totals.get(label, 0)
        for w in text.split():
            counts[label][w] = counts[label].get(w, 0) + 1
            totals[label] += 1
            vocab.add(w)
    n = len(samples)
    return {
        "priors": {k: v / n for k, v in prior.items()},
        "counts": counts,
        "totals": totals,
        "vocab": vocab,
    }


def predict(model, text):
    vocab_size = len(model["vocab"])
    best, best_score = None, None
    for label, p in model["priors"].items():
        score = math.log(p)
        total = model["totals"][label]
        bag = model["counts"][label]
        for w in text.split():
            # 拉普拉斯平滑：分子 +1，分母 + 词表大小
            score += math.log((bag.get(w, 0) + 1) / (total + vocab_size))
        if best_score is None or score > best_score:
            best, best_score = label, score
    return best


def accuracy(model, samples):
    if not samples:
        return 0.0
    hit = sum(1 for text, truth in samples if predict(model, text) == truth)
    return hit / len(samples)


m = train(TRAIN)
for text, truth in TEST:
    print("%s -> %s" % (truth, predict(m, text)))
print("准确率 %.2f" % accuracy(m, TEST))`
  },

  {
    id: 't-ai-3', emoji: '📐', name: '特征缩放为什么重要', sub: '梯度下降 · 标准化 · 学习率的敏感度', color: '#e8f0ff', diff: 3, tag: 'AI 实战',
    desc: '自己实现梯度下降，然后亲手验证「不标准化学习率就非常难调」这件事。',
    intro: `
<p>几乎所有入门教程都会说「训练前要标准化特征」，但很少有人说清<strong>为什么</strong>。
这个项目让你把那句话算出来。</p>
<p>面积在 50~130 之间，价格在 180~420 之间。同一个学习率之下，
上面那组数据会让参数<strong>直接冲飞</strong>，标准化之后却能稳稳下降 ——
原因是梯度里带着特征值本身，特征越大、梯度越大，能用的学习率窗口就越窄。</p>
<div class="tip tip-info"><span class="tip-ico">📌</span><div>顺带纠正一个常见误解：
标准化<strong>不是</strong>让损失变得更低，而是让「调学习率」这件事从难题变成日常。
这个项目要你看的正是这一点。</div></div>`,
    steps: [
      '写 <code>normalize(xs)</code>：返回 <code>(标准化后的列表, 均值, 标准差)</code>，用<strong>总体标准差</strong>（除以 n，不是 n-1）。',
      '写 <code>fit(xs, ys, lr, epochs)</code>：从 <code>w = 0, b = 0</code> 开始做梯度下降拟合 <code>y = w * x + b</code>。',
      '损失用均方误差（除以样本数），梯度也相应除以样本数 —— 这样下面的数值才是可复现的。',
      '<code>losses[0]</code> 记的是<strong>还没更新参数时</strong>的损失，长度等于 <code>epochs</code>。',
      '返回 <code>(w, b, losses)</code>。主流程已经给好了：对比原始特征和标准化之后的收敛情况。'
    ],
    starter: `XS = [50, 70, 90, 110, 130]
YS = [180, 240, 300, 360, 420]


def normalize(xs):
    """返回 (标准化后的列表, 均值, 标准差)。

    用总体标准差：sqrt(平均平方偏差)，也就是除以 n，不是 n-1。
    """
    pass


def fit(xs, ys, lr, epochs):
    """梯度下降拟合 y = w * x + b，从 w = 0, b = 0 开始。

    - 损失：均方误差（每个样本的误差平方求和后除以样本数）
    - 梯度：损失对 w / b 的偏导（同样除以样本数）
    - losses[0] 是**还没更新时**的损失，列表长度等于 epochs
    - 返回 (w, b, losses)
    """
    pass


_, _, l_raw = fit(XS, YS, lr=1e-4, epochs=500)
zn, mu, sd = normalize(XS)
_, _, l_norm = fit(zn, YS, lr=5e-3, epochs=500)
print("均值 %.1f  标准差 %.2f" % (mu, sd))
print("原始特征（lr=1e-4）最后损失 %.1f" % l_raw[-1])
print("标准化后（lr=5e-3）最后损失 %.1f" % l_norm[-1])
print("标准化之后敢用大 50 倍的学习率：%s" % (l_norm[-1] < l_raw[-1]))
`,
    check: { type: 'tests', code: `xs = [50, 70, 90, 110, 130]
ys = [180, 240, 300, 360, 420]

zn, mu, sd = normalize(xs)
assert abs(mu - 90) < 1e-9, f"均值应该是 90，实际 {mu!r}"
assert abs(sd - 28.284271247461902) < 1e-6, f"标准差应该是 28.284271（除以 n 的总体标准差），实际 {sd!r}"
assert len(zn) == 5, f"标准化后的长度应该不变，实际 {len(zn)}"
assert abs(zn[0] - (-40 / sd)) < 1e-9, f"第一个样本标准化不对：{zn[0]!r}"

w, b, losses = fit(xs, ys, lr=1e-4, epochs=500)
assert len(losses) == 500, f"losses 长度应该等于 epochs，实际 {len(losses)}"
assert abs(losses[0] - 97200.0) < 1e-6, (
    f"第一个记录应该是还没更新时的损失 = mean(y^2)，也就是 97200，实际 {losses[0]!r}")
assert losses[-1] < losses[0], f"500 轮之后损失应该下降，实际 {losses[0]!r} -> {losses[-1]!r}"
assert w > 0 and abs(w - 3) < 1, f"拟合出来的斜率应该在 3 附近，实际 {w!r}"

w2, b2, l2 = fit(zn, ys, lr=5e-3, epochs=500)
assert len(l2) == 500, f"标准化那次的 losses 长度不对：{len(l2)}"
assert l2[-1] < l2[0], f"标准化之后损失要下降：{l2[0]!r} -> {l2[-1]!r}"
assert l2[-1] < losses[-1], (
    f"同样的 500 轮，标准化 + 大 50 倍学习率的结果应该更好："
    f"{l2[-1]!r} vs 原始 {losses[-1]!r}")

assert "标准差" in __OUTPUT__, "主流程要打印标准差"` },
    hint: '一轮是这样：先用当前 <code>w, b</code> 算一遍损失记下来，再算梯度 <code>dw = 2 * mean(e * x)</code>、<code>db = 2 * mean(e)</code>（<code>e = (w*x + b) - y</code>），最后 <code>w -= lr * dw</code>。想亲眼看到「不标准化就飞」：把 <code>fit(XS, YS, lr=2e-4, ...)</code> 跑一下，损失会一路涨到 inf。',
    solution: `XS = [50, 70, 90, 110, 130]
YS = [180, 240, 300, 360, 420]


def normalize(xs):
    n = len(xs)
    mu = sum(xs) / n
    var = sum((x - mu) ** 2 for x in xs) / n     # 总体方差：除以 n
    sd = var ** 0.5
    return [(x - mu) / sd for x in xs], mu, sd


def fit(xs, ys, lr, epochs):
    w = b = 0.0
    n = len(xs)
    losses = []
    for _ in range(epochs):
        dw = db = loss = 0.0
        for x, y in zip(xs, ys):
            e = (w * x + b) - y
            dw += 2 * e * x / n
            db += 2 * e / n
            loss += e * e / n
        losses.append(loss)
        w -= lr * dw
        b -= lr * db
    return w, b, losses


_, _, l_raw = fit(XS, YS, lr=1e-4, epochs=500)
zn, mu, sd = normalize(XS)
_, _, l_norm = fit(zn, YS, lr=5e-3, epochs=500)
print("均值 %.1f  标准差 %.2f" % (mu, sd))
print("原始特征（lr=1e-4）最后损失 %.1f" % l_raw[-1])
print("标准化后（lr=5e-3）最后损失 %.1f" % l_norm[-1])
print("标准化之后敢用大 50 倍的学习率：%s" % (l_norm[-1] < l_raw[-1]))`
  }
]);

/* ---------------- 音视频与图片处理 ---------------- */

extraProj('media', [
  {
    id: 't-media-2', emoji: '💧', name: '图片加水印与亮度调节', sub: '像素操作 · 区域叠加 · 越界裁剪', color: '#e8f0ff', diff: 2, tag: '媒体实战',
    desc: '用纯 Python 操作像素：画一块矩形水印、整体调亮度，并把结果预览成字符画。',
    intro: `
<p>一张图片在程序里就是一串像素。这个项目不依赖任何图像库，
<strong>原样操作 <code>(r, g, b)</code> 元组</strong> —— 理解了这一层，
以后用 Pillow 之类的库就只是换 API 而已。</p>
<p>两个容易写错的地方：<strong>越界要裁掉而不是报错</strong>，
以及<strong>改图要返回新图、不能动原图</strong>。后者是「不可变数据」的入门，
也是这类工具能安全串起来用（调亮度 → 加水印 → 再调）的前提。</p>`,
    steps: [
      '写 <code>fill(w, h, rgb)</code>：返回 <code>(w, h, 像素列表)</code>，每个像素都是 <code>(r, g, b)</code>。',
      '写 <code>draw_rect(img, x, y, rw, rh, rgb)</code>：在图上画一个矩形，返回<strong>新图</strong>（原图不能变），越界的部分直接裁掉。',
      '写 <code>brightness(img, factor)</code>：每个通道乘 factor，结果 <code>clamp</code> 到 <code>0~255</code>。',
      '写 <code>to_ascii(img, cols=40)</code>：把图缩放到宽 cols（高按比例），每个格子取平均亮度，映射到 <code>\' .:-=+*#%@\'</code> 这套字符上。',
      '主流程已经给好了：造一张图、画水印、提亮，然后打印字符预览。'
    ],
    starter: `RAMP = ' .:-=+*#%@'


def fill(w, h, rgb):
    """返回 (w, h, 像素列表)，像素按行排，每个像素是 (r, g, b)。"""
    pass


def draw_rect(img, x, y, rw, rh, rgb):
    """在 (x, y) 处画一个 rw x rh 的矩形，返回**新图**（原图不动）。

    越界的部分裁掉，不要报错。
    """
    pass


def brightness(img, factor):
    """每个通道乘 factor，结果限制在 0~255，返回新图。"""
    pass


def to_ascii(img, cols=40):
    """缩放到宽 cols（高按 cols/w 等比取整），每个格子取平均亮度，映射到 RAMP。

    返回一个字符串，行之间用换行。
    """
    pass


img = fill(8, 6, (0, 0, 200))
img = draw_rect(img, 2, 1, 3, 2, (200, 0, 0))
img = brightness(img, 1.5)
print(to_ascii(img, cols=8))
`,
    check: { type: 'tests', code: `w, h, px = fill(8, 6, (0, 0, 200))
assert (w, h) == (8, 6), f"尺寸不对：{(w, h)!r}"
assert len(px) == 48, f"8x6 应该有 48 个像素，实际 {len(px)}"
assert px[0] == (0, 0, 200), f"像素值不对：{px[0]!r}"

img2 = draw_rect((8, 6, px), 2, 1, 3, 2, (200, 0, 0))
assert len(img2) == 3, "draw_rect 应该返回 (w, h, 像素) 三元组"
w2, h2, px2 = img2
assert (w2, h2) == (8, 6), f"画矩形不该改尺寸：{(w2, h2)!r}"
assert px2[1 * 8 + 2] == (200, 0, 0), f"矩形左上角没画上：{px2[1 * 8 + 2]!r}"
assert px2[2 * 8 + 4] == (200, 0, 0), f"矩形右下角没画上：{px2[2 * 8 + 4]!r}"
assert px2[1 * 8 + 1] == (0, 0, 200), f"矩形左边不该被涂：{px2[1 * 8 + 1]!r}"
assert px2[3 * 8 + 2] == (0, 0, 200), f"矩形下边不该被涂：{px2[3 * 8 + 2]!r}"
assert px[1 * 8 + 2] == (0, 0, 200), "draw_rect 不能改到原图，要返回新图"

img3 = draw_rect((8, 6, px), 6, 4, 5, 5, (0, 255, 0))
assert img3[2][4 * 8 + 7] == (0, 255, 0), f"贴着右下角那格应该被画上：{img3[2][4 * 8 + 7]!r}"
green = sum(1 for c in img3[2] if c == (0, 255, 0))
assert green == 4, (
    f"5x5 的矩形从 (6,4) 开始只画得下 2x2 = 4 格，越界部分要裁掉，实际 {green} 格")

wb, hb, pxb = brightness(img2, 1.5)
assert (wb, hb) == (8, 6), "调亮度不该改尺寸"
assert pxb[1 * 8 + 2] == (255, 0, 0), f"200*1.5=300 要截到 255，实际 {pxb[1 * 8 + 2]!r}"
assert pxb[0] == (0, 0, 255), f"蓝色通道也要截到 255，实际 {pxb[0]!r}"
wd, hd, pxd = brightness(img2, 0.5)
assert pxd[1 * 8 + 2] == (100, 0, 0), f"200*0.5=100，实际 {pxd[1 * 8 + 2]!r}"
assert px2[1 * 8 + 2] == (200, 0, 0), "brightness 也不能改到原图"

art = to_ascii(img2, cols=8)
lines = art.rstrip('\\n').split('\\n')
assert len(lines) == 6, f"宽 8 高 6 的图缩放成 8 列之后应该有 6 行，实际 {len(lines)}"
assert all(len(l) == 8 for l in lines), f"每行应该有 8 个字符：{[len(l) for l in lines]!r}"

dark = to_ascii(fill(2, 1, (0, 0, 0)), cols=2).rstrip('\\n')
bright_art = to_ascii(fill(2, 1, (255, 255, 255)), cols=2).rstrip('\\n')
assert RAMP.index(bright_art[0]) > RAMP.index(dark[0]), (
    f"越亮应该映射到越靠后的字符：暗 {dark!r} vs 亮 {bright_art!r}")

assert __OUTPUT__.strip() != '', "主流程要打印字符预览"` },
    hint: '像素下标是 <code>y * w + x</code>。画矩形时先算 <code>x0 = max(0, x)</code>、<code>x1 = min(w, x + rw)</code>，再循环 —— 这样越界自动被裁掉。亮度用 <code>max(0, min(255, int(v * factor)))</code>。字符映射：先除以 255 得到 0~1，再乘 <code>len(RAMP) - 1</code> 取整当下标。',
    solution: `RAMP = ' .:-=+*#%@'


def fill(w, h, rgb):
    return w, h, [tuple(rgb) for _ in range(w * h)]


def draw_rect(img, x, y, rw, rh, rgb):
    w, h, px = img
    out = list(px)                       # 复制一份，不动原图
    for yy in range(max(0, y), min(h, y + rh)):
        for xx in range(max(0, x), min(w, x + rw)):
            out[yy * w + xx] = tuple(rgb)
    return w, h, out


def brightness(img, factor):
    w, h, px = img
    return w, h, [tuple(max(0, min(255, int(c * factor))) for c in p) for p in px]


def _lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def to_ascii(img, cols=40):
    w, h, px = img
    rows = max(1, round(h * cols / w))
    lines = []
    for ry in range(rows):
        y0, y1 = ry * h // rows, max(ry * h // rows + 1, (ry + 1) * h // rows)
        line = []
        for rx in range(cols):
            x0, x1 = rx * w // cols, max(rx * w // cols + 1, (rx + 1) * w // cols)
            vals = [_lum(px[y * w + x]) for y in range(y0, y1) for x in range(x0, x1)]
            v = sum(vals) / len(vals)
            line.append(RAMP[min(len(RAMP) - 1, int(v / 255 * (len(RAMP) - 1) + 0.5))])
        lines.append(''.join(line))
    return '\\n'.join(lines)


img = fill(8, 6, (0, 0, 200))
img = draw_rect(img, 2, 1, 3, 2, (200, 0, 0))
img = brightness(img, 1.5)
print(to_ascii(img, cols=8))`
  },

  {
    id: 't-media-3', emoji: '🎵', name: '把声音画成波形图', sub: '采样 · 分帧 RMS · 字符波形', color: '#e8f0ff', diff: 2, tag: '媒体实战',
    desc: '合成一段音频，算出它的音量包络，然后用字符画出波形。',
    intro: `
<p>声音在程序里就是<strong>一串采样值</strong>：每秒几千到几万个 <code>-1.0 ~ 1.0</code> 之间的数。
波形图、音量条、语音检测，全都建立在这串数上。</p>
<p>这一步的关键概念是<strong>分帧</strong>：单看一个采样没有意义（它可能正好在零点），
所以要把连续的若干个采样<strong>打包成一帧</strong>，算这一帧的<strong>均方根</strong>（RMS）——
它对应人耳感觉到的「这一段有多响」。</p>`,
    steps: [
      '写 <code>sine(freq, seconds, rate=8000, amp=1.0)</code>：生成一段正弦波采样列表，用 <code>math.sin</code>，<code>2 * math.pi * freq * i / rate</code>。',
      '写 <code>rms(values)</code>：均方根 = <code>sqrt(平均平方)</code>；空列表返回 <code>0.0</code>。',
      '写 <code>envelope(samples, frame=200)</code>：按 frame 个采样一帧，返回每帧的 rms；最后不足一帧的丢掉。',
      '写 <code>loudest_range(env, frame, rate)</code>：最响的那一帧对应的 <code>(起始秒, 结束秒)</code>。',
      '写 <code>draw_wave(env, width=50)</code>：返回<strong>一行</strong>字符波形，用 <code>\'▁▂▃▄▅▆▇█\'</code> 这 8 个字符表示相对响度（除以最大值归一化）。',
      '主流程已经给好了：合成静音 + 满幅 + 弱音三段，打印波形和最响区间。'
    ],
    starter: `import math

RAMP = '▁▂▃▄▅▆▇█'


def sine(freq, seconds, rate=8000, amp=1.0):
    """生成 seconds 秒、每秒 rate 个采样的正弦波，返回 float 列表。"""
    pass


def rms(values):
    """均方根：sqrt(平均平方)。空列表返回 0.0。"""
    pass


def envelope(samples, frame=200):
    """把采样按 frame 个一帧打包，返回每帧的 rms。不足一帧的尾巴丢掉。"""
    pass


def loudest_range(env, frame=200, rate=8000):
    """返回最响那一帧对应的 (起始秒, 结束秒)。"""
    pass


def draw_wave(env, width=50):
    """返回一行字符波形。

    把 env 缩放到 width 个格子（每格取平均），按除以最大值的相对响度
    映射到 RAMP 的 8 个字符上。
    """
    pass


sig = [0.0] * 1000 + sine(200, 0.5, rate=2000, amp=1.0) + sine(200, 0.5, rate=2000, amp=0.2)
env = envelope(sig, frame=250)
print(draw_wave(env, width=12))
print("最响的一段：%.1f ~ %.1f 秒" % loudest_range(env, frame=250, rate=2000))
`,
    check: { type: 'tests', code: `s = sine(440, 0.1, rate=8000, amp=1.0)
assert len(s) == 800, f"0.1 秒 x 8000 应该有 800 个采样，实际 {len(s)}"
assert abs(max(s) - 1.0) < 0.02, f"满幅正弦的峰值应该接近 1.0，实际 {max(s)!r}"
assert abs(min(s) + 1.0) < 0.02, f"谷值应该接近 -1.0，实际 {min(s)!r}"
assert abs(sine(440, 0.1, rate=8000, amp=0.3)[0]) < 1e-9, "正弦从 0 开始"

assert abs(rms([1.0, -1.0]) - 1.0) < 1e-9, f"rms([1,-1]) 应该是 1.0，实际 {rms([1.0, -1.0])!r}"
assert rms([]) == 0.0, "空列表的 rms 应该是 0.0"
assert abs(rms([0.0, 0.0]) - 0.0) < 1e-9, "全零的 rms 是 0"

e = envelope(sine(440, 0.1, rate=8000, amp=1.0), frame=200)
assert len(e) == 4, f"800 个采样按 200 一帧应该得到 4 帧，实际 {len(e)}"
assert all(0.6 < x < 0.76 for x in e), (
    f"满幅正弦的每帧 rms 应该接近 1/sqrt(2)≈0.707，实际 {e!r}")

sig = [0.0] * 1000 + sine(200, 0.5, rate=2000, amp=1.0) + sine(200, 0.5, rate=2000, amp=0.2)
assert len(sig) == 3000, f"三段各 0.5 秒 x 2000 应该有 3000 个采样，实际 {len(sig)}"
env = envelope(sig, frame=250)
assert len(env) == 12, f"3000 / 250 应该得到 12 帧，实际 {len(env)}"
assert max(env[:4]) < 0.01, f"前 1/3 是静音，rms 应该接近 0：{env[:4]!r}"
assert 0.65 < env[4] < 0.76, f"中间是满幅正弦：{env[4]!r}"
assert 0.10 < env[8] < 0.18, f"最后是 20% 幅度，rms 应该接近 0.141：{env[8]!r}"

lo, hi = loudest_range(env, frame=250, rate=2000)
assert abs((hi - lo) - 0.125) < 1e-9, (
    f"区间长度应该正好是一帧（250/2000 = 0.125 秒），实际 {lo!r} ~ {hi!r}")
assert 0.5 <= lo < 1.0, f"最响的那一帧应该落在满幅那一段（0.5~1.0 秒），实际 {lo!r}"
assert hi <= 1.0 + 1e-9, f"区间不该越出满幅段，实际 {hi!r}"

art = draw_wave(env, width=12)
assert '\\n' not in art.rstrip('\\n'), f"draw_wave 应该返回一行，实际 {art!r}"
assert len(art.rstrip('\\n')) == 12, f"width=12 应该有 12 个字符，实际 {len(art.rstrip(chr(10)))!r}"
flat = art.rstrip('\\n')
assert flat[0] == '▁', f"静音段该是最低的字符，实际 {flat[0]!r}"
assert flat[4] == '█', f"最响的那一帧该是最高的字符，实际 {flat[4]!r}"

assert "最响" in __OUTPUT__, "主流程要打印最响区间"` },
    hint: '<code>rms</code>：<code>(sum(v * v for v in vals) / len(vals)) ** 0.5</code>。包络帧的下标 i 对应时间 <code>i*frame/rate</code> 到 <code>(i+1)*frame/rate</code> 秒。字符下标：<code>min(7, int(round(v / peak * 7)))</code>，注意 <code>peak</code> 为 0 时要兜一下（否则除零）。',
    solution: `import math

RAMP = '▁▂▃▄▅▆▇█'


def sine(freq, seconds, rate=8000, amp=1.0):
    n = int(round(seconds * rate))
    return [amp * math.sin(2 * math.pi * freq * i / rate) for i in range(n)]


def rms(values):
    if not values:
        return 0.0
    return (sum(v * v for v in values) / len(values)) ** 0.5


def envelope(samples, frame=200):
    out = []
    for i in range(0, len(samples) - frame + 1, frame):
        out.append(rms(samples[i:i + frame]))
    return out


def loudest_range(env, frame=200, rate=8000):
    if not env:
        return 0.0, 0.0
    i = env.index(max(env))
    return i * frame / rate, (i + 1) * frame / rate


def draw_wave(env, width=50):
    if not env:
        return RAMP[0] * width
    peak = max(env) or 1.0
    line = []
    for c in range(width):
        lo = c * len(env) // width
        hi = max(lo + 1, (c + 1) * len(env) // width)
        v = sum(env[lo:hi]) / len(env[lo:hi])
        line.append(RAMP[min(len(RAMP) - 1, int(round(v / peak * (len(RAMP) - 1))))])
    return ''.join(line)


sig = [0.0] * 1000 + sine(200, 0.5, rate=2000, amp=1.0) + sine(200, 0.5, rate=2000, amp=0.2)
env = envelope(sig, frame=250)
print(draw_wave(env, width=12))
print("最响的一段：%.1f ~ %.1f 秒" % loudest_range(env, frame=250, rate=2000))`
  }
]);

/* ---- 合并点：新项目一律在下面这行之前用 extraProj() 追加 ---- */

/* 把 extraProj() 攒下来的项目并进各自的方向。
   只在文件末尾合并一次 —— 合并语句散在中间的话，后加的项目就会漏掉。 */
(function mergeTrackProjectsExtra() {
  TRACKS.forEach(t => {
    const extra = TRACK_PROJECTS_EXTRA[t.id];
    if (extra) t.projects = (t.projects || []).concat(extra);
  });
})();

/* ---------------- 新项目的「档案」 ----------------
   用时 / 做完会掌握 / 提交前自查 / 拓展挑战。
   和判题数据（starter / check / solution）分开放：判题数据写错会直接红，
   文案写错不容易被发现，两者的审阅节奏不一样，混在一起就会互相掩护。 */
const PROJECT_DOSSIER_EXTRA = {

  /* ---- 网络爬虫 ---- */
  't-crawl-2': {
    time: '40 分钟',
    learn: [
      '「抓下来」只占三成，剩下七成是清洗和筛选 —— 价格要去掉符号和千分位才能变成数字',
      '先按外层的 <code>&lt;li&gt;</code> 切块、每块里再取字段；三个独立的 <code>findall</code> 再 <code>zip</code>，一旦某条缺字段就会整列错位且看不出来',
      '缺货商品不是「删掉这个字段」，而是「这条记录不符合条件」——过滤要在解析之后单独做一步'
    ],
    rubric: [
      '价格真的做了 <code>replace(",", "")</code> 再 <code>float</code>，1299.0 那条没有被当成字符串',
      '缺货的两件商品没有出现在 <code>prices.csv</code> 里',
      '结果是按价格升序的，不是按抓取顺序',
      'CSV 第一行是表头'
    ],
    challenge: '把「比价」这件事做完整：同一件商品在不同页面出现两次时只保留最便宜的那条（按商品名分组取最小值），再把结果按价格分档（100 以下 / 100-500 / 500 以上）统计每档有几件。'
  },
  't-crawl-3': {
    time: '30 分钟',
    learn: [
      '能用接口就别去啃 HTML —— 但接口给的格式未必是你能直接用的格式',
      '<code>"12.4k"</code> 这种带单位的字符串要先换算成数字，才算真正「拿到数据」',
      '接口给的顺序常常不是你要的顺序，排序这一步不能省'
    ],
    rubric: [
      '<code>to_number</code> 同时认 <code>"12.4k"</code>、<code>"2K"</code> 和纯数字 <code>"980"</code>',
      '榜单是按热度降序的，不是照着 JSON 里的顺序抄下来的',
      '只取了前 5 条，第 6 名没有混进来',
      'CSV 里的热度是整数，不是 <code>"12.4k"</code>'
    ],
    challenge: '给采集加一层「不用重复抓」：把上一次的结果存成 JSON，这次抓完先比一比，如果榜单没变就直接复用旧文件、打印「无更新」。这正是 <code>t-crawl-4</code> 在讲的那套思路，换个场景再写一遍会扎实很多。'
  },
  't-crawl-4': {
    time: '50 分钟',
    learn: [
      '增量抓取的核心是「快照 + 比对」：只处理变化的部分，抓一万条也就省下了九成九的工作量',
      '比对要用集合语义 —— 顺序抖动不是变化，按列表逐位比会天天误报',
      '把纯逻辑（<code>diff_snapshots</code>）从 IO（抓网 / 读写文件）里拆出来，它才能被单独测'
    ],
    rubric: [
      '<code>diff_snapshots</code> 不碰网络、不碰文件 —— 只接收两个列表',
      '顺序变化不产生「新增」或「消失」',
      '第一次跑（没有快照文件）时说清是在建立基线，而不是慌报 5 条新增',
      '快照文件是 UTF-8 的 JSON，中文没有变成 <code>\\uXXXX</code>'
    ],
    challenge: '让它支持多个站点：快照文件改成 <code>{站点: [标题...]}</code>，一次跑完报告每个站点各有什么变化。再加一个「变化历史」日志，每次有变化就追加一行，这样回头看能知道这个站更新得勤不勤。'
  },

  /* ---- 数据分析与可视化 ---- */
  't-data-2': {
    time: '35 分钟',
    learn: [
      '「缺失」和「0」是两件事：缺考要被排除在统计之外，当成 0 分会让整份数据失真',
      '平均分会被极端值拖着走，中位数不会 —— 这就是为什么两者要一起看',
      '分段统计（分箱）是数据分析里最常用的第一步'
    ],
    rubric: [
      '两个 <code>-</code> 解析成了 <code>None</code>，不是 0',
      '有效人数是 6，不是 8',
      '平均值用 <code>round(..., 1)</code>，不是整数除法',
      '分段人数加起来等于有效人数（缺考不落在任何一段）'
    ],
    challenge: '再加两项统计：一是「去掉最高分和最低分之后的平均分」（评分比赛里常用的做法），二是每个分数段的占比（算成百分比）。然后想一想：这份成绩单里，平均值高还是中位数高，说明分数分布是偏哪边的？'
  },
  't-data-3': {
    time: '35 分钟',
    learn: [
      '相邻两项的比较（环比）要把序列和它自己错开一位 —— <code>zip(values, values[1:])</code> 一次拿到「上月 + 本月」',
      '第一项没有上一项，所以它的环比是「空」而不是 0；把空写成 0 会凭空多出一个 -100%',
      '按固定的步长（这里是 3 个月）分组，是聚合数据最基础的写法'
    ],
    rubric: [
      '<code>mom</code> 返回的列表长度和输入一样长，第一项是 <code>None</code>',
      '负数环比保留了符号（跌了是负的，不是取了绝对值）',
      '<code>worst_mom</code> 跳过第一项的 <code>None</code>，否则会报类型错误',
      '四个季度的合计加起来等于全年总额'
    ],
    challenge: '把「环比」升级成「同比」：再给一组去年同期的数字，算每个月跟去年同月比增长了多少，然后回答「哪个月同比最好」。顺便想一下：环比和同比答案不一样时，通常说明什么问题？'
  },

  /* ---- 数据库操作 ---- */
  't-db-2': {
    time: '40 分钟',
    learn: [
      '单表能回答的问题有限，「谁还没还书」必须把两张表连起来看 —— 这就是 JOIN',
      '「从来没有出现过的」要用 <code>LEFT JOIN ... IS NULL</code>：<code>NOT IN</code> 一旦碰上子查询里的 <code>NULL</code> 会静默返回空结果',
      '<code>GROUP BY</code> 是「按某个字段把人分成堆，每堆算一个数」'
    ],
    rubric: [
      '两张表真的建好并灌进了数据，<code>setup</code> 反复跑结果一致',
      '还没还的书按书的 id 排序（不是按中文书名）',
      '<code>count_by_reader</code> 数的是全部借阅（含已还）',
      '「从没借过」用的是 LEFT JOIN 或 NOT IN，且结果只有《重构》'
    ],
    challenge: '再加一个「这个月该催谁还书」：给 <code>loans</code> 加一个 <code>borrow_date</code> 字段，算出每笔未还的借了几天，超过 30 天的排在最前面。真实图书馆系统里，这张「逾期提醒表」是每天都要跑的。'
  },
  't-db-3': {
    time: '50 分钟',
    learn: [
      '「要么两边都变，要么两边都不变」—— 这条要求就是事务存在的全部理由',
      '写错的典型方式是「先扣款再发现问题」：钱凭空少了一笔，而这在单机测试里很不容易被发现',
      '校验要放在改数据之前，或者把改动整个包进事务里回滚'
    ],
    rubric: [
      '<code>transfer</code> 用的是传进来的 <code>conn</code>，没有自己再 <code>connect</code> 一次',
      '余额不足和账户不存在这两种失败之后，三个人的余额都和失败前一模一样',
      '成功的转账两边都真的变了（不是只扣不加、也不是只加不扣）',
      '金额为 0 或负数被拒绝'
    ],
    challenge: '加一个「转账流水」表：每笔成功的转账写一条记录（谁、给谁、多少、什么时候），失败的不写。然后写一个 <code>audit(conn)</code>，用流水表重新累加一遍，核对结果和 <code>accounts</code> 里的余额是否一致 —— 这就是对账。'
  },

  /* ---- 测试开发 ---- */
  't-test-2': {
    time: '50 分钟',
    learn: [
      '先写测试再改实现：让测试告诉你错在哪儿，比通读代码猜要快得多',
      '「测试存在」不等于「测试有效」—— 把 bug 放回去，测试必须报错，这才叫覆盖到了',
      '断言要写具体数字（<code>assertEqual(c.subtotal(), 1127)</code>），写 <code>assertGreater(x, 0)</code> 对什么实现都成立，等于没测'
    ],
    rubric: [
      '至少 6 个测试方法，而且全部通过',
      '测试里真的断言了具体金额，不是只断言「不报错」',
      '<code>subtotal</code> 乘上了数量，<code>discount</code> 算的是「减掉 rate」而不是「只收 rate」',
      '折扣越界（1.5 / -0.1）用 <code>assertRaises</code> 验过'
    ],
    challenge: '再给 <code>Cart</code> 加一个「满减」规则（满 1000 减 100），然后先写测试、再写实现。写完之后自己动手把满减的阈值改成 100 看测试会不会红 —— 会红说明测试真的有效，不会红说明断言写得太松。'
  },
  't-test-3': {
    time: '40 分钟',
    learn: [
      '用例多起来时，正确做法是「一张表 + <code>subTest</code> 循环」，而不是复制粘贴十个几乎一样的测试方法',
      '<code>subTest</code> 的失败信息会点名是哪一行数据挂了，排查成本差了一个数量级',
      '非法输入要抛异常，不要返回 <code>None</code> —— 返回 None 会把错误推到离病根很远的地方'
    ],
    rubric: [
      '合法用例和非法用例各是一张表，用 <code>for</code> + <code>self.subTest</code> 跑',
      '大小写和空格都被处理了（<code>\' 1H 30M \'</code> 是合法的）',
      '单位重复、单位顺序倒置、负数、小数都被判为非法并抛 <code>ValueError</code>',
      '<code>None</code> 也被当成非法输入处理，而不是崩在 <code>str(None)</code> 上'
    ],
    challenge: '给解析器加一个「秒」单位（<code>s</code>，结果向上取整到分钟），并写一条测试说明为什么要「向上」取整。然后想清楚：加了新单位之后，原来「单位必须从大到小」的那条规则还够用吗？'
  },

  /* ---- 自动化办公 ---- */
  't-office-2': {
    time: '35 分钟',
    learn: [
      '批量改名一定要配日志：改错了得知道原来叫什么，这不是可选项',
      '日志里的顺序要稳定（按原文件名排序），否则每次跑出来的文件都不一样，没法对账',
      '<code>Path</code> 对象在 <code>rename()</code> 之后 <code>.name</code> 就是新名字了 —— 原文件名必须在改之前存下来'
    ],
    rubric: [
      '只有「扫描件_ 开头 + .pdf 结尾」的三个文件被改，<code>notes.txt</code> 没动',
      '日期补零正确：<code>2026-9-3</code> 变成 <code>20260903</code>',
      '磁盘上的文件名真的变了，不只是写了日志',
      '日志按原文件名排序，且表头是「原文件名,新文件名」'
    ],
    challenge: '把它变成一个可以反复跑的工具：已经规范的名字再跑一遍不要出错（幂等），并且加一个 <code>--dry-run</code> 参数，只打印「将要改成什么」而不真的改。真实运维脚本里，这两个特性是上生产前的底线。'
  },
  't-office-3': {
    time: '30 分钟',
    learn: [
      '「一张表 + 一个模板 → N 份文件」是办公自动化里最高频的模式，工资条、通知、证书都是它',
      '千分位格式化不用手写字符串拼接，<code>f"{amount:,}"</code> 就是答案',
      '产出文件之后顺手留一张清单（谁对应哪个文件），交付给别人时才说得清'
    ],
    rubric: [
      '金额格式正确：1200 → <code>1,200</code>，而 980 保持 <code>980</code> 不加逗号',
      '三份通知文件名正确、内容里姓名和部门都对上了',
      '<code>通知清单.csv</code> 的表头是「姓名,部门,文件名」',
      '读 CSV 时跳过了表头，没有把表头当成一个人'
    ],
    challenge: '加一层「模板校验」：写一个函数检查模板里的占位符（<code>{xxx}</code>）和传入的字段是否一一对应，缺哪个就报出来。模板一多，最常见的故障就是「模板改了、代码没改」，这个检查能提前拦住它。'
  },

  /* ---- 游戏开发 ---- */
  't-game-2': {
    time: '45 分钟',
    learn: [
      '游戏里九成代码是规则而不是画面 —— 把规则写成不碰界面的纯函数，才能拿几十个局面去测',
      '「头走到这一格算不算撞到自己」有一个必须想清楚的例外：尾巴这一步会让位，所以只跟前面几节比',
      '蛇的更新是「加头、去尾」，吃到食物时只加头不去尾 —— 变长的逻辑就是这么来的'
    ],
    rubric: [
      '四个方向都走对了，y 轴向下（<code>up</code> 是减 y）',
      '撞墙和撞自己都返回原来的蛇 + <code>\'dead\'</code>，而不是返回 None 或空列表',
      '吃到食物时尾巴不动（蛇变长一节）',
      '<code>step</code> 没有改到传进来的那个蛇列表'
    ],
    challenge: '加上「蛇的生长速度」和「食物有保质期」：食物放 N 步不吃就会换位置，蛇的长度超过 10 之后每吃一次食物得分递减。写完之后用同样的方式测一遍 —— 你会发现规则一复杂，纯函数的好处立刻显现。'
  },
  't-game-3': {
    time: '50 分钟',
    learn: [
      '随机生成必须可复现：同一种子永远同一张图，否则出了 bug 连复现都做不到',
      '<code>random.Random(seed)</code> 是自己的一条独立随机序列，不会被别处调用干扰 —— 全局 <code>random</code> 做不到这一点',
      '「取最远的那格」这类极值问题，用 <code>&gt;</code> 从左到右扫一遍就能自然拿到「并列取第一个」'
    ],
    rubric: [
      '同种子两次生成的结果完全一致，不同种子不一样',
      '<code>@</code> / <code>$</code> / <code>E</code> 各一个，而且位置互不相同',
      '地图尺寸正好是 w × h，每行长度都对',
      '字符只用了规定的五个，没有出现别的符号'
    ],
    challenge: '把「房间」升级成「房间 + 走廊」：先生成若干个互不重叠的房间，再用走廊把它们连起来（每个新房间跟已经连通的某个房间之间挖一条直线通道）。然后写一个检查：从起点出发能不能走到出口（BFS 一遍）。'
  },

  /* ---- 桌面 GUI ---- */
  't-gui-2': {
    time: '55 分钟',
    learn: [
      '界面代码最难自动化测试，所以要把逻辑从界面里抠出来：<code>Calc</code> 不 import tkinter，才测得了',
      '计算器的本质是一个小状态机：待处理的运算、待处理的运算符、以及「下一次输入要不要重新开始」',
      '让构建函数返回控件字典，是给自动化测试留的一扇门 —— 不用模拟鼠标也能点按钮'
    ],
    rubric: [
      '内核与界面完全分离：<code>Calc</code> 里没有 tkinter',
      '按完 <code>=</code> 之后按数字是「新输入」，按运算符是「接着结果算」',
      '连按运算符取最后那个，不会先算出一个莫名其妙的结果',
      '除以 0 显示「错误」，按 C 能恢复，之后还能继续算'
    ],
    challenge: '给计算器加上「括号」和「历史记录」：括号要求你放弃现在的累加式内核、改成一个真正的表达式解析器（可以先做 <code>tokenize</code> 再写递归下降）。这一步做完，你就顺手把「表达式求值」这个经典问题过了一遍。'
  },
  't-gui-3': {
    time: '45 分钟',
    learn: [
      '把「弹窗选路径」和「读写文件」分开，界面才可能被自动化测试 —— 一行参数 <code>path=None</code> 就能决定走哪条路',
      '<code>tk.Text</code> 取内容用 <code>"end-1c"</code>：用 <code>"end"</code> 会多带一个换行',
      '文件操作用 <code>pathlib</code>，读之前判断存在，比 <code>try/except</code> 更好读'
    ],
    rubric: [
      '三个按钮文字和初始状态标签都对（打开 / 保存 / 就绪）',
      '给了 <code>path</code> 就不弹窗，直接读写那个文件',
      '点「保存」之后磁盘上的文件内容真的变了，状态标签显示「已保存 N 个字符」',
      '读不到的文件返回空字符串，不抛异常'
    ],
    challenge: '加「未保存提示」：把 Text 的内容和上次保存的内容比一比，如果不一样就更新窗口标题加一个 <code>*</code>，并且关闭窗口前弹一次确认。再进一步，把状态栏改成「字数 / 行数」实时统计。'
  },

  /* ---- Web 后端 ---- */
  't-web-2': {
    time: '50 分钟',
    learn: [
      '只有正常路径的服务不能上线：参数错了、路径不存在，都要给出明确且格式统一的响应',
      '同一个服务要同时吐纯文本和 JSON，Content-Type 就不能写死，它得跟着返回内容走',
      '访问日志不是「以后再说」的优化项，它是排查问题时的第一手材料'
    ],
    rubric: [
      '<code>handle</code> 返回三元组，文本和 JSON 的 Content-Type 分别正确',
      '<code>limit</code> 非整数、负数都是 400，且错误正文是 JSON',
      '未知路径是 404，正文 <code>{"error": "not found"}</code>',
      '每个请求都在 <code>LOG</code> 里留了一条，且日志里的 path 不带查询串'
    ],
    challenge: '把日志升级成「结构化日志」：每条记成 JSON（时间、方法、路径、状态码、耗时毫秒），再加一个 <code>/stats</code> 接口返回「各状态码各多少次、最慢的一次是哪个请求」。真实的线上服务里，这类统计接口是每天都有人看的。'
  },
  't-web-3': {
    time: '55 分钟',
    learn: [
      '把 URL 映射到磁盘文件是最经典的漏洞来源：不检查就等着被人把整个磁盘下载走',
      '检查顺序很重要：先把 <code>..</code> 归一化，再判断前缀；反过来的话，还没归一化的路径骗得过判断',
      '判断「在不在目录里」不能用字符串 <code>startswith</code>：<code>/srv/www-evil</code> 会骗过 <code>/srv/www</code> 的判断'
    ],
    rubric: [
      '<code>safe_path</code> 对三种 <code>..</code> 写法都返回 <code>None</code>',
      '穿越请求返回 404，而且响应里绝不包含被保护文件的内容',
      '扩展名白名单真的生效（<code>.py</code> 拿不到）',
      '真发一次 HTTP 请求也能正常拿到文件'
    ],
    challenge: '加上目录浏览和缓存：请求一个目录时列出一份 HTML 索引（注意每个文件名都要正确转义，否则又是一个 XSS 漏洞），并对带 mtime 的文件返回 <code>Last-Modified</code>、支持 <code>If-Modified-Since</code> 回 304。'
  },

  /* ---- 运维自动化 ---- */
  't-ops-2': {
    time: '40 分钟',
    learn: [
      '磁盘告警的价值不在「列出来」，而在「有阈值、有排序、有结论」',
      'root 下直接放的文件不属于任何子目录 —— 漏掉它们，报告的总数就对不上',
      '巡检报告要落盘：出问题时能翻回来看当时是什么样'
    ],
    rubric: [
      '目录合计精确到字节（logs 5500 / data 16000 / backup 3000）',
      '阈值调低时，<code>alerts</code> 的结果按大小降序',
      '报告里最大的目录在第一行，且带告警标记；没超的没有标记',
      'root 下的 <code>readme.txt</code> 没有被算进任何子目录'
    ],
    challenge: '把它变成「趋势巡检」：每次运行把结果追加到一个历史文件里，然后比较本次和上次，检出「哪个目录长得最快」，并在报告里单独一段列出来。运维里真正有用的信号是变化速度，不是绝对值。'
  },
  't-ops-3': {
    time: '40 分钟',
    learn: [
      '备份脚本写错的方式出奇一致：越备越多，最后把磁盘塞满，备份自己成了故障源',
      '所以轮转不是附加功能，它是备份的一半 —— 打完包必须顺手清理旧的',
      '压缩包内部用相对路径，换台机器解压才不会解出一长串本机目录'
    ],
    rubric: [
      '压缩包名是 <code>data-20260916.zip</code>（日期补零、格式固定）',
      '包内文件是相对 <code>data</code> 的名字，没有 <code>data/</code> 前缀',
      '轮转之后只剩日期最新的三份',
      '<code>rotate</code> 返回了被删掉的文件名列表，而不只是默默删掉'
    ],
    challenge: '加「保留策略」而不是「保留份数」：改成保留最近 7 天每天一份、最近 4 周每周一份、最近 6 个月每月一份（这就是真正的 <code>grandfather-father-son</code> 轮转）。再给 <code>make_backup</code> 加上「打包前校验源目录存在」和「打完包校验能读回来」。'
  },

  /* ---- 人工智能与机器学习 ---- */
  't-ai-2': {
    time: '55 分钟',
    learn: [
      '朴素贝叶斯的骨架很朴素：数每个词在各类别下的出现次数，然后比大小',
      '拉普拉斯平滑（分子 +1）解决「没见过的词概率是 0，一乘就全归零」',
      '取对数再相加，而不是直接连乘 —— 几十个小数相乘会下溢成 0，这是实现层面的硬要求'
    ],
    rubric: [
      '训练用的是拉普拉斯平滑，不是原始频率',
      '预测走的是对数概率相加',
      '遇到训练集里完全没出现过的词也能照常返回标签，不崩',
      '测试集准确率不低于 0.75'
    ],
    challenge: '把它从「词袋」升级成「带权重的词袋」：用 TF-IDF 给区分度高的词更大权重，看准确率有没有变化。再增强一版：把「没见过的词」单独记一条日志，训练数据攒多了回头补进去 —— 这就是真实项目里模型迭代的样子。'
  },
  't-ai-3': {
    time: '55 分钟',
    learn: [
      '梯度里带着特征值本身：特征越大、梯度越大，能用的学习率窗口就越窄',
      '标准化的作用不是「让损失更低」，而是「让调学习率从难题变成日常」',
      '均方误差和它的梯度都按样本数平均，这一步决定了数值结果可不可复现',
      '一上来就把 <code>losses[0]</code> 记下来（参数还没动时的损失），后面比较才有基准'
    ],
    rubric: [
      '标准差用的是总体标准差（除以 n），不是样本标准差（n-1）',
      '<code>losses</code> 长度等于 <code>epochs</code>，而且第一项是初始损失 97200',
      '原始特征在小学习率下能收敛，<code>w</code> 落在 3 附近',
      '标准化 + 大 50 倍学习率的结果比原始特征更好'
    ],
    challenge: '把「发散」亲手看到：跑 <code>fit(XS, YS, lr=2e-4, epochs=200)</code>，损失会一路涨到超出浮点范围。然后给 <code>fit</code> 加一个保护：一旦发现损失不是有限数就提前停下，返回「发散了」以及是在第几轮开始的 —— 这比让程序默默算出 inf 有用得多。'
  },

  /* ---- 音视频与图片处理 ---- */
  't-media-2': {
    time: '45 分钟',
    learn: [
      '一张图在程序里就是一串像素 —— 理解这一层之后，换成 Pillow 之类的库只是换 API',
      '越界要裁掉而不是报错：把 <code>x0 = max(0, x)</code>、<code>x1 = min(w, x + rw)</code> 落在循环边界上，裁剪就是免费的',
      '改图要返回新图、不动原图，这样操作才能安全地串起来（调亮度 → 加水印 → 再调）'
    ],
    rubric: [
      '像素下标是 <code>y * w + x</code>，行列没有搞反',
      '矩形越界时只画得下的部分，不报错、也不多画',
      '<code>draw_rect</code> 和 <code>brightness</code> 都没有改到原图',
      '亮度计算做了 0~255 的截断，200 × 1.5 得到 255 而不是 300'
    ],
    challenge: '把水印换成真正的水印：用给出的 <code>RAMP</code> 之外，试着写一个 <code>blend(img, top, alpha)</code> 做两图混合（<code>alpha</code> 是透明度），然后把一块小图半透明地贴到右下角。再写一个「边缘检测」：每个像素和它右侧、下方的像素做差，取绝对值当新亮度。'
  },
  't-media-3': {
    time: '45 分钟',
    learn: [
      '声音就是一串 -1.0 ~ 1.0 的采样值，波形图、音量条、语音检测全都建立在它上面',
      '单看一个采样没有意义（可能正好在零点），要「分帧」之后算均方根 —— 它对应人耳听到的「这一段有多响」',
      '满幅正弦的 RMS 约为 0.707（也就是 <code>1/sqrt(2)</code>），这个数字值得记住'
    ],
    rubric: [
      '正弦波的峰值接近 1.0、谷值接近 -1.0',
      '<code>rms([])</code> 返回 0.0 而不是报错',
      '分帧时不足一帧的尾巴被丢掉，帧数正好对得上',
      '字符波形里静音是最低的 <code>▁</code>、最响的是 <code>█</code>'
    ],
    challenge: '做一个「静音检测」：把连续若干帧的 RMS 都低于阈值的区间标出来，打印「第 0.0 ~ 0.5 秒是静音」。再加一个「淡入淡出」函数：让开头和结尾的振幅线性升上去、降下来，然后用字符波形确认两端确实变矮了。'
  }
};

(function mergeExtraDossier() {
  const all = PROJECTS.slice();
  TRACKS.forEach(t => (t.projects || []).forEach(p => all.push(p)));
  all.forEach(p => {
    const d = PROJECT_DOSSIER_EXTRA[p.id];
    if (!d) return;
    Object.keys(d).forEach(k => { if (p[k] === undefined) p[k] = d[k]; });
  });
})();

(function mergeProjectDossier() {
  const all = PROJECTS.slice();
  TRACKS.forEach(t => (t.projects || []).forEach(p => all.push(p)));
  all.forEach(p => {
    const d = PROJECT_DOSSIER[p.id];
    if (!d) return;
    Object.keys(d).forEach(k => { if (p[k] === undefined) p[k] = d[k]; });
  });
})();

