export default defineEventHandler(async (event) => {
    const session = requireRole(event, ['admin', 'developer', 'guru']);
    const config = useRuntimeConfig();
    const query = getQuery(event);
    const params = new URLSearchParams(query);

    const res = await fetch(config.public.apiBase + '/api/dashboard/stats?' + params.toString(), {
      headers: getUpstreamAuthHeaders(session),
    });
    
    const json = await readUpstreamJson(res);
    const data = json?.data;
    
    if (!data) return null;

    // Map all backend stats for the new dashboard design
    return {
      total: data.totalStudents + data.totalUsers,
      klasifikasi: {
        developer: 1,
        admin: data.totalUsers,
        siswa: data.totalStudents,
        guru: data.totalUsers - 1 // Approximation
      },
      today: data.today,
      pendingLeaves: data.pendingLeaves,
      recentAttendances: data.recentAttendances,
      recentLogs: data.recentLogs,
      recentFaceFailures: data.recentFaceFailures || [],
      pagination: data.pagination || null,
      onsite_siswa: (data.today?.present || 0) + (data.today?.late || 0)
    };
  });
