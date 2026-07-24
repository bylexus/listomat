import { eq } from 'drizzle-orm'
import { db } from '../../../../../../db'
import { entries } from '../../../../../../db/schema'
import { requireGroupEntry, requireListAccess, requireListGroup } from '../../../../../../utils/access'
import { touchList } from '../../../../../../utils/lists'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const groupId = getRouterParam(event, 'groupId')!
  const entryId = getRouterParam(event, 'entryId')!
  const { list } = await requireListAccess(event, listId)
  const group = await requireListGroup(list.id, groupId)
  const entry = await requireGroupEntry(group.id, entryId)

  await db.delete(entries).where(eq(entries.id, entry.id))
  await touchList(list.id)

  return { ok: true }
})
