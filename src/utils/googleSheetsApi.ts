import {
  SchoolProfile,
  SchoolClass,
  Teacher,
  Student,
  LessonSchedule,
  StudentGrade,
  StudentAttendance,
  TeachingJournal,
} from '../types/school';
import { UserAccount } from '../types/auth';

export const SPREADSHEET_ID_DEFAULT = '1hpH6qjMBIC_HsiK-gYFWu_mXdGHSrP00YW_G13ATFHA';
export const GID_PROFIL = '0';
export const GID_USERS_TEACHERS = '158463269';
export const GID_USER = '158463269'; // Sheet "user" / "Akun_Guru_GTK"
export const GID_KELAS = '741157322';
export const GID_SISWA = '1653577372';
export const GID_MAPEL = '2022369648';
export const GID_JADWAL = '462744807';
export const GID_ABSEN = '1317223548';
export const GID_JURNAL = '215052993';
export const GID_NILAI = '626678318';
export const GID_CATATAN = '30122210';

export const KNOWN_CLASS_MAP: Record<string, string> = {
  'ID_1981011600001': '10 AKL 1',
  'ID_1981011600002': '10 AKL 2',
  'ID_1981011600003': '10 AKL 3',
  'ID_1981011600004': '10 AKL 4',
  'ID_1981011600005': '10 DPIB 1',
  'ID_1981011600006': '10 DPIB 2',
  'ID_1981011600007': '10 NKPI 1',
  'ID_1981011600008': '10 NKPI 2',
  'ID_1981011600009': '11 AKL 1',
  'ID_1981011600010': '11 AKL 2',
  'ID_1981011600011': '11 AKL 3',
  'ID_1981011600012': '11 AKL 4',
  'ID_1981011600013': '11 DPIB',
  'ID_1981011600014': '11 NKPI 1',
  'ID_1981011600015': '11 NKPI 2',
  'ID_1981011600016': '12 AKL 1',
  'ID_1981011600017': '12 AKL 2',
  'ID_1981011600018': '12 AKL 3',
  'ID_1981011600019': '12 AKL 4',
  'ID_1981011600020': '12 DPIB',
  'ID_1981011600021': '12 NKPI 1',
  'ID_1981011600022': '12 NKPI 2',
};

/**
 * Robust CSV parser that handles quotes, escaped quotes, commas, and newlines
 */
export const parseCsvTo2DArray = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

/**
 * Fetch spreadsheet metadata
 */
export const fetchSpreadsheetMetadata = async (spreadsheetId: string, accessToken?: string | null) => {
  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title,gridProperties)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Direct OAuth metadata fetch failed, attempting public fallback', err);
    }
  }

  // Fallback metadata for known sheets
  return {
    spreadsheetId,
    properties: {
      title: 'SMK Negeri 2 Songgom Database',
    },
    sheets: [
      { properties: { sheetId: 158463269, title: 'Akun_Guru_GTK' } },
      { properties: { sheetId: 1653577372, title: 'Data_Siswa' } },
      { properties: { sheetId: 741157322, title: 'Data_Kelas' } },
      { properties: { sheetId: 462744807, title: 'Jadwal_Pelajaran' } },
      { properties: { sheetId: 1317223548, title: 'Absen' } },
      { properties: { sheetId: 215052993, title: 'Jurnal' } },
      { properties: { sheetId: 626678318, title: 'Nilai' } },
      { properties: { sheetId: 0, title: 'Profil_Sekolah' } },
    ],
  };
};

/**
 * Fetch values from a specific Sheet range or GID
 */
export const fetchSheetRangeValues = async (
  spreadsheetId: string,
  range: string = 'A1:Z100',
  accessToken?: string | null,
  gid?: string | number
): Promise<any[][]> => {
  const cleanSpreadsheetId = spreadsheetId.trim();

  // Method 1: Try authenticated Google Sheets v4 API
  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      const encodedRange = encodeURIComponent(range);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanSpreadsheetId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        const json = await res.json();
        if (json.values && json.values.length > 0) {
          return json.values;
        }
      }
    } catch (apiErr) {
      console.warn('Google Sheets v4 API error, trying public CSV fallback:', apiErr);
    }
  }

  // Method 2: Fallback to Google Visualization API (CSV format)
  const targetGid = gid !== undefined ? gid : (cleanSpreadsheetId === SPREADSHEET_ID_DEFAULT ? GID_USERS_TEACHERS : '0');
  const gvizUrls = [
    `https://docs.google.com/spreadsheets/d/${cleanSpreadsheetId}/gviz/tq?tqx=out:csv&gid=${targetGid}`,
    `https://docs.google.com/spreadsheets/d/${cleanSpreadsheetId}/export?format=csv&gid=${targetGid}`,
    `https://docs.google.com/spreadsheets/d/${cleanSpreadsheetId}/export?format=csv`,
  ];

  let lastError: Error | null = null;

  for (const url of gvizUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const csvText = await res.text();
        if (csvText && !csvText.includes('<!DOCTYPE html>')) {
          const parsed = parseCsvTo2DArray(csvText);
          if (parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Gagal mengambil data dari Google Sheets.');
};

/**
 * Update range values in spreadsheet using official Google Sheets API
 */
export const updateSheetRangeValues = async (
  spreadsheetId: string,
  range: string,
  values: any[][],
  accessToken: string
) => {
  if (!accessToken || accessToken.startsWith('dev-') || accessToken.startsWith('local-')) {
    throw new Error('Sesi autentikasi Google tidak valid. Silakan klik "Login Google" terlebih dahulu.');
  }

  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        values,
      }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.error?.message || `HTTP ${res.status}: Gagal memperbarui data Google Sheets`;
    if (res.status === 401 || message.includes('authentication') || message.includes('credential')) {
      throw new Error('Token akses Google kedaluwarsa. Silakan Login Ulang dengan Google.');
    }
    throw new Error(message);
  }

  return await res.json();
};

