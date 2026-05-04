export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const config = useRuntimeConfig();

    // Whitelist role untuk mencegah path traversal dan SSRF
    const allowedRoles = ['admin', 'developer', 'siswa'];
    if (!allowedRoles.includes(query.role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: Invalid role'
      });
    }

    // Sanitasi user ID: hanya huruf dan angka
    const requestedUser = ensureAlphanumeric(query.user, 'user ID');
    const session = requireUserAccess(event, query.role, requestedUser);

    // Fetch data initially
    const response = await fetch(config.public.apiBase + `/api/${query.role}/${requestedUser}`, {
      headers: getUpstreamAuthHeaders(session),
    });
    return readUpstreamJson(response);
  });
