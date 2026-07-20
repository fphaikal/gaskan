export default defineEventHandler(async (event) => {
  const session = requireAuthSession(event);
  const config = useRuntimeConfig();

  const contentType = getHeader(event, 'content-type') || '';
  let body;
  let headers = getUpstreamAuthHeaders(session);

  if (contentType.includes('multipart/form-data')) {
    const formData = await readMultipartFormData(event);
    if (!formData) {
      throw createError({ statusCode: 400, statusMessage: 'Missing form data' });
    }
    const upstreamFormData = new FormData();
    formData.forEach((field) => {
      if (field.name === 'photo' && field.filename) {
        const blob = new Blob([field.data], { type: field.type });
        upstreamFormData.append('photo', blob, field.filename);
      } else if (field.name) {
        upstreamFormData.append(field.name, field.data.toString());
      }
    });
    body = upstreamFormData;
  } else {
    body = JSON.stringify(await readBody(event));
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${config.public.apiBase}/api/team/my-profile`, {
    method: 'PUT',
    headers,
    body,
  });
  return readUpstreamJson(res);
});
