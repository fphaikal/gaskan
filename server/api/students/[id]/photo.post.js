export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'guru']);
  const config = useRuntimeConfig();
  const id = event.context.params.id;

  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file yang diunggah' });
  }

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

  try {
    const response = await fetch(`${config.public.apiBase}/api/students/${id}/photo`, {
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
    console.error('[STUDENT PHOTO UPLOAD PROXY ERROR]', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Terjadi kesalahan pada proxy upload foto siswa',
    });
  }
});
