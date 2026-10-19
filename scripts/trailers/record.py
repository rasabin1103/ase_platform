import asyncio, json, time, sys
import psycopg
from playwright.async_api import async_playwright
import os
HERE = os.path.dirname(os.path.abspath(__file__))
O = os.environ.get('TRAILER_WORK', os.path.join(HERE, 'work'))
os.makedirs(O, exist_ok=True)
CHROMIUM = os.environ.get('CHROMIUM_PATH') or None
K=os.path.join(HERE, 'fixtures')
BASE=os.environ.get('TRAILER_BASE_URL', 'http://127.0.0.1:5173')
W,H=1440,810
DB=os.environ.get('TRAILER_DB', 'postgresql://ase:ase@localhost:5432/ase_mig')  # SOLO base de datos local
only = sys.argv[1:] or None
UID = None  # se resuelve a partir de TRAILER_EMAIL

async def seg(b, name, fn):
    if only and name not in only: return
    ctx = await b.new_context(viewport={'width':W,'height':H}, device_scale_factor=2, record_video_dir=f'{O}/raw_{name}', record_video_size={'width':W*2,'height':H*2}, storage_state=f'{O}/state.json', locale='es-ES')
    t0 = time.monotonic(); m = []
    pg = await ctx.new_page()
    pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    def mark(label): m.append((label, round(time.monotonic()-t0, 2)))
    try: await fn(pg, mark)
    except Exception as e:
        print('ERR', name, e); await pg.screenshot(path=f'{O}/err_{name}.png')
    mark('end')
    path = await pg.video.path()
    await ctx.close()
    json.dump({'video': path, 'marks': m}, open(f'{O}/marks_{name}.json','w'), indent=1)
    print(name, m)

async def meeting(pg):
    for _ in range(10):
        if not await pg.get_by_role('dialog').count(): break
        await pg.wait_for_timeout(900)
        await pg.get_by_role('dialog').locator('button:not([disabled])').first.click(); await pg.wait_for_timeout(400)
async def app(pg, label):
    await meeting(pg); await pg.locator('nav button', has_text=label).first.click(); await pg.wait_for_timeout(500)
async def start(pg, course, mid, mark=None):
    with psycopg.connect(DB) as c:
        c.execute(f"delete from academy_runs where user_id={UID} and course_key=%s and mission_id=%s", (course, mid)); c.commit()
    await pg.goto(f'{BASE}/academy/{course}/{mid}'); await pg.wait_for_timeout(2200)
    try: await pg.get_by_role('button', name='Entendido').click(timeout=1000)
    except Exception: pass
    if mark: mark('briefing')
    await pg.wait_for_timeout(1500)
    b = pg.get_by_role('button', name='Hacer el diagnóstico')
    if await b.count():
        await b.click(); await pg.wait_for_timeout(300)
        n = await pg.get_by_role('radiogroup').count()
        for i in range(n):
            await pg.get_by_role('radiogroup').nth(i).get_by_role('radio').nth(1).click(); await pg.wait_for_timeout(40)
    await pg.get_by_role('button', name='Empezar la jornada').click(); await pg.wait_for_timeout(1000)
async def wait30(pg, n=1, gap=1400):
    for _ in range(n):
        await meeting(pg)
        await pg.get_by_role('button', name='Esperar 30 min').click(); await pg.wait_for_timeout(gap)

# ---------- Fundamentos
async def tf_mail(pg, mark):
    await start(pg, 'testing-fundamentals', 'm00-primer-dia', mark)
    mark('desk'); await pg.wait_for_timeout(3500)
    await pg.locator('nav button', has_text='Chat').first.click(); await pg.wait_for_timeout(500); mark('chat'); await pg.wait_for_timeout(2500)
    mark('clock'); await wait30(pg, 3, 1500); await pg.wait_for_timeout(800)
async def tf_loans(pg, mark):
    await start(pg, 'testing-fundamentals', 'm02-simulador-prestamos')
    await app(pg, 'Staging'); mark('app')
    for vals in [('35','2000','10000','36'), ('70','1800','25000','84')]:
        for ph, v in zip(['Ej.: 35','Ej.: 2.000','1.000 – 30.000','12 – 84'], vals):
            f = pg.get_by_placeholder(ph); await f.click(); await f.fill(''); await f.type(v, delay=110)
        mark('click'); await pg.get_by_role('button', name='Simular', exact=True).click(); await pg.wait_for_timeout(1300)
    await pg.wait_for_timeout(1000)
