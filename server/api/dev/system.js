export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['developer']);
  const config = useRuntimeConfig(); // get runtime config

  const res = await fetch(config.public.apiBase + "/api/dev/system", {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
