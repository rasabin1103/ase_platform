import type { QuizQuestion } from '../../../engine/types'

/**
 * Test antes y después de la misión 0. Mismos conceptos, contextos
 * distintos, para medir si el alumno transfiere lo aprendido.
 */
export const m00Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'pre_partitions',
      conceptId: 'equivalence',
      question: 'Un campo admite edades de 18 a 65 años. ¿Qué conjunto de valores cubre una partición de equivalencia cada uno?',
      options: ['18, 30 y 65', '10, 30 y 80', '1, 2, 3 y 4', 'Solo 30, el valor típico'],
      correct: 1,
      explanation: 'Hay tres grupos: por debajo (10), dentro (30) y por encima (80). 18 y 65 son valores límite, no particiones distintas.',
    },
    {
      id: 'pre_boundaries',
      conceptId: 'boundary_values',
      question: 'Un pago admite como máximo 100 € por operación. ¿Qué par de valores prueba mejor el límite superior?',
      options: ['50 € y 100 €', '99 € y 200 €', '100 € y 100,01 €', '0 € y 100 €'],
      correct: 2,
      explanation: 'Justo en el límite (100 €, válido) y justo fuera (100,01 €, inválido): ahí es donde se equivoca el «>» por «>=».',
    },
    {
      id: 'pre_static',
      conceptId: 'static_testing',
      question: 'Un criterio de aceptación dice «el importe debe ser válido». ¿Qué haces primero?',
      options: [
        'Pruebo lo que me parezca razonable',
        'Lo doy por probado si no veo errores',
        'Espero a que algún cliente lo reporte',
        'Pregunto a la PO qué significa exactamente y lo dejo escrito',
      ],
      correct: 3,
      explanation: 'Un requisito ambiguo es un defecto. Aclararlo antes de probar (testing estático) es lo más barato.',
    },
    {
      id: 'pre_report',
      conceptId: 'bug_anatomy',
      question: '¿Qué es imprescindible en un bug report?',
      options: [
        'Pasos para reproducirlo, resultado esperado y resultado obtenido',
        'Quién ha causado el error',
        'Solo una captura de pantalla',
        'Que sea breve: «no funciona»',
      ],
      correct: 0,
      explanation: 'Si el desarrollador no puede reproducirlo, no puede arreglarlo. Pasos, esperado, obtenido y evidencia.',
    },
    {
      id: 'pre_retest',
      conceptId: 'regression',
      question: 'El desarrollador te dice que ya ha corregido un bug. ¿Qué haces?',
      options: [
        'Lo cierro: confío en el equipo',
        'Le pido que lo cierre él',
        'Re-pruebo el caso en el build nuevo y repito los casos relacionados',
        'Espero a ver si falla en producción',
      ],
      correct: 2,
      explanation: 'QA abre y QA cierra: re-test del caso que falló y regresión de lo relacionado, siempre en el build nuevo.',
    },
    {
      id: 'pre_risk',
      conceptId: 'risk_based',
      question: 'Tienes una hora y cinco zonas por probar. ¿Cómo decides el orden?',
      options: ['Por orden alfabético', 'Por probabilidad de fallo × impacto', 'Empiezo por lo más rápido', 'Lo que diga el desarrollador'],
      correct: 1,
      explanation: 'Testing basado en riesgos: primero lo que tiene más probabilidad de fallar y más impacto si falla.',
    },
  ],
  post: [
    {
      id: 'post_partitions',
      conceptId: 'equivalence',
      question: 'Un campo «número de pasajeros» admite de 1 a 9. ¿Qué valores cubren una partición cada uno?',
      options: ['1, 5 y 9', '5, 5 y 5', '0, 5 y 12', '1, 2 y 3'],
      correct: 2,
      explanation: 'Por debajo (0), dentro (5) y por encima (12). 1 y 9 serían los valores límite.',
    },
    {
      id: 'post_boundaries',
      conceptId: 'boundary_values',
      question: 'Una contraseña admite de 8 a 20 caracteres. ¿Qué valores pruebas para el límite inferior?',
      options: ['7 y 8 caracteres', '8 y 20 caracteres', '1 y 100 caracteres', '10 y 15 caracteres'],
      correct: 0,
      explanation: 'Justo fuera (7, inválido) y justo en el límite (8, válido).',
    },
    {
      id: 'post_static',
      conceptId: 'static_testing',
      question: 'La historia dice «se respetan los límites de la cuenta», sin cifras, y la wiki tiene unas de hace meses. ¿Qué haces?',
      options: [
        'Uso las de la wiki',
        'Pregunto a la PO las cifras exactas antes de diseñar los casos',
        'Pruebo con valores al azar',
        'Lo ignoro, no es mi trabajo',
      ],
      correct: 1,
      explanation: 'La documentación puede estar desactualizada; la fuente de verdad es la PO, y su respuesta debe quedar en el ticket.',
    },
    {
      id: 'post_report',
      conceptId: 'bug_anatomy',
      question: 'El desarrollador no consigue reproducir tu bug. ¿Qué le falta casi seguro a tu report?',
      options: ['Una severidad más alta', 'Un título más largo', 'Los pasos exactos con los datos usados y la evidencia', 'Más contexto sobre la demo'],
      correct: 2,
      explanation: 'Datos exactos y evidencia (la ejecución o el log) son lo que permite reproducirlo.',
    },
    {
      id: 'post_retest',
      conceptId: 'regression',
      question: 'Tras un fix en el formato decimal, ¿qué más deberías probar además del caso que falló?',
      options: [
        'Nada más',
        'Los casos con decimales que antes funcionaban',
        'Solo el login',
        'Nada: probaré en producción',
      ],
      correct: 1,
      explanation: 'Un cambio puede romper lo que funcionaba: eso es una regresión, y se detecta repitiendo casos relacionados.',
    },
    {
      id: 'post_risk',
      conceptId: 'risk_based',
      question: 'En una app de pagos, con poco tiempo: ¿qué pruebas antes, el texto del concepto o el importe con decimales?',
      options: [
        'El concepto, es más rápido',
        'Los dos a la vez y por encima',
        'Ninguno: lo prueba el desarrollador',
        'El importe: más probabilidad de fallo y mucho más impacto',
      ],
      correct: 3,
      explanation: 'El importe combina lógica compleja (probabilidad alta) con dinero (impacto alto).',
    },
  ],
}
