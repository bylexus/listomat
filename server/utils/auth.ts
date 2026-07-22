import type { H3Event } from 'h3'

export async function requireUser(event: H3Event) {
  const session = await requireUserSession(event)
  return session.user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
