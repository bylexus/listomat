import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { db } from '../../../../../db'
import { entries } from '../../../../../db/schema'
import { requireListAccess, requireListGroup } from '../../../../../utils/access'
import { touchList } from '../../../../../utils/lists'
import { requireString, optionalString, optionalInt } from '../../../../../utils/validate'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const groupId = getRouterParam(event, 'groupId')!
  const { user, list } = await requireListAccess(event, listId)
  const group = await requireListGroup(list.id, groupId)

  const body = await readBody(event)
  const name = requireString(body, 'name', { max: 500 })
  const comment = optionalString(body, 'comment', { max: 2000 })
  const quantity = optionalInt(body, 'quantity', { min: 0 })

  const existing = await db.select({ id: entries.id }).from(entries).where(eq(entries.groupId, group.id))

  const id = uuidv7()
  const now = new Date()
  await db.insert(entries).values({
    id,
    name,
    comment,
    quantity,
    groupId: group.id,
    creatorId: user.id,
    sortOrder: existing.length,
    done: false,
    createdAt: now,
    updatedAt: now
  })
  await touchList(list.id)

  return db.query.entries.findFirst({ where: eq(entries.id, id) })
})
