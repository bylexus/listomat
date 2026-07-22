import bcrypt from 'bcrypt'
import { uuidv7 } from 'uuidv7'
import { eq } from 'drizzle-orm'
import { db } from './index'
import { users } from './schema'

async function seed() {
  const existing = await db.query.users.findFirst({ where: eq(users.email, 'admin@local') })

  if (existing) {
    console.log('Admin-User existiert bereits, Seed übersprungen.')
    return
  }

  const passwordHash = await bcrypt.hash('admin', 10)

  await db.insert(users).values({
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

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed fehlgeschlagen:', err)
    process.exit(1)
  })