/**
 * Append row to range using official Google Sheets API
 */
export const appendSheetRow = async (
  spreadsheetId: string,
  range: string,
  values: any[][],
  accessToken: string
) => {
  if (!accessToken || accessToken.startsWith('dev-') || accessToken.startsWith('local-')) {
    throw new Error('Sesi autentikasi Google tidak valid. Silakan Login dengan Google.');
  }

  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.error?.message || `HTTP ${res.status}: Gagal menambahkan baris ke Google Sheets`;
    if (res.status === 401 || message.includes('authentication') || message.includes('credential')) {
      throw new Error('Token akses Google kedaluwarsa. Silakan Login Ulang dengan Google.');
    }
    throw new Error(message);
  }

  return await res.json();
};

/**
 * Fetch all comprehensive data tabs from Google Sheets
 * - Profil (GID: 0)
 * - Guru & GTK (GID: 158463269)
 * - Siswa (GID: 1653577372)
 * - Kelas (GID: 741157322)
 * - Jadwal (GID: 462744807)
 * - Absen (GID: 1317223548)
 * - Jurnal (GID: 215052993)
 * - Nilai (GID: 626678318)
 */
export const fetchAllGoogleSheetsTabs = async (spreadsheetId: string, accessToken?: string | null) => {
  const cleanId = spreadsheetId.trim();

  // Fetch all key sheets in parallel
  const [profileRows, teachersRows, studentsRows, classesRows, schedulesRows, absenRows, jurnalRows, nilaiRows] = await Promise.all([
    fetchSheetRangeValues(cleanId, 'A1:Z50', accessToken, GID_PROFIL).catch(() => []),
    fetchSheetRangeValues(cleanId, 'A1:Z100', accessToken, GID_USERS_TEACHERS).catch(() => []),
    fetchSheetRangeValues(cleanId, 'A1:Z1000', accessToken, GID_SISWA).catch(() => []),
    fetchSheetRangeValues(cleanId, 'A1:Z100', accessToken, GID_KELAS).catch(() => []),
    fetchSheetRangeValues(cleanId, 'A1:Z100', accessToken, GID_JADWAL).catch(() => []),
    fetchSheetRangeValues(cleanId, 'A1:Z1000', accessToken, GID_ABSEN).catch(() => []),
    fetchSheetRangeValues(cleanId, 'A1:Z500', accessToken, GID_JURNAL).catch(() => []),
    fetchSheetRangeValues(cleanId, 'A1:Z500', accessToken, GID_NILAI).catch(() => []),
  ]);

  const profile = parseProfileRows(profileRows);
  const teachers = parseTeachersRows(teachersRows);
  const users = parseUserAccountsRows(teachersRows);
  const students = parseStudentsRows(studentsRows);
  const classes = parseClassesRows(classesRows);
  const schedules = parseSchedulesRows(schedulesRows);
  const attendances = parseAttendanceRows(absenRows);
  const journals = parseJournalRows(jurnalRows);
  const grades = parseGradesRows(nilaiRows);

  return {
    profile,
    teachers,
    users,
    students,
    classes,
    schedules,
    attendances,
    journals,
    grades,
  };
};

/**
 * Parses Kelas from Sheet "kelas" (GID: 741157322)
 * Schema: ["id", "nama"]
 */
export const parseClassesRows = (rows: any[][]): SchoolClass[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const idIdx = headers.findIndex((h) => h === 'id' || h.includes('id'));
  const namaIdx = headers.findIndex((h) => h.includes('nama') || h.includes('kelas'));

  const result: SchoolClass[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawId = idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : `ID_198101160000${i}`;
    const rawNama = namaIdx >= 0 && row[namaIdx] ? String(row[namaIdx]).trim() : row[0] ? String(row[0]).trim() : '';

    if (!rawNama || rawNama.toLowerCase() === 'nama') continue;

    let jurusan = 'Akuntansi & Keuangan Lembaga (AKL)';
    if (rawNama.includes('DPIB')) jurusan = 'Desain Pemodelan & Informasi Bangunan (DPIB)';
    else if (rawNama.includes('NKPI')) jurusan = 'Nautika Kapal Penangkap Ikan (NKPI)';
    else if (rawNama.includes('TJKT')) jurusan = 'Teknik Jaringan Komputer & Telekomunikasi (TJKT)';

    const tingkat = rawNama.startsWith('10') ? 'Kelas 10' : rawNama.startsWith('11') ? 'Kelas 11' : rawNama.startsWith('12') ? 'Kelas 12' : 'Umum';

    result.push({
      id: rawId,
      nama: rawNama,
      tingkat: tingkat,
      jurusan: jurusan,
    });
  }

  return result;
};

