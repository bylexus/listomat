import { eq } from 'drizzle-orm'
import { db } from '../../../../../../db'
import { entries } from '../../../../../../db/schema'
import { requireGroupEntry, requireListAccess, requireListGroup } from '../../../../../../utils/access'
import { touchList } from '../../../../../../utils/lists'
import { requireString, optionalString, requireBool } from '../../../../../../utils/validate'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const groupId = getRouterParam(event, 'groupId')!
  const entryId = getRouterParam(event, 'entryId')!
  const { list } = await requireListAccess(event, listId)
  const group = await requireListGroup(list.id, groupId)
  const entry = await requireGroupEntry(group.id, entryId)

  const body = await readBody(event)
  const patch: Record<string, unknown> = {}
  if (body?.name !== undefined) patch.name = requireString(body, 'name', { max: 500 })
  if (body?.comment !== undefined) patch.comment = optionalString(body, 'comment', { max: 2000 })
  if (body?.done !== undefined) patch.done = requireBool(body, 'done')
  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  }
  patch.updatedAt = new Date()

  await db.update(entries).set(patch).where(eq(entries.id, entry.id))
  await touchList(list.id)

  return db.query.entries.findFirst({ where: eq(entries.id, entry.id) })
})
