import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { db } from '../../db'
import { users } from '../../db/schema'
import { requireString } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = requireString(body, 'email', { max: 300 }).toLowerCase()
  const password = requireString(body, 'password', { max: 300 })

  const dbUser = await db.query.users.findFirst({ where: eq(users.email, email) })

  if (!dbUser || !dbUser.active) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const validPassword = await bcrypt.compare(password, dbUser.passwordHash)
  if (!validPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, dbUser.id))

  const sessionUser = {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    role: dbUser.role
  }

  await replaceUserSession(event, { user: sessionUser })

  return { user: sessionUser }
})
