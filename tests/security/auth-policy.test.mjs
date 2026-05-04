import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  canAccessSelfOrRole,
  canAccessUser,
  createSignedSession,
  getUpstreamAuthHeaders,
  normalizeRole,
  verifySignedSession,
} from '../../server/utils/auth.js';

test('signed sessions round-trip and reject tampering', () => {
  const now = 1_700_000_000_000;
  const session = {
    exp: now + 60_000,
    kelas: 'XI KA A',
    nis: '22100001',
    role: 'siswa',
    sessionId: 'session-123',
  };

  const token = createSignedSession(session, 'test-secret');
  assert.deepEqual(verifySignedSession(token, 'test-secret', now), session);

  const [payload, signature] = token.split('.');
  const tamperedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  tamperedPayload.role = 'developer';
  const tamperedToken = `${Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url')}.${signature}`;

  assert.equal(verifySignedSession(tamperedToken, 'test-secret', now), null);
});

test('expired or wrongly-signed sessions are rejected', () => {
  const now = 1_700_000_000_000;
  const token = createSignedSession(
    {
      exp: now - 1,
      kelas: 'XI KA A',
      nis: '22100001',
      role: 'siswa',
      sessionId: 'session-123',
    },
    'test-secret',
  );

  assert.equal(verifySignedSession(token, 'test-secret', now), null);
  assert.equal(verifySignedSession(token, 'other-secret', now - 10_000), null);
});

test('roles are normalized to security roles', () => {
  assert.equal(normalizeRole('admin'), 'admin');
  assert.equal(normalizeRole('developer'), 'developer');
  assert.equal(normalizeRole('XI KA A'), 'siswa');
  assert.equal(normalizeRole(''), 'siswa');
});

test('user object access is self-only for students and broad for privileged roles', () => {
  const student = { nis: '22100001', role: 'siswa' };
  const admin = { nis: '0001', role: 'admin' };
  const developer = { nis: '0002', role: 'developer' };

  assert.equal(canAccessUser(student, 'siswa', '22100001'), true);
  assert.equal(canAccessUser(student, 'siswa', '22100002'), false);
  assert.equal(canAccessUser(student, 'admin', '22100001'), false);
  assert.equal(canAccessUser(admin, 'developer', 'anyone'), true);
  assert.equal(canAccessUser(developer, 'admin', 'anyone'), true);
});

test('self-or-role policy permits own records and privileged roles only', () => {
  const student = { nis: '22100001', role: 'siswa' };
  const admin = { nis: '0001', role: 'admin' };

  assert.equal(canAccessSelfOrRole(student, '22100001', ['admin', 'developer']), true);
  assert.equal(canAccessSelfOrRole(student, '22100002', ['admin', 'developer']), false);
  assert.equal(canAccessSelfOrRole(admin, '22100002', ['admin', 'developer']), true);
});

test('upstream auth headers forward the server-verified session id', () => {
  const headers = getUpstreamAuthHeaders({ sessionId: 'session-123' });

  assert.equal(headers.Authorization, 'Bearer session-123');
  assert.match(headers.Cookie, /token=session-123/);
  assert.match(headers.Cookie, /sessionId=session-123/);
});
