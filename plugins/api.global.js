/**
 * api.global.js — Disabled (all API calls go through Nitro proxy)
 * Nitro routeRules in nuxt.config.ts handles /api/** → backend
 */
export default defineNuxtPlugin(() => {
  // No-op: all routing handled by Nitro routeRules
});
