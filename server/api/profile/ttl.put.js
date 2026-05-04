export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const TTL = normalizeTtl(body?.TTL);

    return forwardProfileUpdate(event, 'TTL', { TTL });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
