import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'gaskan_session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 Days
const DEV_SESSION_SECRET = 'development-only-gaskan-session-secret';
const ALLOWED_ROLES = new Set(['admin', 'developer', 'guru', 'siswa']);

const toBase64Url = (value) => Buffer.from(value).toString('base64url');

const fromBase64Url = (value) => Buffer.from(value, 'base64url').toString('utf8');

const sign = (payload, secret) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export const normalizeRole = (role) => {
  const r = role?.toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'developer') return 'developer';
  if (r === 'guru') return 'guru';
  return 'siswa';
};

export const createSignedSession = (session, secret) => {
  const payload = toBase64Url(JSON.stringify(session));
  return `${payload}.${sign(payload, secret)}`;
};

export const verifySignedSession = (token, secret, now = Date.now()) => {
  if (!token || !secret || typeof token !== 'string') return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload, secret);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(payload));
    if (!session?.sessionId || !session?.nis || !ALLOWED_ROLES.has(session?.role)) {
      return null;
    }
    if (!Number.isFinite(session.exp) || session.exp <= now) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const canAccessSelfOrRole = (session, requestedNis, privilegedRoles = []) => {
  if (!session || !requestedNis) return false;
  if (privilegedRoles.includes(session.role)) return true;
  return session.nis?.toString() === requestedNis.toString();
};

export const canAccessUser = (session, requestedRole, requestedUser) => {
  if (!session || !requestedRole || !requestedUser) return false;
  if (!ALLOWED_ROLES.has(requestedRole)) return false;
  if (session.role === 'admin' || session.role === 'developer') return true;
  // Guru can view any profile (they need to manage students)
  if (session.role === 'guru') return true;
  // Siswa can view their own profile
  return requestedRole === 'siswa' && session.nis?.toString() === requestedUser.toString();
};

export const getUpstreamAuthHeaders = (session, extraHeaders = {}) => {
  if (!session?.sessionId) return { ...extraHeaders };

  const encodedSessionId = encodeURIComponent(session.sessionId);
  return {
    Authorization: `Bearer ${session.sessionId}`,
    Cookie: `token=${encodedSessionId}; sessionId=${encodedSessionId}`,
    'X-Session-Id': session.sessionId,
    ...extraHeaders,
  };
};

export const createSessionFromLogin = (data, now = Date.now()) => {
  if (!data?.token || !data?.user) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway: invalid login response',
    });
  }

  return {
    exp: now + SESSION_MAX_AGE_SECONDS * 1000,
    kelas: data.user.role || '',
    nama: data.user.name || '',
    nis: data.user.nis?.toString() || data.user.email || '',
    role: data.user.role?.toLowerCase() || 'siswa',
    sessionId: data.token,
  };
};

export const publicSession = (session) => ({
  authenticated: true,
  user: {
    kelas: session.kelas,
    nama: session.nama,
    nis: session.nis,
    role: session.role,
  },
});

export const getSessionSecret = () => {
  const config = useRuntimeConfig();
  const secret = config.sessionSecret || process.env.NUXT_SESSION_SECRET || process.env.SESSION_SECRET;

  if (secret) return secret;
  if (import.meta.dev) return DEV_SESSION_SECRET;

  throw createError({
    statusCode: 500,
    statusMessage: 'Server session secret is not configured',
  });
};

export const setSessionCookie = (event, session) => {
  const token = createSignedSession(session, getSessionSecret());
  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: !import.meta.dev,
  });
};

export const clearSessionCookie = (event) => {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/',
    sameSite: 'lax',
    secure: !import.meta.dev,
  });
};

export const getServerSession = (event) => {
  const token = getCookie(event, SESSION_COOKIE_NAME);
  return verifySignedSession(token, getSessionSecret());
};

export const requireSession = (event) => {
  const session = getServerSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
  return session;
};

export const requireRole = (event, roles) => {
  const session = requireSession(event);
  if (!roles.includes(session.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    });
  }
  return session;
};

export const requireSelfOrRole = (event, requestedNis, roles) => {
  const session = requireSession(event);
  if (!canAccessSelfOrRole(session, requestedNis, roles)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    });
  }
  return session;
};

export const requireUserAccess = (event, requestedRole, requestedUser) => {
  const session = requireSession(event);
  if (!canAccessUser(session, requestedRole, requestedUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    });
  }
  return session;
};

export const ensureAlphanumeric = (value, fieldName) => {
  const normalized = value?.toString();
  if (!normalized || !/^[a-zA-Z0-9]+$/.test(normalized)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Bad Request: invalid ${fieldName}`,
    });
  }
  return normalized;
};

export const readUpstreamJson = async (response) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw createError({
      data,
      statusCode: response.status,
      statusMessage: data?.error || data?.message || response.statusText || 'Upstream request failed',
    });
  }
  return data;
};
