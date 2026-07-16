export default defineEventHandler(async (event) => {
    const requestedNis = ensureAlphanumeric(event.context.params.id, 'student id');
    const session = requireSelfOrRole(event, requestedNis, ['admin', 'developer', 'guru']);
    const config = useRuntimeConfig(); // get runtime config
  
    const res = await fetch(config.public.apiBase + `/api/siswa/${requestedNis}?reverse=true`, {
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(res);
  });
  
