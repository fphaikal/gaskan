import { getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const session = requireRole(event, ['admin', 'developer']);
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const qStr = new URLSearchParams(query).toString();

  const targetUrl = `${config.public.apiBase}/api/system/reshuffle/template${qStr ? '?' + qStr : ''}`;
  const res = await fetch(targetUrl, {
    headers: getUpstreamAuthHeaders(session),
  });

  if (!res.ok) {
    throw createError({ statusCode: res.status, statusMessage: 'Gagal mengunduh template reshuffle' });
  }

  // Forward the excel file stream
  const blob = await res.blob();
  event.node.res.setHeader('Content-Type', res.headers.get('Content-Type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  event.node.res.setHeader('Content-Disposition', res.headers.get('Content-Disposition') || 'attachment; filename=Reshuffle_Template.xlsx');
  
  return blob.stream();
});
