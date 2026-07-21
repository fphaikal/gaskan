export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru', 'siswa']);
  const config = useRuntimeConfig();

  const body = await readBody(event);
  const res = await fetch(`${config.public.apiBase}/api/profile/sync-photos`, {
    method: 'POST',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return readUpstreamJson(res);
});
