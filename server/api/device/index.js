export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const method = event.method;

  if (method === 'GET') {
    const res = await fetch(`${config.public.apiBase}/api/device`, {
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  }

  if (method === 'POST') {
    const body = await readBody(event);
    const res = await fetch(`${config.public.apiBase}/api/device`, {
      method: 'POST',
      headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    return readUpstreamJson(res);
  }
});
