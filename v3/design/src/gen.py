# 生成静态视觉稿 HTML（无后端）。python3 gen.py 输出到 ../
import os, random
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SPK = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>'

def head(title, tab=None, streak=True):
    tabs = ''.join(f'<a class="{"on" if tab==k else ""}" href="#">{k}</a>' for k in ['今日','错词本','进度'])
    chip = '<span class="chip streak"><span class="flame"></span>连续 12 天</span>' if streak else ''
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><link rel="stylesheet" href="design.css"></head><body>
<header class="top"><div class="in"><div class="brand"><span class="logo">W</span>背单词</div><nav class="tabs">{tabs}</nav><div class="right">{chip}</div></div></header>'''

def bottom(tab):
    return '<nav class="bottombar">' + ''.join(f'<a class="{"on" if tab==k else ""}" href="#"><i></i>{k}</a>' for k in ['今日','错词本','进度']) + '</nav>'

def studyhead(title):
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><link rel="stylesheet" href="design.css"></head><body>'''

def studybar(done, total):
    return f'<div class="studybar"><button class="x" title="暂停（Esc）">×</button><div class="track"><span style="width:{done/total*100:.0f}%"></span></div><span class="small muted num">{done} / {total}</span></div>'

def calendar():
    cells = ''.join(f'<div class="dow">{d}</div>' for d in '一二三四五六日')
    cells += '<div class="d blank"></div>' * 3  # 2026-10-01 是周四
    for d in range(1, 32):
        cls = 'd'
        if d in (2, 3) or 5 <= d <= 16: cls += ' done'
        if d == 9: cls = 'd makeup'
        if d == 17: cls = 'd today'
        if d > 17: cls += ' future'
        cells += f'<div class="{cls}">{d}</div>'
    return f'''<div class="cal-head"><span class="big"><span class="flame"></span> 连续 12 天</span><span class="small muted">本月还可补签 1 次</span></div>
<div class="cal">{cells}</div>
<div class="legend"><span><i style="background:#F7D6AE;border:1px solid #F2C690"></i>完成</span><span><i style="background:repeating-linear-gradient(135deg,#FDF0E1 0 3px,#F8D9B6 3px 6px)"></i>补签</span><span><i style="outline:2px solid var(--primary);background:#fff"></i>今天</span></div>
<div class="badges"><div class="badge got"><b>7 天</b>已获得</div><div class="badge"><b>30 天</b>12 / 30<div class="mini"><span style="width:40%"></span></div></div><div class="badge"><b>100 天</b>12 / 100<div class="mini"><span style="width:12%"></span></div></div></div>'''

def progress_panel():
    return '''<section class="panel"><h2>课标进度</h2>
<div class="prog"><div class="row"><span><span class="tag core">核心词</span> 三级新增</span><span class="num"><b>46</b> / 1095 已掌握</span></div>
<div class="bar"><span class="m" style="flex:46"></span><span class="f" style="flex:38"></span><span class="l" style="flex:52"></span><span style="flex:959"></span></div></div>
<div class="prog"><div class="row"><span><span class="tag">二级词</span> 小学阶段</span><span class="num"><b>31</b> / 505 已掌握</span></div>
<div class="bar"><span class="m" style="flex:31"></span><span class="f" style="flex:12"></span><span class="l" style="flex:14"></span><span style="flex:448"></span></div></div>
<div class="keys"><span><i style="background:var(--ok)"></i>掌握</span><span><i style="background:#7DBE97"></i>熟悉</span><span><i style="background:#F1B85A"></i>学习中</span><span><i style="background:#ECE8DF"></i>还没学</span></div></section>'''

def write(name, html):
    with open(os.path.join(OUT, name), 'w') as f: f.write(html + '</body></html>\n')

