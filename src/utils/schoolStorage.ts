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
import { UserAccount, LoginSecurityState } from '../types/auth';
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_CLASSES,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_SCHEDULES,
  INITIAL_GRADES,
  INITIAL_ATTENDANCES,
  INITIAL_JOURNALS,
} from './initialData';

const STORAGE_KEYS = {
  PROFILE: 'smkn2songgom_profile',
  CLASSES: 'smkn2songgom_classes',
  TEACHERS: 'smkn2songgom_teachers',
  STUDENTS: 'smkn2songgom_students',
  SCHEDULES: 'smkn2songgom_schedules',
  GRADES: 'smkn2songgom_grades',
  ATTENDANCE: 'smkn2songgom_attendance',
  JOURNALS: 'smkn2songgom_journals',
  SETTINGS: 'smkn2songgom_settings',
  USERS: 'smkn2songgom_users_db',
  LOGIN_SECURITY: 'smkn2songgom_login_security',
};

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR_ADMIN_01',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    nama: 'Agus Joko Iryanto, S.Kom',
    email: 'agusjki.1681@gmail.com',
    nip: '198101162022211006',
    mapel: 'Informatika / Pemrograman Web',
    jabatan: 'Administrator SIM / Koordinator IT',
    status: 'Aktif',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'USR_KEPSEK_01',
    username: 'kepsek',
    password: 'kepsek123',
    role: 'kepala_sekolah',
    nama: 'Wigit Marseto Adji, S,Pd., M.Si',
    email: 'smkn2songgom.brebes@gmail.com',
    nip: '196910161997021003',
    mapel: 'Manajemen Pendidikan',
    jabatan: 'Kepala Sekolah',
    status: 'Aktif',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'USR_GURU_01',
    username: 'agusjokoiryanto',
    password: 'guru123',
    role: 'guru',
    nama: 'Agus Joko Iryanto, S.Kom',
    email: 'agusjokoiryanto@smkn2songgom.sch.id',
    nip: '198101162022211006',
    mapel: 'Informatika / Pemrograman Web',
    jabatan: 'Guru Produktif / Wali Kelas',
    status: 'Aktif',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'USR_GURU_02',
    username: 'didikmisbun',
    password: 'guru123',
    role: 'guru',
    nama: 'Didik Misbun Shidiq, S.Pd',
    email: 'didikmisbunshidiq@smkn2songgom.sch.id',
    nip: '198110101202002',
    mapel: 'Teknik Kendaraan Ringan Otomotif (TKRO)',
    jabatan: 'Guru Kejuruan Otomotif',
    status: 'Aktif',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'USR_GURU_03',
    username: 'abdulkarim',
    password: 'guru123',
    role: 'guru',
    nama: 'Abdul Karim, S.Pd.I',
    email: 'abdulkarim@smkn2songgom.sch.id',
    nip: '198120101202003',
    mapel: 'Pendidikan Agama Islam & BP',
    jabatan: 'Guru PAI / Pembina Rohis',
    status: 'Aktif',
    lastLogin: new Date().toISOString(),
  },
];

export const loadUserAccounts = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading users', e);
  }
  return INITIAL_USER_ACCOUNTS;
};

export const saveUserAccounts = (users: UserAccount[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users', e);
  }
};

export const loadLoginSecurity = (): LoginSecurityState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGIN_SECURITY);
    if (raw) {
      const parsed: LoginSecurityState = JSON.parse(raw);
      const now = Date.now();
      const isLocked = parsed.lockoutUntil > now;
      return {
        ...parsed,
        isLocked,
        failedAttempts: isLocked ? parsed.failedAttempts : (parsed.lockoutUntil > 0 && parsed.lockoutUntil <= now ? 0 : parsed.failedAttempts),
      };
    }
  } catch (e) {
    console.error('Error loading login security', e);
  }
  return {
    failedAttempts: 0,
    lockoutUntil: 0,
    isLocked: false,
  };
};

export const saveLoginSecurity = (state: LoginSecurityState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGIN_SECURITY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving login security', e);
  }
};


