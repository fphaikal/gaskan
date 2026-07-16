export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Build payload — forward all supported biodata fields
    const payload = {};
    if ('birthPlace' in body) payload.birthPlace = body.birthPlace?.trim() || null;
    if ('birthDate' in body) payload.birthDate = body.birthDate || null;
    if ('gender' in body) payload.gender = body.gender || null;
    if ('religion' in body) payload.religion = body.religion || null;
    if ('address' in body) payload.address = body.address?.trim() || null;
    if ('email' in body) payload.email = body.email?.trim() || null;

    if (Object.keys(payload).length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Tidak ada field yang diperbarui' });
    }

    return forwardProfileUpdate(event, 'biodata', payload);
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
