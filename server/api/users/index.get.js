export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const res = await fetch(config.public.apiBase + '/api/users?' + new URLSearchParams(query), {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});

