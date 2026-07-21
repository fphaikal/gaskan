export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const method = getMethod(event);
  const query = getQuery(event);
  const params = new URLSearchParams(query);
  const path = event.context.params?.path || '';

  const apiBase = (config.public.apiBase || 'https://gaskan-api.smtijogja.my.id').replace(/\/+$/, '');
  let url = `${apiBase}/api/docs/${path}`;
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const options = {
    method,
    headers: {
      'Accept': 'application/json',
    }
  };

  const reqAuth = getRequestHeader(event, 'authorization');
  if (reqAuth) {
    options.headers['Authorization'] = reqAuth;
  }

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();
  } catch (err) {
    console.error('[DOCS CATCH-ALL PROXY ERROR]', err);
    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway / Backend Offline',
    });
  }
});