# 1 首页
write('home.html', head('首页', '今日') + f'''<main class="page"><div class="grid"><div style="display:grid;gap:20px">
<section class="panel today"><div class="eyebrow">10月17日 · 周六</div>
<h1>今天：复习 <span style="color:var(--primary)">32</span> 个 · 新词 <span style="color:var(--primary)">10</span> 个 · 约 18 分钟</h1>
<p class="muted small" style="margin:0">刚学的词和答错的词，过几分钟会再出现</p>
<div class="actions"><button class="btn primary lg">开始复习</button><button class="btn lg">先学新词</button></div>
<div class="divider"></div>
<div class="small muted">和上周的自己比：本周多掌握 <b style="color:var(--ink)">14</b> 个 · 正确率 <b style="color:var(--ink)">86%</b>（上周 81%）</div></section>
{progress_panel()}
<section class="panel"><h2>错词本</h2><p style="margin:0 0 12px">错词本 24 个，其中 6 个本周已练对 2 次。</p><button class="btn">练这 10 个</button></section></div>
<div style="display:grid;gap:20px"><section class="panel"><h2>打卡</h2>{calendar()}</section></div>
</div></main>''' + bottom('今日'))

# 2 认词卡 正面
write('card-front.html', studyhead('认词卡 正面') + f'''<main class="study">{studybar(12,42)}
<article class="card"><div class="meta"><span class="tag">认词</span><span class="tag core">核心词</span></div>
<div class="word">would <button class="speak" title="听发音（空格）">{SPK}</button></div><div class="phon">/wud/</div>
<p class="think">先自己想想意思再翻面</p><button class="btn primary lg reveal">翻面</button></article>
<div class="hints"><span><kbd>空格</kbd>听发音</span><span><kbd>→</kbd>翻面</span><span><kbd>Esc</kbd>暂停</span><span><kbd>?</kbd>快捷键</span></div></main>''')

# 3 认词卡 背面（人工释义全显示）
write('card-back.html', studyhead('认词卡 背面') + f'''<main class="study">{studybar(13,42)}
<article class="card"><div class="meta"><span class="tag">认词</span><span class="tag">二级词</span><span class="repeat">刚才这个再来一次</span></div>
<div class="word">well <button class="speak">{SPK}</button></div><div class="phon">/wel/</div>
<div class="divider"></div>
<div class="meaning"><div class="sense"><span class="pos">adv.</span>好；很好地</div><div class="sense"><span class="pos">adj.</span>健康的</div><div class="sense"><span class="pos">interj.</span>嗯，好吧</div><div class="sense"><span class="pos">n.</span>井</div></div>
<div class="rates"><button class="rate r1">忘了<small>1</small></button><button class="rate r2">模糊<small>2</small></button><button class="rate r3">认识<small>3</small></button><button class="rate r4">很熟<small>4</small></button></div></article>
<div class="hints"><span><kbd>1</kbd>–<kbd>4</kbd>自评</span><span><kbd>空格</kbd>听发音</span><span><kbd>Esc</kbd>暂停</span></div></main>''')

# 3b 手机背面：ECDICT 折叠
write('card-back-ecdict.html', studyhead('认词卡 背面 ECDICT') + f'''<main class="study">{studybar(14,42)}
<article class="card"><div class="meta"><span class="tag">认词</span><span class="tag">二级词</span></div>
<div class="word">weather <button class="speak">{SPK}</button></div><div class="phon">/'weðә/</div>
<div class="divider"></div>
<div class="meaning"><div class="sense"><span class="pos">n.</span>天气, 气象, 处境</div><div class="sense"><span class="pos">adj.</span>迎风的</div><button class="link">更多释义（2）</button></div>
<div class="rates"><button class="rate r1">忘了<small>1</small></button><button class="rate r2">模糊<small>2</small></button><button class="rate r3">认识<small>3</small></button><button class="rate r4">很熟<small>4</small></button></div></article></main>''')

