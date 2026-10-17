# 第二期查词 / 词表视觉稿（工程负责人 2026-10-17）。python3 gen_p2.py 输出到 ../p2-*.html
# 词头、音标、释义、COCA 位次取自 qa.db（kb2022）；中考高频的分数和依据是示意数据。
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SPK = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>'
TABS = ['今日', '错词本', '词表', '进度']

def doc(title):
    return f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><link rel="stylesheet" href="design.css"></head><body>'

def head(tab=None, q='', focus=False, dropdown='', searching=False):
    tabs = ''.join(f'<a class="{"on" if tab==k else ""}" href="#">{k}</a>' for k in TABS)
    val = f' value="{q}"' if q else ''
    kbd = '' if q else '<span class="kbd"><kbd>/</kbd></span>'
    return f'''<header class="top{' searching' if searching else ''}"><div class="in"><div class="brand"><span class="logo">W</span>背单词</div><nav class="tabs">{tabs}</nav>
<div class="search"><span class="ico"></span><input class="{'focus' if focus else ''}" placeholder="查单词，英文或中文"{val}>{kbd}{dropdown}</div><a class="cancel" href="#">取消</a>
<div class="right"><button class="mbtn" aria-label="查单词"><span class="ico"></span></button><span class="chip streak"><span class="flame"></span>连续 12 天</span></div></div></header>'''

def bottom(tab):
    return '<nav class="bottombar">' + ''.join(f'<a class="{"on" if tab==k else ""}" href="#"><i></i>{k}</a>' for k in TABS) + '</nav>'

def write(name, html):
    with open(os.path.join(OUT, name), 'w') as f: f.write(html + '</body></html>\n')

ST = {'new': '新词', 'learning': '学习中', 'familiar': '熟悉', 'mastered': '掌握'}
def st(s): return f'<span class="st {s}">{ST[s]}</span>'
def lv(l): return '<span class="tag core">核心词</span>' if l == '三级' else '<span class="tag">二级词</span>'

def row(w, p, m, l, s, sel=False, note='', wb=False):
    side = lv(l) + st(s) + ('<span class="wb">错词本</span>' if wb else '')
    return f'<div class="sr-row{" sel" if sel else ""}"><div class="w">{w}<small>{p}</small></div><div></div><div class="side">{side}</div><div class="m">{note}{m}</div></div>'

FT = '<div class="ft"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span><kbd>Esc</kbd> 关闭</span></div>'
EN = [('<mark>go</mark>', "/gou/", 'vi. 去, 走, 达到, 运转, 消失, 结束', '二级', 'mastered', True),
      ('<mark>go</mark>al', "/gәul/", 'n. 目标, 终点, 得分, 球门, 守门员', '三级', 'learning', False),
      ('<mark>go</mark>ld', "/gәuld/", 'n. 黄金, 钱财, 金块, 金色, 宝贵', '三级', 'new', False),
      ('<mark>go</mark>od', "/gud/", 'adj. 好的, 优良的, 上等的, 愉快的', '二级', 'familiar', False)]
def en_dd(cls=''):
    return f'<div class="sr {cls}"><div class="hd">英文 · 4 个结果</div>' + ''.join(row(*r[:5], sel=r[5]) for r in EN) + FT + '</div>'
INF = '<div class="sr {c}"><div class="hd">词形 · 1 个结果</div>' + row('go', '/gou/', 'vi. 去, 走, 达到, 运转, 消失, 结束', '二级', 'mastered', True, '<span class="form-note">went 是 go 的过去式</span>') + FT + '</div>'
ZH = '<div class="sr {c}"><div class="hd">中文 · 2 个结果</div>' + row('receive', "/ri'si:v/", 'vt. <mark>收到</mark>, 接到, 得到, 接待, 迎接, 承受', '三级', 'familiar', True, wb=True) + row('collect', "/kә'lekt/", 'adj. 由<mark>收到</mark>者付款的 <span class="small" style="color:var(--ink-3)">（第 2 行释义）</span>', '三级', 'new') + FT + '</div>'
EMPTY = '<div class="sr {c}"><div class="sr-empty"><b>没找到这个词。</b><span class="muted">课标词表里没有，或者换个拼法试试。</span><ul><li>英文、中文都能查，比如 receive、收到</li><li>过去式、复数这些变化形式也能查，比如 went、children</li></ul></div></div>'

def home_bg():
    return '''<main class="page"><div class="grid"><div style="display:grid;gap:20px"><section class="panel today"><div class="eyebrow">10月17日 · 周六</div>
<h1>今天：复习 <span style="color:var(--primary)">32</span> 个 · 新词 <span style="color:var(--primary)">10</span> 个 · 约 18 分钟</h1><p class="muted small" style="margin:0">刚学的词和答错的词，过几分钟会再出现</p>
<div class="actions"><button class="btn primary lg">开始复习</button><button class="btn lg">先学新词</button></div></section>
<section class="panel"><h2>错词本</h2><p style="margin:0 0 12px">错词本 24 个，其中 6 个本周已练对 2 次。</p><button class="btn">练这 10 个</button></section></div>
<section class="panel"><h2>打卡</h2><p class="muted small" style="margin:0">（首页其余部分同第一期稿）</p></section></div></main>'''

