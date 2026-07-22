import { db } from '../../db'
import { users } from '../../db/schema'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const all = await db.query.users.findMany({ orderBy: (u, { asc }) => [asc(u.email)] })

  return all.map(({ passwordHash, ...safe }) => safe)
})
