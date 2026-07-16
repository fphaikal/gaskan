export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig();

  if (!body?.token || !body?.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: token and password are required',
    });
  }

  const response = await fetch(`${config.public.apiBase}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      token: body.token,
      password: body.password 
    }),
  });
  
  return await readUpstreamJson(response);
});
