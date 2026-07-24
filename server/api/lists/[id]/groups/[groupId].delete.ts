import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { groups } from '../../../../db/schema'
import { requireListAccess, requireListGroup } from '../../../../utils/access'
import { touchList } from '../../../../utils/lists'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const groupId = getRouterParam(event, 'groupId')!
  const { list } = await requireListAccess(event, listId)
  const group = await requireListGroup(list.id, groupId)

  // Einträge werden DB-seitig via onDelete: 'cascade' mitgelöscht.
  await db.delete(groups).where(eq(groups.id, group.id))
  await touchList(list.id)

  return { ok: true }
})