async def tf_release(pg, mark):
    await start(pg, 'testing-fundamentals', 'm05-release')
    await app(pg, 'Staging'); mark('app'); await pg.wait_for_timeout(1500)
    for tc in ['TC-01','TC-02','TC-03','TC-04']:
        await pg.get_by_label('Ejecutar '+tc).click(); await pg.wait_for_timeout(900); await meeting(pg)
    mark('done'); await pg.wait_for_timeout(1500)
async def tf_incident(pg, mark):
    await start(pg, 'testing-fundamentals', 'm07-incidente')
    await app(pg, 'Staging'); mark('app'); await pg.wait_for_timeout(2500)
    mark('wait'); await wait30(pg, 4, 1300)
    await app(pg, 'Staging'); await pg.wait_for_timeout(1500)

async def fastclock(pg, mark, course, mid):
    await start(pg, course, mid)
    await pg.wait_for_timeout(800); mark('clock')
    for _ in range(8):
        for _ in range(6):
            if not await pg.get_by_role('dialog').count(): break
            await pg.get_by_role('dialog').locator('button:not([disabled])').first.click(); await pg.wait_for_timeout(120)
        await pg.get_by_role('button', name='Esperar 30 min').click(); await pg.wait_for_timeout(650)
    mark('done')
async def tf_clock(pg, mark): await fastclock(pg, mark, 'testing-fundamentals', 'm05-release')
async def qp_clock(pg, mark): await fastclock(pg, mark, 'qa-profesional', 'm05-plan')

# ---------- QA Profesional
async def qp_mail(pg, mark):
    await start(pg, 'qa-profesional', 'm00-equipo', mark)
    mark('desk'); await pg.wait_for_timeout(3500)
    mark('clock'); await wait30(pg, 2, 1500)
async def qp_coverage(pg, mark):
    await start(pg, 'qa-profesional', 'm03-cobertura')
    await app(pg, 'Cobertura'); mark('app'); await pg.wait_for_timeout(2500)
    mark('click'); await pg.get_by_role('button', name='Ejecutar la suite · 5 min').click(); await pg.wait_for_timeout(1500); await meeting(pg)
    mark('run'); await pg.wait_for_timeout(3000)
async def qp_metrics(pg, mark):
    await start(pg, 'qa-profesional', 'm06-metricas')
    await app(pg, 'Métricas'); mark('app'); await pg.wait_for_timeout(3500)
    await pg.get_by_role('tab', name='Control', exact=True).click(); mark('control'); await pg.wait_for_timeout(2500)
async def qp_inspection(pg, mark):
    await start(pg, 'qa-profesional', 'm01-inspeccion')
    await app(pg, 'Sala'); mark('app'); await pg.wait_for_timeout(3500)
async def qp_gherkin(pg, mark):
    await start(pg, 'qa-profesional', 'm02-gherkin')
    await pg.wait_for_timeout(500); mark('desk'); await pg.wait_for_timeout(1500)
    await wait30(pg, 1, 1500); await meeting(pg)
    await app(pg, 'Escenarios'); mark('app'); await pg.wait_for_timeout(3500)

# ---------- Karate
async def ide(pg):
    await meeting(pg); await pg.locator('nav button', has_text='IDE Karate').click(); await pg.wait_for_timeout(300)
async def fill(pg, path, content):
    await pg.get_by_role('button', name=path.split('/')[-1], exact=True).click(); await pg.wait_for_timeout(200)
    await pg.get_by_label('Código de '+path).fill(content)
async def ka_ide(pg, mark):
    await start(pg, 'karate-framework', 'm00-hola-karate')
    await ide(pg); mark('ide')
    ed = pg.get_by_label('Código de src/test/java/openapi/accounts.feature')
    await ed.click(); await pg.keyboard.press('Control+End'); await pg.wait_for_timeout(300)
    mark('typing')
    await pg.keyboard.type("    Given path 'health'\nWhen method get\nThen status 200\nAnd match response.status == 'UP'", delay=45)
    mark('typed'); await pg.wait_for_timeout(500)
    await pg.get_by_role('button', name='Ejecutar', exact=True).click(); await pg.wait_for_timeout(1200); await ide(pg); mark('run')
    await pg.get_by_role('tab', name='Consola').click(); await pg.wait_for_timeout(2500); mark('console')
