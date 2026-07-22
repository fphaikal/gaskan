export default defineEventHandler(async (event) => {
  const studentId = getRouterParam(event, 'id');
  const session = requireSelfOrRole(event, studentId, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const params = new URLSearchParams();
  if (query.month) params.set('month', query.month.toString());
  if (query.year)  params.set('year', query.year.toString());

  const res = await fetch(`${config.public.apiBase}/api/attendance/student/${studentId}?${params.toString()}`, {
    headers: getUpstreamAuthHeaders(session),
  });

  return readUpstreamJson(res);
});
