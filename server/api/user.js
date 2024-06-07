export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const config = useRuntimeConfig(); // get runtime config

    // Fetch data initially
    const response = await fetch(config.public.apiBase + `/api/${query.role}/${query.user}`); // Fetch data dari API
    const data = response.json();
  
    // Ambil nama member dari setiap recent
    return data;
  });