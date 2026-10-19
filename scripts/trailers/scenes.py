"""Escenas animadas (motion graphics) para el vídeo de presentación de la plataforma.

Cada escena devuelve el <body> y el CSS propios. Las animaciones son CSS
@keyframes: el renderizador las pausa y fija `currentTime` fotograma a
fotograma; los contadores numéricos usan window.__tick(ms).
"""
import base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
_LOGO = None


def logo_uri():
    global _LOGO
    if _LOGO is None:
        p = os.path.join(HERE, '..', '..', 'frontend', 'src', 'assets', 'ase-logo.png')
        _LOGO = 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode() if os.path.exists(p) else ''
    return _LOGO


BASE_CSS = """
*{box-sizing:border-box;margin:0}
html,body{width:%(W)spx;height:%(H)spx;overflow:hidden;background:#04060b;color:#f4f7fb;font-family:'Inter Display','Inter',sans-serif}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50%% 45%%, rgba(56,120,220,.22), transparent 60%%),#04060b}
.lines{position:absolute;inset:0;background:repeating-linear-gradient(0deg, rgba(255,255,255,.016) 0 1px, transparent 1px 4px)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(ellipse at center,#000 30%%,transparent 75%%)}
.stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.grad{background:linear-gradient(90deg,#22d3ee,#818cf8 55%%,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent}
.kick{font-family:'Inter';font-weight:700;letter-spacing:.42em;text-transform:uppercase;color:#7dd3fc;font-size:%(KS)spx}
.card{background:linear-gradient(180deg,rgba(30,41,74,.85),rgba(15,22,42,.9));border:1px solid rgba(148,163,184,.18);border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)}
.anim{animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.2,1)}
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes pop{0%%{opacity:0;transform:scale(.6)}70%%{opacity:1;transform:scale(1.06)}100%%{opacity:1;transform:scale(1)}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes out{from{opacity:1}to{opacity:0}}
@keyframes blurin{from{opacity:0;filter:blur(18px);transform:scale(1.15)}to{opacity:1;filter:blur(0);transform:scale(1)}}
@keyframes drift{from{transform:scale(1)}to{transform:scale(.965)}}
"""


def _a(name, delay, dur=0.6):
    return f'animation:{name} {dur}s {delay}s both cubic-bezier(.2,.7,.2,1)'


def scene_logo(card, W, H, vert):
    sz = 360 if vert else 300
    return f"""
<div class="bg"></div><div class="grid"></div><div class="lines"></div>
<div class="stage" style="flex-direction:column;text-align:center;padding:0 70px;animation:drift {card['dur']}s linear both">
  <div style="position:relative;{_a('blurin', .05, 1.1)}">
    <div style="position:absolute;inset:-40%;background:radial-gradient(circle,rgba(34,211,238,.35),rgba(129,140,248,.18) 40%,transparent 70%);filter:blur(10px);{_a('fade', .3, 1.4)}"></div>
    <img src="{logo_uri()}" style="position:relative;width:{sz}px">
  </div>
  <div class="kick" style="margin-top:40px;{_a('up', .9, .7)}">Arce Sabín Ingeniería</div>
  <div style="margin-top:22px;font-weight:900;text-transform:uppercase;font-size:{66 if vert else 64}px;line-height:1.02;{_a('up', 1.25, .7)}">Todo para dominar<br><span class="grad">la calidad del software.</span></div>
</div>"""


def scene_pillar(card, W, H, vert):
    n, kicker, title = card['n'], card['kicker'], card['title']
    fs = 104 if vert else 118
    return f"""
<div class="bg"></div><div class="lines"></div>
<div class="stage" style="flex-direction:column;align-items:{'center' if vert else 'flex-start'};padding:0 {80 if vert else 200}px;text-align:{'center' if vert else 'left'};animation:drift {card['dur']}s linear both">
  <div style="font-weight:900;font-size:{240 if vert else 220}px;line-height:.8;-webkit-text-stroke:3px rgba(125,211,252,.55);color:transparent;{_a('blurin', 0, .55)}">{n}</div>
  <div class="kick" style="margin-top:34px;{_a('up', .15, .5)}">{kicker}</div>
  <div style="margin-top:18px;font-weight:900;text-transform:uppercase;font-size:{fs}px;line-height:1;{_a('up', .28, .55)}">{title}</div>
</div>"""


