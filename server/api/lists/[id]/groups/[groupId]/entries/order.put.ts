import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../../../../../db'
import { entries, groups } from '../../../../../../db/schema'
import { requireListAccess, requireListGroup } from '../../../../../../utils/access'
import { touchList } from '../../../../../../utils/lists'
import { reorder } from '../../../../../../utils/sort'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const groupId = getRouterParam(event, 'groupId')!
  const { list } = await requireListAccess(event, listId)
  const group = await requireListGroup(list.id, groupId)

  const body = await readBody(event)
  const ids = body?.ids
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
    throw createError({ statusCode: 400, statusMessage: 'ids must be a string array' })
  }

  // Optional: Eintrag aus einer anderen Gruppe derselben Liste in diese Gruppe verschieben.
  const movedEntryId = body?.movedEntryId
  if (movedEntryId !== undefined) {
    if (typeof movedEntryId !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'movedEntryId is invalid' })
    }
    const listGroupIds = (
      await db.select({ id: groups.id }).from(groups).where(eq(groups.listId, list.id))
    ).map((g) => g.id)
    const moved = await db.query.entries.findFirst({
      where: and(eq(entries.id, movedEntryId), inArray(entries.groupId, listGroupIds))
    })
    if (!moved) {
      throw createError({ statusCode: 400, statusMessage: 'movedEntryId is invalid' })
    }
    if (moved.groupId !== group.id) {
      await db
        .update(entries)
        .set({ groupId: group.id, updatedAt: new Date() })
        .where(eq(entries.id, moved.id))
    }
  }

  await reorder(entries, entries.id, eq(entries.groupId, group.id), ids)
  await touchList(list.id)

  return { ok: true }
})
