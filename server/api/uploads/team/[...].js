export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const path = event.context.params._;
  
  const res = await fetch(`${config.public.apiBase}/uploads/team/${path}`);
  
  if (!res.ok) {
    throw createError({ statusCode: 404, statusMessage: 'Photo not found' });
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  setResponseHeader(event, 'Content-Type', contentType);
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
});