/**
 * Submit attendance records and auto-sync to Google Sheets (GID 1317223548)
 * Schema: ["id", "tanggal", "nis", "status", "ket"]
 */
export const saveAttendanceToGoogleSheets = async (
  spreadsheetId: string,
  records: StudentAttendance[],
  accessToken?: string | null,
  webhookUrl?: string
) => {
  const rows = records.map((r, idx) => [
    r.id || `ABS_${Date.now()}_${idx}`,
    r.tanggal,
    r.nis,
    r.status,
    r.ket || '',
  ]);

  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitAttendance',
          spreadsheetId,
          data: records,
          rows,
        }),
      });
    } catch (e) {
      console.warn('Webhook attendance post error', e);
    }
  }

  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      await appendSheetRow(spreadsheetId, 'A:E', rows, accessToken);
    } catch (e) {
      console.warn('Direct appendSheetRow error', e);
    }
  }

  return true;
};

/**
 * Submit teaching journal entry and auto-sync to Google Sheets (GID 215052993)
 * Schema: ["id", "tanggal", "kelas", "mapel", "tp", "deskripsi", "guru"]
 */
export const saveJournalToGoogleSheets = async (
  spreadsheetId: string,
  journal: TeachingJournal,
  accessToken?: string | null,
  webhookUrl?: string
) => {
  const rows = [
    [
      journal.id || `JRN_${Date.now()}`,
      journal.tanggal,
      journal.kelas,
      journal.mapel,
      journal.tp,
      journal.deskripsi,
      journal.guru,
    ],
  ];

  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitJournal',
          spreadsheetId,
          data: journal,
          rows,
        }),
      });
    } catch (e) {
      console.warn('Webhook journal post error', e);
    }
  }

  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      await appendSheetRow(spreadsheetId, 'A:G', rows, accessToken);
    } catch (e) {
      console.warn('Direct appendSheetRow error', e);
    }
  }

  return true;
};

/**
 * Submit student grades and auto-sync to Google Sheets (GID 626678318)
 * Schema: ["id", "nis", "mapel", "tp", "jenis", "skor"]
 */
export const saveGradesToGoogleSheets = async (
  spreadsheetId: string,
  grades: StudentGrade[],
  accessToken?: string | null,
  webhookUrl?: string
) => {
  const rows = grades.map((g, idx) => [
    g.id || `NIL_${g.kelas}_${g.mataPelajaran}_${g.jenis || 'Ulangan'}_${g.nisn}_${idx}`,
    g.nisn,
    g.mataPelajaran,
    g.tp || 'Tujuan Pembelajaran',
    g.jenis || 'Ulangan Harian',
    g.nilaiAkhir,
  ]);

  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitGrades',
          spreadsheetId,
          data: grades,
          rows,
        }),
      });
    } catch (e) {
      console.warn('Webhook grades post error', e);
    }
  }

  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      await appendSheetRow(spreadsheetId, 'A:F', rows, accessToken);
    } catch (e) {
      console.warn('Direct appendSheetRow error', e);
    }
  }

  return true;
};

/**
 * Parses Profile
 */
export const parseProfileRows = (rows: any[][]): Partial<SchoolProfile> | null => {
  if (!rows || rows.length === 0) return null;

  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map((c) => String(c).toLowerCase().trim());
    if (
      rowStr.some((h) => h.includes('nama_sekolah') || h.includes('kepsek') || h.includes('logo') || h.includes('alamat'))
    ) {
      headerRowIndex = i;
      headers = rowStr;
      break;
    }
  }

  let dataRow: any[] = [];
  if (headerRowIndex !== -1 && rows.length > headerRowIndex + 1) {
    dataRow = rows[headerRowIndex + 1];
  } else if (rows.length > 0) {
    dataRow = rows[0];
  }

  if (!dataRow || dataRow.length === 0) return null;

  const getCol = (key: string, defaultIdx: number): string => {
    if (headerRowIndex !== -1) {
      const idx = headers.findIndex((h) => h === key || h.includes(key));
      if (idx !== -1 && dataRow[idx] !== undefined) return String(dataRow[idx]).trim();
    }
    return dataRow[defaultIdx] !== undefined ? String(dataRow[defaultIdx]).trim() : '';
  };

  const idVal = getCol('id', 0) || 'P1';
  const logoVal = getCol('logo', 1) || 'https://i.ibb.co/k2Qs4p65/logosmk2songgom.png';
  const namaSekolahVal = getCol('nama_sekolah', 2) || getCol('nama', 2) || 'SMK Negeri 2 Songgom';
  const alamatVal = getCol('alamat', 3) || 'Jl. Raksa Wijaya, Wetan, Karangsembung, Kec. Songgom, Brebes';
  const kepsekVal = getCol('kepsek', 4) || getCol('kepala', 4) || 'Wigit Marseto Adji, S,Pd., M.Si';
  const nipKepsekVal = getCol('nip_kepsek', 5) || getCol('nip', 5) || '196910161997021003';
  const guruVal = getCol('guru', 6) || getCol('operator', 6) || 'Administrator';
  const nipGuruVal = getCol('nip_guru', 7) || '-';

  return {
    id: idVal,
    logo: logoVal,
    nama_sekolah: namaSekolahVal,
    alamat: alamatVal,
    kepsek: kepsekVal,
    nip_kepsek: nipKepsekVal,
    guru: guruVal,
    nip_guru: nipGuruVal,
  };
};

