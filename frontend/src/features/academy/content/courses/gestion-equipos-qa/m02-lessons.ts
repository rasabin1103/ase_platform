import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 2 · rol QA Engineer). */
export const m02Lessons: Lesson[] = [
  {
    id: 'role',
    question: '¿Qué cambia de QA manual a QA Engineer?',
    conceptId: 'role_qa_engineer',
    cost: 5,
    body: `Sigues probando, pero ahora eres responsable de la **red de seguridad del equipo**: la suite automática, sus datos, sus entornos y que sea fiable.

**Es tuyo:**
- decidir qué automatizar;
- decidir qué hacer con un test que no aporta;
- enseñar a otros a escribir buenos tests.

**No es tuyo:**
- decidir el tiempo del sprint: se negocia;
- ser el dueño de todos los tests: cada squad cuida los suyos.`,
  },
  {
    id: 'triage',
    question: 'Un test falla una de cada diez veces. ¿Qué hago?',
    conceptId: 'flaky_triage',
    cost: 5,
    body: `Primero, **por qué falla**. Mira los logs de los fallos, no solo el último.

Según la causa:
- **Falla el test:** esperas fijas, datos compartidos, zona horaria. Si aporta, **arréglalo**.
- **Depende de algo externo:** simúlalo en el pipeline y deja la prueba real aparte.
- **Aporta, pero arreglarlo es caro:** **cuarentena** con ticket, dueño y fecha.
- **Prueba algo que ya no existe o está duplicado:** **bórralo**.
- **Falla el producto:** **reporta el bug**. Un fallo intermitente puede ser una carrera real.`,
  },
  {
    id: 'quarantine',
    question: '¿Qué diferencia hay entre cuarentena y desactivar un test?',
    conceptId: 'quarantine',
    cost: 5,
    body: `**Cuarentena:**
- el test sale del pipeline que bloquea el merge, pero **sigue ejecutándose** (por ejemplo, cada noche);
- tiene un **ticket**, un **dueño** y una **fecha** para volver o desaparecer.

**Desactivarlo** («skip», comentarlo):
- nadie lo vuelve a mirar;
- dentro de seis meses nadie sabe por qué está así.

Si alguien desactiva tests para poder trabajar, no le riñas: el problema es la suite. Ofrécele la cuarentena.`,
  },
  {
    id: 'retries',
    question: '¿Por qué no pongo reintentos automáticos y listo?',
    conceptId: 'retries_hide',
    cost: 5,
    body: `Porque el verde deja de significar algo:
- un test con esperas mal hechas pasa al segundo intento, y nadie lo arregla;
- un **bug intermitente real** (una carrera, una caché) también pasa al segundo intento, y **llega a producción**.

Los reintentos pueden tener sentido muy acotados, en un test concreto y con un motivo conocido. Como solución general, esconden el problema.`,
  },
  {
    id: 'capacity',
    question: '¿Cómo pido tiempo para arreglar la suite?',
    conceptId: 'negotiate_capacity',
    cost: 5,
    body: `Con lo que necesita quien decide:
- **El problema, con datos:** «8 tests causan el 90 % de los rojos».
- **Qué pides:** «el 20 % de mi tiempo durante dos sprints».
- **Para qué:** «pipeline en verde más del 95 %».
- **Cuándo lo revisamos:** «en dos semanas».

Evita los extremos: «el sprint entero para reescribirla» asusta y no garantiza nada. «En mis ratos libres» lo hace invisible, y no se hace.`,
  },
  {
    id: 'ownership',
    question: '¿Quién arregla un test cuando se rompe?',
    conceptId: 'test_ownership',
    cost: 5,
    body: `**Quien lo rompe**, antes de mergear. Cada test tiene un squad dueño.

El QA Engineer:
- pone las **reglas**: nada de «skip»; la cuarentena, con ticket;
- enseña **patrones**: esperas por condición, datos propios por test, dobles para lo externo;
- **ayuda** cuando hace falta.

Si te quedas con todos los tests, los devs dejan de cuidarlos y tú pasas a ser el cuello de botella de la calidad.`,
  },
]
