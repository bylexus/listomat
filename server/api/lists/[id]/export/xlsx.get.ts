import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { groups } from '../../../../db/schema'
import { requireListAccess } from '../../../../utils/access'
import { contentDispositionHeader, requireExportStatus } from '../../../../utils/export'
import { buildListXlsx } from '../../../../utils/xlsx-export'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const { list } = await requireListAccess(event, listId)
  const status = requireExportStatus(event)

  const listGroups = await db.query.groups.findMany({
    where: eq(groups.listId, list.id),
    orderBy: (g, { asc }) => [asc(g.sortOrder)],
    with: { entries: { orderBy: (e, { asc }) => [asc(e.sortOrder)] } }
  })

  const buffer = await buildListXlsx(list.name, listGroups, status)

  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', contentDispositionHeader(list.name, 'xlsx'))
  return buffer
})
