import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { users } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (!session.impersonatedBy) {
    throw createError({ statusCode: 400, statusMessage: 'Not impersonating' })
  }

  const admin = await db.query.users.findFirst({ where: eq(users.id, session.impersonatedBy) })
  if (!admin || !admin.active) {
    throw createError({ statusCode: 404, statusMessage: 'Admin user not found' })
  }

  const sessionUser = {
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role
  }

  await replaceUserSession(event, { user: sessionUser, impersonatedBy: undefined })

  return { ok: true }
})
