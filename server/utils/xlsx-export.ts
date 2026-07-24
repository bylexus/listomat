import ExcelJS from 'exceljs'
import type { ExportStatus } from './export'
import { sanitizeSheetName } from './export'
import type { ExportEntry, ExportGroup } from './pdf-export'

export async function buildListXlsx(
  listName: string,
  groups: ExportGroup[],
  status: ExportStatus
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sanitizeSheetName(listName))

  sheet.columns = [{ width: 8 }, { width: 40 }, { width: 40 }]

  const titleRow = sheet.addRow([listName])
  titleRow.getCell(1).font = { bold: true, size: 16 }
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 3)

  for (const group of groups) {
    if (group.entries.length === 0) continue

    sheet.addRow([])
    const groupRow = sheet.addRow([group.name])
    for (let col = 1; col <= 3; col++) {
      const cell = groupRow.getCell(col)
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
    }
    sheet.mergeCells(groupRow.number, 1, groupRow.number, 3)

    for (const entry of group.entries) {
      addEntryRow(sheet, entry, status)
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function addEntryRow(sheet: ExcelJS.Worksheet, entry: ExportEntry, status: ExportStatus) {
  const done = status === 'current' && entry.done ? 'x' : ''
  const row = sheet.addRow([done, entry.name, entry.comment ?? ''])
  row.getCell(1).alignment = { horizontal: 'center' }
}
