"""Planos de la web pública (sin sesión) para el vídeo de presentación de la plataforma."""
import asyncio, json, time, sys, os
from playwright.async_api import async_playwright
O = os.environ.get('TRAILER_WORK', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'work'))
os.makedirs(O, exist_ok=True)
BASE = os.environ.get('TRAILER_BASE_URL', 'http://127.0.0.1:5173')
W, H = 1440, 810
only = sys.argv[1:] or None

async def seg(b, name, fn):
    if only and name not in only: return
    ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, record_video_dir=f'{O}/raw_{name}',
                              record_video_size={'width': W*2, 'height': H*2}, locale='es-ES', storage_state=f'{O}/anon.json')
    t0 = time.monotonic(); m = []
    pg = await ctx.new_page()
    def mark(label): m.append((label, round(time.monotonic()-t0, 2)))
    try: await fn(pg, mark)
    except Exception as e:
        print('ERR', name, e); await pg.screenshot(path=f'{O}/err_{name}.png')
    mark('end')
    path = await pg.video.path(); await ctx.close()
    json.dump({'video': path, 'marks': m}, open(f'{O}/marks_{name}.json', 'w'), indent=1)
    print(name, m)

async def goto(pg, path):
    await pg.goto(BASE + path); await pg.wait_for_timeout(1800)
    await pg.add_style_tag(content='html{scroll-behavior:auto!important}')

async def to_heading(pg, text, offset=90, smooth=True):
    y = await pg.evaluate("""([t, off]) => { const el = [...document.querySelectorAll('h1,h2,h3')].find(e => e.textContent.includes(t)); if (!el) return null;
        return el.getBoundingClientRect().top + window.scrollY - off }""", [text, offset])
    if y is None: print('no heading', text); return
    await pg.evaluate("([y, s]) => window.scrollTo({top: y, behavior: s ? 'smooth' : 'auto'})", [y, smooth])
    await pg.wait_for_timeout(1100)

async def home(pg, mark):
    await goto(pg, '/'); mark('hero'); await pg.wait_for_timeout(5000)
    await to_heading(pg, 'Todo lo que incluye ASE'); mark('eco'); await pg.wait_for_timeout(2500)
    await pg.mouse.wheel(0, 380); await pg.wait_for_timeout(1500); mark('eco2'); await pg.wait_for_timeout(2000)
    await to_heading(pg, 'Crece contigo'); mark('audience'); await pg.wait_for_timeout(3000)

async def platform(pg, mark):
    await goto(pg, '/platform'); mark('core'); await pg.wait_for_timeout(5000)
    for label, h in [('flow', 'De quién eres'), ('multi', 'Una persona, varias'), ('roles', 'Cada rol ve'), ('plans', 'Tu plan decide'),
                     ('audit', 'Todo lo importante'), ('auto', 'Preparada para automatizar'), ('panel', 'Un panel pensado')]:
        await to_heading(pg, h); mark(label); await pg.wait_for_timeout(3000)

async def academy(pg, mark):
    await goto(pg, '/academy'); mark('hero'); await pg.wait_for_timeout(3500)
    await pg.mouse.wheel(0, 520); await pg.wait_for_timeout(1500); mark('courses'); await pg.wait_for_timeout(3000)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None, args=['--force-device-scale-factor=2'])
        ctx = await b.new_context(viewport={'width': W, 'height': H}, locale='es-ES'); pg = await ctx.new_page()
        await pg.goto(BASE + '/'); await pg.wait_for_timeout(1500)
        try: await pg.get_by_role('button', name='Entendido', exact=True).click(timeout=2000)
        except Exception: pass
        await ctx.storage_state(path=f'{O}/anon.json'); await ctx.close()
        await seg(b, 'pl_home', home)
        await seg(b, 'pl_platform', platform)
        await seg(b, 'pl_academy', academy)
        await b.close()
asyncio.run(main())
