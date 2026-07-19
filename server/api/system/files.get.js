export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['developer']);
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', String(query.search));
  if (query.type) params.set('type', String(query.type));
  if (query.dir) params.set('dir', String(query.dir));
  if (query.backupStatus) params.set('backupStatus', String(query.backupStatus));

  const res = await fetch(`${config.public.apiBase}/api/system/files?${params.toString()}`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
