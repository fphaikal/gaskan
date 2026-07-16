export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;
  const body = await readBody(event);

  const res = await fetch(`${config.public.apiBase}/api/classes/${id}`, {
    method: 'PUT',
    headers: {
      ...getUpstreamAuthHeaders(session),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return readUpstreamJson(res);
});
