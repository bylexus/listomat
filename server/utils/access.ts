import type { H3Event } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { entries, groups, lists, listShares } from '../db/schema'
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

// Gruppe muss zur angegebenen Liste gehören, sonst 404.
export async function requireListGroup(listId: string, groupId: string) {
  const group = await db.query.groups.findFirst({
    where: and(eq(groups.id, groupId), eq(groups.listId, listId))
  })
  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  return group
}

// Eintrag muss zur angegebenen Gruppe gehören, sonst 404.
export async function requireGroupEntry(groupId: string, entryId: string) {
  const entry = await db.query.entries.findFirst({
    where: and(eq(entries.id, entryId), eq(entries.groupId, groupId))
  })
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  return entry
}
