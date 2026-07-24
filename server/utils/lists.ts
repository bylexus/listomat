import { eq } from 'drizzle-orm'
import { db } from '../db'
import { lists } from '../db/schema'

// Jede mutierende Listen-Operation aktualisiert lists.updatedAt.
export async function touchList(listId: string) {
  await db.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, listId))
}
