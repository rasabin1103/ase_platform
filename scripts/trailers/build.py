import json, os, subprocess, sys, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import synth
import os
HERE = os.path.dirname(os.path.abspath(__file__))
O = os.environ.get('TRAILER_WORK', os.path.join(HERE, 'work'))
os.makedirs(O, exist_ok=True)
CHROMIUM = os.environ.get('CHROMIUM_PATH') or None
FB='/usr/share/fonts/opentype/inter/Inter-Bold.otf'
FPS=30
C = sys.argv[1]; FORMATS = sys.argv[2:] or ['h', 'v']
def vid(seg): return json.load(open(f'{O}/marks_{seg}.json'))['video']

def S(seg, a, b, rect, z=1.08, speed=1.0, **kw): return dict(t='shot', seg=seg, a=a, b=b, rect=rect, z=z, speed=speed, **kw)
def Cd(cid, lines, dur, bg=''): return dict(t='card', id=cid, card={'kind':'slam','lines':lines,'dur':dur,'bg':bg})
def M(items): return dict(t='montage', items=items)

TL = {
'testing-fundamentals': dict(name='Fundamentos de Testing', pulse_from=3, items=[
  Cd('c1', [['Lunes.',''],['09:00.','acc']], 1.5),
  S('tf_mail', 9.4, 11.8, (480,20,800,450)),
  Cd('c2', [['Tu primer día',''],['como QA.','acc']], 1.6),
  S('tf_mail', 13.3, 15.6, (60,20,760,428)),
  Cd('c3', [['Un neobanco.',''],['Una demo el viernes.','acc']], 1.9),
  S('tf_loans', 9.5, 11.1, (250,120,680,383), 1.12),
  S('tf_release', 9.4, 11.4, (60,40,900,506), 1.06),
  Cd('c4', [['Nadie te dará',''],['las respuestas.','acc']], 1.7),
  S('tf_clock', 10.0, 15.3, (738,6,304,36), 1.12, 2.0, ticks=True),
  Cd('c5', [['El reloj',''],['no espera.','acc']], 1.4),
  S('tf_incident', 9.4, 11.4, (60,48,420,36), 1.1),
  S('tf_incident', 13.9, 17.3, (972,48,462,36), 1.12, 1.1),
  Cd('c6', [['Y producción',''],['no perdona.','acc r']], 1.6, 'red'),
  M([('tf_loans',13.8,(860,160,560,315)),('tf_release',10.2,(150,90,640,360)),('tf_mail',10.0,(980,40,460,259)),
     ('tf_incident',15,(600,0,840,472)),('tf_mail',14.0,(380,60,700,394)),('tf_incident',19,(0,0,720,405))]),
  Cd('c7', [['Cada decisión',''],['cuenta.','acc']], 1.8),
  dict(t='black', d=0.5),
  S('cert_tf', 3.3, 7.0, (280,180,880,495), 1.12, flash=True),
  dict(t='card', id='title', card={'kind':'title','kicker':'ASE Academy · Curso interactivo','title':'Fundamentos<br>de Testing','sub':'Tus primeras semanas como QA · 8 misiones · certificado','dur':3.8}),
  dict(t='card', id='cta', card={'kind':'cta','title':'Aprende trabajando.','dur':3.4}),
]),
'qa-profesional': dict(name='QA Profesional', pulse_from=3, items=[
  Cd('c1', [['Seis meses',''],['después.','acc']], 1.5),
  S('qp_mail', 8.8, 11.6, (540,40,760,428)),
  Cd('c2', [['Ya no eres',''],['junior.','acc']], 1.4),
  S('qp_inspection', 10.6, 13.4, (240,90,1000,562), 1.06),
  Cd('c3', [['Ahora el equipo',''],['depende de ti.','acc']], 1.7),
  S('qp_gherkin', 14.4, 17.0, (230,70,1000,562), 1.06),
  S('qp_coverage', 9.4, 11.6, (190,40,720,405), 1.1),
  Cd('c4', [['Revisiones.',''],['Cobertura.',''],['Métricas.','acc']], 1.9),
  S('qp_coverage', 13.0, 16.0, (860,80,480,270), 1.15),
  S('qp_metrics', 9.4, 12.6, (250,130,1040,585), 1.07),
  Cd('c5', [['Un comité',''],['espera tu informe.','acc']], 1.7),
  S('qp_clock', 12.0, 15.5, (738,6,304,36), 1.12, 1.3, ticks=True),
  Cd('c6', [['El reloj',''],['no espera.','acc r']], 1.4, 'red'),
  M([('qp_coverage',14.5,(200,140,700,394)),('qp_metrics',11,(500,280,700,394)),('qp_inspection',12,(250,360,800,450)),
     ('qp_gherkin',16,(250,140,600,338)),('qp_mail',10,(560,60,600,338)),('qp_coverage',10.5,(500,300,900,506))]),
  Cd('c7', [['Cada decisión',''],['cuenta.','acc']], 1.8),
  dict(t='black', d=0.5),
  S('cert_qp', 3.3, 7.0, (280,180,880,495), 1.12, flash=True),
  dict(t='card', id='title', card={'kind':'title','kicker':'ASE Academy · Curso interactivo','title':'QA Profesional','sub':'Del testing a la calidad del equipo · preparación CTFL v4.0','dur':3.8}),
  dict(t='card', id='cta', card={'kind':'cta','title':'Aprende trabajando.','dur':3.4}),
]),
'plataforma': dict(name='Arce Sabín Ingeniería', pulse_from=7, items=[
  Cd('w1', [['Tutoriales.','']], 0.85),
  Cd('w2', [['Teoría.','']], 0.85),
  Cd('w3', [['Diapositivas.','']], 0.95),
  Cd('w4', [['La calidad no se memoriza.',''],['Se entrena.','acc']], 2.1),
  dict(t='card', id='logo', card={'kind':'logo','dur':4.2}, sfx=[('whoosh',0,{'d':0.5}),('hit',0,{'big':True}),('chord',0,{'d':6,'g':0.8})]),
  dict(t='card', id='p1', card={'kind':'pillar','n':'01','kicker':'ASE Academy','title':'Formación<br>que se juega.','dur':1.9}),
  S('pl_academy', 3.3, 6.3, (200,110,1040,585), 1.06),
  S('tf_incident', 13.9, 16.4, (972,48,462,36), 1.1),
  S('ka_ide', 9.2, 13.6, (270,140,760,428), 1.1, 1.6),
  S('qp_coverage', 13.0, 15.6, (860,80,480,270), 1.12),
  S('ka_pipeline', 12.9, 15.3, (1060,150,380,214), 1.1),
  Cd('a1', [['Tres cursos. 28 misiones.',''],['Un certificado verificable.','acc']], 2.0),
  S('cert_ka', 3.3, 6.2, (280,180,880,495), 1.1, flash=True),
  dict(t='card', id='p2', card={'kind':'pillar','n':'02','kicker':'Catálogo técnico','title':'Cursos, libros<br>y frameworks.','dur':1.9}),
  dict(t='card', id='cat', card={'kind':'catalog','dur':3.4}),
  dict(t='card', id='p3', card={'kind':'pillar','n':'03','kicker':'Empleo con IA','title':'Tu CV, frente<br>a cada oferta.','dur':1.9}),
  dict(t='card', id='job', card={'kind':'jobfit','dur':4.4}, sfx=[('ticks',0.7,{'d':1.5,'every':0.12})]),
  dict(t='card', id='p4', card={'kind':'pillar','n':'04','kicker':'Consultoría QA senior','title':'Experiencia en<br>entornos críticos.','dur':1.9}),
  dict(t='card', id='stats', card={'kind':'stats','dur':3.4}),
  dict(t='card', id='p5', card={'kind':'pillar','n':'05','kicker':'Equipos y empresas','title':'Roles, permisos<br>y auditoría.','dur':1.9}),
  S('pl_platform', 3.0, 6.0, (740,150,700,394), 1.08),
  S('pl_platform', 14.1, 16.4, (740,110,680,383), 1.07),
  S('pl_platform', 18.2, 20.6, (300,326,860,484), 1.07),
  S('pl_platform', 26.4, 28.8, (740,100,660,371), 1.07),
  S('pl_platform', 34.7, 36.3, (60,300,880,495), 1.06),
  dict(t='card', id='p6', card={'kind':'pillar','n':'06','kicker':'Programa de fidelidad','title':'Tu antigüedad,<br>recompensada.','dur':1.9}),
  dict(t='card', id='loy', card={'kind':'loyalty','dur':3.4}),
  M([('pl_academy',10.0,(60,100,1320,743)),('pl_platform',23.0,(40,100,700,394)),('ka_ide',20.5,(0,60,600,338)),
     ('pl_home',5.0,(780,150,620,349)),('tf_loans',14.0,(860,160,560,315)),('pl_platform',35.5,(60,300,880,495))]),
  Cd('f1', [['Para profesionales.','']], 0.9),
  Cd('f2', [['Para equipos.','']], 0.9),
  Cd('f3', [['Para empresas.','acc']], 1.0),
  S('pl_home', 18.4, 20.1, (35,40,1370,770), 1.05),
  dict(t='black', d=0.5),
  dict(t='card', id='grid', card={'kind':'grid','dur':3.9}, sfx=[('riser',0,{'d':1.9}),('hit',1.9,{'big':True}),('chord',1.9,{'d':7,'g':1.0}),('drone',0,{'d':8.3,'g0':.4,'g1':.9}),('pulse',1.9,{'d':5.6,'g':0.7})]),
  dict(t='card', id='cta', card={'kind':'finale','dur':4.4}, sfx=[('hit',0,{})]),
]),
'karate-framework': dict(name='Karate Framework', pulse_from=2, items=[
  Cd('c1', [['Nada de',''],['diapositivas.','acc']], 1.5),
  Cd('c2', [['Código.',''],['De verdad.','acc']], 1.4),
  S('ka_ide', 9.2, 15.6, (270,140,760,428), 1.1, 1.6),
  Cd('c3', [['Contra una API',''],['con bugs reales.','acc']], 1.8),
  S('ka_ide', 19.3, 21.6, (0,50,760,428), 1.08),
  Cd('c4', [['El nocturno',''],['en rojo.','acc r']], 1.6, 'red'),
  S('ka_pipeline', 12.9, 16.1, (1060,150,380,214), 1.12),
  Cd('c5', [['Examen final:',''],['cuatro horas.','acc']], 1.5),
  S('ka_exam', 3.0, 6.4, (380,90,700,394), 1.08),
  Cd('c6', [['Sin pistas.',''],['Sin mentor.','acc']], 1.4),
  M([('ka_ide',12,(280,160,600,338)),('ka_pipeline',14,(1080,170,360,203)),('ka_ide',20.5,(0,60,600,338)),
     ('ka_exam',5,(400,380,640,360)),('ka_ide',16.5,(270,150,760,428)),('ka_pipeline',15.5,(1060,220,380,214))]),
  Cd('c7', [['Cada línea',''],['cuenta.','acc']], 1.8),
  dict(t='black', d=0.5),
  S('cert_ka', 3.3, 7.0, (280,180,880,495), 1.12, flash=True),
  dict(t='card', id='title', card={'kind':'title','kicker':'ASE Academy · Curso interactivo','title':'Karate<br>Framework','sub':'Automatización de APIs · 10 misiones · examen práctico','dur':3.8}),
  dict(t='card', id='cta', card={'kind':'cta','title':'Aprende trabajando.','dur':3.4}),
]),
}[C]
MONT = 0.42

