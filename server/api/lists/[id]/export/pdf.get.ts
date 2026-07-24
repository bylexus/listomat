import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { groups } from '../../../../db/schema'
import { requireListAccess } from '../../../../utils/access'
import { contentDispositionHeader, requireExportStatus } from '../../../../utils/export'
import { buildListPdf } from '../../../../utils/pdf-export'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const { list } = await requireListAccess(event, listId)
  const status = requireExportStatus(event)

  const listGroups = await db.query.groups.findMany({
    where: eq(groups.listId, list.id),
    orderBy: (g, { asc }) => [asc(g.sortOrder)],
    with: { entries: { orderBy: (e, { asc }) => [asc(e.sortOrder)] } }
  })

  const buffer = await buildListPdf(list.name, listGroups, status)

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', contentDispositionHeader(list.name, 'pdf'))
  return buffer
})
