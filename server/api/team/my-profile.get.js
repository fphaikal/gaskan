export default defineEventHandler(async (event) => {
  const session = requireAuthSession(event);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/team/my-profile`, {
    headers: getUpstreamAuthHeaders(session),
  });
  return readUpstreamJson(res);
});
