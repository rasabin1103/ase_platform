import { describe, expect, it } from 'vitest'
import { formatJobTitle, parseJobDescription } from './jobDescription'

const RAW =
  '🇺🇸 100 % REMOTO | SOLO USA 📄 Contrato: Contractor ⏰ Dedicación: Part-time 💰 Compensación: No especificada 🚍 ¿EN QUÉ CONSISTE? Buscan Senior Data Analysts para mejorar la calidad de sistemas de IA. 🛠️ ¿QUÉ HARÁS? ✅ Evaluar respuestas ✅ Revisar datos'

describe('parseJobDescription', () => {
  it('separa etiquetas, datos clave y secciones de un anuncio pegado en una línea', () => {
    const p = parseJobDescription(RAW)
    expect(p.highlights).toEqual(['100 % Remoto', 'Solo USA'])
    expect(p.facts.map((f) => f.label)).toEqual(['Contrato', 'Dedicación', 'Compensación'])
    expect(p.facts[2].missing).toBe(true)
    expect(p.sections.map((s) => s.heading)).toEqual(['¿En qué consiste?', '¿Qué harás?'])
    expect(p.sections[1].bullets).toEqual(['Evaluar respuestas', 'Revisar datos'])
    expect(p.summary).toMatch(/^Buscan Senior Data Analysts/)
  })

  it('deja el texto normal como párrafos', () => {
    const p = parseJobDescription('Buscamos una persona QA.\n\nTrabajo en equipo con desarrollo.')
    expect(p.facts).toEqual([])
    expect(p.sections[0].paragraphs).toHaveLength(2)
  })

  it('suaviza títulos en mayúsculas sin romper siglas', () => {
    expect(formatJobTitle('SENIOR DATA ANALYST – AI EVALUATION')).toBe('Senior Data Analyst – AI Evaluation')
    expect(formatJobTitle('Quality Analyst')).toBe('Quality Analyst')
  })
})
