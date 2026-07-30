import { relations } from 'drizzle-orm'
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

// Timestamps als Unix-Millisekunden (integer, mode: 'timestamp_ms')

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),                    // uuidv7
  email: text('email').notNull().unique(),        // dient als Username, lowercase speichern
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash').notNull(),  // bcrypt
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const lists = sqliteTable('lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => [index('lists_owner_idx').on(t.ownerId)])

export const listShares = sqliteTable('list_shares', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  sharedUserId: text('shared_user_id').notNull().references(() => users.id),
}, (t) => [
  uniqueIndex('list_shares_unique').on(t.listId, t.sharedUserId),
  index('list_shares_user_idx').on(t.sharedUserId),
])
// Hinweis: kein separates owner-Feld nötig; Owner steht auf lists.ownerId.

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  listId: text('list_id').references(() => lists.id, { onDelete: 'cascade' }),
    // null => Vorlagen-Gruppe; gesetzt => Listen-Gruppe
  origGroupId: text('orig_group_id'),  // reine Info, keine FK-Constraint
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => [index('groups_list_idx').on(t.listId), index('groups_owner_idx').on(t.ownerId)])

export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  comment: text('comment'),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  creatorId: text('creator_id').notNull().references(() => users.id),  // reine Info
  sortOrder: integer('sort_order').notNull().default(0),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
    // bei Vorlagen-Gruppen ungenutzt, bleibt false
  quantity: integer('quantity'), // nullable; null = no quantity, 0 is valid
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const listsRelations = relations(lists, ({ one, many }) => ({
  owner: one(users, { fields: [lists.ownerId], references: [users.id] }),
  groups: many(groups),
  shares: many(listShares)
}))

export const listSharesRelations = relations(listShares, ({ one }) => ({
  list: one(lists, { fields: [listShares.listId], references: [lists.id] }),
  sharedUser: one(users, { fields: [listShares.sharedUserId], references: [users.id] })
}))

export const groupsRelations = relations(groups, ({ one, many }) => ({
  list: one(lists, { fields: [groups.listId], references: [lists.id] }),
  entries: many(entries)
}))

export const entriesRelations = relations(entries, ({ one }) => ({
  group: one(groups, { fields: [entries.groupId], references: [groups.id] })
}))
