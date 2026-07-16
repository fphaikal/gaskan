export default defineEventHandler(async (event) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();
  const query = getQuery(event);

  // Build query string for backend
  const params = new URLSearchParams();
  if (query.month) params.set('month', query.month.toString());
  if (query.year) params.set('year', query.year.toString());
  if (query.semesterId) params.set('semesterId', query.semesterId.toString());

  const url = `${config.public.apiBase}/api/attendance/my?${params.toString()}`;

  const res = await fetch(url, {
    headers: getUpstreamAuthHeaders(session),
  });

  return readUpstreamJson(res);
});
