export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiBase = (config.public.apiBase || 'https://gaskan-api.smtijogja.my.id').replace(/\/+$/, '');
  const url = `${apiBase}/api/docs/openapi.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Upstream returned status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('[DOCS PROXY ERROR]', err);
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil spesifikasi OpenAPI dari backend',
    });
  }
});
