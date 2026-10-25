import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 0 · rol QA manual). */
export const m00Lessons: Lesson[] = [
  {
    id: 'role',
    question: '¿Qué me toca a mí como QA manual y qué no?',
    conceptId: 'role_qa_manual',
    cost: 5,
    body: `**Es tuyo:**
- tus pruebas y su evidencia;
- tus bug reports;
- tu estado: qué está probado, qué no y qué riesgo ves.

**Lo decides tú:**
- cómo y en qué orden pruebas (riesgo primero);
- cuándo pides ayuda.

**No lo decides tú:**
- si se sale con un riesgo: eso es del dueño del negocio;
- qué petición va antes cuando chocan: eso es de tu Lead.

Tu trabajo es que quien decide lo haga con la mejor información posible.`,
  },
  {
    id: 'status',
    question: '¿Cómo doy un estado de pruebas que sirva?',
    conceptId: 'honest_status',
    cost: 5,
    body: `Cuatro partes, en este orden:
1. **Hecho:** qué está probado y cómo ha ido.
2. **Pendiente:** qué falta y cuánto calculas.
3. **Bloqueos:** qué te frena (entorno, un bug sin aceptar, datos).
4. **Riesgo:** qué puede pasar si se sale hoy.

Evita «casi está», «va bien» o «creo». Un estado optimista no ayuda a nadie: quita a los demás la oportunidad de reaccionar mientras aún hay tiempo.`,
  },
  {
    id: 'reject',
    question: 'Un desarrollador rechaza mi bug: ¿qué hago?',
    conceptId: 'evidence_based',
    cost: 5,
    body: `1. **Reprodúcelo** y busca la condición que lo dispara (red lenta, un dato, un dispositivo).
2. **Adjunta evidencia:** pasos exactos, datos, entorno, vídeo y hora del log.
3. **Habla del problema, no de la persona:** «pasa con red lenta» en vez de «no lo has probado bien».
4. **Ofrece verlo juntos** diez minutos.
5. Solo si aun así no hay acuerdo, **escala** a tu Lead con los hechos.

Un bug sin evidencia es una opinión; con evidencia es un hecho.`,
  },
  {
    id: 'sign',
    question: 'Me piden firmar algo que no he probado. ¿Qué hago?',
    conceptId: 'risk_ownership',
    cost: 5,
    body: `No firmes, pero tampoco te limites a decir que no:
- **Explica** qué está probado y qué no.
- **Ofrece opciones:** probar primero lo crítico, reducir el alcance, desactivar lo no probado o retrasar.
- **Déjalo por escrito** en el ticket.
- **Deja la decisión a quien le toca:** salir con un riesgo conocido es una decisión legítima del negocio. Lo que no es legítimo es esconder el riesgo detrás de tu firma.

Bloquear tú sola el release también es salirte de tu rol.`,
  },
  {
    id: 'priorities',
    question: 'Me piden tres cosas a la vez. ¿A qué digo que sí?',
    conceptId: 'priority_negotiation',
    cost: 5,
    body: `Entre «sí a todo» y «no» hay una respuesta mejor:
- **Qué puedo hacer** y **cuándo** («hoy no; mañana a primera hora, una hora»).
- **Qué dejaría de hacer** si lo hago ahora.
- **Quién decide** si dos peticiones chocan: tu Lead, no tú ni quien pide más fuerte.

Decir que sí a todo parece amable, pero acaba en entregas tarde para todos.`,
  },
  {
    id: 'help',
    question: '¿Cuándo tengo que pedir ayuda?',
    conceptId: 'ask_help',
    cost: 5,
    body: `**Pronto:** en cuanto el cálculo no cuadra, no en la reunión final.

**Concreto:** qué falta, cuánto tiempo y qué propones (ayuda, reducir el alcance o avisar en el go/no-go).

Pedir ayuda no es debilidad: es dar a tu Lead la información para que pueda hacer su trabajo. Lo que hace daño es la sorpresa.`,
  },
]
