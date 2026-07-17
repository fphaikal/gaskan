export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'guru']);
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const res = await fetch(`${config.public.apiBase}/api/students/bulk-register-device`, {
    method: 'POST',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return readUpstreamJson(res);
});
