import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { db } from '../../../db'
import { listShares, users } from '../../../db/schema'
import { requireListOwner } from '../../../utils/access'
import { requireString } from '../../../utils/validate'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const { list } = await requireListOwner(event, listId)

  const body = await readBody(event)
  const email = requireString(body, 'email', { max: 300 }).toLowerCase()

  // Unbekannt oder inaktiv -> 404 (kein Existenz-Leak, analog Login).
  const target = await db.query.users.findFirst({ where: and(eq(users.email, email), eq(users.active, true)) })
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  // Owner kann sich nicht selbst freigeben.
  if (target.id === list.ownerId) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot share with owner' })
  }

  const existingShare = await db.query.listShares.findFirst({
    where: and(eq(listShares.listId, list.id), eq(listShares.sharedUserId, target.id))
  })
  if (existingShare) {
    throw createError({ statusCode: 400, statusMessage: 'Already shared' })
  }

  const id = uuidv7()
  await db.insert(listShares).values({ id, listId: list.id, sharedUserId: target.id })

  return { id, email: target.email }
})
