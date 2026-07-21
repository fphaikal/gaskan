import { defineEventHandler, getQuery } from 'h3';
import { requireRole, getUpstreamAuthHeaders, readUpstreamJson } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();

  // Forward pagination / search / filter query params to backend
  const query = getQuery(event);
  const qs = new URLSearchParams();
  if (query.page)   qs.set('page',   String(query.page));
  if (query.limit)  qs.set('limit',  String(query.limit));
  if (query.search) qs.set('search', String(query.search));
  if (query.type)   qs.set('type',   String(query.type));

  const url = `${config.public.apiBase}/api/system/reshuffle/history?${qs.toString()}`;

  const res = await fetch(url, {
    headers: getUpstreamAuthHeaders(session),
  });

  return readUpstreamJson(res);
});

