export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const Nomor = normalizePhoneNumber(body?.Nomor);

    return forwardProfileUpdate(event, 'Nomor', { Nomor });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
