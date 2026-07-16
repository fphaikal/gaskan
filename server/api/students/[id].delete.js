export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const id = getRouterParam(event, 'id');

  const res = await fetch(config.public.apiBase + '/api/students/' + id, {
    method: 'DELETE',
    headers: getUpstreamAuthHeaders(session),
  });
  
  return readUpstreamJson(res);
});
