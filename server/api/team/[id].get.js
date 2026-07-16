export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;

  const res = await fetch(`${config.public.apiBase}/api/team/${id}`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
