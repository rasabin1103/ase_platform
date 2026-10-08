import type { RequirementsReviewModel } from '../../../engine/types'

/**
 * KOB-151 · Transferencias programadas, tal como llega al refinamiento.
 * 8 defectos reales (uno de ellos, una contradicción entre dos fragmentos)
 * y 2 fragmentos correctos que sirven de distractores.
 */
export const m01Review: RequirementsReviewModel = {
  storyId: 'KOB-151',
  reviewer: 'marta',
  submitCost: 10,
  fragments: [
    {
      id: 'd1',
      section: 'description',
      text: 'Funcionalidad para que el cliente programe pagos entre sus propias cuentas sin tener que acordarse de hacerlos.',
      issue: {
        types: ['contradictory', 'ambiguous'],
        key: 'destination',
        explanation: 'La descripción dice «entre sus propias cuentas», pero el criterio 7 pone como ejemplo pagar el alquiler a un casero, que es una cuenta de terceros.',
        clarifyFlag: 'clar.destination',
        clarification: 'A cualquier cuenta, propia o de terceros. Pagar el alquiler es justo el caso de uso principal.',
      },
    },
    {
      id: 'f1',
      section: 'criteria',
      text: '1. El cliente elige la fecha de ejecución.',
      issue: {
        types: ['incomplete', 'ambiguous'],
        key: 'date',
        explanation: 'No dice qué fechas son válidas: ¿hoy?, ¿fechas pasadas?, ¿hasta cuándo?, ¿qué pasa en fin de semana?',
        clarifyFlag: 'clar.date',
        clarification: 'Desde mañana y hasta 365 días. Si cae en fin de semana, se ejecuta el lunes siguiente.',
      },
    },
    {
      id: 'f2',
      section: 'criteria',
      text: '2. Puede elegir la frecuencia: una vez, semanal o mensual.',
      issue: {
        types: ['incomplete'],
        key: 'monthly',
        explanation: 'Falta qué pasa con una mensual que empieza el día 29, 30 o 31 en los meses que no tienen ese día.',
        clarifyFlag: 'clar.monthly',
        clarification: 'Si el mes no tiene ese día, se ejecuta el último día del mes.',
      },
    },
    {
      id: 'f3',
      section: 'criteria',
      text: '3. Se aplican los mismos límites que en una transferencia normal.',
      issue: {
        types: ['ambiguous', 'incomplete'],
        key: 'limits',
        explanation: '«Los mismos límites»: ¿cuáles?, ¿se comprueban al programar o el día de la ejecución?',
        clarifyFlag: 'clar.limits',
        clarification: 'El máximo de 5.000 € por operación se valida al programar; el límite diario de 6.000 €, el día de ejecución.',
      },
    },
    {
      id: 'f4',
      section: 'criteria',
      text: '4. La fecha de fin es opcional en las recurrentes y, si se indica, debe ser posterior o igual a la de inicio.',
      fineReply: 'esto está claro: opcional y, si se pone, no anterior al inicio.',
    },
    {
      id: 'f5',
      section: 'criteria',
      text: '5. El cliente puede cancelar una transferencia programada.',
      issue: {
        types: ['incomplete', 'ambiguous'],
        key: 'cancel',
        explanation: 'En una recurrente, ¿se cancela solo la próxima ejecución o toda la serie? ¿Hasta cuándo se puede cancelar?',
        clarifyFlag: 'clar.cancel',
        clarification: 'En las recurrentes, el cliente elige «solo la próxima» o «toda la serie». Se puede cancelar hasta el día anterior.',
      },
    },
    {
      id: 'f6',
      section: 'criteria',
      text: '6. El sistema debe ser rápido y fácil de usar.',
      issue: {
        types: ['untestable', 'ambiguous'],
        key: 'nfr',
        explanation: '«Rápido» y «fácil» no se pueden verificar: no hay ningún umbral ni forma objetiva de comprobarlo.',
        clarifyFlag: 'clar.nfr',
        clarification: 'Confirmar una programación debe tardar menos de 2 segundos; la facilidad de uso la validamos con 5 clientes antes de la release.',
      },
    },
    {
      id: 'f7',
      section: 'criteria',
      text: '7. Ejemplo: pagar el alquiler al casero el día 1 de cada mes.',
      issue: {
        types: ['contradictory'],
        key: 'destination',
        explanation: 'La descripción dice «entre sus propias cuentas», pero el criterio 7 pone como ejemplo pagar el alquiler a un casero, que es una cuenta de terceros.',
        clarifyFlag: 'clar.destination',
        clarification: 'A cualquier cuenta, propia o de terceros. Pagar el alquiler es justo el caso de uso principal.',
      },
    },
    {
      id: 'f8',
      section: 'criteria',
      text: '8. Si no hay saldo suficiente, la transferencia no se ejecuta.',
      issue: {
        types: ['incomplete'],
        key: 'nofunds',
        explanation: 'No dice si se reintenta ni si se avisa: el cliente no sabría que su alquiler no se ha pagado.',
        clarifyFlag: 'clar.nofunds',
        clarification: 'Se reintenta una vez a las 18:00 y, si vuelve a fallar, se avisa al cliente por email y en la app.',
      },
    },
    {
      id: 'f9',
      section: 'criteria',
      text: '9. El importe admite hasta 2 decimales.',
      fineReply: 'correcto, igual que en las transferencias normales.',
    },
    {
      id: 'f10',
      section: 'criteria',
      text: '10. Se notifica al cliente.',
      issue: {
        types: ['incomplete', 'ambiguous', 'untestable'],
        key: 'notify',
        explanation: '¿Cuándo, por qué canal y de qué se le notifica?',
        clarifyFlag: 'clar.notify',
        clarification: 'Un email el día anterior a cada ejecución y otro cuando se ejecuta.',
      },
    },
  ],
}
