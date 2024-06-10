export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(); // get runtime config
  
    const res = await fetch(config.public.apiBase + "/api/onsite");
    const data = await res.json();
    return data;
  });
  