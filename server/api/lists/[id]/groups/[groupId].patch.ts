import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { groups } from '../../../../db/schema'
import { requireListAccess, requireListGroup } from '../../../../utils/access'
import { touchList } from '../../../../utils/lists'
import { requireString } from '../../../../utils/validate'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const groupId = getRouterParam(event, 'groupId')!
  const { list } = await requireListAccess(event, listId)
  const group = await requireListGroup(list.id, groupId)

  const body = await readBody(event)
  const name = requireString(body, 'name', { max: 200 })

  await db.update(groups).set({ name }).where(eq(groups.id, group.id))
  await touchList(list.id)

  return db.query.groups.findFirst({ where: eq(groups.id, group.id) })
})
