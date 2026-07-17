export default defineEventHandler(async (event) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/academic-events`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
