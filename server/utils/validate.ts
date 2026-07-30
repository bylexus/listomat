export function requireString(body: any, field: string, { max = 500 }: { max?: number } = {}): string {
  const value = body?.[field]
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `${field} is required` })
  }
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max) {
    throw createError({ statusCode: 400, statusMessage: `${field} is invalid` })
  }
  return trimmed
}

export function optionalString(body: any, field: string, { max = 2000 }: { max?: number } = {}): string | null {
  const value = body?.[field]
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `${field} is invalid` })
  }
  const trimmed = value.trim()
  if (trimmed.length > max) {
    throw createError({ statusCode: 400, statusMessage: `${field} is invalid` })
  }
  return trimmed || null
}

export function requireBool(body: any, field: string): boolean {
  const value = body?.[field]
  if (typeof value !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: `${field} must be boolean` })
  }
  return value
}

export function optionalInt(body: any, field: string, { min = 0, max = 999999 }: { min?: number; max?: number } = {}): number | null {
  const value = body?.[field]
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw createError({ statusCode: 400, statusMessage: `${field} is invalid` })
  }
  return value
}