def run(cmd): subprocess.run(cmd, check=True)
BAND = 'drawbox=x=0:y=0:w=iw:h=260:color=black@0.55:t=fill,drawbox=x=0:y=ih-300:w=iw:h=300:color=black@0.6:t=fill,'
GRADE = 'eq=contrast=1.07:saturation=1.08,vignette=angle=PI/4.6,noise=alls=4:allf=t'

def vrect(r):
    x, y, w, h = r; cx, cy = x+w/2, y+h/2
    wv = w*0.8; hv = wv*1.25
    if hv > 810: hv = 810; wv = hv/1.25
    if wv > 1440: wv = 1440
    x0 = min(max(cx-wv/2, 0), 1440-wv); y0 = min(max(cy-hv/2, 0), 810-hv)
    return x0, y0, wv, hv

def shot_clip(out, fmt, seg, a, dur_src, rect, z, speed, flash=False, title=''):
    dur = dur_src/speed; N = max(int(round(dur*FPS)), 1)
    key = hashlib.md5(repr((fmt, seg, a, dur_src, rect, z, speed, flash, title, GRADE, BAND if fmt == 'v' else '')).encode()).hexdigest()[:12]
    cache = f'{O}/cache/{key}.mp4'
    if os.path.exists(cache):
        run(['cp', cache, out]); return N/FPS
    os.makedirs(f'{O}/cache', exist_ok=True)
    r = _shot(cache, fmt, seg, a, dur_src, rect, z, speed, flash, title, N)
    run(['cp', cache, out]); return r

