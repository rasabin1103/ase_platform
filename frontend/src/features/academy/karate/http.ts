/** Tipos HTTP compartidos por el intérprete y las APIs simuladas. */

export interface HttpRequest {
  method: string
  /** URL completa, sin query string. */
  url: string
  /** Ruta relativa al host (p. ej. «/v1/accounts/ACC-1001»). */
  path: string
  host: string
  query: Record<string, string[]>
  headers: Record<string, string>
  body?: unknown
  /** Reloj simulado de la ejecución (ms desde el inicio): procesos asíncronos de la API. */
  now?: number
  /**
   * Red saliente: el servidor simulado la usa para llamar a otros servicios
   * (p. ej. un mock de Karate arrancado con karate.start en localhost).
   */
  net?: (req: HttpRequest) => HttpResponse
}

export interface HttpResponse {
  status: number
  headers: Record<string, string>
  body: unknown
  /** Tiempo de respuesta simulado (ms). */
  ms: number
  /** Bugs sembrados que han influido en esta respuesta. */
  bugs?: string[]
}

export type HttpHandler = (req: HttpRequest) => HttpResponse

/** Crea un servidor simulado (con su estado) para los bugs activos indicados. */
export type ServerFactory = (activeBugs: string[]) => HttpHandler

export function jsonResponse(status: number, body: unknown, ms: number, extraHeaders: Record<string, string> = {}, bugs: string[] = []): HttpResponse {
  return { status, body, ms, bugs, headers: { 'Content-Type': 'application/json', ...extraHeaders } }
}
