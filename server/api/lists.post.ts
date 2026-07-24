import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { db } from '../db'
import { lists } from '../db/schema'
import { requireUser } from '../utils/auth'
import { optionalString } from '../utils/validate'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  // Default-Name liefert der Client via i18n (analog Gruppen-Default),
  // siehe Entscheide «E6 – Listenübersicht». Fallback, falls kein Body gesendet wird.
  const body = await readBody(event).catch(() => ({}))
  const name = optionalString(body, 'name', { max: 200 }) || 'Neue Liste'

  const id = uuidv7()
  const now = new Date()
  await db.insert(lists).values({
    id,
    name,
    ownerId: user.id,
    createdAt: now,
    updatedAt: now
  })

  return db.query.lists.findFirst({ where: eq(lists.id, id) })
})
