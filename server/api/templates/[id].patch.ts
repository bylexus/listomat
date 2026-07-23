import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { groups } from '../../db/schema'
import { requireUser } from '../../utils/auth'
import { requireOwnedTemplate } from '../../utils/access'
import { requireString } from '../../utils/validate'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  await requireOwnedTemplate(user.id, id)

  const body = await readBody(event)
  const name = requireString(body, 'name', { max: 200 })

  await db.update(groups).set({ name }).where(eq(groups.id, id))

  return db.query.groups.findFirst({ where: eq(groups.id, id), with: { entries: true } })
})
