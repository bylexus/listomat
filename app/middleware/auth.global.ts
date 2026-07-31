export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login' || to.path === '/about') return

  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }

  if (to.path.startsWith('/admin') && user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
