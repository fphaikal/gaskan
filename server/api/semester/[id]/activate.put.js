export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;

  const res = await fetch(`${config.public.apiBase}/api/semesters/${id}/activate`, {
    method: 'PUT',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
  });
  return readUpstreamJson(res);
});
