import type { H3Event } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { groups, lists, listShares } from '../db/schema'
import { requireUser } from './auth'

// Vorlagen-Gruppen (listId = null) sind strikt privat: nur der Owner hat Zugriff.
// Kein Fund => 404 (kein Existenz-Leak), analog zu requireListAccess/requireListOwner (E7).
export async function requireOwnedTemplate(userId: string, groupId: string) {
  const group = await db.query.groups.findFirst({
    where: and(eq(groups.id, groupId), eq(groups.ownerId, userId), isNull(groups.listId))
  })
  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  return group
}

// Zugriff auf eine Liste: Owner ODER Share vorhanden, sonst 404 (kein Existenz-Leak).
export async function requireListAccess(event: H3Event, listId: string) {
  const user = await requireUser(event)
  const list = await db.query.lists.findFirst({ where: eq(lists.id, listId) })
  if (list) {
    if (list.ownerId === user.id) {
      return { user, list, isOwner: true }
    }
    const share = await db.query.listShares.findFirst({
      where: and(eq(listShares.listId, listId), eq(listShares.sharedUserId, user.id))
    })
    if (share) {
      return { user, list, isOwner: false }
    }
  }
  throw createError({ statusCode: 404, statusMessage: 'Not found' })
}

// Nur der Owner einer Liste, sonst 404 (kein Existenz-Leak).
export async function requireListOwner(event: H3Event, listId: string) {
  const user = await requireUser(event)
  const list = await db.query.lists.findFirst({
    where: and(eq(lists.id, listId), eq(lists.ownerId, user.id))
  })
  if (!list) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  return { user, list }
}
