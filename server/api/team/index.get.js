export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const res = await fetch(config.public.apiBase + '/api/team');
  return readUpstreamJson(res);
});
