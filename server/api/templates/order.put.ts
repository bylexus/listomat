import { and, eq, isNull } from 'drizzle-orm'
import { groups } from '../../db/schema'
import { requireUser } from '../../utils/auth'
import { reorder } from '../../utils/sort'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const ids = body?.ids

  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    throw createError({ statusCode: 400, statusMessage: 'ids must be a string array' })
  }

  await reorder(groups, groups.id, and(eq(groups.ownerId, user.id), isNull(groups.listId))!, ids)

  return { ok: true }
})
