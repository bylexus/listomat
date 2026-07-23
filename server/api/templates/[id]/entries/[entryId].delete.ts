import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { entries } from '../../../../db/schema'
import { requireUser } from '../../../../utils/auth'
import { requireOwnedTemplate } from '../../../../utils/access'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const groupId = getRouterParam(event, 'id')!
  const entryId = getRouterParam(event, 'entryId')!
  await requireOwnedTemplate(user.id, groupId)

  const entry = await db.query.entries.findFirst({
    where: and(eq(entries.id, entryId), eq(entries.groupId, groupId))
  })
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await db.delete(entries).where(eq(entries.id, entryId))

  return { ok: true }
})
