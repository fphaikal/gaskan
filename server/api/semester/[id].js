export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;
  const method = event.method;

  // PUT /api/semester/:id → update semester
  if (method === 'PUT') {
    const body = await readBody(event);
    const res = await fetch(`${config.public.apiBase}/api/semesters/${id}`, {
      method: 'PUT',
      headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    return readUpstreamJson(res);
  }

  // DELETE /api/semester/:id → delete semester
  if (method === 'DELETE') {
    const res = await fetch(`${config.public.apiBase}/api/semesters/${id}`, {
      method: 'DELETE',
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  }
});
