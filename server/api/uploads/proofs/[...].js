export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const path = event.context.params._ || event.context.params.path;
  
  const res = await fetch(`${config.public.apiBase}/uploads/proofs/${path}`);
  
  if (!res.ok) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' });
  }

  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  setResponseHeader(event, 'Content-Type', contentType);
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400');

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
});
