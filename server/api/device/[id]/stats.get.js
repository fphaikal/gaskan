export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;

  const res = await fetch(`${config.public.apiBase}/api/device/${id}/stats`, {
    method: 'GET',
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
