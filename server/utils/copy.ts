import { and, eq, isNull } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { db } from '../db'
import { entries, groups } from '../db/schema'

// Zentrale Kopierlogik (3 Verwendungen: Vorlage→Liste, Liste→Vorlage, Liste duplizieren):
// - neue uuidv7 für Gruppe und alle Einträge
// - origGroupId = Quell-Gruppen-Id
// - Kommentare und quantity immer mitkopieren
// - done: bei resetDone false, sonst übernehmen
// - sortOrder der Einträge übernehmen; Gruppe ans Ende der Zielmenge
export async function copyGroup({
  sourceGroupId,
  targetListId,
  newOwnerId,
  resetDone,
  newName
}: {
  sourceGroupId: string
  targetListId: string | null
  newOwnerId: string
  resetDone: boolean
  newName?: string
}) {
  const source = await db.query.groups.findFirst({
    where: eq(groups.id, sourceGroupId),
    with: { entries: { orderBy: (e, { asc }) => [asc(e.sortOrder)] } }
  })
  if (!source) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  // Zielmenge: Gruppen der Ziel-Liste bzw. Vorlagen des neuen Owners
  const targetScope =
    targetListId === null
      ? and(eq(groups.ownerId, newOwnerId), isNull(groups.listId))!
      : eq(groups.listId, targetListId)
  const targetCount = (await db.select({ id: groups.id }).from(groups).where(targetScope)).length

  const newGroupId = uuidv7()
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.insert(groups).values({
      id: newGroupId,
      name: newName ?? source.name,
      ownerId: newOwnerId,
      listId: targetListId,
      origGroupId: source.id,
      sortOrder: targetCount
    })
    for (const entry of source.entries) {
      await tx.insert(entries).values({
        id: uuidv7(),
        name: entry.name,
        comment: entry.comment,
        quantity: entry.quantity,
        groupId: newGroupId,
        creatorId: newOwnerId,
        sortOrder: entry.sortOrder,
        done: resetDone ? false : entry.done,
        createdAt: now,
        updatedAt: now
      })
    }
  })

  return db.query.groups.findFirst({
    where: eq(groups.id, newGroupId),
    with: { entries: { orderBy: (e, { asc }) => [asc(e.sortOrder)] } }
  })
}
