# -*- coding: utf-8 -*-
"""生成爬虫练习靶场（website/ 下的静态站）。

这是一次性生成脚本：跑完产物就是一堆静态 HTML，站点定型后不再需要它。
留在这里是为了说明靶场的结构是怎么来的，改内容直接改 HTML 更直观。

用法： python website/_generate.py
"""
import os

SHELL = u"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{title} - 编程日报</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="site-header">
  <a class="logo" href="/index.html">编程日报</a>
  <nav class="main-nav">
    <a href="/index.html">首页</a>
    <a href="/news.html">全部新闻</a>
    <a href="/shop.html">商城</a>
    <a href="/about.html">关于我们</a>
  </nav>
</header>

<div class="layout">
  <main class="main">
{main}
  </main>

  <aside class="sidebar">
    <div class="widget hot">
      <h3>热门标签</h3>
      <ul>
        <li><a href="/news.html">Python</a></li>
        <li><a href="/news.html">性能优化</a></li>
        <li><a href="/news.html">数据结构</a></li>
      </ul>
    </div>
    <div class="widget ad">
      <p>广告位招租</p>
      <a href="/about.html">联系我们</a>
    </div>
  </aside>
</div>

<footer class="site-footer">
  <p>编程日报 · 这是一个用于学习爬虫的示例站点，内容均为虚构。</p>
  <p><a href="/robots.txt">robots.txt</a></p>
</footer>
</body>
</html>
"""

POSTS = [
    dict(n=1, title=u"Python 3.14 正式发布：这次真的快了不少",
         date=u"2026-09-10", tags=[u"Python", u"性能优化"], views=u"12.4k",
         body=u"""<p>Python 3.14 在九月正式发布了。官方给出的基准测试显示，在常见的循环和函数调用场景下，
这次的平均提升大约在 20% 左右。</p>
<p>提升主要来自三块：解释器主循环的优化、函数调用栈的简化，以及对小整数缓存的调整。</p>
<h3>对日常代码意味着什么</h3>
<p>大部分同学不需要改任何代码。如果你的程序里有大量循环，升级后会自动变快；
如果本来就在依赖第三方库做重活，感受可能不明显。</p>
<p>唯一的注意点是：某些长期没维护的 C 扩展可能还没跟上，升级前建议先在虚拟环境里试一遍。</p>"""),
    dict(n=2, title=u"为什么你的 for 循环可以更快",
         date=u"2026-09-08", tags=[u"性能优化", u"Python"], views=u"8.7k",
         body=u"""<p>很多人写循环时会习惯性在循环体里做重复计算，这是最常见的一类浪费。</p>
<p>比如每次都算一遍 <code>len(data)</code>，或者反复查找同一个字典的键。
把不随循环变化的东西提到循环外面，通常能省下 10% 到 30%。</p>
<h3>两个立刻能用的技巧</h3>
<p>第一，用列表推导式代替「建空列表再 append」，它少了一层方法调用的开销。</p>
<p>第二，需要同时拿到下标和元素时用 <code>enumerate</code>，别自己维护一个计数器变量。</p>"""),
    dict(n=3, title=u"从零理解递归：把大问题拆成小问题",
         date=u"2026-09-05", tags=[u"数据结构", u"算法"], views=u"6.1k",
         body=u"""<p>递归难，往往是因为一开始就试图在脑子里展开每一层调用。</p>
<p>正确的姿势是反过来：先相信「小一号的问题已经被解决了」，然后只关心怎么用它拼出当前这层。</p>
<h3>写递归的两件事</h3>
<p>写下终止条件，也就是最小的情况直接返回什么；然后写下递推关系，也就是当前问题怎么用小一号的结果表示。</p>
<p>这两件事写清楚，递归就写完了 —— 中间过程交给计算机。</p>"""),
    dict(n=4, title=u"数据清洗实战：一份脏 CSV 的改造记",
         date=u"2026-09-02", tags=[u"数据处理", u"Python"], views=u"4.3k",
         body=u"""<p>拿到手的真实数据，很少有干净的时候。这份 CSV 里有全角空格、有空字符串冒充的缺失值、
还有「1,234」这种带千分位的数字。</p>
<h3>清洗的顺序很重要</h3>
<p>先统一编码和空白字符，再处理缺失值，最后才是类型转换。顺序反了会反复返工。</p>
<p>另外强烈建议每一步都打印一下数据的形状和几行样子，不要一口气写完再跑。</p>"""),
    dict(n=5, title=u"类型注解到底值不值得写",
         date=u"2026-08-28", tags=[u"Python", u"工程实践"], views=u"3.2k",
         body=u"""<p>Python 的类型注解不参与运行，写错了也不会报错。那还有必要写吗？</p>
