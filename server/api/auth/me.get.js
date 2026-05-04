export default defineEventHandler((event) => {
  const session = requireSession(event);

  return publicSession(session);
});
