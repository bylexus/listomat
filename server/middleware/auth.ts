// Globale API-Auth: alle /api/*-Routen erfordern eine gültige Session,
// ausser den public Auth-Routen (login, logout). Die per-Route-Checks
// (requireUser/requireAdmin) bleiben als Defense-in-Depth bestehen.
const PUBLIC_API_ROUTES = new Set(['/api/auth/login', '/api/auth/logout'])

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]

  if (!path.startsWith('/api/')) return
  if (PUBLIC_API_ROUTES.has(path)) return

  await requireUserSession(event)
})
