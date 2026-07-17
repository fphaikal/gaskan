export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/system/settings`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
