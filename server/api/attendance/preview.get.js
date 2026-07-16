export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const queryString = new URLSearchParams(query).toString();

  const res = await fetch(`${config.public.apiBase}/api/attendance/preview?${queryString}`, {
    headers: getUpstreamAuthHeaders(session),
  });

  const json = await readUpstreamJson(res);
  return json;
});