# 1 搜索：英文、词形、中文、没找到（桌面盖在首页上；手机搜索态整屏列表）
for name, q, dd in [('search-en', 'go', en_dd()), ('search-inflect', 'went', INF.format(c='')), ('search-zh', '收到', ZH.format(c='')), ('search-empty', 'xylophon', EMPTY.format(c=''))]:
    write(f'p2-{name}.html', doc('查词') + head('今日', q, True, dd) + home_bg() + bottom('今日'))
for name, q, dd in [('search-en', 'go', en_dd('sheet')), ('search-inflect', 'went', INF.format(c='sheet')), ('search-empty', 'xylophon', EMPTY.format(c='sheet'))]:
    write(f'p2-{name}-m.html', doc('查词（手机）') + head('今日', q, True, '', True) + f'<main class="page">{dd}</main>')

# 2 单词详情：receive，学习中、在错词本里，讲解区全部折叠
def blk(title, preview):
    return f'<details class="blk"><summary><span class="ttl">{title}</span><span class="pv">{preview}</span><span class="chev">▾</span></summary></details>'
EXPL = ('<section class="explain"><div class="ex-head"><h3>讲解</h3><span class="ai">AI 生成 · 可能有误</span><div class="tools"><button class="link">全部展开</button></div></div>'
        + blk('例句', 'I received a letter from my pen pal in England last week.')
        + blk('常见搭配', 'receive a letter from sb. · receive a gift · receive a warm welcome')
        + blk('易混词', 'receive 收到 / accept 接受')
        + blk('近义 · 反义', '近义 get · 反义 send、give')
        + blk('发音', 're·CEIVE，两个音节，重音在后')
        + blk('记忆', '<span style="color:var(--primary);font-weight:600">词源</span> re- + capere「拿」 · <span style="color:var(--warn);font-weight:600">联想</span> c 后写 ei') + '</section>')
def word_page(inbook=True):
    wb = ('''<section class="panel wbbox"><h2>错词本</h2><p><span class="wb">在错词本里</span> 错过 3 次 · 最近一次：昨天</p>
<p class="small muted"><span class="dots3"><i class="on"></i><i></i><i></i></span>1/3 天 · 再有 2 个不同的日子答对，就会自动移出</p><button class="btn">移出错词本</button></section>''' if inbook else
          '''<section class="panel wbbox"><h2>错词本</h2><p class="muted">不在错词本里。</p><button class="btn">加入错词本</button><p class="small muted" style="margin:10px 0 0">加入后会出现在“练错词”里；查词本身不算学习，不会改复习安排。</p></section>''')
    return f'''<main class="page"><a class="back" href="#">← 返回</a><div class="wdetail"><section class="panel wd-main card" style="max-width:none;margin:0">
<div class="meta"><span class="tag core">核心词</span>{st('familiar')}{'<span class="wb">错词本</span>' if inbook else ''}</div>
<div class="word">receive <button class="speak" title="听发音">{SPK}</button></div><div class="phon">/ri'si:v/</div><div class="divider"></div>
<div class="meaning"><div class="sense"><span class="pos">vt.</span>收到, 接到, 得到, 接待, 迎接, 承受</div><div class="sense"><span class="pos">vi.</span>收到, 会客</div></div>{EXPL}</section>
<div class="wd-side"><section class="panel"><h2>学习状态</h2><p style="margin:0 0 12px">{st('familiar')} 认词卡下次复习：10月19日</p>
<div class="cards3"><div class="c"><span>认词</span><span>熟悉 · 10月19日</span></div><div class="c"><span>拼写</span><span>学习中 · 10月18日</span></div><div class="c"><span>听写</span><span>学习中 · 明天</span></div></div></section>{wb}</div></div></main>'''
write('p2-word.html', doc('单词详情') + head('今日') + word_page(True) + bottom('今日'))
write('p2-word-m.html', doc('单词详情（手机）') + head('今日') + word_page(False) + bottom('今日'))

# 3 词表：中考高频（推断）/ 日常高频（COCA）
ZK = [('because', '/bi\'kɒ:z/', 'conj. 因为', '二级', 'mastered', '表示原因的基础连词，阅读和书面表达里很常用', False),
      ('important', '/im\'pɒ:tәnt/', 'adj. 重要的', '三级', 'familiar', '书面表达和阅读观点句常用的形容词', False),
      ('different', "/'difәrәnt/", 'adj. 不同的', '三级', 'familiar', '比较类话题的基础形容词，完形里常见', True),
      ('always', "/'ɒ:lweiz/", 'adv. 总是, 始终', '二级', 'mastered', '频度副词，听力和对话题常见', False),
      ('answer', "/'ɑ:nsә/", 'n. 答案, 回答', '二级', 'familiar', '题目指令和对话里的基础词', False),
      ('arrive', "/ә'raiv/", 'vi. 到达, 抵达', '三级', 'learning', 'arrive in / at 的搭配是语法常见考点', False),
      ('environment', "/in'vairәnmәnt/", 'n. 环境, 外界', '三级', 'learning', '环境保护是中考常见话题', True),
      ('already', "/ɒ:l'redi/", 'adv. 已经, 早已', '三级', 'new', '现在完成时的标志词，语法题常见', False),
      ('accept', "/әk'sept/", 'vt. 接受, 承认, 同意', '三级', 'new', '邀请类书信和对话里常用', False),
      ('afternoon', "/'ɑ:ftә'nu:n/", 'n. 午后, 下午', '二级', 'mastered', '时间表达的基础词，听力常见', False)]