<p>有必要，但收益不在运行时，而在你半年后回来看自己的代码的时候。</p>
<h3>什么时候收益最大</h3>
<p>函数参数和返回值、以及跨模块传递的数据结构 —— 这两处写上类型，编辑器就能帮你抓掉相当一部分低级错误。</p>
<p>函数体内部的小变量，就随缘吧，不必强求。</p>"""),
]

# 商城页的商品。两页共 10 件，其中 2 件库存为 0（要过滤掉），
# 一件价格带千分位（¥1,299.00，要洗干净）—— 都是真实站点上常见的坑。
PRODUCTS = [
    dict(sku=u"A-1001", name=u"机械键盘 K87", price=u"499.00", stock=12),
    dict(sku=u"A-1002", name=u"人体工学椅", price=u"1,299.00", stock=3),
    dict(sku=u"A-1003", name=u"4K 显示器 27 寸", price=u"1,899.00", stock=0),
    dict(sku=u"A-1004", name=u"降噪耳机 Pro", price=u"899.00", stock=7),
    dict(sku=u"A-1005", name=u"无线鼠标 M3", price=u"129.00", stock=40),
    dict(sku=u"A-1006", name=u"笔记本支架", price=u"89.00", stock=25),
    dict(sku=u"A-1007", name=u"固态硬盘 1TB", price=u"559.00", stock=8),
    dict(sku=u"A-1008", name=u"摄像头 1080P", price=u"219.00", stock=0),
    dict(sku=u"A-1009", name=u"USB 扩展坞", price=u"159.00", stock=16),
    dict(sku=u"A-1010", name=u"桌面音箱", price=u"329.00", stock=5),
]

# 热榜接口。注意两点：items **不是**按热度排好的（要自己排），
# heat 是带 k 后缀的字符串（要自己换算成数字）—— 接口给你什么格式，
# 就得按什么格式处理，这是真实采集里最常被低估的一步。
HOT = {
    "site": u"编程日报",
    "date": u"2026-09-16",
    "items": [
        {"title": u"数据清洗实战：一份脏 CSV 的改造记", "heat": u"4.3k", "url": u"/post-4.html"},
        {"title": u"Python 3.14 正式发布：这次真的快了不少", "heat": u"12.4k", "url": u"/post-1.html"},
        {"title": u"关于我们", "heat": u"1.2k", "url": u"/about.html"},
        {"title": u"类型注解到底值不值得写", "heat": u"3.2k", "url": u"/post-5.html"},
        {"title": u"为什么你的 for 循环可以更快", "heat": u"8.7k", "url": u"/post-2.html"},
        {"title": u"从零理解递归：把大问题拆成小问题", "heat": u"6.1k", "url": u"/post-3.html"},
    ],
}

STYLE = u"""/* 编程日报 · 样式（爬虫练习站，抓 HTML 时用不到它） */
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, "Microsoft YaHei", sans-serif;
       color: #1c2434; background: #f4f6fb; line-height: 1.75; }
