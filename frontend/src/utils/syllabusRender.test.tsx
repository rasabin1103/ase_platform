import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownContent } from '../components/catalog/MarkdownViewer'
import { I18nProvider } from '../i18n'
import { syllabusMarkdown, upsertSyllabus } from '../features/academy/syllabus'

describe('temario de Academy en la descripción', () => {
  it('no muestra los marcadores y se sustituye al actualizar', () => {
    const block = syllabusMarkdown('qa-profesional', 'es')
    const desc = upsertSyllabus(upsertSyllabus('Intro del curso.', block), block)
    expect(desc.split('[//]: # (temario-academy)').length - 1).toBe(1)
    const { container } = render(
      <I18nProvider>
        <MarkdownContent content={desc} />
      </I18nProvider>,
    )
    expect(container.textContent).toContain('Misiones del curso')
    expect(container.textContent).toContain('El plan')
    expect(container.textContent).not.toContain('temario')
  })
})
