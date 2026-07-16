export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Missing form data' });
  }

  // Construct new FormData for upstream
  const upstreamFormData = new FormData();
  formData.forEach((field) => {
    if (field.name === 'photo' && field.filename) {
      const blob = new Blob([field.data], { type: field.type });
      upstreamFormData.append('photo', blob, field.filename);
    } else if (field.name) {
      upstreamFormData.append(field.name, field.data.toString());
    }
  });

  const res = await fetch(config.public.apiBase + '/api/team', {
    method: 'POST',
    headers: {
      ...getUpstreamAuthHeaders(session),
      // Don't set Content-Type, fetch will set it with boundary
    },
    body: upstreamFormData,
  });
  return readUpstreamJson(res);
});
