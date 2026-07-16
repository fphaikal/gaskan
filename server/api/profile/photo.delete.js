export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const session = getServerSession(event);

    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const response = await fetch(config.public.apiBase + '/api/profile/photo', {
      method: 'DELETE',
      headers: getUpstreamAuthHeaders(session),
    });

    return await readUpstreamJson(response);
  } catch (error) {
    console.error('[PROFILE PHOTO DELETE PROXY] Error:', error);
    throw error;
  }
});
