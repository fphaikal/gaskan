export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const studentId = getRouterParam(event, 'id');
  const query = getQuery(event);

  const params = new URLSearchParams();
  if (query.month) params.set('month', query.month.toString());
  if (query.year)  params.set('year', query.year.toString());

  const res = await fetch(`${config.public.apiBase}/api/attendance/student/${studentId}?${params.toString()}`, {
    headers: getUpstreamAuthHeaders(session),
  });

  return readUpstreamJson(res);
});
