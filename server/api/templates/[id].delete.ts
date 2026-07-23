import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { groups } from '../../db/schema'
import { requireUser } from '../../utils/auth'
import { requireOwnedTemplate } from '../../utils/access'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  await requireOwnedTemplate(user.id, id)

  // Einträge werden DB-seitig via onDelete: 'cascade' mitgelöscht.
  await db.delete(groups).where(eq(groups.id, id))

  return { ok: true }
})
