export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;
  const query = getQuery(event);

  const queryParams = new URLSearchParams(query).toString();
  const url = `${config.public.apiBase}/api/students/${id}/photo${queryParams ? '?' + queryParams : ''}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
