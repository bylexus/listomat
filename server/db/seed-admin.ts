import bcrypt from 'bcrypt'
import { uuidv7 } from 'uuidv7'
import { eq } from 'drizzle-orm'
import { users } from './schema'
import type { db } from './index'

export async function seedAdmin(database: typeof db) {
  const existing = await database.query.users.findFirst({ where: eq(users.email, 'admin@local') })

  if (existing) {
    console.log('Admin-User existiert bereits, Seed übersprungen.')
    return
  }

  const passwordHash = await bcrypt.hash('admin', 10)

  await database.insert(users).values({
    id: uuidv7(),
    email: 'admin@local',
    firstName: 'Admin',
    lastName: 'Admin',
    passwordHash,
    role: 'admin',
    active: true,
    createdAt: new Date()
  })

  console.log('Admin-User angelegt (admin@local / admin).')
}
