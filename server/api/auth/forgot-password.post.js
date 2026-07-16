export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig();

  if (!body?.identifier) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: identifier is required',
    });
  }

  const response = await fetch(`${config.public.apiBase}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: body.identifier }),
  });
  
  return await readUpstreamJson(response);
});
