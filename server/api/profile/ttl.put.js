export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const birthPlace = body?.TTL?.split(',')[0]?.trim();
    const dateStr = body?.TTL?.split(',').slice(1).join(',').trim();

    // Send to new backend format
    return forwardProfileUpdate(event, 'ttl', {
      birthPlace: birthPlace || body?.TTL,
      birthDate: dateStr || undefined,
    });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
