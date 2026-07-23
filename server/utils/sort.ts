import { eq, type SQL } from 'drizzle-orm'
import { db } from '../db'

// Client sendet die vollständige neue Reihenfolge als ids: string[].
// Validiert, dass die Ids exakt der betroffenen Menge (scopeWhere) entsprechen,
// und schreibt sortOrder = index (0-basiert) in einer Transaktion. Keine Lücken-Technik.
export async function reorder(table: any, idColumn: any, scopeWhere: SQL, ids: string[]) {
  const existing = await db.select({ id: idColumn }).from(table).where(scopeWhere)
  const existingIds = new Set(existing.map((row: any) => row.id))

  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id set' })
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(table).set({ sortOrder: i }).where(eq(idColumn, ids[i]))
    }
  })
}
