import { requireListAccess, requireListGroup } from '../../../../../utils/access'
import { copyGroup } from '../../../../../utils/copy'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const groupId = getRouterParam(event, 'groupId')!
  const { user, list } = await requireListAccess(event, listId)
  const group = await requireListGroup(list.id, groupId)

  // Kopiert Gruppe + Einträge als Vorlage des Aufrufers (done ignoriert,
  // Kommentare mit, origGroupId gesetzt). Die Liste selbst bleibt unverändert.
  return copyGroup({
    sourceGroupId: group.id,
    targetListId: null,
    newOwnerId: user.id,
    resetDone: true
  })
})
