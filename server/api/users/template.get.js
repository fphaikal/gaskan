export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/users/template`, {
    headers: getUpstreamAuthHeaders(session),
  });

  if (!res.ok) {
    throw createError({ statusCode: res.status, statusMessage: 'Failed to download user template' });
  }

  // Forward the excel file
  const blob = await res.blob();
  event.node.res.setHeader('Content-Type', res.headers.get('Content-Type'));
  event.node.res.setHeader('Content-Disposition', res.headers.get('Content-Disposition'));
  
  return blob.stream();
});
