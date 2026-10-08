import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { listPlansCatalog } from '../../api/plansCatalog.api'
import { useI18n } from '../../i18n'

/**
 * Carga el catálogo público de planes (misma caché que la página de precios)
 * y lo publica en el contexto de i18n, para que cualquier texto con
 * marcadores {{plan:…}} muestre los nombres reales de la base de datos.
 */
export function PlanNamesSync() {
  const { setPlans } = useI18n()
  const query = useQuery({
    queryKey: ['plans', 'public-catalog'],
    queryFn: listPlansCatalog,
    staleTime: 5 * 60_000,
    // Si falla, los textos usan una expresión genérica; no merece un aviso.
    meta: { suppressGlobalError: true },
  })
  useEffect(() => {
    if (query.data) setPlans(query.data)
  }, [query.data, setPlans])
  return null
}
