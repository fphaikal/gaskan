export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const Password = normalizePassword(body?.Password);

    return forwardProfileUpdate(event, 'Password', { Password });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw toProfileValidationError(error);
  }
});
