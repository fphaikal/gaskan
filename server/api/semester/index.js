export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const method = event.method;

  // GET /api/semester → list all semesters
  if (method === 'GET') {
    const res = await fetch(`${config.public.apiBase}/api/semesters`, {
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  }

  // POST /api/semester → create new semester
  if (method === 'POST') {
    const body = await readBody(event);
    const res = await fetch(`${config.public.apiBase}/api/semesters`, {
      method: 'POST',
      headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    return readUpstreamJson(res);
  }
});