def scene_catalog(card, W, H, vert):
    tiles = [('Cursos', 'Teoría + práctica'), ('Libros', 'PDF · EPUB · Kindle · Audio'), ('Scripts', 'Listos para usar'),
             ('Frameworks', 'CI/CD y ejecución en paralelo'), ('Plantillas', 'Estrategia, planes, informes'), ('Recursos', 'Siempre actualizados')]
    cols = 2 if vert else 3
    tw = 440 if vert else 470
    items = ''.join(
        f'<div class="card" style="width:{tw}px;padding:30px 34px;{_a("pop", .1 + i * .16, .55)}">'
        f'<div style="font-weight:900;text-transform:uppercase;font-size:{50 if vert else 46}px" class="grad">{t}</div>'
        f'<div style="font-family:Inter;color:#a8b8d0;font-size:{26 if vert else 24}px;margin-top:8px">{s}</div></div>'
        for i, (t, s) in enumerate(tiles))
    badges = ''.join(f'<span style="padding:12px 24px;border-radius:999px;border:1px solid rgba(125,211,252,.35);background:rgba(14,165,233,.08);{_a("up", 1.2 + i * .12, .45)}">{b}</span>'
                     for i, b in enumerate(['Reseñas reales', 'Muestra gratuita', 'Descarga inmediata']))
    return f"""
<div class="bg"></div><div class="grid"></div><div class="lines"></div>
<div class="stage" style="flex-direction:column;gap:46px;animation:drift {card['dur']}s linear both">
  <div style="display:grid;grid-template-columns:repeat({cols},auto);gap:26px;zoom:{1.12 if vert else 1.3}">{items}</div>
  <div style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center;font-family:Inter;font-weight:600;font-size:{28 if vert else 26}px;color:#cfe8ff">{badges}</div>
</div>"""


def scene_jobfit(card, W, H, vert):
    # CV escaneado → anillo de encaje → brechas y preparación. Ejemplo ilustrativo.
    lines = ''.join(f'<div style="height:16px;border-radius:8px;background:rgba(148,163,184,.22);width:{w}%;margin-top:18px"></div>' for w in (92, 70, 85, 60, 78, 66, 88, 54))
    cv = f"""<div class="card" style="position:relative;overflow:hidden;width:{460 if vert else 420}px;height:{520 if vert else 560}px;padding:40px;{_a('up', .05, .6)}">
      <div style="display:flex;gap:18px;align-items:center"><div style="width:74px;height:74px;border-radius:50%;background:linear-gradient(135deg,#22d3ee,#818cf8)"></div>
      <div><div style="font-weight:800;font-size:34px">Tu CV</div><div style="font-family:Inter;color:#94a3b8;font-size:22px">QA Automation · 4 años</div></div></div>
      {lines}
      <div style="position:absolute;left:0;right:0;height:120px;background:linear-gradient(180deg,transparent,rgba(34,211,238,.35),transparent);animation:scan 1.6s .5s both linear"></div>
    </div>"""
    ring = f"""<div class="card" style="width:{560 if vert else 600}px;padding:40px 44px;{_a('up', .2, .6)}">
      <div style="font-family:Inter;color:#94a3b8;font-size:22px;letter-spacing:.2em;text-transform:uppercase">Oferta</div>
      <div style="font-weight:800;font-size:38px;margin-top:6px">QA Automation Engineer · Remoto</div>
      <div style="display:flex;align-items:center;gap:34px;margin-top:30px">
        <div style="position:relative;width:190px;height:190px">
          <svg viewBox="0 0 100 100" style="width:190px;height:190px;transform:rotate(-90deg)"><circle cx="50" cy="50" r="42" stroke="rgba(148,163,184,.18)" stroke-width="9" fill="none"/>
          <circle id="arc" cx="50" cy="50" r="42" stroke="url(#g)" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="264"/>
          <defs><linearGradient id="g"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs></svg>
          <div id="pct" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:58px">0%</div>
        </div>
        <div><div style="font-family:Inter;color:#94a3b8;font-size:24px">Encaje con la oferta</div><div style="font-weight:900;font-size:52px;color:#34d399;{_a('pop', 2.2, .4)}">ALTO</div></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:30px;font-family:Inter;font-size:25px;font-weight:600">
        <div style="{_a('up', 2.4, .4)}"><span style="color:#34d399">✓</span>&nbsp; Automatización de APIs · CI/CD</div>
        <div style="{_a('up', 2.6, .4)}"><span style="color:#fbbf24">▲</span>&nbsp; Brecha: rendimiento</div>
        <div style="{_a('up', 2.8, .4)}"><span style="color:#7dd3fc">→</span>&nbsp; Cómo preparar la entrevista</div>
      </div>
    </div>"""
    layout = (f'<div style="display:flex;flex-direction:column;gap:30px;align-items:center;transform:scale(1.18)">{cv.replace("height:520px", "height:300px")}{ring}</div>'
              if vert else f'<div style="display:flex;gap:44px;align-items:center;transform:scale(1.28)">{cv}{ring}</div>')
    return f"""
<style>@keyframes scan{{from{{top:-120px}}to{{top:100%}}}}</style>
<div class="bg"></div><div class="grid"></div><div class="lines"></div>
<div class="stage" style="flex-direction:column;animation:drift {card['dur']}s linear both">{layout}
  <div style="position:absolute;bottom:{70 if vert else 40}px;font-family:Inter;font-size:18px;letter-spacing:.3em;color:#64748b;text-transform:uppercase">Ejemplo ilustrativo</div>
</div>
<script>window.__tick=function(ms){{const p=Math.max(0,Math.min(1,(ms-700)/1500));const e=1-Math.pow(1-p,3);const v=Math.round(82*e);
document.getElementById('pct').textContent=v+'%';document.getElementById('arc').setAttribute('stroke-dashoffset',264-264*v/100)}}</script>"""


