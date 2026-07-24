import { eq } from 'drizzle-orm'
import { groups } from '../../../../db/schema'
import { requireListAccess } from '../../../../utils/access'
import { touchList } from '../../../../utils/lists'
import { reorder } from '../../../../utils/sort'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const { list } = await requireListAccess(event, listId)

  const body = await readBody(event)
  const ids = body?.ids
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
    throw createError({ statusCode: 400, statusMessage: 'ids must be a string array' })
  }

  await reorder(groups, groups.id, eq(groups.listId, list.id), ids)
  await touchList(list.id)

  return { ok: true }
})
