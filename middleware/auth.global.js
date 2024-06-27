import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';
import { useStorage } from '@vueuse/core';

export default defineNuxtRouteMiddleware((to) => {
  const { authenticated } = storeToRefs(useAuthStore()); // make authenticated state reactive
  const token = useCookie('token'); // get token from cookies
  const userRole = useStorage('_id'); // get user role from cookies

  if (token.value) {
    // check if value exists
    // todo verify if token is valid, before updating the state
    authenticated.value = true; // update the state to authenticated
  }

  // if token exists and url is /login or /register redirect to homepage
  if (token.value && to?.name === 'login') {
    return navigateTo('/home');
  }

  // if token doesn't exist and the url is not /login or /register, redirect to login
  if (!token.value && to?.name !== 'login' && to?.name === 'home') {
    abortNavigation();
    return navigateTo('/login');
  } else if (!token.value && to?.name !== 'login' && to?.path === '/log/kehadiran') {
    abortNavigation();
    return navigateTo('/login');
  } else if (!token.value && to?.name !== 'login' && to?.path === '/log/error') {
    abortNavigation();
    return navigateTo('/login');
  } else if (!token.value && to?.name !== 'login' && to?.path === '/log/onsite') {
    abortNavigation();
    return navigateTo('/login');
  } else if (!token.value && to?.name !== 'login' && to?.path === '/siswa') {
    abortNavigation();
    return navigateTo('/login');
  }

  if (userRole.value === 'siswa' && to?.path === '/log/error') {
    abortNavigation();
    return navigateTo('/');
  }
});