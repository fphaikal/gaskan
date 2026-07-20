import { defineEventHandler, getQuery } from 'h3';
import { requireRole } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'developer']);
  const query = getQuery(event);
  return await fetchBackend(event, '/api/system/reshuffle/template', {
    method: 'GET',
    query
  });
});
