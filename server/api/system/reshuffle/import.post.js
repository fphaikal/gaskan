import { defineEventHandler, readBody } from 'h3';
import { requireRole } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'developer']);
  const body = await readBody(event);
  return await fetchBackend(event, '/api/system/reshuffle/import', {
    method: 'POST',
    body
  });
});
