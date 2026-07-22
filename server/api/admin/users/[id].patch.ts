import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { db } from '../../../db'
import { users } from '../../../db/schema'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const target = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = {}

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase()
    if (!email || email.length > 300) {
      throw createError({ statusCode: 400, statusMessage: 'email is invalid' })
    }
    if (email !== target.email) {
      const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
      if (existing) {
        throw createError({ statusCode: 400, statusMessage: 'Email already in use' })
      }
    }
    updates.email = email
  }

  if (body.firstName !== undefined) {
    const value = String(body.firstName).trim()
    if (!value || value.length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'firstName is invalid' })
    }
    updates.firstName = value
  }

  if (body.lastName !== undefined) {
    const value = String(body.lastName).trim()
    if (!value || value.length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'lastName is invalid' })
    }
    updates.lastName = value
  }

  if (body.role !== undefined) {
    if (body.role !== 'admin' && body.role !== 'user') {
      throw createError({ statusCode: 400, statusMessage: 'role is invalid' })
    }
    updates.role = body.role
  }

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'active must be boolean' })
    }
    if (body.active === false && target.id === admin.id) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot deactivate yourself' })
    }
    updates.active = body.active
  }

  if (body.password !== undefined) {
    const password = String(body.password)
    if (!password || password.length > 300) {
      throw createError({ statusCode: 400, statusMessage: 'password is invalid' })
    }
    updates.passwordHash = await bcrypt.hash(password, 10)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  await db.update(users).set(updates).where(eq(users.id, id))

  const updated = await db.query.users.findFirst({ where: eq(users.id, id) })
  const { passwordHash: _omit, ...safe } = updated!
  return safe
})
