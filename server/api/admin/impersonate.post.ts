import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const session = await getUserSession(event)
  if (session.impersonatedBy) {
    throw createError({ statusCode: 400, statusMessage: 'Already impersonating' })
  }

  const body = await readBody(event)
  const userId = body?.userId
  if (typeof userId !== 'string' || !userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  }

  const target = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!target || !target.active) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const sessionUser = {
    id: target.id,
    email: target.email,
    firstName: target.firstName,
    lastName: target.lastName,
    role: target.role
  }

  await replaceUserSession(event, { user: sessionUser, impersonatedBy: admin.id })

  return { ok: true }
})
