export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['developer', 'admin']);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/system/metrics`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
