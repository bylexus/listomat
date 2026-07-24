import { eq, inArray } from 'drizzle-orm'
import { db } from '../../../db'
import { entries, groups } from '../../../db/schema'
import { requireListAccess } from '../../../utils/access'
import { touchList } from '../../../utils/lists'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const { list } = await requireListAccess(event, listId)

  const listGroupIds = (
    await db.select({ id: groups.id }).from(groups).where(eq(groups.listId, list.id))
  ).map((g) => g.id)

  if (listGroupIds.length > 0) {
    await db
      .update(entries)
      .set({ done: false, updatedAt: new Date() })
      .where(inArray(entries.groupId, listGroupIds))
  }
  await touchList(list.id)

  return { ok: true }
})