.site-header { display: flex; align-items: center; gap: 24px; padding: 14px 28px;
               background: #fff; border-bottom: 1px solid #e2e8f2; }
.logo { font-weight: 800; font-size: 18px; color: #2f6df6; text-decoration: none; }
.main-nav a { margin-right: 16px; color: #4d5a70; text-decoration: none; font-size: 14px; }
.layout { max-width: 1000px; margin: 24px auto; padding: 0 20px;
          display: grid; grid-template-columns: minmax(0,1fr) 240px; gap: 24px; }
.main, .sidebar .widget { background: #fff; border: 1px solid #e2e8f2; border-radius: 12px; }
.main { padding: 24px 26px; }
.page-title, .post-title { margin: 0 0 18px; font-size: 24px; }
.news-list { list-style: none; margin: 0; padding: 0; }
.news-item { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
             padding: 13px 0; border-bottom: 1px dashed #e2e8f2; }
.news-title { flex: 1 1 260px; color: #1c2434; text-decoration: none; font-weight: 600; }
.news-title:hover { color: #2f6df6; }
.news-date { color: #8794a8; font-size: 13px; font-variant-numeric: tabular-nums; }
.news-tags .tag, .post-tags .tag { display: inline-block; margin-right: 6px; padding: 1px 8px;
    background: #e8f0ff; color: #2f6df6; border-radius: 20px; font-size: 12px; }
.post-meta { display: flex; gap: 16px; align-items: center; flex-wrap: wrap;
             color: #8794a8; font-size: 13px; padding-bottom: 14px;
             border-bottom: 1px solid #e2e8f2; margin-bottom: 18px; }
.post-body h3 { margin: 22px 0 8px; font-size: 16px; }
.post-body code { background: #f2f6ff; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
.pager { display: flex; justify-content: space-between; align-items: center;
         margin-top: 20px; font-size: 14px; }
.pager a { color: #2f6df6; text-decoration: none; }
.pager-cur { color: #8794a8; }
.more { margin-top: 20px; }
.more a { color: #2f6df6; text-decoration: none; }
.sidebar .widget { padding: 16px 18px; margin-bottom: 16px; }
.widget h3 { margin: 0 0 10px; font-size: 14px; }
.widget ul { list-style: none; margin: 0; padding: 0; }
.widget li { padding: 4px 0; font-size: 13px; }
.widget a { color: #4d5a70; text-decoration: none; }
.ad { text-align: center; color: #8794a8; font-size: 13px; }
.site-footer { max-width: 1000px; margin: 30px auto 60px; padding: 0 20px;
               color: #8794a8; font-size: 13px; }
.site-footer a { color: #8794a8; }

/* 商品列表。价格故意混着千分位（¥1,299.00），库存有一两条是 0 ——
   真实站点的数据就是这么脏的，清洗是爬虫项目里必须过的一关。 */
.product-list { list-style: none; margin: 0; padding: 0; }
.product-item { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap;
                padding: 12px 0; border-bottom: 1px dashed #e2e8f2; }
.product-name { flex: 1 1 220px; font-weight: 600; }
.product-price { color: #e5484d; font-weight: 700; font-variant-numeric: tabular-nums; }
.product-stock { color: #8794a8; font-size: 13px; }
.product-stock.out { color: #e5484d; }
"""

ROBOTS = u"""# 编程日报 · 爬虫约定
# 这是一个教学用的示例站点，用来演示 robots.txt 该怎么读。

User-agent: *
Allow: /news.html
Allow: /news-2.html
Allow: /post-1.html
Allow: /post-2.html
Allow: /post-3.html
Allow: /post-4.html
Allow: /post-5.html
Disallow: /about.html
Disallow: /admin/

# 建议抓取间隔（秒）
Crawl-delay: 1
"""

HERE = os.path.dirname(os.path.abspath(__file__))


def page(title, main):
    return SHELL.format(title=title, main=main)


def list_items(posts):
    rows = []
    for p in posts:
        tags = u"".join(u'<span class="tag">%s</span>' % t for t in p['tags'])
        rows.append(
            u'    <li class="news-item">\n'
            u'      <a class="news-title" href="/post-%d.html">%s</a>\n'
            u'      <span class="news-date">%s</span>\n'
            u'      <span class="news-tags">%s</span>\n'
            u'    </li>' % (p['n'], p['title'], p['date'], tags))
    return u'<ul class="news-list">\n' + u'\n'.join(rows) + u'\n</ul>'


def product_items(products):
    """库存直接写成数字。缺货的那几条多加一个 class="out" ——
    真实站点上「怎么标缺货」有十几种写法，这里给两种线索（数字 + class），
    学生用哪种都能筛出来。"""
    rows = []
    for p in products:
        cls = u'product-stock out' if p['stock'] == 0 else u'product-stock'
        rows.append(
            u'    <li class="product-item" data-sku="%s">\n'
            u'      <span class="product-name">%s</span>\n'
            u'      <span class="product-price">\uffe5%s</span>\n'
            u'      <span class="%s">%d</span>\n'
            u'    </li>' % (p['sku'], p['name'], p['price'], cls, p['stock']))
    return u'<ul class="product-list">\n' + u'\n'.join(rows) + u'\n</ul>'


def write(name, text):
    path = os.path.join(HERE, name)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print(u'  %-16s %5d 字节' % (name, len(text.encode('utf-8'))))


def main():
    write('index.html', page(u'首页', u'    <h1 class="page-title">最新动态</h1>\n'
          + list_items(POSTS[:3])
          + u'\n    <p class="more"><a href="/news.html">查看全部新闻 →</a></p>'))

    write('news.html', page(u'全部新闻', u'    <h1 class="page-title">全部新闻（第 1 页）</h1>\n'
          + list_items(POSTS[:3])
          + u'\n    <div class="pager">\n'
            u'      <span class="pager-cur">第 1 页</span>\n'
            u'      <a class="pager-next" href="/news-2.html">下一页 →</a>\n'
            u'    </div>'))

    write('news-2.html', page(u'全部新闻 第 2 页', u'    <h1 class="page-title">全部新闻（第 2 页）</h1>\n'
          + list_items(POSTS[3:])
          + u'\n    <div class="pager">\n'
            u'      <a class="pager-prev" href="/news.html">← 上一页</a>\n'
            u'      <span class="pager-cur">第 2 页</span>\n'
            u'    </div>'))

    for p in POSTS:
        tags = u"".join(u'<span class="tag">%s</span>' % t for t in p['tags'])
        main_html = (
            u'    <article class="post">\n'
            u'      <h1 class="post-title">%s</h1>\n'
            u'      <div class="post-meta">\n'
            u'        <span class="post-date">%s</span>\n'
            u'        <span class="post-views">阅读 %s</span>\n'
            u'        <span class="post-tags">%s</span>\n'
            u'      </div>\n'
            u'      <div class="post-body">\n%s\n      </div>\n'
            u'    </article>\n'
            u'    <p class="more"><a href="/news.html">← 返回新闻列表</a></p>'
        ) % (p['title'], p['date'], p['views'], tags, p['body'])
        write('post-%d.html' % p['n'], page(p['title'], main_html))

    write('about.html', page(u'关于我们', u"""    <h1 class="page-title">关于我们</h1>
    <div class="post-body">
      <p>「编程日报」是一个虚构的站点，专门用来练习写爬虫。</p>
      <p>它的结构模仿了真实新闻站：有导航、有侧栏、有分页、有广告位，
      所以在这里练成的选择器，换到真实站点上也基本能用。</p>
      <p>站点内容全部是编的，不涉及任何真实事件或人物。</p>
    </div>"""))

    # 商城：练「列表 + 价格清洗 + 过滤」用的第二类页面。
    # 和新闻页刻意写得不一样（价格带货币符号、库存是数字、商品有多属性），
    # 这样换一个页面就得重新写一遍选择器，而不是把上一段代码复制过来。
    write('shop.html', page(u'商城', u'    <h1 class="page-title">商城 · 第 1 页</h1>\n'
          + product_items(PRODUCTS[:6])
          + u'\n    <div class="pager">\n'
            u'      <span class="pager-cur">第 1 页</span>\n'
            u'      <a class="pager-next" href="/shop-2.html">下一页 →</a>\n'
            u'    </div>'))

    write('shop-2.html', page(u'商城 第 2 页', u'    <h1 class="page-title">商城 · 第 2 页</h1>\n'
          + product_items(PRODUCTS[6:])
          + u'\n    <div class="pager">\n'
            u'      <a class="pager-prev" href="/shop.html">← 上一页</a>\n'
            u'      <span class="pager-cur">第 2 页</span>\n'
            u'    </div>'))

    # 热榜接口：JSON 格式的数据源。真实站点上「页面 + 接口」混着来，
    # 会读接口能省掉一大堆解析 HTML 的麻烦，但接口给的格式未必就是你要的格式。
    import json as _json
    hot_text = _json.dumps(HOT, ensure_ascii=False, indent=2) + u'\n'
    write('hot.json', hot_text)

    write('404.html', page(u'页面不存在', u"""    <h1 class="page-title">404 · 页面不存在</h1>
    <div class="post-body">
      <p>你要找的页面不在这里。可能是网址拼错了，或者这篇文章已经被删掉了。</p>
      <p><a href="/index.html">回到首页</a></p>
    </div>"""))

    write('robots.txt', ROBOTS)
    write('style.css', STYLE)

    # 清单：网页版没有目录列举能力，得先知道有哪些文件才能整个预取下来。
    # 由这里生成、由 tests/verify-website.py 校验，避免手改文件后清单对不上。
    # 下划线开头的文件是内部工具（含本脚本），不算靶场内容，两边都排除。
    files = sorted(f for f in os.listdir(HERE)
                   if not f.startswith('_') and not f.startswith('.')
                   and f not in ('README.md', 'manifest.json'))
    manifest = u'{\n  "note": "靶场文件清单，由 website/_generate.py 生成，勿手改",\n  "files": [\n' \
        + u',\n'.join(u'    "/%s"' % f for f in files) + u'\n  ]\n}\n'
    with open(os.path.join(HERE, 'manifest.json'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(manifest)
    print(u'  %-16s %5d 字节  （%d 个文件）' % ('manifest.json', len(manifest.encode('utf-8')), len(files)))

    allfiles = files + ['manifest.json']
    total = sum(os.path.getsize(os.path.join(HERE, f)) for f in allfiles)
    print(u'\n靶场共 %d 个文件，%.1f KB' % (len(allfiles), total / 1024.0))


if __name__ == '__main__':
    main()
