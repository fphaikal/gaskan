export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig();
  const Password = typeof body?.Password === 'string' ? body.Password : '';

  if (!body?.NIS || !Password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: NIS and Password are required',
    });
  }

  const identifier = body.NIS?.toString();

  const response = await fetch(`${config.public.apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      password: Password,
    }),
  });
  const data = await readUpstreamJson(response);
  const session = createSessionFromLogin(data.data);

  setSessionCookie(event, session);

  return publicSession(session);
});
