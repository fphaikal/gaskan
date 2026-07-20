import { defineEventHandler } from 'h3';
import { requireRole, getUpstreamAuthHeaders, readUpstreamJson } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();

  const res = await fetch(`${config.public.apiBase}/api/system/reshuffle/history`, {
    headers: getUpstreamAuthHeaders(session),
  });

  return readUpstreamJson(res);
});
