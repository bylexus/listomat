import { db } from './index'
import { seedAdmin } from './seed-admin'

seedAdmin(db)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed fehlgeschlagen:', err)
    process.exit(1)
  })
