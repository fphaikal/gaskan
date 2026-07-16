export default defineEventHandler(async (event) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();
  const id = event.context.params.id;
  const method = event.method;

  // DELETE /api/izin/:id → cancel leave (siswa)
  if (method === 'DELETE') {
    const res = await fetch(`${config.public.apiBase}/api/leaves/${id}`, {
      method: 'DELETE',
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  }
});
