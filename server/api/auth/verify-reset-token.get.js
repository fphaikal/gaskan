export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();

  if (!query?.token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: token is required',
    });
  }

  const response = await fetch(`${config.public.apiBase}/api/auth/verify-reset-token/${encodeURIComponent(query.token)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return await readUpstreamJson(response);
});
