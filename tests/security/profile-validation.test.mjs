import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizePassword,
  normalizePhoneNumber,
  normalizePlateNumber,
  normalizeTtl,
} from '../../server/utils/profile.js';

test('profile text fields are trimmed and bounded', () => {
  assert.equal(normalizeTtl('  Jakarta, 2007-01-02  '), 'Jakarta, 2007-01-02');
  assert.throws(() => normalizeTtl(''), /TTL is required/);
  assert.throws(() => normalizeTtl('a'.repeat(121)), /TTL is too long/);
});

test('phone numbers accept digits only with sane length', () => {
  assert.equal(normalizePhoneNumber('81234567890'), '81234567890');
  assert.throws(() => normalizePhoneNumber('0812-345'), /Nomor must contain 8 to 15 digits/);
  assert.throws(() => normalizePhoneNumber('1234567'), /Nomor must contain 8 to 15 digits/);
});

test('plate numbers are uppercased and limited to common plate characters', () => {
  assert.equal(normalizePlateNumber(' ab 1234 cd '), 'AB 1234 CD');
  assert.throws(() => normalizePlateNumber('AB<script>'), /Plat nomor contains invalid characters/);
  assert.throws(() => normalizePlateNumber('A'.repeat(21)), /Plat nomor is too long/);
});

test('password changes require a non-trivial new password', () => {
  assert.equal(normalizePassword('new-password-123'), 'new-password-123');
  assert.throws(() => normalizePassword('short'), /Password must be at least 8 characters/);
  assert.throws(() => normalizePassword(''), /Password is required/);
});