def zk_list(n):
    out = ''
    for i, (w, p, m, l, s, b, inb) in enumerate(ZK[:n]):
        out += f'''<div class="brow"><div class="rk">{i+1}<span class="infer">推断</span></div><div class="w">{w}<small>{p}</small></div>
<div class="m">{m}<div class="basis">依据：{b}（模型推断，非真题统计）</div></div><div class="tags">{lv(l)}{st(s)}{'<span class="wb">错词本</span>' if inb else ''}</div></div>'''
    return out
E = [('even', "/'i:vәn/", 'adj. 平坦的, 相等的', '三级', 'familiar', 107), ('every', "/'evri/", 'adj. 每一, 所有的', '二级', 'mastered', 172),
     ('each', '/i:tʃ/', 'adj. 每个；各自的', '三级', 'familiar', 192), ('eye', '/ai/', 'n. 眼睛, 视力', '二级', 'mastered', 242),
     ('end', '/end/', 'n. 结束, 终点, 目标', '三级', 'learning', 278), ('ever', "/'evә/", 'adv. 曾经, 究竟, 永远', '三级', 'learning', 280),
     ('early', "/'ә:li/", 'adj. 早的', '二级', 'mastered', 365), ('enough', "/i'nʌf/", 'adj. 足够的', '三级', 'new', 374)]
def daily_list():
    out = ''.join(f'''<div class="brow"><div class="rk">{i+1}</div><div class="w">{w}<small>{p}</small></div><div class="m">{m}<div class="basis">依据：COCA 词频第 {f} 位（ECDICT frq）</div></div><div class="tags">{lv(l)}{st(s)}</div></div>''' for i, (w, p, m, l, s, f) in enumerate(E))
    out += '<div class="brow gap">··· 中间还有 54 个 ···</div>'
    out += f'''<div class="brow"><div class="rk">63<span class="infer">推断</span></div><div class="w">email<small>/'i:'meil/</small></div><div class="m">n. 电子信函<div class="basis">依据：词频库无数据，排在最后（推断）</div></div><div class="tags">{lv('二级')}{st('new')}</div></div>'''
    return out
LET = lambda on: '<div class="letters"><a class="' + ('on' if on == '全部' else '') + '" href="#">全部</a>' + ''.join(f'<a class="{"on" if on==c else ""}" href="#">{c}</a>' for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') + '</div>'
def filters(level='全部', status='全部'):
    p = lambda opts, on: '<span class="pills">' + ''.join(f'<a class="{"on" if o==on else ""}" href="#">{o}</a>' for o in opts) + '</span>'
    return f'<div class="filters"><div><span class="lbl">级别</span>{p(["全部","核心词","二级词"], level)}</div><div><span class="lbl">学习状态</span>{p(["全部","新词","学习中","熟悉","掌握"], status)}</div></div>'
def browse(group, n=10):
    seg = f'<div class="seg lg"><a class="{"on" if group=="zk" else ""}" href="#">中考高频</a><a class="{"on" if group=="daily" else ""}" href="#">日常高频</a></div>'
    if group == 'zk':
        note = '<p class="note infer-note"><b>「推断」</b><span>中考高频排序是根据词义和用法推断的，不是真题统计。每个词的依据写在释义下面。</span></p>'
        body = filters() + LET('全部') + '<div class="listhead"><span>共 1600 个 · 按中考常见程度（推断）排序</span><span>1–' + str(n) + '</span></div><div class="blist">' + zk_list(n) + '</div><button class="btn more">加载更多</button>'
    else:
        note = '<p class="small muted" style="margin:12px 0 0">按 COCA（美国当代英语语料库）词频排序，数据来自 ECDICT。词频库里没有的词排在最后，标「推断」。</p>'
        body = filters() + LET('E') + '<div class="listhead"><span>首字母 E · 63 个 · 按日常使用频率排序</span><span></span></div><div class="blist">' + daily_list() + '</div>'
    return f'<main class="page"><h1 style="margin:0 0 14px;font-size:24px">词表</h1>{seg}{note}{body}</main>'
write('p2-browse-zk.html', doc('词表 中考高频') + head('词表') + browse('zk') + bottom('词表'))
write('p2-browse-zk-m.html', doc('词表 中考高频（手机）') + head('词表') + browse('zk', 6) + bottom('词表'))
write('p2-browse-daily.html', doc('词表 日常高频') + head('词表') + browse('daily') + bottom('词表'))
print('p2 ok')
