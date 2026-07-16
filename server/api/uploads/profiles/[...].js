export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const path = event.context.params._;
  
  console.log(`[PHOTO PROXY] Serving: /uploads/profiles/${path}`);
  
  const res = await fetch(`${config.public.apiBase}/uploads/profiles/${path}`);
  
  if (!res.ok) {
    console.error(`[PHOTO PROXY] Failed to fetch: /uploads/profiles/${path} (${res.status})`);
    throw createError({ statusCode: 404, statusMessage: 'Photo not found' });
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  setResponseHeader(event, 'Content-Type', contentType);
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
});
