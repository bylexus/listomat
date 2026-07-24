import PDFDocument from 'pdfkit'
import type { ExportStatus } from './export'

export interface ExportEntry {
  name: string
  comment: string | null
  done: boolean
}

export interface ExportGroup {
  name: string
  entries: ExportEntry[]
}

const MM = 72 / 25.4
const MARGIN = 15 * MM
const COLUMN_GAP = 16
const GROUP_GAP = 16
const GROUP_TITLE_GAP_AFTER = 6
const ENTRY_GAP = 5
const CHECKBOX_SIZE = 8
const CHECKBOX_GAP = 6
const COMMENT_GAP_ABOVE = 1.5

const GROUP_TITLE_FONT_SIZE = 11
const ENTRY_NAME_FONT_SIZE = 9.5
const ENTRY_COMMENT_FONT_SIZE = 8

export async function buildListPdf(
  listName: string,
  groups: ExportGroup[],
  status: ExportStatus
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN }
    })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height
    const contentWidth = pageWidth - MARGIN * 2
    const columnWidth = (contentWidth - COLUMN_GAP) / 2
    const columnX = [MARGIN, MARGIN + columnWidth + COLUMN_GAP]
    const columnBottom = pageHeight - MARGIN
    const entryTextWidth = columnWidth - CHECKBOX_SIZE - CHECKBOX_GAP

    // Kopf: Listenname + Exportdatum, nur auf Seite 1. Danach beginnen die Spalten.
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000')
    doc.text(listName, MARGIN, MARGIN, { width: contentWidth })
    const dateStr = new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium' }).format(new Date())
    doc.font('Helvetica').fontSize(8).fillColor('#666666')
    doc.text(`Export vom ${dateStr}`, MARGIN, doc.y + 2, { width: contentWidth })
    doc.fillColor('#000000')

    const columnsTopPage1 = doc.y + 14
    // Konservative Schwelle für "länger als eine ganze Spalte": die kleinere der beiden
    // möglichen leeren Spaltenhöhen (Seite 1 hat durch den Kopf weniger Platz als
    // Folgeseiten). Damit wird eine Gruppe nie fälschlich als atomar behandelt.
    const emptyColumnHeight = columnBottom - columnsTopPage1

    let col = 0
    let y = columnsTopPage1
    let firstPage = true

    function newPage() {
      doc.addPage()
      firstPage = false
      col = 0
      y = MARGIN
    }

    function nextColumnOrPage() {
      if (col === 0) {
        col = 1
        y = firstPage ? columnsTopPage1 : MARGIN
      } else {
        newPage()
      }
    }

    function ensureSpace(height: number) {
      if (y + height > columnBottom) {
        nextColumnOrPage()
      }
    }

    function groupTitleHeight(group: ExportGroup) {
      doc.font('Helvetica-Bold').fontSize(GROUP_TITLE_FONT_SIZE)
      return doc.heightOfString(group.name, { width: columnWidth })
    }

    function entryHeight(entry: ExportEntry) {
      doc.font('Helvetica').fontSize(ENTRY_NAME_FONT_SIZE)
      const nameHeight = doc.heightOfString(entry.name, { width: entryTextWidth })
      let height = Math.max(nameHeight, CHECKBOX_SIZE)
      if (entry.comment) {
        doc.font('Helvetica-Oblique').fontSize(ENTRY_COMMENT_FONT_SIZE)
        const commentHeight = doc.heightOfString(entry.comment, { width: entryTextWidth })
        height += COMMENT_GAP_ABOVE + commentHeight
      }
      return height
    }

    function groupTotalHeight(group: ExportGroup) {
      let height = groupTitleHeight(group) + GROUP_TITLE_GAP_AFTER
      for (const entry of group.entries) {
        height += entryHeight(entry) + ENTRY_GAP
      }
      return height
    }

    function drawGroupTitle(group: ExportGroup) {
      const x = columnX[col]
      doc.font('Helvetica-Bold').fontSize(GROUP_TITLE_FONT_SIZE).fillColor('#000000')
      doc.text(group.name, x, y, { width: columnWidth })
      y += groupTitleHeight(group) + GROUP_TITLE_GAP_AFTER
    }

    function drawEntry(entry: ExportEntry) {
      const x = columnX[col]
      const checked = status === 'current' && entry.done
      const boxY = y + 1
      doc.lineWidth(0.8).rect(x, boxY, CHECKBOX_SIZE, CHECKBOX_SIZE).stroke('#333333')
      if (checked) {
        doc.save()
        doc.lineWidth(1.2).strokeColor('#000000')
        doc
          .moveTo(x + 1.3, boxY + 4.3)
          .lineTo(x + 3.2, boxY + 6.5)
          .lineTo(x + 6.7, boxY + 1.3)
          .stroke()
        doc.restore()
      }

      const textX = x + CHECKBOX_SIZE + CHECKBOX_GAP
      doc.font('Helvetica').fontSize(ENTRY_NAME_FONT_SIZE).fillColor('#000000')
      doc.text(entry.name, textX, y, { width: entryTextWidth })
      const nameHeight = doc.heightOfString(entry.name, { width: entryTextWidth })
      const nameBlockHeight = Math.max(nameHeight, CHECKBOX_SIZE)

      if (entry.comment) {
        doc.font('Helvetica-Oblique').fontSize(ENTRY_COMMENT_FONT_SIZE).fillColor('#555555')
        doc.text(entry.comment, textX, y + nameBlockHeight + COMMENT_GAP_ABOVE, { width: entryTextWidth })
        const commentHeight = doc.heightOfString(entry.comment, { width: entryTextWidth })
        y += nameBlockHeight + COMMENT_GAP_ABOVE + commentHeight
        doc.fillColor('#000000')
      } else {
        y += nameBlockHeight
      }
    }

    for (const group of groups) {
      if (group.entries.length === 0) continue

      const gHeight = groupTotalHeight(group)
      const remaining = columnBottom - y

      if (gHeight <= remaining) {
        drawGroupTitle(group)
        for (const entry of group.entries) {
          drawEntry(entry)
          y += ENTRY_GAP
        }
        y += GROUP_GAP - ENTRY_GAP
      } else if (gHeight <= emptyColumnHeight) {
        nextColumnOrPage()
        drawGroupTitle(group)
        for (const entry of group.entries) {
          drawEntry(entry)
          y += ENTRY_GAP
        }
        y += GROUP_GAP - ENTRY_GAP
      } else {
        // Ausnahme: Gruppe ist länger als eine ganze Spalte. Entry-weise umbrechen.
        ensureSpace(groupTitleHeight(group) + GROUP_TITLE_GAP_AFTER)
        drawGroupTitle(group)
        for (const entry of group.entries) {
          ensureSpace(entryHeight(entry))
          drawEntry(entry)
          y += ENTRY_GAP
        }
        y += GROUP_GAP - ENTRY_GAP
      }
    }

    doc.end()
  })
}
