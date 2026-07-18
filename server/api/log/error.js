export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const params = new URLSearchParams(query);
  if (!params.has('reverse')) params.set('reverse', 'true');

  const res = await fetch(config.public.apiBase + "/api/error?" + params.toString(), {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
  
