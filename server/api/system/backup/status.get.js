export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['developer']);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/system/backup/status`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
