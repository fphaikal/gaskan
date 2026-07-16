export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru', 'siswa']);
  const config = useRuntimeConfig();

  const res = await fetch(config.public.apiBase + '/api/classes', {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
