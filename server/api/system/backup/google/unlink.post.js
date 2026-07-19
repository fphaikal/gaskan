export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['developer']);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/system/backup/google/unlink`, {
    method: 'POST',
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
