// Gemeinsame Helfer für PDF-/Excel-Export: Dateinamen sanitizen (Content-Disposition
// mit Umlaut-Unterstützung via RFC 5987) und den ?status=current|empty-Query validieren.

export type ExportStatus = 'current' | 'empty'

export function requireExportStatus(event: any): ExportStatus {
  const status = getQuery(event).status
  if (status !== 'current' && status !== 'empty') {
    throw createError({ statusCode: 400, statusMessage: 'status must be "current" or "empty"' })
  }
  return status
}

// ASCII-Fallback für ältere Clients (Content-Disposition filename=), plus
// UTF-8-Variante (filename*=) für korrekte Umlaute/Sonderzeichen in modernen Browsern.
export function contentDispositionHeader(baseName: string, extension: string): string {
  const safeBase = baseName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Export'
  const filename = `${safeBase}.${extension}`
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_')
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

// Excel-Sheet-Namen: max. 31 Zeichen, verbotene Zeichen ersetzen, darf nicht leer sein.
export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[*?:\\/[\]]/g, '_').trim()
  const truncated = cleaned.slice(0, 31)
  return truncated || 'Liste'
}
