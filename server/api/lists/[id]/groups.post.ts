import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { db } from '../../../db'
import { groups } from '../../../db/schema'
import { requireListAccess } from '../../../utils/access'
import { touchList } from '../../../utils/lists'
import { requireString } from '../../../utils/validate'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const { user, list } = await requireListAccess(event, listId)

  const body = await readBody(event)
  const name = requireString(body, 'name', { max: 200 })

  const existing = await db.select({ id: groups.id }).from(groups).where(eq(groups.listId, list.id))

  const id = uuidv7()
  await db.insert(groups).values({
    id,
    name,
    ownerId: user.id,
    listId: list.id,
    origGroupId: null,
    sortOrder: existing.length
  })
  await touchList(list.id)

  return db.query.groups.findFirst({ where: eq(groups.id, id), with: { entries: true } })
})
