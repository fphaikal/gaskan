export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();

  const res = await fetch(config.public.apiBase + '/api/users', {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