export interface SchoolSyncSettings {
  webhookUrl: string;
  autoSync: boolean;
  activeOperatorName: string;
  activeOperatorNip: string;
}

export const loadSchoolProfile = (): SchoolProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading school profile', e);
  }
  return INITIAL_SCHOOL_PROFILE;
};

export const saveSchoolProfile = (profile: SchoolProfile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving school profile', e);
  }
};

export const loadSchoolClasses = (): SchoolClass[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
    }
  } catch (e) {
    console.error('Error loading classes', e);
  }
  return INITIAL_CLASSES;
};

export const saveSchoolClasses = (classes: SchoolClass[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  } catch (e) {
    console.error('Error saving classes', e);
  }
};

export const loadTeachers = (): Teacher[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 20) return parsed;
    }
  } catch (e) {
    console.error('Error loading teachers', e);
  }
  return INITIAL_TEACHERS;
};

export const saveTeachers = (teachers: Teacher[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  } catch (e) {
    console.error('Error saving teachers', e);
  }
};

export const loadStudents = (): Student[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 20) return parsed;
    }
  } catch (e) {
    console.error('Error loading students', e);
  }
  return INITIAL_STUDENTS;
};

export const saveStudents = (students: Student[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students', e);
  }
};

export const loadLessonSchedules = (): LessonSchedule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading schedules', e);
  }
  return INITIAL_SCHEDULES;
};

export const saveLessonSchedules = (schedules: LessonSchedule[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  } catch (e) {
    console.error('Error saving schedules', e);
  }
};

export const loadStudentGrades = (): StudentGrade[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRADES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading grades', e);
  }
  return INITIAL_GRADES;
};

export const saveStudentGrades = (grades: StudentGrade[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  } catch (e) {
    console.error('Error saving grades', e);
  }
};

export const loadAttendances = (): StudentAttendance[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading attendance', e);
  }
  return INITIAL_ATTENDANCES;
};

export const saveAttendances = (attendances: StudentAttendance[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendances));
  } catch (e) {
    console.error('Error saving attendance', e);
  }
};

export const loadJournals = (): TeachingJournal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNALS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading journals', e);
  }
  return INITIAL_JOURNALS;
};

export const saveJournals = (journals: TeachingJournal[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
  } catch (e) {
    console.error('Error saving journals', e);
  }
};

export const loadSchoolSettings = (): SchoolSyncSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return {
    webhookUrl: '',
    autoSync: false,
    activeOperatorName: 'Administrator',
    activeOperatorNip: '-',
  };
};

