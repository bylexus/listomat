import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { listShares } from '../../../../db/schema'
import { requireListOwner } from '../../../../utils/access'

export default defineEventHandler(async (event) => {
  const listId = getRouterParam(event, 'id')!
  const shareId = getRouterParam(event, 'shareId')!
  const { list } = await requireListOwner(event, listId)

  // shareId muss zu dieser Liste gehören, sonst 404 (verhindert Löschen
  // fremder Freigaben über eine andere eigene Liste).
  const share = await db.query.listShares.findFirst({
    where: and(eq(listShares.id, shareId), eq(listShares.listId, list.id))
  })
  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await db.delete(listShares).where(eq(listShares.id, share.id))

  return { ok: true }
})
