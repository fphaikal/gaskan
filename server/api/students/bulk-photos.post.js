export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer', 'guru']);
  const config = useRuntimeConfig();
  
  // Forward multipart/form-data
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No files uploaded' });
  }

  const backendFormData = new FormData();
  formData.forEach(item => {
    if (item.name === 'photos') {
      const blob = new Blob([item.data], { type: item.type });
      backendFormData.append('photos', blob, item.filename);
    } else if (item.name) {
      backendFormData.append(item.name, item.data.toString());
    }
  });

  const res = await fetch(`${config.public.apiBase}/api/students/bulk-photos`, {
    method: 'POST',
    headers: getUpstreamAuthHeaders(session),
    body: backendFormData,
  });

  return readUpstreamJson(res);
});