/**
 * Parses Teachers / GTK
 */
export const parseTeachersRows = (rows: any[][]): Teacher[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const usernameIdx = headers.findIndex((h) => h.includes('username'));
  const roleIdx = headers.findIndex((h) => h.includes('role'));
  const nipIdx = headers.findIndex((h) => h.includes('nip'));
  const namaIdx = headers.findIndex((h) => h.includes('nama') || h.includes('guru'));
  const mapelIdx = headers.findIndex((h) => h.includes('mapel') || h.includes('mata'));
  const jabatanIdx = headers.findIndex((h) => h.includes('jabatan'));
  const statusIdx = headers.findIndex((h) => h.includes('status'));
  const telpIdx = headers.findIndex((h) => h.includes('telp') || h.includes('telepon') || h.includes('hp'));
  const emailIdx = headers.findIndex((h) => h.includes('email'));

  if (nipIdx === -1 && namaIdx === -1 && mapelIdx === -1 && usernameIdx === -1) {
    return [];
  }

  const result: Teacher[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const rawNama = namaIdx >= 0 && row[namaIdx] ? String(row[namaIdx]).trim() : '';
    const rawRole = roleIdx >= 0 && row[roleIdx] ? String(row[roleIdx]).trim().toLowerCase() : '';
    const rawUsername = usernameIdx >= 0 && row[usernameIdx] ? String(row[usernameIdx]).trim() : '';

    if (!rawNama || rawRole === 'siswa' || rawNama === 'Admin Sekolah' || rawNama === 'Siswa Demo') {
      continue;
    }

    let mapel = mapelIdx >= 0 && row[mapelIdx] ? String(row[mapelIdx]).trim() : '';
    if (!mapel) {
      if (rawNama.includes('S.Kom') || rawNama.includes('S.T')) mapel = 'Informatika / Kejuruan';
      else if (rawNama.includes('S.Pi')) mapel = 'Nautika Kapal Penangkap Ikan (NKPI)';
      else if (rawNama.includes('S.E')) mapel = 'Akuntansi & Keuangan Lembaga (AKL)';
      else if (rawNama.includes('S.Pd.I')) mapel = 'Pendidikan Agama Islam';
      else mapel = 'Guru Normatif / Adaptif';
    }

    const nipVal = nipIdx >= 0 && row[nipIdx] && String(row[nipIdx]).trim().length > 4
      ? String(row[nipIdx]).trim()
      : `198${(i + 10).toString().padStart(2, '0')}01012020${i.toString().padStart(2, '0')}`;

    const emailVal = emailIdx >= 0 && row[emailIdx]
      ? String(row[emailIdx]).trim()
      : rawUsername
      ? `${rawUsername}@smkn2songgom.sch.id`
      : `guru${i}@smkn2songgom.sch.id`;

    result.push({
      id: `T${i}`,
      nip: nipVal,
      nama: rawNama,
      mapel: mapel,
      jabatan: jabatanIdx >= 0 && row[jabatanIdx] ? String(row[jabatanIdx]).trim() : 'Guru Mata Pelajaran',
      status: (statusIdx >= 0 && row[statusIdx] ? String(row[statusIdx]).trim() : i % 3 === 0 ? 'PNS' : i % 3 === 1 ? 'PPPK' : 'GTT') as any,
      telepon: telpIdx >= 0 && row[telpIdx] ? String(row[telpIdx]).trim() : `081234567${(i + 100).toString().slice(0, 3)}`,
      email: emailVal,
    });
  }

  return result;
};

/**
 * Parses User Accounts from Google Sheets "users" / "user" / "Akun_Guru_GTK" (GID: 158463269)
 * Schema: ["id", "username", "password", "role", "nama", "email", "nip", "status", "last_login"]
 */
