import { useAuthStore } from '~/store/useAuthStore';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();

  const publicRoutes = ['login', 'register', 'index', 'team', 'forgot-password', 'reset-password-token'];
  const routeName = to.name?.toString() || '';
  const isPublicRoute = publicRoutes.includes(routeName);
  
  // Get user from store (restored from localStorage if client)
  let user = authStore.authenticated ? { role: authStore.role } : null;

  // Always verify session with server on first page load/refresh
  if (!authStore.initialized) {
    try {
      const refreshed = await authStore.refreshSession();
      if (refreshed) user = refreshed;
    } catch {
      if (!user && authStore.authenticated) {
        user = { role: authStore.role };
      }
    }
  }

  // Redirect authenticated users away from login/register pages
  if (user && isPublicRoute && ['login', 'register'].includes(routeName)) {
    return navigateTo('/home');
  }

  // Redirect unauthenticated users to login page for protected routes
  if (!user && !isPublicRoute) {
    if (routeName !== 'login') {
      return navigateTo('/login');
    }
  }

  if (!user) return;

  // Role-based Access Control (RBAC)
  const path = to.path;

  // Admin & Developer: /log/error
  if (path.startsWith('/log/error') && !['admin', 'developer'].includes(user.role)) {
    return navigateTo('/home');
  }

  // Admin-only: /semester, /admin/*, /config/*
  const adminOnlyPaths = ['/semester', '/admin', '/config'];
  if (adminOnlyPaths.some(p => path.startsWith(p)) && !['admin', 'developer'].includes(user.role)) {
    return navigateTo('/home');
  }

  // Staff (Admin, Guru, Developer): /absensi, /siswa, /log/* (except error), /kelas
  const staffPaths = ['/absensi', '/siswa', '/log', '/kelas', '/monitor', '/jurusan'];
  if (staffPaths.some(p => path.startsWith(p)) && !['admin', 'developer', 'guru'].includes(user.role)) {
    if (path.startsWith('/siswa/') || path === '/log/kehadiran') {
       // Allow individual student profiles and student log page
    } else {
      return navigateTo('/home');
    }
  }
});