export const saveSchoolSettings = (settings: SchoolSyncSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

/**
 * CSV Helper with quotes handling
 */
export const escapeCsvValue = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const parseCsvLine = (text: string): string[] => {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
};

/**
 * Convert School Profile to Exact User CSV Schema:
 * id,logo,nama_sekolah,alamat,kepsek,nip_kepsek,guru,nip_guru
 */
export const generateProfileCsv = (profile: SchoolProfile): string => {
  const headers = 'id,logo,nama_sekolah,alamat,kepsek,nip_kepsek,guru,nip_guru';
  const row = [
    escapeCsvValue(profile.id),
    escapeCsvValue(profile.logo),
    escapeCsvValue(profile.nama_sekolah),
    escapeCsvValue(profile.alamat),
    escapeCsvValue(profile.kepsek),
    escapeCsvValue(profile.nip_kepsek),
    escapeCsvValue(profile.guru),
    escapeCsvValue(profile.nip_guru),
  ].join(',');

  return `${headers}\n${row}`;
};

/**
 * Parse Exact User CSV Schema into SchoolProfile
 */
export const parseProfileCsv = (csvText: string): SchoolProfile | null => {
  const lines = csvText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // If first line has header, get data from row 1 or row 0
  let dataLine = lines[0];
  if (lines[0].toLowerCase().includes('nama_sekolah') && lines.length > 1) {
    dataLine = lines[1];
  }

  const cols = parseCsvLine(dataLine);
  if (cols.length < 3) return null;

  return {
    id: cols[0] || 'P1',
    logo: cols[1] || 'https://i.ibb.co/k2Qs4p65/logosmk2songgom.png',
    nama_sekolah: cols[2] || 'SMK Negeri 2 Songgom',
    alamat: cols[3] || 'Jl. Raksa Wijaya, Wetan, Karangsembung, Kec. Songgom, Kabupaten Brebes',
    kepsek: cols[4] || 'Wigit Marseto Adji, S,Pd., M.Si',
    nip_kepsek: cols[5] || '196910161997021003',
    guru: cols[6] || 'Administrator',
    nip_guru: cols[7] || '-',
    npsn: '69989012',
    akreditasi: 'A (Unggul)',
    email: 'smkn2songgom.brebes@gmail.com',
    telepon: '(0283) 6192831',
    website: 'www.smkn2songgom.sch.id',
  };
};

/**
 * Generate CSV for Teachers
 */
export const generateTeachersCsv = (teachers: Teacher[]): string => {
  const headers = 'nip,nama,mapel,jabatan,status,telepon,email';
  const rows = teachers.map((t) =>
    [
      escapeCsvValue(t.nip),
      escapeCsvValue(t.nama),
      escapeCsvValue(t.mapel),
      escapeCsvValue(t.jabatan),
      escapeCsvValue(t.status),
      escapeCsvValue(t.telepon || ''),
      escapeCsvValue(t.email || ''),
    ].join(',')
  );
  return [headers, ...rows].join('\n');
};

/**
 * Generate CSV for Students
 */
export const generateStudentsCsv = (students: Student[]): string => {
  const headers = 'nisn,nis,nama,kelas,jurusan,jenis_kelamin,telepon_ortu,alamat';
  const rows = students.map((s) =>
    [
      escapeCsvValue(s.nisn),
      escapeCsvValue(s.nis),
      escapeCsvValue(s.nama),
      escapeCsvValue(s.kelas),
      escapeCsvValue(s.jurusan),
      escapeCsvValue(s.jenisKelamin),
      escapeCsvValue(s.teleponOrtu || ''),
      escapeCsvValue(s.alamat || ''),
    ].join(',')
  );
  return [headers, ...rows].join('\n');
};

/**
 * Generate CSV for Lesson Schedules
 */
export const generateSchedulesCsv = (schedules: LessonSchedule[]): string => {
  const headers = 'hari,jam_ke,waktu_mulai,waktu_selesai,mata_pelajaran,guru_pengampu,kelas,ruang';
  const rows = schedules.map((sc) =>
    [
      escapeCsvValue(sc.hari),
      escapeCsvValue(sc.jamKe),
      escapeCsvValue(sc.waktuMulai),
      escapeCsvValue(sc.waktuSelesai),
      escapeCsvValue(sc.mataPelajaran),
      escapeCsvValue(sc.guruPengampu),
      escapeCsvValue(sc.kelas),
      escapeCsvValue(sc.ruang),
    ].join(',')
  );
  return [headers, ...rows].join('\n');
};

/**
 * Generate CSV for Grades
 */
export const generateGradesCsv = (grades: StudentGrade[]): string => {
  const headers = 'nisn,nama_siswa,kelas,mata_pelajaran,nilai_tugas,nilai_uts,nilai_uas,nilai_praktik_ukk,nilai_akhir,predikat';
  const rows = grades.map((g) =>
    [
      escapeCsvValue(g.nisn),
      escapeCsvValue(g.namaSiswa),
      escapeCsvValue(g.kelas),
      escapeCsvValue(g.mataPelajaran),
      escapeCsvValue(g.nilaiTugas),
      escapeCsvValue(g.nilaiUTS),
      escapeCsvValue(g.nilaiUAS),
      escapeCsvValue(g.nilaiPraktikUKK),
      escapeCsvValue(g.nilaiAkhir),
      escapeCsvValue(g.predikat),
    ].join(',')
  );
  return [headers, ...rows].join('\n');
};