async def ka_pipeline(pg, mark):
    await start(pg, 'karate-framework', 'm08-pipeline')
    await ide(pg)
    for p, f in [('src/test/java/openapi/accounts.feature','m08a.feature'),('src/test/java/openapi/transfers.feature','m08t.feature'),('src/test/java/openapi/OpenApiRunner.java','m08n.java')]:
        await fill(pg, p, open(K+'/'+f).read())
    await pg.get_by_label('Job del pipeline').select_option(label='Nocturno · regresión'); await pg.wait_for_timeout(800)
    mark('click'); await pg.get_by_role('button', name='Pipeline', exact=True).click(); await pg.wait_for_timeout(1500); await ide(pg)
    mark('pipeline'); await pg.wait_for_timeout(3500)
async def ka_exam(pg, mark):
    with psycopg.connect(DB) as c:
        c.execute(f"delete from academy_runs where user_id={UID} and course_key='karate-framework' and mission_id='m10-examen'"); c.commit()
    await pg.goto(f'{BASE}/academy/karate-framework/m10-examen'); await pg.wait_for_timeout(2200)
    mark('briefing'); await pg.wait_for_timeout(4000)

# ---------- Certificados
def certf(course):
    async def f(pg, mark):
        with psycopg.connect(DB) as c:
            code = c.execute(f"select code from academy_certificates where user_id={UID} and course_key=%s", (course,)).fetchone()[0]
        await pg.goto(BASE+'/academy/certificado/'+code); await pg.wait_for_timeout(1500)
        await pg.evaluate("""() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.nodeValue.includes('127.0.0.1:5173')) n.nodeValue = n.nodeValue.replace('http://127.0.0.1:5173', 'https://www.arcesabinengineering.com') } }""")
        await pg.wait_for_timeout(1000); mark('cert'); await pg.wait_for_timeout(4000)
    return f

def reseed():
    M = {'testing-fundamentals': ['m00-primer-dia','m01-historia-ambigua','m02-simulador-prestamos','m03-estados-pago','m04-reportar','m05-release','m06-piramide','m07-incidente'],
         'qa-profesional': ['m00-equipo','m01-inspeccion','m02-gherkin','m03-cobertura','m04-exploratoria','m05-plan','m06-metricas','m07-configuracion','m08-herramientas'],
         'karate-framework': ['m00-hola-karate','m01-match','m02-config','m03-payloads','m04-datos','m05-auth','m06-errores','m07-mocks','m08-pipeline','m09-framework','m10-examen']}
    with psycopg.connect(DB) as c:
        for course, ms in M.items():
            c.execute(f"delete from academy_runs where user_id={UID} and course_key=%s", (course,))
            for mid in ms:
                c.execute("insert into academy_runs (user_id, course_key, mission_id, seed, actions_json, finished, finished_at, created_at, updated_at) values (%s,%s,%s,1,'[]'::jsonb,true,now(),now(),now())", (UID, course, mid))
        c.commit()

SEGS = [('tf_clock',tf_clock),('qp_clock',qp_clock),('tf_mail',tf_mail),('tf_loans',tf_loans),('tf_release',tf_release),('tf_incident',tf_incident),
        ('qp_mail',qp_mail),('qp_coverage',qp_coverage),('qp_metrics',qp_metrics),('qp_inspection',qp_inspection),('qp_gherkin',qp_gherkin),
        ('ka_ide',ka_ide),('ka_pipeline',ka_pipeline),('ka_exam',ka_exam),
        ('cert_tf',certf('testing-fundamentals')),('cert_qp',certf('qa-profesional')),('cert_ka',certf('karate-framework'))]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROMIUM, args=['--force-device-scale-factor=2'])
        ctx = await b.new_context(viewport={'width':W,'height':H}, locale='es-ES'); pg = await ctx.new_page()
        await pg.goto(BASE+'/login'); await pg.wait_for_timeout(1500)
        await pg.locator('#login-email').fill(os.environ['TRAILER_EMAIL'])
        await pg.locator('#login-password').fill(os.environ['TRAILER_PASSWORD']); await pg.locator('#login-password').press('Enter'); await pg.wait_for_timeout(2500)
        try: await pg.get_by_role('button', name='Entendido', exact=True).click(timeout=2000)
        except Exception: pass
        await ctx.storage_state(path=f'{O}/state.json'); await ctx.close()
        global UID
        with psycopg.connect(DB) as c:
            UID = c.execute("select id from users where email=%s", (os.environ['TRAILER_EMAIL'],)).fetchone()[0]
        for n, f in SEGS: await seg(b, n, f)
        reseed()
        await b.close()
asyncio.run(main())
