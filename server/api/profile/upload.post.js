export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  // 1. Get Session
  const session = getServerSession(event);
  
  if (!session || !session.sessionId) {
    console.warn('[UPLOAD PROXY] No valid session found');
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  console.log('[UPLOAD PROXY] Session verified for:', session.nama);

  // 2. Read Multipart Data
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file yang diunggah' });
  }

  // 3. Prepare FormData for Backend
  const body = new FormData();
  let fileFound = false;

  for (const field of formData) {
    if (field.name === 'photo' && field.filename) {
      const blob = new Blob([field.data], { type: field.type || 'image/jpeg' });
      body.append('photo', blob, field.filename);
      fileFound = true;
    } else if (field.name) {
      body.append(field.name, field.data.toString());
    }
  }

  if (!fileFound) {
    throw createError({ statusCode: 400, statusMessage: 'Field "photo" tidak ditemukan' });
  }

  // 4. Forward to Backend
  try {
    const response = await fetch(`${config.public.apiBase}/api/profile/upload`, {
      method: 'POST',
      headers: getUpstreamAuthHeaders(session),
      body,
    });

    const result = await response.json();
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: result.message || 'Gagal meneruskan file ke backend',
      });
    }

    return result;
  } catch (error) {
    console.error('[UPLOAD PROXY ERROR]', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Terjadi kesalahan pada proxy upload',
    });
  }
});