export const parseUserAccountsRows = (rows: any[][]): UserAccount[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h || '').toLowerCase().trim());
  
  // Helper for matching column indices robustly
  const findCol = (candidates: string[]) => {
    // 1. Exact match or normalized exact match
    for (const c of candidates) {
      const idx = headers.findIndex(
        (h) => h === c || h.replace(/[\s_.-]+/g, '') === c.replace(/[\s_.-]+/g, '')
      );
      if (idx !== -1) return idx;
    }
    // 2. Contains match
    for (const c of candidates) {
      const idx = headers.findIndex(
        (h) => h.includes(c) || h.replace(/[\s_.-]+/g, '').includes(c.replace(/[\s_.-]+/g, ''))
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idIdx = findCol(['id', 'id_user', 'user_id', 'id_akun', 'uid', 'kode', 'no']);
  const usernameIdx = findCol(['username', 'user_name', 'nama_pengguna', 'id_login', 'akun', 'user']);
  const passIdx = findCol(['password', 'kata_sandi', 'katasandi', 'sandi', 'pass', 'pwd', 'pin']);
  const roleIdx = findCol(['role', 'hak_akses', 'hakakses', 'peran', 'level', 'akses', 'jabatan_role']);
  const namaIdx = findCol(['nama_lengkap', 'nama', 'nama_guru', 'nama_gtk', 'nama_ptk', 'nama_pegawai', 'nama_user', 'guru']);
  const emailIdx = findCol(['email', 'surel', 'email_sekolah', 'email_gtk', 'mail']);
  const nipIdx = findCol(['nip', 'nuptk', 'nik', 'nomor_induk', 'id_pegawai', 'nrk']);
  const mapelIdx = findCol(['mapel', 'mata_pelajaran', 'matapelajaran', 'ampu', 'bidang']);
  const jabatanIdx = findCol(['jabatan', 'tugas_tambahan', 'tugas', 'posisi']);
  const statusIdx = findCol(['status', 'keaktifan', 'aktif', 'kondisi']);
  const lastLoginIdx = findCol(['last_login', 'login_terakhir', 'terakhir_login', 'waktu_login', 'login']);

  const users: UserAccount[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const rawNama = namaIdx >= 0 && row[namaIdx] !== undefined ? String(row[namaIdx]).trim() : '';
    if (!rawNama || rawNama.toLowerCase() === 'nama' || rawNama.toLowerCase() === 'nama lengkap') continue;

    let rawUsername = usernameIdx >= 0 && row[usernameIdx] !== undefined && String(row[usernameIdx]).trim() !== ''
      ? String(row[usernameIdx]).trim()
      : '';

    // If username column empty or equals ID, fallback to NIP or clean slug of nama
    if (!rawUsername || (usernameIdx === idIdx && rawUsername.startsWith('USR_'))) {
      if (nipIdx >= 0 && row[nipIdx] && String(row[nipIdx]).trim()) {
        rawUsername = String(row[nipIdx]).trim();
      } else if (emailIdx >= 0 && row[emailIdx] && String(row[emailIdx]).trim()) {
        rawUsername = String(row[emailIdx]).trim().split('@')[0];
      } else {
        rawUsername = rawNama.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      }
    }

    let rawRole: 'admin' | 'guru' | 'kepala_sekolah' = 'guru';
    if (roleIdx >= 0 && row[roleIdx] !== undefined && String(row[roleIdx]).trim()) {
      const roleStr = String(row[roleIdx]).trim().toLowerCase();
      if (roleStr.includes('admin') || roleStr === '1' || roleStr.includes('super')) rawRole = 'admin';
      else if (roleStr.includes('kepsek') || roleStr.includes('kepala')) rawRole = 'kepala_sekolah';
      else rawRole = 'guru';
    } else {
      const uLower = rawUsername.toLowerCase();
      const nLower = rawNama.toLowerCase();
      if (uLower.includes('admin') || nLower.includes('admin') || nLower.includes('agus joko iryanto')) rawRole = 'admin';
      else if (uLower.includes('kepsek') || nLower.includes('wigit') || nLower.includes('kepala')) rawRole = 'kepala_sekolah';
    }

    const rawPass = passIdx >= 0 && row[passIdx] !== undefined && String(row[passIdx]).trim() !== ''
      ? String(row[passIdx]).trim()
      : rawRole === 'admin'
      ? 'admin123'
      : rawRole === 'kepala_sekolah'
      ? 'kepsek123'
      : 'guru123';

    const rawNip = nipIdx >= 0 && row[nipIdx] !== undefined && String(row[nipIdx]).trim() !== ''
      ? String(row[nipIdx]).trim()
      : `198101012020${i.toString().padStart(2, '0')}`;

    const rawEmail = emailIdx >= 0 && row[emailIdx] !== undefined && String(row[emailIdx]).trim() !== ''
      ? String(row[emailIdx]).trim()
      : `${rawUsername.toLowerCase()}@smkn2songgom.sch.id`;

    const rawMapel = mapelIdx >= 0 && row[mapelIdx] !== undefined ? String(row[mapelIdx]).trim() : undefined;
    const rawJabatan = jabatanIdx >= 0 && row[jabatanIdx] !== undefined ? String(row[jabatanIdx]).trim() : undefined;

    users.push({
      id: idIdx >= 0 && row[idIdx] !== undefined && String(row[idIdx]).trim() !== '' ? String(row[idIdx]).trim() : `USR_${rawRole.toUpperCase()}_${i}`,
      username: rawUsername,
      password: rawPass,
      role: rawRole,
      nama: rawNama,
      email: rawEmail,
      nip: rawNip,
      mapel: rawMapel,
      jabatan: rawJabatan,
      status: (statusIdx >= 0 && row[statusIdx] !== undefined && String(row[statusIdx]).trim() ? String(row[statusIdx]).trim() : 'Aktif') as any,
      lastLogin: lastLoginIdx >= 0 && row[lastLoginIdx] !== undefined && String(row[lastLoginIdx]).trim() ? String(row[lastLoginIdx]).trim() : new Date().toISOString(),
    });
  }

  // Ensure default Admin and Kepala Sekolah if none exist in raw rows
  if (!users.some((u) => u.role === 'admin')) {
    users.unshift({
      id: 'USR_ADMIN_01',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      nama: 'Administrator SIM (Agus Joko Iryanto, S.Kom)',
      email: 'agusjki.1681@gmail.com',
      nip: '198101162022211006',
      status: 'Aktif',
      lastLogin: new Date().toISOString(),
    });
  }

  if (!users.some((u) => u.role === 'kepala_sekolah')) {
    users.splice(1, 0, {
      id: 'USR_KEPSEK_01',
      username: 'kepsek',
      password: 'kepsek123',
      role: 'kepala_sekolah',
      nama: 'Wigit Aryanto, M.Pd.',
      email: 'kepsek@smkn2songgom.brebes.sch.id',
      nip: '196910161997021003',
      status: 'Aktif',
      lastLogin: new Date().toISOString(),
    });
  }

  return users;
};

/**
 * Fetch dedicated users dataset directly from Google Sheets "users" / "user"
 */
export const fetchUsersFromGoogleSheets = async (
  spreadsheetId: string = SPREADSHEET_ID_DEFAULT,
  accessToken?: string | null
): Promise<UserAccount[]> => {
  const cleanId = spreadsheetId.trim();

  // Try direct OAuth Google Sheets API range if available
  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    const rangeCandidates = ['users!A1:Z100', 'user!A1:Z100', 'Users!A1:Z100', 'Akun_Guru_GTK!A1:Z100', 'A1:Z100'];
    for (const r of rangeCandidates) {
      try {
        const encodedRange = encodeURIComponent(r);
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.values && json.values.length > 1) {
            const parsed = parseUserAccountsRows(json.values);
            if (parsed.length > 0) return parsed;
          }
        }
      } catch (e) {
        // try next
      }
    }
  }

  // Fallback to Public CSV Export endpoints with various Sheet name/GID strategies
  const candidateUrls = [
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=users`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=user`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=Users`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=User`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&gid=158463269`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=Akun_Guru_GTK`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=guru`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&gid=158463269`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const csvText = await res.text();
        if (csvText && !csvText.includes('<!DOCTYPE html>')) {
          const rows = parseCsvTo2DArray(csvText);
          if (rows.length > 1) {
            const parsed = parseUserAccountsRows(rows);
            if (parsed.length > 0) {
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      // try next candidate
    }
  }

  return [];
};

/**
 * Save / update single user account to Google Sheets "user"
 */
export const saveUserAccountToGoogleSheets = async (
  spreadsheetId: string,
  user: UserAccount,
  accessToken?: string | null,
  webhookUrl?: string
) => {
  const row = [
    user.id,
    user.username,
    user.password,
    user.role,
    user.nama,
    user.email,
    user.nip,
    user.status,
    user.lastLogin || new Date().toISOString(),
  ];

  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveUserAccount',
          spreadsheetId,
          user,
          row,
        }),
      });
    } catch (e) {
      console.warn('Webhook save user error', e);
    }
  }

  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      await appendSheetRow(spreadsheetId, 'A:I', [row], accessToken);
    } catch (e) {
      console.warn('Direct save user error', e);
    }
  }

  return true;
};

