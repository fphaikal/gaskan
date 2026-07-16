export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const newPassword = normalizePassword(body?.Password);
    // currentPassword — for legacy siswa accounts, use empty string as fallback
    const currentPassword = body?.CurrentPassword || '';

    return forwardPasswordChange(event, currentPassword, newPassword);
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
