const asTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

const badRequest = (message) => {
  throw createError({ statusCode: 400, statusMessage: message });
};

export const normalizeTtl = (value) => {
  const ttl = asTrimmedString(value);
  if (!ttl) badRequest('TTL is required');
  if (ttl.length > 120) badRequest('TTL is too long');
  return ttl;
};

export const normalizePhoneNumber = (value) => {
  const nomor = asTrimmedString(value);
  if (!/^[0-9]{8,15}$/.test(nomor)) {
    badRequest('Nomor must contain 8 to 15 digits');
  }
  return nomor;
};

export const normalizePlateNumber = (value) => {
  const plat = asTrimmedString(value).toUpperCase();
  if (!plat) badRequest('Plat nomor is required');
  if (plat.length > 20) badRequest('Plat nomor is too long');
  if (!/^[A-Z0-9 -]+$/.test(plat)) {
    badRequest('Plat nomor contains invalid characters');
  }
  return plat;
};

export const normalizePassword = (value) => {
  const password = typeof value === 'string' ? value : '';
  if (!password) badRequest('Password is required');
  if (password.length < 6) badRequest('Password minimal 6 karakter');
  if (password.length > 128) badRequest('Password is too long');
  return password;
};

export const toProfileValidationError = (error) =>
  createError({
    statusCode: 400,
    statusMessage: error?.message || 'Bad Request: invalid profile input',
  });

/**
 * Generic profile update — forwards PATCH /api/profile/me to backend
 * payload: object with fields to update (snake_case matches new backend schema)
 */
export const forwardProfileUpdate = async (event, _field, payload) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();

  const response = await fetch(`${config.public.apiBase}/api/profile/me`, {
    method: 'PUT',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  return readUpstreamJson(response);
};

/**
 * Password change — forwards to PUT /api/profile/password
 */
export const forwardPasswordChange = async (event, currentPassword, newPassword) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();

  const response = await fetch(`${config.public.apiBase}/api/profile/password`, {
    method: 'PUT',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  return readUpstreamJson(response);
};
