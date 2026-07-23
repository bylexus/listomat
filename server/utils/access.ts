import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { groups } from '../db/schema'

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
