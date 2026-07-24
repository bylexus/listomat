import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { db } from '../../../db'
import { groups, lists } from '../../../db/schema'
import { requireListAccess } from '../../../utils/access'
import { copyGroup } from '../../../utils/copy'
import { optionalString } from '../../../utils/validate'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  // Owner oder Shared dürfen duplizieren; die Kopie gehört dem Aufrufer.
  const { user, list } = await requireListAccess(event, listId)

  // Namen liefert der Client via i18n („… (Kopie)“), analog Default-Name in E6.
  const body = await readBody(event).catch(() => ({}))
  const name = optionalString(body, 'name', { max: 250 }) || `${list.name} (Kopie)`

  const id = uuidv7()
  const now = new Date()
  await db.insert(lists).values({ id, name, ownerId: user.id, createdAt: now, updatedAt: now })

  const sourceGroups = await db.query.groups.findMany({
    where: eq(groups.listId, list.id),
    orderBy: (g, { asc }) => [asc(g.sortOrder)]
  })
  for (const group of sourceGroups) {
    // Kommentare bleiben, done → false
    await copyGroup({ sourceGroupId: group.id, targetListId: id, newOwnerId: user.id, resetDone: true })
  }

  return db.query.lists.findFirst({ where: eq(lists.id, id) })
})
