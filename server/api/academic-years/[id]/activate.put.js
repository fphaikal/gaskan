
export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;

  const res = await fetch(`${config.public.apiBase}/api/academic-years/${id}/activate`, {
    method: 'PUT',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
  });
  return readUpstreamJson(res);
});
