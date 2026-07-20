export const useApi = () => {
  const nuxtApp = useNuxtApp();
  return nuxtApp.$api || $fetch;
};
