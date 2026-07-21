export default defineEventHandler(async (event) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();
  const id = getRouterParam(event, 'id');
  const method = getMethod(event);

  const url = `${config.public.apiBase}/api/academic-events/${id}`;

  const options = {
    method,
    headers: getUpstreamAuthHeaders(session),
  };

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const body = await readBody(event);
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, options);
  return readUpstreamJson(res);
});
