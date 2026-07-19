export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;

  const res = await fetch(`${config.public.apiBase}/api/device/${id}/capture`, {
    method: 'GET',
    headers: getUpstreamAuthHeaders(session),
  });

  if (!res.ok) {
    return readUpstreamJson(res);
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  setResponseHeader(event, 'Content-Type', contentType);

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
});
