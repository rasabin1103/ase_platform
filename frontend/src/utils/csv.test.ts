import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv } from './csv'

/** Captures the Blob passed to URL.createObjectURL so the CSV text itself
 * can be asserted on, without downloadCsv actually navigating the browser. */
function captureDownloadedCsv(): { getText: () => Promise<string>; clickedFilename: () => string | undefined } {
  let capturedBlob: Blob | null = null
  let clickedFilename: string | undefined

  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => {
    capturedBlob = blob
    return 'blob:mock-url'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clickedFilename = this.download
  })

  return {
    getText: async () => {
      if (!capturedBlob) throw new Error('No blob was captured — was downloadCsv called?')
      return await (capturedBlob as Blob).text()
    },
    clickedFilename: () => clickedFilename,
  }
}

describe('downloadCsv', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does nothing for an empty row set', () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    downloadCsv('empty', [])
    expect(spy).not.toHaveBeenCalled()
  })

  it('writes a header row from the first object\'s keys, then one line per row', async () => {
    const capture = captureDownloadedCsv()
    downloadCsv('report', [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ])
    const text = await capture.getText()
    expect(text).toBe('name,age\r\nAlice,30\r\nBob,25')
  })

  it('quotes values containing commas, quotes, or newlines, escaping embedded quotes', async () => {
    const capture = captureDownloadedCsv()
    downloadCsv('report', [{ note: 'has, a comma' }, { note: 'has "quotes"' }, { note: 'has\na newline' }])
    const text = await capture.getText()
    const lines = text.split('\r\n')
    expect(lines[1]).toBe('"has, a comma"')
    expect(lines[2]).toBe('"has ""quotes"""')
    expect(lines[3]).toBe('"has\na newline"')
  })

  it('renders null/undefined cell values as an empty string', async () => {
    const capture = captureDownloadedCsv()
    downloadCsv('report', [{ value: null }, { value: undefined }])
    const text = await capture.getText()
    expect(text).toBe('value\r\n\r\n')
  })

  it('appends .csv to the filename only if missing', () => {
    const capture = captureDownloadedCsv()
    downloadCsv('report', [{ a: 1 }])
    expect(capture.clickedFilename()).toBe('report.csv')

    const capture2 = captureDownloadedCsv()
    downloadCsv('report.csv', [{ a: 1 }])
    expect(capture2.clickedFilename()).toBe('report.csv')
  })
})
