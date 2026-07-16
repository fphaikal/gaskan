export default defineEventHandler(async (event) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();
  const method = event.method;

  // GET /api/izin → depends on role
  if (method === 'GET') {
    const isSiswa = session.role === 'siswa';
    const endpoint = isSiswa ? '/api/leaves/my' : '/api/leaves';
    const query = getQuery(event);
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status.toString());
    if (query.classId) params.set('classId', query.classId.toString());

    const res = await fetch(`${config.public.apiBase}${endpoint}?${params.toString()}`, {
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  }

  // POST /api/izin → create leave (siswa only)
  if (method === 'POST') {
    const body = await readBody(event);
    const res = await fetch(`${config.public.apiBase}/api/leaves`, {
      method: 'POST',
      headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    return readUpstreamJson(res);
  }
});
