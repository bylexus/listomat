import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { entries } from '../../../../db/schema'
import { requireUser } from '../../../../utils/auth'
import { requireOwnedTemplate } from '../../../../utils/access'
import { requireString, optionalString } from '../../../../utils/validate'

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

  const body = await readBody(event)
  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (body?.name !== undefined) update.name = requireString(body, 'name', { max: 500 })
  if (body?.comment !== undefined) update.comment = optionalString(body, 'comment', { max: 2000 })

  await db.update(entries).set(update).where(eq(entries.id, entryId))

  return db.query.entries.findFirst({ where: eq(entries.id, entryId) })
})