/**
 * Bulk save all user accounts to Google Sheets "user"
 */
export const saveAllUsersToGoogleSheets = async (
  spreadsheetId: string,
  users: UserAccount[],
  accessToken?: string | null,
  webhookUrl?: string
) => {
  const header = ['id', 'username', 'password', 'role', 'nama', 'email', 'nip', 'status', 'last_login'];
  const rows = [
    header,
    ...users.map((u) => [
      u.id,
      u.username,
      u.password,
      u.role,
      u.nama,
      u.email,
      u.nip,
      u.status,
      u.lastLogin || new Date().toISOString(),
    ]),
  ];

  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveAllUsers',
          spreadsheetId,
          users,
          rows,
        }),
      });
    } catch (e) {
      console.warn('Webhook bulk user error', e);
    }
  }

  if (accessToken && !accessToken.startsWith('dev-') && !accessToken.startsWith('local-')) {
    try {
      await updateSheetRangeValues(spreadsheetId, 'A1:I' + (rows.length + 1), rows, accessToken);
    } catch (e) {
      console.warn('Direct bulk user update error', e);
    }
  }

  return true;
};

/**
 * Parses Students from 2D Array
 */
export const parseStudentsRows = (rows: any[][]): Student[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const nisnIdx = headers.findIndex((h) => h.includes('nisn'));
  const nisIdx = headers.findIndex((h) => h.includes('nis') && !h.includes('nisn'));
  const namaIdx = headers.findIndex((h) => h.includes('nama') || h.includes('siswa'));
  const idKelasIdx = headers.findIndex((h) => h.includes('kelas') || h.includes('id_kelas'));
  const jurusanIdx = headers.findIndex((h) => h.includes('jurusan') || h.includes('program'));
  const jkIdx = headers.findIndex((h) => h.includes('kelamin') || h.includes('jk') || h.includes('jenis'));
  const telpIdx = headers.findIndex((h) => h.includes('telp') || h.includes('ortu') || h.includes('hp'));
  const alamatIdx = headers.findIndex((h) => h.includes('alamat'));

  if (nisnIdx === -1 && namaIdx === -1 && idKelasIdx === -1 && nisIdx === -1) {
    return [];
  }

  const result: Student[] = [];
  const femaleNames = ['siti', 'nur', 'dewi', 'putri', 'anita', 'dwi', 'linda', 'aliya', 'afiyah', 'ambar', 'naysela', 'khoerunisa', 'aeni', 'nita', 'ayu', 'fitri', 'anggun', 'suci', 'indah', 'lestari', 'rahma', 'wulan', 'khasanah'];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const rawNama = namaIdx >= 0 && row[namaIdx] ? String(row[namaIdx]).trim() : '';
    const rawNis = nisIdx >= 0 && row[nisIdx] ? String(row[nisIdx]).trim() : `2425${i.toString().padStart(3, '0')}`;
    if (!rawNama) continue;

    const rawClassId = idKelasIdx >= 0 && row[idKelasIdx] ? String(row[idKelasIdx]).trim() : '10 AKL 1';
    const className = KNOWN_CLASS_MAP[rawClassId] || rawClassId;

    let jurusan = jurusanIdx >= 0 && row[jurusanIdx] ? String(row[jurusanIdx]).trim() : '';
    if (!jurusan) {
      if (className.includes('AKL')) jurusan = 'Akuntansi & Keuangan Lembaga (AKL)';
      else if (className.includes('DPIB')) jurusan = 'Desain Pemodelan & Informasi Bangunan (DPIB)';
      else if (className.includes('NKPI')) jurusan = 'Nautika Kapal Penangkap Ikan (NKPI)';
      else jurusan = 'Teknik Komputer & Jaringan (TJKT)';
    }

    let parsedJk: 'L' | 'P' = 'L';
    if (jkIdx >= 0 && row[jkIdx]) {
      const jkVal = String(row[jkIdx]).trim().toUpperCase();
      parsedJk = jkVal.startsWith('P') || jkVal === 'PEREMPUAN' ? 'P' : 'L';
    } else {
      parsedJk = femaleNames.some((f) => rawNama.toLowerCase().includes(f)) ? 'P' : 'L';
    }

    result.push({
      id: `S${i}`,
      nisn: nisnIdx >= 0 && row[nisnIdx] && String(row[nisnIdx]).trim().length > 3
        ? String(row[nisnIdx]).trim()
        : `00${(60000000 + i)}`,
      nis: rawNis,
      nama: rawNama,
      kelas: className,
      jurusan: jurusan,
      jenisKelamin: parsedJk,
      teleponOrtu: telpIdx >= 0 && row[telpIdx] ? String(row[telpIdx]).trim() : `0857000${(1000 + i)}`,
      alamat: alamatIdx >= 0 && row[alamatIdx] ? String(row[alamatIdx]).trim() : 'Songgom, Kabupaten Brebes, Jawa Tengah',
      status: 'Aktif',
    });
  }

  return result;
};

