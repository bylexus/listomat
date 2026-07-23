import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { db } from '../../../db'
import { entries } from '../../../db/schema'
import { requireUser } from '../../../utils/auth'
import { requireOwnedTemplate } from '../../../utils/access'
import { requireString, optionalString } from '../../../utils/validate'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const groupId = getRouterParam(event, 'id')!
  await requireOwnedTemplate(user.id, groupId)

  const body = await readBody(event)
  const name = requireString(body, 'name', { max: 500 })
  const comment = optionalString(body, 'comment', { max: 2000 })

  const existing = await db.query.entries.findMany({ where: eq(entries.groupId, groupId) })

  const id = uuidv7()
  const now = new Date()
  await db.insert(entries).values({
    id,
    name,
    comment,
    groupId,
    creatorId: user.id,
    sortOrder: existing.length,
    done: false,
    createdAt: now,
    updatedAt: now
  })

  return db.query.entries.findFirst({ where: eq(entries.id, id) })
})
