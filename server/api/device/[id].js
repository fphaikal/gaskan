export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;
  const method = event.method;

  if (method === 'PUT') {
    const body = await readBody(event);
    const res = await fetch(`${config.public.apiBase}/api/device/${id}`, {
      method: 'PUT',
      headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    return readUpstreamJson(res);
  }

  if (method === 'DELETE') {
    const res = await fetch(`${config.public.apiBase}/api/device/${id}`, {
      method: 'DELETE',
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  }
});
