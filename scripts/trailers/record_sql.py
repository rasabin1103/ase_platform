"""Planos del tráiler de «SQL desde cero» (curso 5). Mismas reglas que record.py:
base de datos local, alumna ficticia y nunca mostrar respuestas: solo consultas
de exploración que no resuelven ningún encargo, ni pistas, ni opciones de las reuniones."""
import asyncio, json, os, sys, time
import psycopg
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
O = os.environ.get('TRAILER_WORK', os.path.join(HERE, 'work'))
os.makedirs(O, exist_ok=True)
CHROMIUM = os.environ.get('CHROMIUM_PATH') or None
BASE = os.environ.get('TRAILER_BASE_URL', 'http://127.0.0.1:5173')
DB = os.environ.get('TRAILER_DB', 'postgresql://ase:ase@localhost:5432/ase_mig')  # SOLO base de datos local
W, H = 1440, 810
COURSE = 'sql-iniciacion'
only = sys.argv[1:] or None
UID = None


async def seg(b, name, fn):
    if only and name not in only: return
    ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, record_video_dir=f'{O}/raw_{name}',
                              record_video_size={'width': W * 2, 'height': H * 2}, storage_state=f'{O}/state.json', locale='es-ES')
    t0 = time.monotonic(); m = []
    pg = await ctx.new_page()
    def mark(label): m.append((label, round(time.monotonic() - t0, 2)))
    try: await fn(pg, mark)
    except Exception as e:
        print('ERR', name, e); await pg.screenshot(path=f'{O}/err_{name}.png')
    mark('end')
    path = await pg.video.path()
    await ctx.close()
    json.dump({'video': path, 'marks': m}, open(f'{O}/marks_{name}.json', 'w'), indent=1)
    print(name, m)


async def start(pg, mid):
    with psycopg.connect(DB) as c:
        c.execute("delete from academy_runs where user_id=%s and course_key=%s and mission_id=%s", (UID, COURSE, mid)); c.commit()
    await pg.goto(f'{BASE}/academy/{COURSE}/{mid}'); await pg.wait_for_timeout(2200)
    try: await pg.get_by_role('button', name='Entendido').click(timeout=1000)
    except Exception: pass
    await pg.wait_for_timeout(800)
    b = pg.get_by_role('button', name='Hacer el diagnóstico')
    if await b.count():
        await b.click(); await pg.wait_for_timeout(300)
        n = await pg.get_by_role('radiogroup').count()
        for i in range(n):
            await pg.get_by_role('radiogroup').nth(i).get_by_role('radio').nth(1).click(); await pg.wait_for_timeout(40)
    await pg.get_by_role('button', name='Empezar la jornada').click(); await pg.wait_for_timeout(1000)


async def console(pg, mid, waits=0):
    await start(pg, mid)
    for _ in range(waits):
        await close_dialogs(pg)
        await pg.get_by_role('button', name='Esperar 30 min').click(); await pg.wait_for_timeout(500)
    await close_dialogs(pg)
    await pg.locator('nav button', has_text='Consola SQL').first.click()
    await pg.get_by_text('Arrancando PostgreSQL').wait_for(state='detached', timeout=90000)
    await pg.wait_for_timeout(800)


async def close_dialogs(pg):
    for _ in range(6):
        if not await pg.get_by_role('dialog').count(): return
        await pg.get_by_role('dialog').locator('button:not([disabled])').first.click(); await pg.wait_for_timeout(200)


async def type_sql(pg, sql, mark, delay=55):
    ed = pg.get_by_label('Consulta SQL')
    await ed.click(); await pg.keyboard.press('Control+A'); await pg.keyboard.press('Delete'); await pg.wait_for_timeout(300)
    mark('type'); await pg.keyboard.type(sql, delay=delay); await pg.wait_for_timeout(500)
    mark('run'); await pg.get_by_role('button', name='Ejecutar').first.click(); await pg.wait_for_timeout(3200)


async def sq_desk(pg, mark):
    await start(pg, 'm00-primera-consulta')
    mark('desk'); await pg.wait_for_timeout(3500)


async def sq_type(pg, mark):
    # Exploración libre (ningún encargo pide los clientes de Bilbao).
    await console(pg, 'm01-filtrar')
    mark('console'); await pg.wait_for_timeout(1500)
    await type_sql(pg, "SELECT nombre, apellidos, ciudad, segmento\nFROM clientes\nWHERE ciudad = 'Bilbao';", mark)


