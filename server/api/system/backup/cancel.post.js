export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['developer']);
  const config = useRuntimeConfig();
  const body = await readBody(event).catch(() => ({}));

  const res = await fetch(`${config.public.apiBase}/api/system/backup/cancel`, {
    method: 'POST',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body || {}),
  });
  return readUpstreamJson(res);
});
