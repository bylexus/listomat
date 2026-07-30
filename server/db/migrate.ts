// Production migration + seed CLI. Bundled via esbuild into .output/server/migrate.cjs
// (see docker/Dockerfile); uses the drizzle-orm migrator so the runtime image needs
// neither drizzle-kit nor tsx.
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './index'
import { seedAdmin } from './seed-admin'

async function main() {
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })

  console.log('Seeding database...')
  await seedAdmin(db)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration fehlgeschlagen:', err)
    process.exit(1)
  })
