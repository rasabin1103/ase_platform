"""Renderiza tarjetas de texto animadas (HTML + Web Animations) a secuencias PNG."""
import asyncio, json, os, sys, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scenes
from playwright.async_api import async_playwright
import os
HERE = os.path.dirname(os.path.abspath(__file__))
O = os.environ.get('TRAILER_WORK', os.path.join(HERE, 'work'))
os.makedirs(O, exist_ok=True)
CHROMIUM = os.environ.get('CHROMIUM_PATH') or None
FPS=30
CSS = """
*{box-sizing:border-box}
html,body{margin:0;width:%(W)spx;height:%(H)spx;overflow:hidden;background:#04060b}
body{font-family:'Inter Display','Inter',sans-serif;color:#f4f7fb;display:flex;align-items:center;justify-content:center}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50%% 55%%, rgba(40,70,130,.28), transparent 62%%), #04060b}
.bg.red{background:radial-gradient(ellipse at 50%% 55%%, rgba(170,20,30,.32), transparent 62%%), #050304}
.bg.gold{background:radial-gradient(ellipse at 50%% 50%%, rgba(56,130,246,.30), transparent 60%%), #04060b}
.lines{position:absolute;inset:0;background:repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 4px)}
.wrap{position:relative;text-align:center;padding:0 %(PAD)spx}
.l{display:block;font-weight:900;text-transform:uppercase;letter-spacing:.04em;line-height:1.02;font-size:%(FS)spx;text-shadow:0 0 40px rgba(120,170,255,.25)}
.l.small{font-size:%(FS2)spx;font-weight:800;letter-spacing:.08em;color:#9fb3d1}
.acc{color:#38bdf8}.red .l .acc,.acc.r{color:#f43f5e}
.kicker{font-family:'Inter';font-weight:700;letter-spacing:.45em;text-transform:uppercase;color:#7dd3fc;font-size:%(KS)spx;margin-bottom:%(KM)spx}
.title{font-weight:900;text-transform:uppercase;font-size:%(TS)spx;line-height:.98;letter-spacing:.01em}
.sub{font-family:'Inter';font-weight:500;color:#a8b8d0;font-size:%(SS)spx;margin-top:%(KM)spx;letter-spacing:.02em}
.pill{display:inline-block;margin-top:%(PM)spx;padding:.55em 1.3em;border-radius:999px;background:#2563eb;color:#fff;font-family:'Inter';font-weight:800;font-size:%(SS)spx;box-shadow:0 0 60px rgba(37,99,235,.55)}
.url{font-family:'Inter';font-weight:600;color:#cbd5e1;font-size:%(SS)spx;margin-top:.6em;letter-spacing:.02em}
.sweep{position:absolute;inset:0;background:linear-gradient(100deg, transparent 40%%, rgba(255,255,255,.10) 50%%, transparent 60%%);mix-blend-mode:screen}
"""
def page(card, W, H):
    vert = H > W
    k = dict(W=W, H=H, PAD=70 if vert else 160, FS=118 if vert else 132, FS2=54 if vert else 50, KS=26 if vert else 28, KM=34,
             TS=132 if vert else 150, SS=40 if vert else 38, PM=60)
    kind = card['kind']
    bgc = card.get('bg', '')
    if kind == 'slam':
        lines = ''.join(f'<span class="l {c}">{t}</span>' for t, c in card['lines'])
        body = f'<div class="bg {bgc}"></div><div class="lines"></div><div class="wrap" id="w">{lines}</div>'
    elif kind == 'title':
        body = f'<div class="bg gold"></div><div class="lines"></div><div class="wrap" id="w"><div class="kicker">{card["kicker"]}</div><div class="title">{card["title"]}</div><div class="sub">{card["sub"]}</div></div><div class="sweep" id="s"></div>'
    elif kind == 'cta':
        body = f'<div class="bg gold"></div><div class="lines"></div><div class="wrap" id="w"><div class="kicker">Arce Sabín Ingeniería · ASE Academy</div><div class="title" style="font-size:{int(k["TS"]*.62)}px">{card["title"]}</div><div class="pill">La primera misión es gratis</div><div class="url">arcesabinengineering.com/academy</div></div>'
    return f'<html><head><meta charset="utf-8"><style>{CSS % k}</style></head><body>{body}</body></html>'

ANIM = """(d) => {
  const w = document.getElementById('w'); const ls = w.querySelectorAll('.l');
  const D = d*1000;
  if (ls.length) {
    ls.forEach((l,i) => {
      const s = i*140, dd = D - s, p = Math.min(0.9, 240/dd);
      l.animate([{opacity:0, transform:'scale(1.4)', filter:'blur(16px)'},
                 {opacity:1, transform:'scale(1.0)', filter:'blur(0px)', offset:p, easing:'linear'},
                 {opacity:1, transform:'scale(0.965)', filter:'blur(0px)'}],
                {duration:dd, delay:s, fill:'both', easing:'cubic-bezier(.2,.7,.2,1)'}).pause();
    });
    w.animate([{opacity:1},{opacity:1, offset:Math.max(0,(D-120)/D)},{opacity:0}], {duration:D, fill:'both'}).pause();
  } else {
    w.animate([{opacity:0, transform:'scale(1.08)', filter:'blur(10px)'},{opacity:1, transform:'scale(1.0)', filter:'blur(0px)', offset:0.15},{opacity:1, transform:'scale(0.985)'}], {duration:D, fill:'both'}).pause();
    const sw = document.getElementById('s');
    if (sw) sw.animate([{transform:'translateX(-100%)'},{transform:'translateX(-100%)', offset:0.2},{transform:'translateX(100%)', offset:0.6},{transform:'translateX(100%)'}], {duration:D, fill:'both'}).pause();
  }
}"""
async def render(cards, W, H, tag):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROMIUM)
        pg = await b.new_page(viewport={'width':W,'height':H})
        for cid, card in cards.items():
            d = f'{O}/cards/{tag}/{cid}'
            n = int(round(card['dur']*FPS))
            if os.path.isdir(d) and len(os.listdir(d)) == n and not os.environ.get('RECARDS'):
                continue
            os.makedirs(d, exist_ok=True)
            for f in os.listdir(d): os.remove(os.path.join(d, f))
            is_scene = card['kind'] in scenes.SCENES
            await pg.evaluate('window.__tick = null')
            await pg.set_content(scenes.page(card, W, H) if is_scene else page(card, W, H)); await pg.evaluate('document.fonts.ready')
            await pg.wait_for_timeout(150)
            if not is_scene:
                await pg.evaluate(ANIM, card['dur'])
            for i in range(n):
                await pg.evaluate("(t)=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=t}); if(window.__tick) window.__tick(t)}", i*1000/FPS)
                await pg.screenshot(path=f'{d}/{i:04d}.png')
            print(tag, cid, n)
        await b.close()

if __name__ == '__main__':
    spec = json.load(open(sys.argv[1]))
    for tag, (W, H) in {'h': (1920,1080), 'v': (1080,1920)}.items():
        asyncio.run(render(spec, W, H, f'{sys.argv[2]}_{tag}'))
