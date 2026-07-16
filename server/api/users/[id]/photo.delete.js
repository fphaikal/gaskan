export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const session = getServerSession(event);

    if (!session || session.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin only' });
    }

    const id = event.context.params.id;

    const response = await fetch(`${config.public.apiBase}/api/users/${id}/photo`, {
      method: 'DELETE',
      headers: getUpstreamAuthHeaders(session),
    });

    return await readUpstreamJson(response);
  } catch (error) {
    console.error('[ADMIN PHOTO DELETE PROXY] Error:', error);
    throw error;
  }
});
