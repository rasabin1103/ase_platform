import ExcelJS from 'exceljs'
import { ASE_BRAND, ASE_BRAND_HEX, loadAseLogoDataUrl } from './exportBranding'

export type ExcelReportOptions = {
  /** File name to save as, e.g. `ase-compras-2026-08-26.xlsx`. */
  filename: string
  /** Worksheet tab name (Excel caps this at 31 chars, handled internally). */
  sheetName: string
  /** Report title printed in the corporate header block, e.g. "Compras". */
  title: string
  /** Optional line under the title, e.g. an applied date-range filter. */
  subtitle?: string
  /** Flat row objects — each key becomes a column header, in insertion order. */
  rows: Record<string, unknown>[]
  /** Name/email of the admin who triggered the export, shown in the meta line. */
  generatedBy?: string
  lang?: 'es' | 'en'
}

function triggerBrowserDownload(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Turns an array of flat objects into a branded, single-sheet .xlsx
 * workbook and triggers a browser download — client-side only, no backend
 * endpoint needed. Uses ExcelJS (not the `xlsx`/SheetJS dependency used
 * elsewhere to *read* uploaded spreadsheets) because SheetJS's community
 * build silently drops cell styling on write; ExcelJS gives us real ASE
 * brand fills, fonts, borders, and an embedded logo for a genuinely
 * corporate report instead of a plain data dump. */
export async function downloadBrandedExcel({
  filename,
  sheetName,
  title,
  subtitle,
  rows,
  generatedBy,
  lang = 'es',
}: ExcelReportOptions): Promise<void> {
  if (rows.length === 0) return

  const columns = Object.keys(rows[0])
  const colCount = Math.max(columns.length, 2)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = ASE_BRAND.companyName
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ showGridLines: false }],
  })

  // Reasonable default column widths, generous enough for typical
  // headers/emails/titles without the caller needing to size them.
  columns.forEach((header, index) => {
    sheet.getColumn(index + 1).width = Math.min(48, Math.max(16, header.length + 6))
  })

  const ink = 'FF' + ASE_BRAND_HEX.ink
  const brand = 'FF' + ASE_BRAND_HEX.brand
  const brandStrong = 'FF' + ASE_BRAND_HEX.brandStrong
  const white = 'FFFFFFFF'
  const chalk = 'FF' + ASE_BRAND_HEX.chalk
  const fog = 'FF' + ASE_BRAND_HEX.fog
  const line = 'FF' + ASE_BRAND_HEX.line

  // --- Corporate header block (rows 1-4): dark band with company name,
  // report title, optional subtitle, and a generated-on/by meta line.
  const bandRows = subtitle ? 4 : 3
  for (let r = 1; r <= bandRows; r += 1) {
    sheet.mergeCells(r, 1, r, colCount)
    sheet.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ink } }
  }
  sheet.getRow(1).height = 24
  sheet.getRow(2).height = 20
  if (subtitle) sheet.getRow(3).height = 16

  const companyCell = sheet.getCell(1, 1)
  companyCell.value = `      ${ASE_BRAND.companyName}`
  companyCell.font = { bold: true, size: 12, color: { argb: brand } }
  companyCell.alignment = { vertical: 'middle', indent: 1 }

  const titleCell = sheet.getCell(2, 1)
  titleCell.value = `      ${title}`
  titleCell.font = { bold: true, size: 14, color: { argb: white } }
  titleCell.alignment = { vertical: 'middle', indent: 1 }

  let metaRow = 3
  if (subtitle) {
    const subtitleCell = sheet.getCell(3, 1)
    subtitleCell.value = `      ${subtitle}`
    subtitleCell.font = { italic: true, size: 9, color: { argb: fog } }
    subtitleCell.alignment = { vertical: 'middle', indent: 1 }
    metaRow = 4
  }

  const generatedLabel = lang === 'en' ? 'Generated' : 'Generado'
  const byLabel = generatedBy ? (lang === 'en' ? ` by ${generatedBy}` : ` por ${generatedBy}`) : ''
  const metaCell = sheet.getCell(metaRow, 1)
  metaCell.value = `      ${generatedLabel} ${new Date().toLocaleString()}${byLabel} · ${ASE_BRAND.website}`
  metaCell.font = { size: 8, color: { argb: fog } }
  metaCell.alignment = { vertical: 'middle', indent: 1 }
  sheet.getRow(metaRow).height = 16

  // Embed the ASE icon logo over the header band, top-left.
  const logoDataUrl = await loadAseLogoDataUrl()
  if (logoDataUrl) {
    try {
      const base64 = logoDataUrl.split(',')[1] ?? ''
      const imageId = workbook.addImage({ base64, extension: 'png' })
      sheet.addImage(imageId, { tl: { col: 0.08, row: 0.12 }, ext: { width: 42, height: 42 } })
    } catch {
      // Logo unavailable/malformed — the text-only header still reads fine.
    }
  }

  // --- Table header row
  const headerRowIndex = bandRows + 2 // one blank spacer row after the band
  const headerRow = sheet.getRow(headerRowIndex)
  columns.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = header
    cell.font = { bold: true, size: 10, color: { argb: white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandStrong } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: line } } }
  })
  headerRow.height = 20

  // --- Data rows with zebra striping and thin borders
  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowIndex)
    const isEven = rowIndex % 2 === 0
    columns.forEach((column, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1)
      cell.value = (row[column] ?? '') as ExcelJS.CellValue
      cell.font = { size: 10, color: { argb: 'FF' + ASE_BRAND_HEX.graphite } }
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: chalk } }
      }
      cell.border = { bottom: { style: 'hair', color: { argb: line } } }
    })
  })

  // Autofilter over the header + data range.
  const lastDataRow = headerRowIndex + rows.length
  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: lastDataRow, column: colCount },
  }
  sheet.views = [{ state: 'frozen', ySplit: headerRowIndex, showGridLines: false }]

  // --- Confidentiality footer row
  const footerRowIndex = lastDataRow + 2
  sheet.mergeCells(footerRowIndex, 1, footerRowIndex, colCount)
  const footerCell = sheet.getCell(footerRowIndex, 1)
  footerCell.value =
    lang === 'en'
      ? `${ASE_BRAND.companyName} · Confidential internal report · ${ASE_BRAND.website}`
      : `${ASE_BRAND.companyName} · Informe confidencial de uso interno · ${ASE_BRAND.website}`
  footerCell.font = { italic: true, size: 8, color: { argb: fog } }

  const buffer = await workbook.xlsx.writeBuffer()
  triggerBrowserDownload(buffer as ArrayBuffer, filename)
}
