export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig(); // get runtime config

    const res = await fetch(config.public.apiBase + '/api/primary', {
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  });
