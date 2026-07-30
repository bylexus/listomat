import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const dbUrl = process.env.DB_URL || 'file:./data/listomat.db'

const client = createClient({ url: dbUrl })

export const db = drizzle(client, { schema })
