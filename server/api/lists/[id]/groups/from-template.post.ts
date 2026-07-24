import { requireListAccess, requireOwnedTemplate } from '../../../../utils/access'
import { copyGroup } from '../../../../utils/copy'
import { touchList } from '../../../../utils/lists'
import { requireString } from '../../../../utils/validate'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const { user, list } = await requireListAccess(event, listId)

  const body = await readBody(event)
  const templateId = requireString(body, 'templateId')
  // Vorlage muss dem Aufrufer gehören (404 sonst).
  const template = await requireOwnedTemplate(user.id, templateId)

  const group = await copyGroup({
    sourceGroupId: template.id,
    targetListId: list.id,
    newOwnerId: user.id,
    resetDone: true
  })
  await touchList(list.id)

  return group
})
