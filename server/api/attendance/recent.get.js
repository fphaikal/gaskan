export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const res = await fetch(config.public.apiBase + '/api/attendance/recent');
  return readUpstreamJson(res);
});
