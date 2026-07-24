import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { lists } from '../../db/schema'
import { requireListOwner } from '../../utils/access'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireListOwner(event, id)

  // Gruppen + Einträge werden DB-seitig via onDelete: 'cascade' mitgelöscht,
  // ebenso allfällige list_shares.
  await db.delete(lists).where(eq(lists.id, id))

  return { ok: true }
})