def scene_stats(card, W, H, vert):
    stats = [('10', '+', 'años liderando QA'), ('120', '+', 'proyectos entregados'), ('28', '', 'misiones jugables')]
    items = ''.join(
        f'<div style="text-align:center;{_a("up", .1 + i * .18, .5)}"><div style="font-weight:900;font-size:{150 if vert else 160}px;line-height:1" class="grad"><span class="cnt" data-to="{v}" data-at="{(.1 + i * .18) * 1000}">0</span>{s}</div>'
        f'<div style="font-family:Inter;color:#a8b8d0;font-size:{30 if vert else 28}px;margin-top:10px">{l}</div></div>'
        for i, (v, s, l) in enumerate(stats))
    sectors = ' · '.join(['Banca digital', 'Aeronáutica', 'Retail', 'Seguridad'])
    return f"""
<div class="bg"></div><div class="grid"></div><div class="lines"></div>
<div class="stage" style="flex-direction:column;gap:{70 if vert else 60}px;animation:drift {card['dur']}s linear both">
  <div style="display:flex;flex-direction:{'column' if vert else 'row'};gap:{50 if vert else 110}px">{items}</div>
  <div style="text-align:center;{_a('up', 1.3, .5)}"><div class="kick">Entornos críticos</div><div style="margin-top:16px;font-weight:800;font-size:{40 if vert else 44}px;text-transform:uppercase;letter-spacing:.04em">{sectors.replace(' · ', '<br>' if vert else ' · ')}</div></div>
</div>
<script>window.__tick=function(ms){{document.querySelectorAll('.cnt').forEach(e=>{{const p=Math.max(0,Math.min(1,(ms-+e.dataset.at)/1100));e.textContent=Math.round(+e.dataset.to*(1-Math.pow(1-p,3)))}})}}</script>"""


def scene_loyalty(card, W, H, vert):
    tiers = [('Plata', '#cbd5e1'), ('Oro', '#fbbf24'), ('Platino', '#67e8f9'), ('Infinita', '#a78bfa')]
    n = len(tiers)
    if vert:
        items = ''.join(f'<div style="display:flex;align-items:center;gap:30px;{_a("pop", .35 + i * .45, .45)}"><div style="width:110px;height:110px;border-radius:50%;border:5px solid {c};box-shadow:0 0 50px {c}66;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:44px;color:{c}">{i + 1}</div><div style="font-weight:900;font-size:64px;text-transform:uppercase;color:{c}">{t}</div></div>' for i, (t, c) in enumerate(tiers))
        body = f'<div style="display:flex;flex-direction:column;gap:46px">{items}</div>'
    else:
        items = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:22px;width:260px;{_a("pop", .35 + i * .45, .45)}"><div style="width:130px;height:130px;border-radius:50%;border:6px solid {c};box-shadow:0 0 60px {c}66;background:#0b1220;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:52px;color:{c}">{i + 1}</div><div style="font-weight:900;font-size:52px;text-transform:uppercase;color:{c}">{t}</div></div>' for i, (t, c) in enumerate(tiers))
        body = f"""<div style="position:relative">
          <div style="position:absolute;left:130px;right:130px;top:63px;height:6px;background:rgba(148,163,184,.2);border-radius:3px"></div>
          <div style="position:absolute;left:130px;top:63px;height:6px;width:{260 * (n - 1)}px;background:linear-gradient(90deg,#cbd5e1,#fbbf24,#67e8f9,#a78bfa);border-radius:3px;transform-origin:left;animation:grow {.45 * (n - 1) + .2}s .35s both linear"></div>
          <div style="position:relative;display:flex">{items}</div></div>"""
    return f"""
<style>@keyframes grow{{from{{transform:scaleX(0)}}to{{transform:scaleX(1)}}}}</style>
<div class="bg"></div><div class="lines"></div>
<div class="stage" style="flex-direction:column;gap:70px;animation:drift {card['dur']}s linear both">{body}
  <div style="font-family:Inter;font-weight:600;color:#a8b8d0;font-size:{32 if vert else 30}px;text-align:center;padding:0 60px;{_a('up', 2.0, .5)}">Tu antigüedad sube de nivel y desbloquea recompensas.</div>
</div>"""


