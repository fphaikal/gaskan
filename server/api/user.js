export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const session = getServerSession(event);

    if (!session) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const query = getQuery(event);
    const requestedNis = query.user || session.nis;

    // Security Check: Only Admin/Guru can view others, Siswa can only view self
    if (session.role === 'siswa' && requestedNis !== session.nis) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden: You can only view your own profile' });
    }

    console.log(`[USER PROXY] Fetching profile for: ${requestedNis} (Requested by: ${session.nis} [${session.role}])`);

    // Route: Always use /api/users because models are unified
    const endpoint = `/api/users/${requestedNis}`;
    
    // Fetch data from Express backend
    const response = await fetch(config.public.apiBase + endpoint, {
      headers: getUpstreamAuthHeaders(session),
    });
    
    const json = await readUpstreamJson(response);
    const data = json.data;

    if (!data) {
      console.warn(`[USER PROXY] No data found in response for ${endpoint}`);
      return null;
    }

    // Map to structure expected by Vue profile page with safety guards
    try {
      const genderLabel = data.gender === 'L' ? 'Laki-Laki' : data.gender === 'P' ? 'Perempuan' : 'Belum Diatur';
      const religionMap = { ISLAM: 'Islam', KRISTEN: 'Kristen', KATOLIK: 'Katolik', HINDU: 'Hindu', BUDHA: 'Budha', KONGHUCU: 'Konghucu' };
      const religionLabel = data.religion ? (religionMap[data.religion] || data.religion) : '-';
      
      let birthDate = null;
      if (data.birthDate) {
        try {
          const d = new Date(data.birthDate);
          birthDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
          birthDate = data.birthDate.split('T')[0];
        }
      }
      
      const ttl = [data.birthPlace, birthDate].filter(Boolean).join(', ') || '-';
      
      const mapped = {
        id: data.id,
        Nama: data.name,
        Kelas: data.class?.className || data.role || 'Unknown',
        NIS: data.nis || data.nisn || '',
        Email: data.email || '-',
        Nomor: data.phone || '-',
        Gender: genderLabel,
        Agama: religionLabel,
        TTL: ttl,
        TanggalLahir: data.birthDate || null,
        TempatLahir: data.birthPlace || '-',
        Alamat: data.address || '-',
        Plat_Nomor: data.vehiclePlate || '-',
        url_picture: data.photoUrl || data.faceUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6366f1&color=ffffff&bold=true&size=128`,
        faceUrl: data.faceUrl || null,
        role: data.role,
        nisn: data.nisn,
        phone: data.phone,
        gender: data.gender,
        religion: data.religion,
        birthDate: data.birthDate,
        birthPlace: data.birthPlace,
        address: data.address,
        vehiclePlate: data.vehiclePlate,
        attendances: data.attendances || [],
        leaveRequests: data.leaveRequests || [],
      };

      return mapped;
    } catch (mapError) {
      console.error('[USER PROXY] Mapping Error:', mapError);
      throw createError({ statusCode: 500, statusMessage: 'Gagal memproses data profil' });
    }
  } catch (error) {
    console.error('[USER PROXY] Outer Error:', error.message);
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: error.message || 'Internal Server Error' });
  }
});
