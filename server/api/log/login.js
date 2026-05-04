export default defineEventHandler(async (event) => {
    const session = requireRole(event, ['admin', 'developer']);
    const config = useRuntimeConfig(); // get runtime config
  
    const res = await fetch(config.public.apiBase + "/api/loglogin?reverse=true", {
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  });
  
