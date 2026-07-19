export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['developer']);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/system/backup/google/auth-url`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