# 4 听音选义（未作答）
heights = [10,18,26,14,22,30,16,24,12,20,28,14,8]
wave = ''.join(f'<i style="height:{h}px"></i>' for h in heights)
write('q-listen.html', studyhead('听音选义') + f'''<main class="study">{studybar(18,42)}
<article class="card"><div class="meta"><span class="tag">听音选义</span><span class="tag core">核心词</span></div>
<div class="listen"><button class="play" title="重听（R）">{SPK}</button><div><div class="wave">{wave}</div><div class="small muted">戴上耳机 · 按 R 重听（不限次数）</div></div></div>
<div class="prompt"><div class="q">听到的是哪个意思？</div></div>
<div class="opts"><button class="opt"><span class="k">A</span>adv. 总是, 一直</button><button class="opt"><span class="k">B</span>adv. 已经, 早已</button><button class="opt"><span class="k">C</span>adv. 也, 还</button><button class="opt"><span class="k">D</span>adv. 几乎, 差不多</button></div>
<p class="small muted" style="margin:14px 0 0">没听到声音？检查耳机或音量。</p></article>
<div class="hints"><span><kbd>1</kbd>–<kbd>4</kbd>选项</span><span><kbd>R</kbd>重听</span><span><kbd>Esc</kbd>暂停</span></div></main>''')

# 5 看义选词 答对
write('q-meaning-correct.html', studyhead('看义选词 答对') + f'''<main class="study">{studybar(21,42)}
<article class="card"><div class="meta"><span class="tag">看义选词</span><span class="tag core">核心词</span></div>
<div class="prompt"><div class="q">哪个词是这个意思？</div><div class="meaning"><div class="sense" style="font-size:22px"><span class="pos">v.</span>决定, 判决</div></div></div>
<div class="opts"><button class="opt en right"><span class="k">A</span>decide<span class="mark">✓</span></button><button class="opt en dim"><span class="k">B</span>divide</button><button class="opt en dim"><span class="k">C</span>describe</button><button class="opt en dim"><span class="k">D</span>design</button></div>
<div class="fb ok"><div><div class="t">正确 ✓</div><div class="d"><i>decide</i> /di'said/ 决定</div></div></div>
<div class="after"><button class="speak">{SPK}</button><button class="btn primary">下一个（Enter）</button></div></article></main>''')

# 6 看义选词 答错
write('q-meaning-wrong.html', studyhead('看义选词 答错') + f'''<main class="study">{studybar(22,42)}
<article class="card"><div class="meta"><span class="tag">看义选词</span><span class="tag core">核心词</span></div>
<div class="prompt"><div class="q">哪个词是这个意思？</div><div class="meaning"><div class="sense" style="font-size:22px"><span class="pos">conj.</span>是否, 不论</div><div class="sense"><span class="pos">pron.</span>两个中的哪一个</div></div></div>
<div class="opts"><button class="opt en wrong"><span class="k">A</span>weather<span class="mark">你选的</span></button><button class="opt en right"><span class="k">B</span>whether<span class="mark">✓</span></button><button class="opt en dim"><span class="k">C</span>together</button><button class="opt en dim"><span class="k">D</span>rather</button></div>
<div class="fb bad"><div><div class="t">应为 B：<i style="font-family:var(--font-word)">whether</i> 是否。已加入错词本。</div><div class="d small" style="margin-top:4px">你选的 weather：n. 天气, 气象</div></div></div>
<div class="after"><button class="speak">{SPK}</button><button class="btn primary">下一个（Enter）</button></div></article></main>''')

# 7 拼写卡（答错，字母级对比）
write('spell.html', studyhead('拼写卡') + f'''<main class="study">{studybar(27,42)}
<article class="card"><div class="meta"><span class="tag">拼写</span><span class="tag core">核心词</span></div>
<div class="prompt"><div class="q">看意思，拼出单词</div><div class="meaning"><div class="sense"><span class="pos">vt.</span>收到, 接到, 得到, 接待, 迎接, 承受</div><div class="sense"><span class="pos">vi.</span>收到, 会客</div></div><div class="phon" style="margin-top:6px">/ri'si:v/</div></div>
<div class="spellbox"><input class="input" value="recieve" disabled></div>
<div class="fb bad"><div><div class="t">差一点</div><div class="diff" style="margin-top:4px"><span class="lbl">你写的</span> rec<span class="x">ie</span>ve　→　rec<span class="y">ei</span>ve</div><div class="d small">已加入错词本。</div></div></div>
<div class="after"><span class="small muted"><kbd>Tab</kbd>提示首字母 · <kbd>Enter</kbd>提交</span><button class="btn primary">下一个（Enter）</button></div></article></main>''')

