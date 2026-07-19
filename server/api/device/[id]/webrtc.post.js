export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const id = event.context.params.id;
  
  const body = await readRawBody(event, 'utf-8');
  const query = getQuery(event);
  const src = query.src || id;

  const isLocal = process.env.NODE_ENV === 'development';
  const go2rtcHost = isLocal ? 'http://localhost:1984' : 'https://stream-gaskan.smtijogja.my.id';

  const res = await fetch(`${go2rtcHost}/api/webrtc?src=${src}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: body
  });

  if (!res.ok) {
    throw createError({
      statusCode: res.status,
      statusMessage: 'Failed to negotiate WebRTC with go2rtc'
    });
  }

  const answer = await res.text();
  return answer;
});
