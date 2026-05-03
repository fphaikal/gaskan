import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';
import { useStorage } from '@vueuse/core';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  const { authenticated } = storeToRefs(authStore); // make authenticated state reactive
  const token = useCookie('token'); // get token from cookies
  const userRole = useStorage('_id'); // get user role from storage

  if (token.value) {
    // TODO: Verify if token is valid, before updating the state
    authenticated.value = true; // update the state to authenticated
  } else {
    // Token is gone (expired or never set) — clean up stale state
    // This is the critical fix: without this, _id persists in localStorage
    // and the next login would read the wrong role.
    authenticated.value = false;
    userRole.value = null;
    authStore.nis = null;
  }

  const loginRoutes = ['login', 'register'];
  const protectedRoutes = [
    'home',
    'log-kehadiran',
    'log-error',
    'log-onsite',
    'log-login',
    'siswa',
    'siswa-id' // using named route for dynamic route
  ];

  // Redirect authenticated users away from login/register pages
  if (token.value && loginRoutes.includes(to.name)) {
    return navigateTo('/home');
  }

  // Redirect unauthenticated users to login page
  if (!token.value && protectedRoutes.includes(to.name)) {
    abortNavigation();
    return navigateTo('/login');
  }

  // Additional role-based redirection
  if (userRole.value === 'siswa' && to.path === '/log/error') {
    abortNavigation();
    return navigateTo('/');
  }
});

