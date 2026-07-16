export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;

  const res = await fetch(`${config.public.apiBase}/api/classes/${id}`, {
    method: 'DELETE',
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