async def sq_join(pg, mark):
    # Encargos a la vista (sin pistas) y un JOIN que no es la solución de ninguno.
    await console(pg, 'm06-join', waits=4)
    mark('retos'); await pg.wait_for_timeout(2500)
    await type_sql(pg, 'SELECT c.ciudad, COUNT(a.id) AS cuentas\nFROM clientes c\nJOIN cuentas a ON a.cliente_id = c.id\nGROUP BY c.ciudad\nORDER BY cuentas DESC;', mark, 40)


async def sq_tx(pg, mark):
    # El susto del UPDATE sin WHERE, dentro de una transacción abierta (no es ningún encargo).
    await console(pg, 'm08-modificar')
    await type_sql(pg, "BEGIN;\nUPDATE clientes SET ciudad = 'Madrid';", mark, 60)
    mark('banner'); await pg.wait_for_timeout(2500)
    await pg.get_by_label('Consulta SQL').click(); await pg.keyboard.press('Control+A'); await pg.keyboard.type('ROLLBACK;')
    await pg.get_by_role('button', name='Ejecutar').first.click(); await pg.wait_for_timeout(800)


async def sq_exam(pg, mark):
    await console(pg, 'm10-examen')
    mark('exam'); await pg.wait_for_timeout(4500)


async def sq_clock(pg, mark):
    await start(pg, 'm04-contar')
    await pg.wait_for_timeout(800); mark('clock')
    for _ in range(8):
        await close_dialogs(pg)
        await pg.get_by_role('button', name='Esperar 30 min').click(); await pg.wait_for_timeout(650)
    mark('done')


async def cert_sql(pg, mark):
    with psycopg.connect(DB) as c:
        code = c.execute("select code from academy_certificates where user_id=%s and course_key=%s", (UID, COURSE)).fetchone()[0]
    await pg.goto(BASE + '/academy/certificado/' + code); await pg.wait_for_timeout(1500)
    try: await pg.get_by_role('button', name='Entendido').click(timeout=1500)
    except Exception: pass
    await pg.evaluate("""(base) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.nodeValue.includes(base.replace(/^https?:\\/\\//, ''))) n.nodeValue = n.nodeValue.replace(base, 'https://www.arcesabinengineering.com') } }""", BASE)
    await pg.wait_for_timeout(1000); mark('cert'); await pg.wait_for_timeout(4000)


def finish_all():
    """Las misiones grabadas se borran al empezar: se vuelven a dejar terminadas (el certificado las exige)."""
    ms = ['m00-primera-consulta', 'm01-filtrar', 'm02-ordenar', 'm03-nulos', 'm04-contar', 'm05-agrupar', 'm06-join',
          'm07-left-join', 'm08-modificar', 'm09-crear-tabla', 'm10-examen']
    with psycopg.connect(DB) as c:
        for mid in ms:
            if not c.execute("select 1 from academy_runs where user_id=%s and course_key=%s and mission_id=%s and finished", (UID, COURSE, mid)).fetchone():
                c.execute("delete from academy_runs where user_id=%s and course_key=%s and mission_id=%s", (UID, COURSE, mid))
                c.execute("insert into academy_runs (user_id, course_key, mission_id, seed, actions_json, finished, finished_at, created_at, updated_at) values (%s,%s,%s,1,'[]'::jsonb,true,now(),now(),now())", (UID, COURSE, mid))
        c.commit()


SEGS = [('sq_desk', sq_desk), ('sq_type', sq_type), ('sq_join', sq_join), ('sq_tx', sq_tx), ('sq_exam', sq_exam),
        ('sq_clock', sq_clock), ('cert_sql', cert_sql)]


async def main():
    global UID
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROMIUM, args=['--force-device-scale-factor=2'])
        ctx = await b.new_context(viewport={'width': W, 'height': H}, locale='es-ES'); pg = await ctx.new_page()
        await pg.goto(BASE + '/login'); await pg.wait_for_timeout(1500)
        await pg.locator('#login-email').fill(os.environ['TRAILER_EMAIL'])
        await pg.locator('#login-password').fill(os.environ['TRAILER_PASSWORD']); await pg.locator('#login-password').press('Enter'); await pg.wait_for_timeout(2500)
        for name in ('Entendido', 'Omitir por ahora'):
            try: await pg.get_by_role('button', name=name, exact=True).click(timeout=1500)
            except Exception: pass
        await ctx.storage_state(path=f'{O}/state.json'); await ctx.close()
        with psycopg.connect(DB) as c:
            UID = c.execute("select id from users where email=%s", (os.environ['TRAILER_EMAIL'],)).fetchone()[0]
        for n, f in SEGS: await seg(b, n, f)
        finish_all()
        await b.close()

asyncio.run(main())
