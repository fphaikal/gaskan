export default defineEventHandler(async (event) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();
  const id = event.context.params.id;

  // Read the raw body as buffer for multipart forwarding
  const contentType = getRequestHeader(event, 'content-type') || '';
  const body = await readRawBody(event, false);

  const res = await fetch(`${config.public.apiBase}/api/leaves/${id}/proofs`, {
    method: 'POST',
    headers: {
      ...getUpstreamAuthHeaders(session),
      'Content-Type': contentType,
    },
    body,
  });

  return readUpstreamJson(res);
});
