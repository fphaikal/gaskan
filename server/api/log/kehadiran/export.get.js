const CONTENT_TYPES = {
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const query = getQuery(event);
  const type = query.type?.toString().toLowerCase();

  if (!CONTENT_TYPES[type]) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: invalid export type',
    });
  }

  const config = useRuntimeConfig();
  const response = await fetch(`${config.public.apiBase}/file/kehadiran?type=${type}`, {
    headers: getUpstreamAuthHeaders(session),
  });

  if (!response.ok) {
    await readUpstreamJson(response);
  }

  setHeader(event, 'Content-Type', response.headers.get('content-type') || CONTENT_TYPES[type]);
  setHeader(
    event,
    'Content-Disposition',
    response.headers.get('content-disposition') || `attachment; filename="kehadiran.${type}"`
  );

  return new Uint8Array(await response.arrayBuffer());
});
