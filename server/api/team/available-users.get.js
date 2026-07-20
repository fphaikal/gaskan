export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/team/available-users`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
