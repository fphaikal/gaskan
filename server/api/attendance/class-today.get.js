export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const params = new URLSearchParams();
  if (query.classId) params.set('classId', query.classId.toString());
  if (query.page)   params.set('page', query.page.toString());
  if (query.limit)  params.set('limit', query.limit.toString());
  if (query.search) params.set('search', query.search.toString());
  if (query.date)   params.set('date', query.date.toString());

  const res = await fetch(`${config.public.apiBase}/api/attendance/class-today?${params.toString()}`, {
    headers: getUpstreamAuthHeaders(session),
  });

  return readUpstreamJson(res);
});

