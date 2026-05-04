import { useAuthStore } from '~/store/useAuthStore';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();

  const loginRoutes = ['login', 'register'];
  const protectedRoutes = [
    'home',
    'profile',
    'log-kehadiran',
    'log-error',
    'log-onsite',
    'log-login',
    'siswa',
    'siswa-id',
    'view-siswa',
    'view-siswa-id'
  ];
  const adminRoutes = ['log-kehadiran', 'log-onsite', 'log-login', 'siswa', 'siswa-id', 'view-siswa', 'view-siswa-id'];
  const developerRoutes = ['log-error'];

  const routeName = to.name?.toString();
  const isMonitorRoute = to.path.startsWith('/monitor');
  const isProtectedRoute = protectedRoutes.includes(routeName) || isMonitorRoute;
  const shouldCheckSession = isProtectedRoute || loginRoutes.includes(routeName);

  let user = authStore.authenticated ? { role: authStore.role } : null;

  if (shouldCheckSession) {
    try {
      user = await authStore.refreshSession();
    } catch {
      user = null;
    }
  }

  // Redirect authenticated users away from login/register pages
  if (user && loginRoutes.includes(routeName)) {
    return navigateTo('/home');
  }

  // Redirect unauthenticated users to login page
  if (!user && isProtectedRoute) {
    abortNavigation();
    return navigateTo('/login');
  }

  if (!user) return;

  if (developerRoutes.includes(routeName) && user.role !== 'developer') {
    abortNavigation();
    return navigateTo('/home');
  }

  if ((adminRoutes.includes(routeName) || isMonitorRoute) && !['admin', 'developer'].includes(user.role)) {
    abortNavigation();
    return navigateTo('/home');
  }
});

