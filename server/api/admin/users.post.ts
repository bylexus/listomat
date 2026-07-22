import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { uuidv7 } from 'uuidv7'
import { db } from '../../db'
import { users } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'
import { requireString } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const email = requireString(body, 'email', { max: 300 }).toLowerCase()
  const firstName = requireString(body, 'firstName', { max: 200 })
  const lastName = requireString(body, 'lastName', { max: 200 })
  const password = requireString(body, 'password', { max: 300 })

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Email already in use' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const id = uuidv7()

  await db.insert(users).values({
    id,
    email,
    firstName,
    lastName,
    passwordHash,
    role: 'user',
    active: true,
    createdAt: new Date()
  })

  const created = await db.query.users.findFirst({ where: eq(users.id, id) })
  const { passwordHash: _omit, ...safe } = created!
  return safe
})
