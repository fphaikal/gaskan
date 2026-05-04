export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const Plat_Nomor = normalizePlateNumber(body?.Plat_Nomor);

    return forwardProfileUpdate(event, 'Plat_Nomor', { Plat_Nomor });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