def _strip(out, fmt, seg, a, dur_src, rect, z, speed, title, N):
    pre = f"setpts=(PTS-STARTPTS)/{speed},fps={FPS}"
    x, y, w, h = [int(v*2) for v in rect]
    if fmt == 'h': W, H, SW = 1920, 1080, 1720
    else: W, H, SW = 1080, 1920, 1010
    zp = f"zoompan=z='1+({z}-1)*on/{N}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={W}x{H}:fps={FPS}"
    bgc = f"scale={W*2}:-2,crop={W}:{H}" if fmt == 'h' else f"scale=-2:{H},crop={W}:{H}"
    extra = ''
    if fmt == 'v':
        extra = (f",{BAND}drawtext=fontfile={FB}:text='ASE ACADEMY':fontcolor=0x7dd3fc:fontsize=34:x=(w-text_w)/2:y=170,"
                 f"drawtext=fontfile={FB}:text='{title}':fontcolor=white:fontsize=50:x=(w-text_w)/2:y=1720")
    fc = (f"[0:v]{pre},split[a][b];"
          f"[a]crop={w}:{h}:{x}:{y},scale={SW}:-2:flags=lanczos,pad=iw+40:ih+40:20:20:color=black@0[fg];"
          f"[b]{bgc},boxblur=30:2,eq=brightness=-0.72:saturation=0.5[bg];"
          f"[bg][fg]overlay=(W-w)/2:(H-h)/2,scale={W*2}:{H*2},{zp}{extra},{GRADE}[o]")
    run(['ffmpeg','-y','-v','error','-ss',str(a),'-t',f'{dur_src:.3f}','-i',vid(seg),'-filter_complex',fc,'-map','[o]','-frames:v',str(N),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-an',out])
    return N/FPS

def _shot(out, fmt, seg, a, dur_src, rect, z, speed, flash, title, N):
    if rect[3] < 120: return _strip(out, fmt, seg, a, dur_src, rect, z, speed, title, N)
    pre = f"setpts=(PTS-STARTPTS)/{speed},fps={FPS}"
    zp = lambda s: f"zoompan=z='1+({z}-1)*on/{N}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={s}:fps={FPS}"
    fl = ",fade=t=in:st=0:d=0.35:color=white" if flash else ''
    if fmt == 'h':
        x, y, w, h = [int(v*2) for v in rect]
        vf = f"{pre},crop={w}:{h}:{x}:{y},scale=3840:2160:flags=lanczos,{zp('1920x1080')},{GRADE}{fl}"
        run(['ffmpeg','-y','-v','error','-ss',str(a),'-t',f'{dur_src:.3f}','-i',vid(seg),'-vf',vf,'-frames:v',str(N),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-an',out])
    else:
        x, y, w, h = [int(v*2) for v in vrect(rect)]
        bx, by, bw, bh = [int(v*2) for v in rect]
        fc = (f"[0:v]{pre},split[a][b];"
              f"[a]crop={w}:{h}:{x}:{y},scale=2160:2700:flags=lanczos,{zp('1080x1350')}[fg];"
              f"[b]crop={bw}:{bh}:{bx}:{by},scale=-2:1920,crop=1080:1920,boxblur=40:2,eq=brightness=-0.32:saturation=0.7[bg];"
              f"[bg][fg]overlay=0:285,{BAND}"
              f"drawtext=fontfile={FB}:text='ASE ACADEMY':fontcolor=0x7dd3fc:fontsize=34:x=(w-text_w)/2:y=170,"
              f"drawtext=fontfile={FB}:text='{title}':fontcolor=white:fontsize=50:x=(w-text_w)/2:y=1720,"
              f"{GRADE}{fl}[o]")
        run(['ffmpeg','-y','-v','error','-ss',str(a),'-t',f'{dur_src:.3f}','-i',vid(seg),'-filter_complex',fc,'-map','[o]','-frames:v',str(N),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-an',out])
    return N/FPS

def card_clip(out, fmt, cid):
    d = f'{O}/cards/{C}_{fmt}/{cid}'
    run(['ffmpeg','-y','-v','error','-framerate',str(FPS),'-i',f'{d}/%04d.png','-vf','noise=alls=3:allf=t,format=yuv420p','-c:v','libx264','-preset','medium','-crf','16','-an',out])
    return len(os.listdir(d))/FPS

def black_clip(out, fmt, d):
    s = '1920x1080' if fmt == 'h' else '1080x1920'
    run(['ffmpeg','-y','-v','error','-f','lavfi','-i',f'color=c=black:s={s}:r={FPS}:d={d}','-c:v','libx264','-pix_fmt','yuv420p','-an',out])
    return d

# 1) tarjetas
cards = {it['id']: it['card'] for it in TL['items'] if it['t'] == 'card'}
spec = f'{O}/cards_{C}.json'; json.dump(cards, open(spec, 'w'))
if not all(os.path.isdir(f'{O}/cards/{C}_{f}') for f in ('h','v')) or '--recards' in sys.argv:
    run([os.environ.get('PLAYWRIGHT_PYTHON', sys.executable), os.path.join(HERE, 'cards.py'), spec, C])
FORMATS = [f for f in FORMATS if f in ('h','v')]

for fmt in FORMATS:
    parts = []; t = 0.0; ev = []; k = 0; black_at = None; first_shot = None
    def nxt():
        global k
        k += 1; return f'{O}/parts/{C}_{fmt}_{k:03d}.mp4'
    os.makedirs(f'{O}/parts', exist_ok=True)
    for idx, it in enumerate(TL['items']):
        if idx == TL['pulse_from'] and first_shot is None: first_shot = t
        if it['t'] == 'card':
            out = nxt(); d = card_clip(out, fmt, it['id']); parts.append(out)
            if 'sfx' in it:
                ev += [(k, t + off, p) for k, off, p in it['sfx']]
            else:
                big = it['id'] == 'title'
                if it['id'] == 'cta': ev.append(('hit', t, {}))
                else:
                    ev += [('whoosh', t, {'d': 0.4}), ('hit', t, {'big': big})]
                if big: ev.append(('chord', t, {'d': 7.5, 'g': 1.0}))
            t += d
        elif it['t'] == 'shot':
            out = nxt(); d = shot_clip(out, fmt, it['seg'], it['a'], it['b']-it['a'], it['rect'], it['z'], it['speed'], it.get('flash', False), TL['name'])
            parts.append(out)
            if it.get('flash'):
                ev += [('hit', t, {'big': True}), ('chord', t, {'d': 4.5, 'g': 0.7})]
            else: ev.append(('cut', t, {}))
            if it.get('ticks'): ev.append(('ticks', t, {'d': d, 'every': 0.5}))
            t += d
        elif it['t'] == 'montage':
            ev.append(('riser', t, {'d': MONT*len(it['items']) + 0.05}))
            for seg, at, rect in it['items']:
                out = nxt(); d = shot_clip(out, fmt, seg, at, MONT*1.0, rect, 1.07, 1.0, False, TL['name']); parts.append(out)
                ev.append(('cut', t, {})); t += d
        elif it['t'] == 'black':
            out = nxt(); d = black_clip(out, fmt, it['d']); parts.append(out)
            black_at = t; ev.append(('silence', t, {'d': d})); t += d
    total = t
    ev = [('drone', 0, {'d': black_at, 'g0': .3, 'g1': .85}), ('pulse', first_shot, {'d': black_at - first_shot, 'g': 0.85})] + ev
    lst = f'{O}/parts/{C}_{fmt}.txt'
    open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    silent = f'{O}/{C}_{fmt}_silent.mp4'
    run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',lst,'-c','copy',silent])
    wav = f'{O}/{C}_{fmt}.wav'; synth.build(ev, total, wav)
    final = f'{O}/{C}-epico-{"16x9" if fmt == "h" else "9x16"}.mp4'
    run(['ffmpeg','-y','-v','error','-i',silent,'-i',wav,'-map','0:v','-map','1:a','-c:v','copy','-af','loudnorm=I=-14:TP=-1.5:LRA=9','-ar','48000','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',final])
    print(fmt, round(total, 2), final)
