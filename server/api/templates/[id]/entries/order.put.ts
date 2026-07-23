import { eq } from 'drizzle-orm'
import { entries } from '../../../../db/schema'
import { requireUser } from '../../../../utils/auth'
import { requireOwnedTemplate } from '../../../../utils/access'
import { reorder } from '../../../../utils/sort'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const groupId = getRouterParam(event, 'id')!
  await requireOwnedTemplate(user.id, groupId)

  const body = await readBody(event)
  const ids = body?.ids

  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    throw createError({ statusCode: 400, statusMessage: 'ids must be a string array' })
  }

  await reorder(entries, entries.id, eq(entries.groupId, groupId), ids)

  return { ok: true }
})
