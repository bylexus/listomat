import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { groups } from '../db/schema'
import { requireUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  return db.query.groups.findMany({
    where: and(eq(groups.ownerId, user.id), isNull(groups.listId)),
    orderBy: (g, { asc }) => [asc(g.sortOrder)],
    with: {
      entries: {
        orderBy: (e, { asc }) => [asc(e.sortOrder)]
      }
    }
  })
})
