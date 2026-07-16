export default defineEventHandler(async (event) => {
    const session = requireRole(event, ['admin', 'developer', 'guru']);
    const config = useRuntimeConfig();
    const query = getQuery(event);
    const page = query.page || 1;
    const limit = query.limit || 50;

    const params = new URLSearchParams({
      action: 'LOGIN',
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (query.search) params.append('search', query.search);
    if (query.date) params.append('date', query.date);

    const res = await fetch(`${config.public.apiBase}/api/dashboard/logs?${params.toString()}`, {
      headers: getUpstreamAuthHeaders(session),
    });
    
    return await readUpstreamJson(res);
  });
  
