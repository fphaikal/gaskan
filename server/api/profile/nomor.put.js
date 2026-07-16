export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const nomor = normalizePhoneNumber(body?.Nomor?.toString());

    return forwardProfileUpdate(event, 'phone', { phone: nomor });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
