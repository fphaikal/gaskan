export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const plat = normalizePlateNumber(body?.Plat_Nomor);

    return forwardProfileUpdate(event, 'vehiclePlate', { vehiclePlate: plat });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
