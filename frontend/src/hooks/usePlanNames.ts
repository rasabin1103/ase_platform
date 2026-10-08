import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { fillPlanNamesDeep } from '../utils/planNames'

/** Nombres de los planes de la base de datos y relleno de marcadores {{plan:…}}. */
export function usePlanNames() {
  const { planNames, fillPlans } = useI18n()
  return { names: planNames, fill: fillPlans }
}

/** Devuelve un objeto de textos con todos sus marcadores {{plan:…}} rellenos. */
export function usePlanFilledCopy<T>(copy: T): T {
  const { fillPlans } = useI18n()
  return useMemo(() => fillPlanNamesDeep(copy, fillPlans), [copy, fillPlans])
}