/**
 * Parses Schedules
 */
export const parseSchedulesRows = (rows: any[][]): LessonSchedule[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const hariIdx = headers.findIndex((h) => h.includes('hari'));
  const jamIdx = headers.findIndex((h) => h.includes('jam'));
  const mapelIdx = headers.findIndex((h) => h.includes('mapel') || h.includes('pelajaran'));
  const guruIdx = headers.findIndex((h) => h.includes('guru') || h.includes('pengampu'));
  const kelasIdx = headers.findIndex((h) => h.includes('kelas') || h.includes('id_kelas'));

  if (hariIdx === -1 && mapelIdx === -1) {
    return [];
  }

  const result: LessonSchedule[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const hariVal = hariIdx >= 0 && row[hariIdx] ? String(row[hariIdx]).trim() : 'Senin';
    const jamStr = jamIdx >= 0 && row[jamIdx] ? String(row[jamIdx]).trim() : '07:40 - 10:40';
    const [waktuMulai, waktuSelesai] = jamStr.split(' - ').map((s) => s.trim());
    const rawClassId = kelasIdx >= 0 && row[kelasIdx] ? String(row[kelasIdx]).trim() : '10 AKL 1';

    result.push({
      id: `SCH${i}`,
      hari: (hariVal || 'Senin') as any,
      jamKe: i,
      waktuMulai: waktuMulai || '07:40',
      waktuSelesai: waktuSelesai || '10:40',
      mataPelajaran: mapelIdx >= 0 && row[mapelIdx] ? String(row[mapelIdx]).trim() : 'Informatika',
      guruPengampu: guruIdx >= 0 && row[guruIdx] ? String(row[guruIdx]).trim() : 'Agus Joko Iryanto, S.Kom',
      kelas: KNOWN_CLASS_MAP[rawClassId] || rawClassId,
      ruang: 'Lab Komputer / Teori',
    });
  }

  return result;
};

/**
 * Parses Attendance Records
 * Schema: ["id", "tanggal", "nis", "status", "ket"]
 */