# 8 错词本
rows = [('environment',"/in'vairәnmәnt/",'n. 环境, 外界',4,['拼写 ×3','认词 ×1'],1,'今天'),
        ('necessary',"/'nesisәri/",'adj. 必要的；必然的',3,['听写 ×2','看义选词 ×1'],0,'今天'),
        ('receive',"/ri'si:v/",'vt. 收到, 接到, 得到',3,['拼写 ×3'],2,'昨天'),
        ('whether',"/'hweðә/",'conj. 是否, 不论',2,['看义选词 ×2'],1,'今天'),
        ('weather',"/'weðә/",'n. 天气, 气象',2,['听音选义 ×1','拼写 ×1'],2,'2 天前'),
        ('different',"/'difәrәnt/",'adj. 不同的',2,['拼写 ×2'],0,'昨天'),
        ('together',"/tә'geðә/",'adv. 一起, 共同',1,['听写 ×1'],2,'3 天前'),
        ('arrive',"/ә'raiv/",'vi. 到达, 抵达',1,['认词 ×1'],1,'4 天前')]
items = ''.join(f'''<div class="witem"><div class="w">{w}<small>{p}</small></div><div class="m"><div>{m}</div><div class="qt">{''.join(f"<span>{q}</span>" for q in qs)}</div></div>
<div class="dots">{''.join('<i class="on"></i>' if i<d else '<i></i>' for i in range(3))}<span style="margin-left:4px">{d}/3 天</span></div><div class="count">{c} 次<small>{t}</small></div></div>''' for w,p,m,c,qs,d,t in rows)
write('wrong.html', head('错词本', '错词本') + f'''<main class="page"><div class="headrow"><div><h1>错词本 24 个</h1><p class="muted" style="margin:6px 0 0">其中 6 个本周已练对 2 次。连续 3 天答对会自动移出。</p></div>
<div style="display:flex;gap:10px;align-items:center"><div class="seg"><a class="on" href="#">按错的次数</a><a href="#">最近错的</a></div><button class="btn primary">练这 10 个</button></div></div>
<div class="wlist">{items}</div><p class="small muted" style="text-align:center;margin-top:14px">练错词会优先出你错过的题型。同一个词一天里只有第一次练习计入复习安排。</p></main>''' + bottom('错词本'))

# 9 空状态：错词本空
write('empty.html', head('错词本 空', '错词本') + '''<main class="page"><div class="headrow"><div><h1>错词本 0 个</h1></div></div>
<section class="panel empty"><svg viewBox="0 0 120 96" fill="none"><rect x="14" y="14" width="44" height="66" rx="6" fill="#E9ECFB"/><rect x="62" y="14" width="44" height="66" rx="6" fill="#E9ECFB"/><path d="M60 18v62" stroke="#C9D0F3" stroke-width="2"/><path d="M24 32h26M24 42h20M72 32h24M72 42h18" stroke="#C9D0F3" stroke-width="3" stroke-linecap="round"/><circle cx="92" cy="68" r="16" fill="#1E7A4C"/><path d="M85 68l5 5 9-10" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
<h2>错词本是空的</h2><p>答错或点了「忘了」的词会自动放进来，连续 3 天答对就会移出。</p>
<div class="actions" style="justify-content:center"><button class="btn">回到今日</button></div></section></main>''' + bottom('错词本'))

