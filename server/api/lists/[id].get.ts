import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { groups, listShares } from '../../db/schema'
import { requireListAccess } from '../../utils/access'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { list, isOwner } = await requireListAccess(event, id)

  const listGroups = await db.query.groups.findMany({
    where: eq(groups.listId, list.id),
    orderBy: (g, { asc }) => [asc(g.sortOrder)],
    with: { entries: { orderBy: (e, { asc }) => [asc(e.sortOrder)] } }
  })

  const result: Record<string, unknown> = { ...list, groups: listGroups, isOwner }

  if (isOwner) {
    const shares = await db.query.listShares.findMany({
      where: eq(listShares.listId, list.id),
      with: { sharedUser: { columns: { email: true } } }
    })
    result.shares = shares.map((s) => ({ id: s.id, email: s.sharedUser.email }))
  }

  return result
})