export const parseAttendanceRows = (rows: any[][]): StudentAttendance[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const idIdx = headers.findIndex((h) => h.includes('id'));
  const tglIdx = headers.findIndex((h) => h.includes('tanggal') || h.includes('tgl'));
  const nisIdx = headers.findIndex((h) => h.includes('nis'));
  const statusIdx = headers.findIndex((h) => h.includes('status'));
  const ketIdx = headers.findIndex((h) => h.includes('ket') || h.includes('keterangan'));

  const result: StudentAttendance[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const nis = nisIdx >= 0 && row[nisIdx] ? String(row[nisIdx]).trim() : '';
    const tanggal = tglIdx >= 0 && row[tglIdx] ? String(row[tglIdx]).trim() : '';
    const status = statusIdx >= 0 && row[statusIdx] ? String(row[statusIdx]).trim() : 'Hadir';
    const ket = ketIdx >= 0 && row[ketIdx] ? String(row[ketIdx]).trim() : '';

    if (!nis && !tanggal) continue;

    result.push({
      id: idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : `ABS_${i}`,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      nis: nis || `2347`,
      status: (status as any) || 'Hadir',
      ket: ket,
    });
  }

  return result;
};

/**
 * Parses Teaching Journals
 * Schema: ["id", "tanggal", "kelas", "mapel", "tp", "deskripsi", "guru"]
 */
export const parseJournalRows = (rows: any[][]): TeachingJournal[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const idIdx = headers.findIndex((h) => h.includes('id'));
  const tglIdx = headers.findIndex((h) => h.includes('tanggal') || h.includes('tgl'));
  const kelasIdx = headers.findIndex((h) => h.includes('kelas') || h.includes('id_kelas'));
  const mapelIdx = headers.findIndex((h) => h.includes('mapel'));
  const tpIdx = headers.findIndex((h) => h.includes('tp') || h.includes('materi') || h.includes('tujuan'));
  const deskIdx = headers.findIndex((h) => h.includes('deskripsi') || h.includes('kegiatan') || h.includes('catatan'));
  const guruIdx = headers.findIndex((h) => h.includes('guru') || h.includes('pengampu'));

  const result: TeachingJournal[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const rawClassId = kelasIdx >= 0 && row[kelasIdx] ? String(row[kelasIdx]).trim() : '10 AKL 1';
    const className = KNOWN_CLASS_MAP[rawClassId] || rawClassId;

    result.push({
      id: idIdx >= 0 && row[idIdx] ? String(row[idIdx]).trim() : `JRN_${i}`,
      tanggal: tglIdx >= 0 && row[tglIdx] ? String(row[tglIdx]).trim() : new Date().toISOString().split('T')[0],
      kelas: className,
      mapel: mapelIdx >= 0 && row[mapelIdx] ? String(row[mapelIdx]).trim() : 'Informatika',
      tp: tpIdx >= 0 && row[tpIdx] ? String(row[tpIdx]).trim() : 'Kegiatan Pembelajaran & Asesmen',
      deskripsi: deskIdx >= 0 && row[deskIdx] ? String(row[deskIdx]).trim() : 'Pelaksanaan KBM tatap muka sesuai modul ajar.',
      guru: guruIdx >= 0 && row[guruIdx] ? String(row[guruIdx]).trim() : 'Agus Joko Iryanto, S.Kom',
    });
  }

  return result;
};

/**
 * Parses Grades
 */
export const parseGradesRows = (rows: any[][]): StudentGrade[] => {
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const nisnIdx = headers.findIndex((h) => h.includes('nisn'));
  const nisIdx = headers.findIndex((h) => h.includes('nis') && !h.includes('nisn'));
  const namaIdx = headers.findIndex((h) => h.includes('nama'));
  const skorIdx = headers.findIndex((h) => h.includes('skor') || h.includes('nilai'));
  const mapelIdx = headers.findIndex((h) => h.includes('mapel') || h.includes('pelajaran'));
  const tpIdx = headers.findIndex((h) => h.includes('tp') || h.includes('tujuan') || h.includes('kompetensi'));
  const jenisIdx = headers.findIndex((h) => h.includes('jenis') || h.includes('tipe'));

  const result: StudentGrade[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const score = skorIdx >= 0 && row[skorIdx] ? Number(row[skorIdx]) || 85 : 85;
    const pred = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';

    result.push({
      id: `G${i}`,
      studentId: `S${i}`,
      nisn: nisnIdx >= 0 && row[nisnIdx] ? String(row[nisnIdx]).trim() : `0060000${i}`,
      namaSiswa: namaIdx >= 0 && row[namaIdx] ? String(row[namaIdx]).trim() : `Siswa ${row[nisIdx >= 0 ? nisIdx : 1] || i}`,
      kelas: '10 AKL 1',
      mataPelajaran: mapelIdx >= 0 && row[mapelIdx] ? String(row[mapelIdx]).trim() : 'Matematika / Kejuruan',
      tp: tpIdx >= 0 && row[tpIdx] ? String(row[tpIdx]).trim() : 'Asesmen Formatif',
      jenis: jenisIdx >= 0 && row[jenisIdx] ? String(row[jenisIdx]).trim() : 'Ulangan',
      nilaiTugas: score,
      nilaiUTS: score,
      nilaiUAS: score,
      nilaiPraktikUKK: score,
      nilaiAkhir: score,
      predikat: pred,
    });
  }

  return result;
};
