import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../../../../db'
import { groups } from '../../../../../db/schema'
import { requireListAccess, requireListGroup } from '../../../../../utils/access'
import { copyGroup } from '../../../../../utils/copy'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const groupId = getRouterParam(event, 'groupId')!
  const { user, list } = await requireListAccess(event, listId)
  const group = await requireListGroup(list.id, groupId)

  const body = await readBody<{ name?: string }>(event).catch(() => null)
  const requestedName =
    typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : group.name

  // Name muss innerhalb der Vorlagen des Aufrufers eindeutig sein; sonst "Name (2)", "Name (3)", ...
  const existing = await db
    .select({ name: groups.name })
    .from(groups)
    .where(and(eq(groups.ownerId, user.id), isNull(groups.listId)))
  const taken = new Set(existing.map((g) => g.name))
  let name = requestedName
  for (let n = 2; taken.has(name); n++) {
    name = `${requestedName} (${n})`
  }

  // Kopiert Gruppe + Einträge als Vorlage des Aufrufers (done ignoriert,
  // Kommentare mit, origGroupId gesetzt). Die Liste selbst bleibt unverändert.
  return copyGroup({
    sourceGroupId: group.id,
    targetListId: null,
    newOwnerId: user.id,
    resetDone: true,
    newName: name
  })
})
