import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { lists } from '../../db/schema'
import { requireListOwner } from '../../utils/access'
import { requireString } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { list } = await requireListOwner(event, id)

  const body = await readBody(event)
  const name = requireString(body, 'name', { max: 200 })

  await db.update(lists).set({ name, updatedAt: new Date() }).where(eq(lists.id, list.id))

  return db.query.lists.findFirst({ where: eq(lists.id, list.id) })
})
