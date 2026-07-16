export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const id = getRouterParam(event, 'id');

  const res = await fetch(config.public.apiBase + `/api/classes/majors/${id}`, {
    method: 'DELETE',
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
