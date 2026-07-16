export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const queryString = new URLSearchParams(query).toString();

  const res = await fetch(`${config.public.apiBase}/api/attendance/export?${queryString}`, {
    headers: getUpstreamAuthHeaders(session),
  });

  // Proxy the binary blob
  const buffer = await res.arrayBuffer();
  
  // Set response headers from upstream if they exist (Content-Type, Content-Disposition)
  appendResponseHeaders(event, {
    'Content-Type': res.headers.get('Content-Type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment; filename=export.xlsx'
  });

  return buffer;
});
