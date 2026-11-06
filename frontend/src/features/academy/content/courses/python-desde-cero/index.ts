import type { LessonModule } from '../../../learn/types'
import { m01PrimerPrograma } from './m01-primer-programa'
import { m02Decidir } from './m02-decidir'
import { m03Repetir } from './m03-repetir'
import { m04Colecciones } from './m04-colecciones'
import { m05Funciones } from './m05-funciones'
import { m06TextosErrores } from './m06-textos-errores'
import { m07Ficheros } from './m07-ficheros'
import { m08OrdenarCodigo } from './m08-ordenar-codigo'
import { m09ProyectoFinal } from './m09-proyecto-final'

/** Módulos del curso «Python desde cero», en orden (los registra learn/registry.ts). */
export const MODULES_PYB: LessonModule[] = [m01PrimerPrograma, m02Decidir, m03Repetir, m04Colecciones, m05Funciones, m06TextosErrores, m07Ficheros, m08OrdenarCodigo, m09ProyectoFinal]
