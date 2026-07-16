export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  const res = await fetch(config.public.apiBase + `/api/classes/majors/${id}`, {
    method: 'PUT',
    headers: {
      ...getUpstreamAuthHeaders(session),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return readUpstreamJson(res);
});
