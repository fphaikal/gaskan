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

  const NIS = ensureAlphanumeric(body.NIS, 'NIS');

  const response = await fetch(`${config.public.apiBase}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      NIS: !isNaN(Number(NIS)) ? Number(NIS) : NIS,
      Password,
      force: Boolean(body.force),
    }),
  });
  const data = await readUpstreamJson(response);
  const session = createSessionFromLogin(data);

  setSessionCookie(event, session);

  return publicSession(session);
});
