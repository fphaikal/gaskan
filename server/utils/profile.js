const asTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

const badRequest = (message) => {
  throw new Error(message);
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
  if (password.length < 8) badRequest('Password must be at least 8 characters');
  if (password.length > 128) badRequest('Password is too long');
  return password;
};

export const toProfileValidationError = (error) =>
  createError({
    statusCode: 400,
    statusMessage: error?.message || 'Bad Request: invalid profile input',
  });

export const forwardProfileUpdate = async (event, field, body) => {
  const session = requireSession(event);
  const config = useRuntimeConfig();

  const response = await fetch(`${config.public.apiBase}/api/edit/primary/${field}/${session.nis}`, {
    method: 'PUT',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });

  return readUpstreamJson(response);
};
