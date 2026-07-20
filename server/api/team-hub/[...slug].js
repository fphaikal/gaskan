export default defineEventHandler(async (event) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();

  const slug = event.context.params.slug || '';
  const query = getQuery(event);
  const queryString = new URLSearchParams(query).toString();
  const targetUrl = `${config.public.apiBase}/api/team-hub/${slug}${queryString ? `?${queryString}` : ''}`;

  const method = event.node.req.method;
  const headers = getUpstreamAuthHeaders(session);

  let body = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    body = JSON.stringify(await readBody(event));
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(targetUrl, {
    method,
    headers,
    body,
  });

  return readUpstreamJson(res);
});