# 10 今日完成
write('done.html', head('完成', '今日') + f'''<main class="page" style="max-width:640px"><section class="panel empty" style="padding:44px 28px">
<svg viewBox="0 0 120 96" fill="none"><circle cx="60" cy="48" r="38" fill="#FDF0E1"/><circle cx="60" cy="48" r="26" fill="#E58A2E"/><path d="M48 48l8 8 16-17" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
<h2>今天的任务完成了，已打卡</h2><p>今天完成 42 题，正确率 86%，新掌握 7 个词。明天要复习 28 个。</p>
<div class="badges" style="max-width:360px;margin:20px auto 0"><div class="badge got"><b>13 天</b>连续打卡</div><div class="badge"><b>30 天</b>还差 17 天</div></div>
<div class="actions" style="justify-content:center"><button class="btn primary">回首页</button><button class="btn">再练错词</button></div></section></main>''' + bottom('今日'))

# 11 家长看板
random.seed(7)
cols = ''
days = []
for i in range(30):
    if i in (3, 6, 11, 13, 16, 21): n = r = 0
    else: n = random.choice([8,10,10,10,6,10]); r = random.randint(14,42)
    if i == 29: n, r = 4, 9
    days.append((n, r))
mx = 55
for n, r in days:
    if n + r == 0: cols += '<div class="col zero"></div>'
    else: cols += f'<div class="col"><i class="n" style="height:{n/mx*100:.1f}%"></i><i class="r" style="height:{r/mx*100:.1f}%"></i></div>'
acc = [random.randint(76, 92) for _ in range(30)]
pts = ' '.join(f'{i*10+5},{46-(a-70)*1.6:.1f}' for i, a in enumerate(acc))
top = [('environment',4,'拼写'),('necessary',3,'听写'),('receive',3,'拼写'),('whether',2,'看义选词'),('weather',2,'听音选义'),('different',2,'拼写'),('beautiful',2,'拼写'),('February',2,'拼写'),('Wednesday',2,'听写'),('believe',2,'拼写'),
       ('together',1,'听写'),('arrive',1,'认词'),('important',1,'看义选词'),('already',1,'听音选义'),('because',1,'拼写'),('library',1,'拼写'),('friend',1,'拼写'),('quiet',1,'看义选词'),('quite',1,'看义选词'),('through',1,'听写')]