def scene_grid(card, W, H, vert):
    tiles = ['ASE Academy', 'Catálogo técnico', 'Empleo con IA', 'Consultoría QA', 'Equipos y empresas', 'Fidelidad', 'Comunidad y blog', 'Frameworks']
    cols = 2 if vert else 4
    tw = 460 if vert else 420
    items = ''.join(f'<div class="card tile" style="width:{tw}px;padding:34px 30px;text-align:center;font-weight:900;text-transform:uppercase;font-size:{38 if vert else 38}px;{_a("pop", .05 + i * .11, .4)}">{t}</div>' for i, t in enumerate(tiles))
    fin = 1.35
    return f"""
<style>@keyframes lit{{0%{{border-color:rgba(148,163,184,.18);box-shadow:0 30px 80px rgba(0,0,0,.55)}}100%{{border-color:rgba(125,211,252,.9);box-shadow:0 0 70px rgba(56,189,248,.45)}}}}
@keyframes away{{from{{opacity:1;transform:scale(1);filter:blur(0)}}to{{opacity:0;transform:scale(.7);filter:blur(12px)}}}}
.tile{{animation-name:pop,lit!important;animation-duration:.4s,.3s!important;animation-fill-mode:both!important}}</style>
<div class="bg"></div><div class="grid"></div><div class="lines"></div>
<div class="stage"><div style="display:grid;grid-template-columns:repeat({cols},auto);gap:22px;animation:away .5s {fin + .4}s both ease-in">{items}</div></div>
<div class="stage" style="flex-direction:column;text-align:center;padding:0 60px">
  <div class="kick" style="{_a('up', fin + .7, .5)}">Todo conectado</div>
  <div style="margin-top:20px;font-weight:900;text-transform:uppercase;font-size:{120 if vert else 140}px;line-height:.98;{_a('blurin', fin + .55, .55)}">Una sola<br><span class="grad">plataforma.</span></div>
</div>
<script>document.querySelectorAll('.tile').forEach((e,i)=>{{e.style.animationDelay=(.05+i*.11)+'s,'+(.6+i*.08)+'s'}})</script>"""


def scene_finale(card, W, H, vert):
    return f"""
<div class="bg" style="background:radial-gradient(ellipse at 50% 40%, rgba(56,120,220,.30), transparent 62%),#04060b"></div><div class="grid"></div><div class="lines"></div>
<div class="stage" style="flex-direction:column;text-align:center;padding:0 70px;animation:drift {card['dur']}s linear both">
  <img src="{logo_uri()}" style="width:{220 if vert else 170}px;{_a('blurin', 0, .7)}">
  <div style="margin-top:30px;font-weight:900;text-transform:uppercase;font-size:{88 if vert else 92}px;line-height:1;{_a('up', .3, .6)}">Aprende. Trabaja.<br><span class="grad">Crece.</span></div>
  <div style="margin-top:46px;display:inline-block;padding:.55em 1.3em;border-radius:999px;background:linear-gradient(90deg,#2563eb,#7c3aed);font-family:Inter;font-weight:800;font-size:{40 if vert else 36}px;box-shadow:0 0 70px rgba(99,102,241,.55);{_a('pop', .8, .5)}">Primera misión gratis · Sin permanencia</div>
  <div style="margin-top:26px;font-family:Inter;font-weight:600;color:#cbd5e1;font-size:{38 if vert else 36}px;{_a('fade', 1.1, .5)}">arcesabinengineering.com</div>
</div>"""


SCENES = {'logo': scene_logo, 'pillar': scene_pillar, 'catalog': scene_catalog, 'jobfit': scene_jobfit, 'stats': scene_stats,
          'loyalty': scene_loyalty, 'grid': scene_grid, 'finale': scene_finale}


def page(card, W, H):
    vert = H > W
    css = BASE_CSS % dict(W=W, H=H, KS=26 if vert else 26)
    body = SCENES[card['kind']](card, W, H, vert)
    return f'<html><head><meta charset="utf-8"><style>{css}</style></head><body>{body}</body></html>'
