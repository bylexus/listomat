import { and, eq, isNull } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { db } from '../db'
import { groups } from '../db/schema'
import { requireUser } from '../utils/auth'
import { requireString } from '../utils/validate'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const name = requireString(body, 'name', { max: 200 })

  const existing = await db.query.groups.findMany({
    where: and(eq(groups.ownerId, user.id), isNull(groups.listId))
  })

  const id = uuidv7()
  await db.insert(groups).values({
    id,
    name,
    ownerId: user.id,
    listId: null,
    origGroupId: null,
    sortOrder: existing.length
  })

  return db.query.groups.findFirst({ where: eq(groups.id, id), with: { entries: true } })
})
