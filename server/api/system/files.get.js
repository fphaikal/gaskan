export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['developer']);
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const parts = [];
  if (query.page) parts.push(`page=${encodeURIComponent(String(query.page))}`);
  if (query.limit) parts.push(`limit=${encodeURIComponent(String(query.limit))}`);
  if (query.search) parts.push(`search=${encodeURIComponent(String(query.search))}`);
  if (query.type) parts.push(`type=${encodeURIComponent(String(query.type))}`);
  if (query.dir) parts.push(`dir=${encodeURIComponent(String(query.dir))}`);
  if (query.backupStatus) parts.push(`backupStatus=${encodeURIComponent(String(query.backupStatus))}`);

  const queryString = parts.length > 0 ? `?${parts.join('&')}` : '';

  const res = await fetch(`${config.public.apiBase}/api/system/files${queryString}`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
