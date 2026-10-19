import { CategoryConfig, Category, ScheduleItem, SyncSettings } from '../types/schedule';

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'work',
    name: 'Pekerjaan / Karir',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    bgLight: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 dark:bg-blue-950/40',
    border: 'border-blue-500',
    icon: 'Briefcase',
  },
  {
    id: 'study',
    name: 'Belajar & Pengembangan',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    bgLight: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 dark:bg-indigo-950/40',
    border: 'border-indigo-500',
    icon: 'GraduationCap',
  },
  {
    id: 'health',
    name: 'Kesehatan & Olahraga',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    bgLight: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/40',
    border: 'border-emerald-500',
    icon: 'HeartPulse',
  },
  {
    id: 'worship',
    name: 'Ibadah & Spiritual',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    bgLight: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 dark:bg-amber-950/40',
    border: 'border-amber-500',
    icon: 'Sparkles',
  },
  {
    id: 'personal',
    name: 'Rutinitas & Pribadi',
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    bgLight: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 dark:bg-sky-950/40',
    border: 'border-sky-500',
    icon: 'User',
  },
  {
    id: 'family',
    name: 'Keluarga & Relasi',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    bgLight: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 dark:bg-rose-950/40',
    border: 'border-rose-500',
    icon: 'Users',
  },
  {
    id: 'entertainment',
    name: 'Hiburan & Hobi',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    bgLight: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 dark:bg-orange-950/40',
    border: 'border-orange-500',
    icon: 'Gamepad2',
  },
  {
    id: 'other',
    name: 'Lainnya',
    color: 'text-gray-700 bg-gray-50 border-gray-200',
    bgLight: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 dark:bg-gray-950/40',
    border: 'border-gray-500',
    icon: 'Bookmark',
  },
];

export const PRIORITY_CONFIG = {
  urgent: {
    label: 'Mendesak (P1)',
    badge: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:bg-red-950/40',
    dot: 'bg-red-500',
  },
  high: {
    label: 'Tinggi (P2)',
    badge: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40',
    dot: 'bg-amber-500',
  },
  medium: {
    label: 'Sedang (P3)',
    badge: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40',
    dot: 'bg-blue-500',
  },
  low: {
    label: 'Rendah (P4)',
    badge: 'bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-400 dark:bg-slate-950/40',
    dot: 'bg-slate-400',
  },
};

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSyncGoogleSheets: false,
  sheetsWebhookUrl: '',
  autoRolloverTasks: true,
  soundEnabled: true,
  autoStatusUpdate: true,
};

export const getCategoryConfig = (cat: Category): CategoryConfig => {
  return CATEGORIES.find((c) => c.id === cat) || CATEGORIES[7];
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateIndonesian = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const INITIAL_SCHEDULE_ITEMS = (): ScheduleItem[] => {
  const today = getTodayDateString();
  return [
    {
      id: 'task-1',
      title: 'Ibadah Subuh & Meditasi Pagi',
      description: 'Membaca doa, afirmasi positif dan pernapasan 10 menit untuk memulai hari dengan tenang.',
      category: 'worship',
      priority: 'high',
      date: today,
      startTime: '05:00',
      endTime: '05:45',
      status: 'completed',
      subtasks: [
        { id: 'st-1', title: 'Sholat/Doa pagi', completed: true },
        { id: 'st-2', title: 'Latihan pernapasan 5 menit', completed: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Jogging & Olahraga Pagi',
      description: 'Lari ringan keliling komplek dan stretching.',
      category: 'health',
      priority: 'medium',
      date: today,
      startTime: '06:00',
      endTime: '06:45',
      status: 'completed',
      subtasks: [
        { id: 'st-3', title: 'Lari 3 KM', completed: true },
        { id: 'st-4', title: 'Minum 600ml air putih', completed: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Sarapan Sehat & Siap-siap Kerja',
      description: 'Sarapan bernutrisi dan review daftar prioritas harian.',
      category: 'personal',
      priority: 'low',
      date: today,
      startTime: '07:00',
      endTime: '08:00',
      status: 'completed',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Daily Standup & Rapat Koordinasi Tim',
      description: 'Sinkronisasi progress mingguan, pembagian tugas sprint baru.',
      category: 'work',
      priority: 'urgent',
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      status: 'in_progress',
      subtasks: [
        { id: 'st-5', title: 'Siapkan slide update progress', completed: true },
        { id: 'st-6', title: 'Catat poin tindakan rapat', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: 'Deep Work: Pengerjaan Laporan & Analisis',
      description: 'Fokus tanpa distraksi mengerjakan modul utama dan dokumen spesifikasi.',
      category: 'work',
      priority: 'high',
      date: today,
      startTime: '10:30',
      endTime: '12:00',
      status: 'upcoming',
      subtasks: [
        { id: 'st-7', title: 'Analisis data kuartal', completed: false },
        { id: 'st-8', title: 'Review feedback klien', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-6',
      title: 'Istirahat Siang & Makan Bersama',
      description: 'Ishoma (Istirahat, Sholat, Makan siang) untuk me-refresh energi.',
      category: 'personal',
      priority: 'medium',
      date: today,
      startTime: '12:00',
      endTime: '13:00',
      status: 'upcoming',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-7',
      title: 'Review Email, Follow-up Klien & Eksekusi',
      description: 'Membalas korespondensi penting dan menyelesaikan tiket prioritas.',
      category: 'work',
      priority: 'medium',
      date: today,
      startTime: '13:30',
      endTime: '15:30',
      status: 'upcoming',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-8',
      title: 'Belajar Keterampilan Baru (Kursus Online)',
      description: 'Menonton modul belajar teknologi baru / membaca 2 bab buku.',
      category: 'study',
      priority: 'medium',
      date: today,
      startTime: '16:00',
      endTime: '17:00',
      status: 'upcoming',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-9',
      title: 'Waktu Bersama Keluarga & Santai',
      description: 'Makan malam bersama keluarga dan berbincang santai.',
      category: 'family',
      priority: 'high',
      date: today,
      startTime: '18:30',
      endTime: '20:00',
      status: 'upcoming',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-10',
      title: 'Evaluasi Harian & Rencana Esok Hari',
      description: 'Jurnal refleksi singkat dan sinkronisasi daftar jadwal besok.',
      category: 'personal',
      priority: 'low',
      date: today,
      startTime: '21:00',
      endTime: '21:30',
      status: 'upcoming',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};
