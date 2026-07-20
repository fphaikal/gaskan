import { defineEventHandler, readBody } from 'h3';
import { requireRole, getUpstreamAuthHeaders, readUpstreamJson } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();

  const body = await readBody(event);
  const res = await fetch(`${config.public.apiBase}/api/system/reshuffle`, {
    method: 'POST',
    headers: getUpstreamAuthHeaders(session, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });

  return readUpstreamJson(res);
});