trs = ''.join(f'<tr><td class="small muted">{i+1}</td><td class="w">{w}</td><td class="num">{c}</td><td class="small muted">{q}</td></tr>' for i,(w,c,q) in enumerate(top))
write('parent.html', '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>学习看板</title><link rel="stylesheet" href="design.css"></head><body>
<header class="ptop"><div class="in"><div class="brand"><span class="logo">W</span>学习看板</div><span class="chip">家长 · 只读</span><span class="small muted" style="margin-left:auto">数据截至 10月17日 12:58（上海时间）</span></div></header>''' + f'''<main class="page">
<p style="margin:0 0 16px;font-size:16px">本周学习 6 天，共 96 分钟，新掌握 41 词。最常错的：<i style="font-family:var(--font-word)">environment</i>、<i style="font-family:var(--font-word)">necessary</i>。</p>
<div class="kpis"><div class="kpi"><b>24<span style="font-size:15px;color:var(--ink-2)"> / 30 天</span></b><span>近 30 天学习天数</span></div><div class="kpi"><b>12 天</b><span>连续打卡（含补签 1 次）</span></div><div class="kpi"><b>6 小时 12 分</b><span>近 30 天用时 · 日均 16 分</span></div><div class="kpi"><b>84%</b><span>近 30 天正确率</span></div></div>
<section class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline"><h2>近 30 天每天学习量</h2><div class="keys" style="margin:0"><span><i style="background:var(--primary)"></i>新词</span><span><i style="background:#A9B4EC"></i>复习</span></div></div>
<div class="chart">{cols}</div><div class="xaxis"><span>9月18日</span><span>9月25日</span><span>10月2日</span><span>10月9日</span><span>10月17日</span></div>
<h2 style="margin-top:18px">每天正确率</h2><svg class="acc" viewBox="0 0 300 46" preserveAspectRatio="none" width="100%"><polyline points="{pts}" fill="none" stroke="var(--ok)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></section>
<div class="two"><section class="panel"><h2>错得最多的 20 个词</h2><table class="top20"><tr><th>#</th><th>单词</th><th>错的次数</th><th>主要错在</th></tr>{trs}</table></section>
<div style="display:grid;gap:20px;align-content:start">{progress_panel()}
<section class="panel"><h2>说明</h2><p class="small muted" style="margin:0">数字都来自孩子的学习记录。用时按每题作答时间累加，单题超过 5 分钟按 5 分钟算。这一页只读，不会改动任何学习数据。</p></section></div></div>
<p class="foot">孩子的导航里没有这个入口，地址是 /parent。</p></main>''')
print('ok')

# ===== 第二期：讲解区 =====
def blk(title, preview, body, open_=False, foot=True, extra=''):
    o = ' open' if open_ else ''
    f = '<div class="foot">' + extra + '<button class="report">这条有问题</button></div>' if foot else ''
    return f'<details class="blk"{o}><summary><span class="ttl">{title}</span><span class="pv">{preview}</span><span class="chev">▾</span></summary><div class="body">{body}{f}</div></details>'

def explain_head():
    return '<div class="ex-head"><h3>讲解</h3><span class="ai">AI 生成 · 可能有误</span><div class="tools"><button class="link">全部展开</button></div></div>'

RATES = '<div class="rates{s}"><button class="rate r1">忘了<small>1</small></button><button class="rate r2">模糊<small>2</small></button><button class="rate r3">认识<small>3</small></button><button class="rate r4">很熟<small>4</small></button></div>'

# receive：默认状态（例句、搭配展开，其余折叠）
rx = explain_head()
rx += blk('例句', '', '<ul class="exs"><li><div class="en">I <b>received</b> a letter from my pen pal in England last week.</div><div class="zh">上周我收到了英国笔友的来信。</div></li><li><div class="en">Did you <b>receive</b> my email about the school trip?</div><div class="zh">你收到我关于学校郊游的那封邮件了吗？</div></li></ul>', True)
rx += blk('常见搭配', '', '<div class="colls"><div class="coll"><span class="en">receive a letter from sb.</span><span class="zh">收到某人的来信</span></div><div class="coll"><span class="en">receive a gift</span><span class="zh">收到礼物</span></div><div class="coll"><span class="en">receive a warm welcome</span><span class="zh">受到热烈欢迎</span></div></div>', True)
rx += blk('易混词', 'receive 收到 / accept 接受', '')
rx += blk('近义 · 反义', '近义 get · 反义 send、give', '')
rx += blk('发音', 're·CEIVE，两个音节，重音在后', '')
rx += blk('记忆', '<span style="color:var(--primary);font-weight:600">词源</span> re- + capere「拿」 · <span style="color:var(--warn);font-weight:600">联想</span> c 后写 ei', '')
write('card-back-explain.html', studyhead('认词卡 背面 + 讲解') + f'''<main class="study">{studybar(15,42)}
<article class="card"><div class="meta"><span class="tag">认词</span><span class="tag core">核心词</span></div>
<div class="word">receive <button class="speak">{SPK}</button></div><div class="phon">/ri'si:v/</div>
<div class="divider"></div>
<div class="meaning"><div class="sense"><span class="pos">vt.</span>收到, 接到, 得到, 接待, 迎接, 承受</div><div class="sense"><span class="pos">vi.</span>收到, 会客</div></div>
<section class="explain">{rx}</section>
{RATES.format(s=' sticky')}</article>
<div class="hints"><span><kbd>1</kbd>–<kbd>4</kbd>自评</span><span><kbd>E</kbd>展开/收起讲解</span><span><kbd>空格</kbd>听发音</span></div></main>''')

# whether：手机，易混词和记忆已展开；没有反义词，所以「近义 · 反义」只显示近义；没有可靠的词根拆分以外的内容就不显示
wx = explain_head()
wx += blk('例句', '', '<ul class="exs"><li><div class="en">I don\'t know <b>whether</b> he will come tomorrow.</div><div class="zh">我不知道他明天是否会来。</div></li><li><div class="en">We are talking about <b>whether</b> we should go camping this weekend.</div><div class="zh">我们正在讨论这个周末是否应该去露营。</div></li></ul>', True)
wx += blk('常见搭配', '', '<div class="colls"><div class="coll"><span class="en">whether … or not</span><span class="zh">是否……</span></div><div class="coll"><span class="en">whether to do sth.</span><span class="zh">是否做某事</span></div></div>', True)
wx += blk('易混词', '', '<div style="font-size:14px"><p style="margin:0 0 6px"><b style="font-family:var(--font-word)">whether</b> 和 <b style="font-family:var(--font-word)">if</b> 都能表示“是否”，引导宾语从句时一般可以互换。下面几种情况<b>只能用 whether</b>：</p><ul style="margin:0;padding-left:18px"><li>后面紧跟 or not：whether or not</li><li>放在介词后：talk about whether …</li><li>后面接不定式：whether to go</li></ul><p style="margin:6px 0 0"><b style="font-family:var(--font-word)">weather</b> 是“天气”，读音和 whether 一样，拼写不同。</p></div>', True)
wx += blk('近义', 'if 是否（已学）', '<div class="wchips"><span class="wchip"><span class="en">if</span><span class="zh">是否（宾语从句中）</span><span class="st">已学</span></span></div>')
wx += blk('发音', '', '<div class="pron"><div class="syl"><span class="stress">wheth</span>·er　<span class="phon" style="font:16px var(--font-ui)">/\'hweðә/</span></div><ul><li>两个音节，重音在第一个音节。</li><li>wh 现在多数人读 /w/；音标里的 /hw/ 是另一种口音，两种都对；th 是 /ð/，舌尖放在上下齿之间，不要读成 /z/ 或 /d/。</li><li>和 weather 读音相同，听力里要靠上下文区分。</li></ul></div>', True)
wx += blk('记忆', '', '''<div class="mn ety"><span class="k">词源</span><div>来自古英语 <i>hwæðer</i>，意思是“两个中的哪一个”。开头的 wh- 和 <b>who、what、which</b> 来自同一个疑问词根，所以它本来就是在两者之间“问一问”，后来变成“是否”。</div><div class="src">同根词：who · what · which（都是课标词）</div></div>
<div class="mn assoc"><span class="k">联想 · 帮助记忆，不是词源</span><div>w<b>eat</b>her（天气）里藏着 eat：天气好，才出门去吃东西。表示“是否”的 whether 里没有 eat。</div></div>''', True)
write('card-back-explain-m.html', studyhead('认词卡 背面 + 讲解（手机）') + f'''<main class="study">{studybar(22,42)}
<article class="card" style="min-height:0"><div class="meta"><span class="tag">认词</span><span class="tag core">核心词</span></div>
<div class="word">whether <button class="speak">{SPK}</button></div><div class="phon">/'hweðә/</div>
<div class="divider"></div>
<div class="meaning"><div class="sense"><span class="pos">conj.</span>是否, 不论</div><div class="sense"><span class="pos">pron.</span>两个中的哪一个</div></div>
<section class="explain">{wx}</section>
{RATES.format(s=' sticky')}</article></main>''')

# 讲解还在准备
write('explain-pending.html', studyhead('讲解还在准备') + f'''<main class="study">{studybar(9,42)}
<article class="card"><div class="meta"><span class="tag">认词</span><span class="tag core">核心词</span></div>
<div class="word">already <button class="speak">{SPK}</button></div><div class="phon">/ɒ:l'redi/</div>
<div class="divider"></div>
<div class="meaning"><div class="sense"><span class="pos">adv.</span>已经, 早已</div></div>
<section class="explain"><div class="ex-head"><h3>讲解</h3></div><div class="pending"><b>讲解还在准备</b>这个词的例句还没生成，先看释义和发音。</div></section>
{RATES.format(s='')}</article></main>''')
print('explain ok')
