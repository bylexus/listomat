import { eq } from 'drizzle-orm'
import { db } from '../db'
import { lists, listShares } from '../db/schema'
import { requireUser } from '../utils/auth'

interface ListSummary {
  id: string
  name: string
  ownerName: string
  progress: { done: number; total: number }
  updatedAt: Date
}

type ListWithProgress = {
  id: string
  name: string
  updatedAt: Date
  groups: { entries: { done: boolean }[] }[]
}

function toSummary(list: ListWithProgress, ownerName: string): ListSummary {
  const allEntries = list.groups.flatMap((g) => g.entries)
  return {
    id: list.id,
    name: list.name,
    ownerName,
    progress: {
      done: allEntries.filter((e) => e.done).length,
      total: allEntries.length
    },
    updatedAt: list.updatedAt
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const ownLists = await db.query.lists.findMany({
    where: eq(lists.ownerId, user.id),
    orderBy: (l, { desc }) => [desc(l.updatedAt)],
    with: {
      groups: { columns: { id: true }, with: { entries: { columns: { done: true } } } }
    }
  })

  const shares = await db.query.listShares.findMany({
    where: eq(listShares.sharedUserId, user.id),
    with: {
      list: {
        with: {
          owner: { columns: { firstName: true, lastName: true } },
          groups: { columns: { id: true }, with: { entries: { columns: { done: true } } } }
        }
      }
    }
  })

  const ownerName = `${user.firstName} ${user.lastName}`
  const own = ownLists.map((l) => toSummary(l, ownerName))
  const shared = shares
    .map((s) => toSummary(s.list, `${s.list.owner.firstName} ${s.list.owner.lastName}`))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  return { own, shared }
})
