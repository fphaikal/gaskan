export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const path = event.path; // Ini akan berisi /uploads/profiles/...
  
  // Teruskan request ke backend
  return proxyRequest(event, `${config.public.apiBase}${path}`);
});
