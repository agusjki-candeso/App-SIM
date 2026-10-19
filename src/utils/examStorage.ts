import {
  ExamQuestion,
  ExamSession,
  ExamViolationLog,
  ExamStudentResult,
} from '../types/exam';

const STORAGE_KEY_EXAM_SESSIONS = 'smkn2songgom_exam_sessions';
const STORAGE_KEY_EXAM_QUESTIONS = 'smkn2songgom_exam_questions';
const STORAGE_KEY_EXAM_LOGS = 'smkn2songgom_exam_violation_logs';
const STORAGE_KEY_EXAM_RESULTS = 'smkn2songgom_exam_student_results';

export const INITIAL_EXAM_SESSIONS: ExamSession[] = [
  {
    id: 'SESI_INF_2026_01',
    title: 'Asesmen Sumatif Akhir Semester - Informatika & Berpikir Komputasional',
    subject: 'Informatika',
    classes: ['10 AKL 1', '10 AKL 2', '10 DPIB 1', '10 NKPI 1'],
    teacher: 'Agus Joko Iryanto, S.Kom',
    token: 'INF-9281',
    durationMinutes: 60,
    startTime: '2026-10-20 07:30',
    endTime: '2026-10-20 12:00',
    randomizeQuestions: true,
    randomizeOptions: true,
    maxViolations: 3,
    status: 'Aktif',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'SESI_KEJURUAN_2026_02',
    title: 'Ujian Penilaian Harian Kejuruan & Sistem Informasi Sekolah',
    subject: 'Dasar Program Keahlian',
    classes: ['10 AKL 1', '10 AKL 3', '11 AKL 1'],
    teacher: 'Wigit Marseto Adji, S.Pd., M.Si',
    token: 'KEJ-7714',
    durationMinutes: 45,
    startTime: '2026-10-22 08:00',
    endTime: '2026-10-22 11:30',
    randomizeQuestions: false,
    randomizeOptions: false,
    maxViolations: 3,
    status: 'Draft',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_EXAM_QUESTIONS: ExamQuestion[] = [
  // 1. Soal Pilihan Ganda (PG)
  {
    id: 'Q_INF_01',
    sessionId: 'SESI_INF_2026_01',
    order: 1,
    type: 'PG',
    question: 'Di era transformasi digital sekolah, manakah komponen perangkat keras (hardware) yang berfungsi sebagai pusat pemrosesan logika dan perhitungan data utama dalam unit komputer?',
    options: [
      { key: 'A', text: 'Central Processing Unit (CPU / Processor)' },
      { key: 'B', text: 'Random Access Memory (RAM)' },
      { key: 'C', text: 'Solid State Drive (SSD NVMe)' },
      { key: 'D', text: 'Power Supply Unit (PSU)' },
      { key: 'E', text: 'Graphic Processing Unit (GPU Dedicated)' },
    ],
    correctAnswer: 'A',
    scoreWeight: 10,
    explanation: 'CPU bertindak sebagai otak komputer yang mengeksekusi instruksi program dan kalkulasi aritmetika-logika.',
  },

  // 2. Soal Ceklist (Pilihan Ganda Kompleks)
  {
    id: 'Q_INF_02',
    sessionId: 'SESI_INF_2026_01',
    order: 2,
    type: 'CEKLIST',
    question: 'Pilihlah semua pernyataan yang BENAR mengenai sistem keamanan integritas dan fitur anti-contek pada aplikasi CBT browser di bawah ini! (Centang semua yang sesuai)',
    options: [
      { key: 'A', text: 'API Fullscreen digunakan untuk mengunci tampilan siswa agar fokus pada lembar soal.' },
      { key: 'B', text: 'Event visibilitychange mendeteksi saat siswa berpindah tab atau meminimalkan browser.' },
      { key: 'C', text: 'Siswa diperbolehkan membuka tab pencarian Google dan split-screen saat ujian.' },
      { key: 'D', text: 'Pencegahan contextmenu memblokir klik kanan inspeksi elemen dan salin-tempel.' },
      { key: 'E', text: 'Setiap pelanggaran waktu riil dapat dicatat langsung ke Google Sheets audit log.' },
    ],
    correctAnswer: 'A,B,D,E',
    scoreWeight: 20,
    explanation: 'Pilihan A, B, D, dan E adalah mekanisme proteksi anti-contek web standard. Pilihan C salah karena split-screen dan browsing bebas dilarang saat ujian.',
  },

  // 3. Soal Pilihan Ganda (PG)
  {
    id: 'Q_INF_03',
    sessionId: 'SESI_INF_2026_01',
    order: 3,
    type: 'PG',
    question: 'Protokol transfer data di internet yang menggunakan enkripsi SSL/TLS untuk memastikan kerahasiaan komunikasi data antara browser siswa dan server Google Sheets adalah...',
    options: [
      { key: 'A', text: 'FTP (File Transfer Protocol)' },
      { key: 'B', text: 'HTTP (Hypertext Transfer Protocol biasa)' },
      { key: 'C', text: 'HTTPS (Hypertext Transfer Protocol Secure)' },
      { key: 'D', text: 'SMTP (Simple Mail Transfer Protocol)' },
      { key: 'E', text: 'DHCP (Dynamic Host Configuration Protocol)' },
    ],
    correctAnswer: 'C',
    scoreWeight: 10,
    explanation: 'HTTPS adalah versi aman dari HTTP yang menggunakan sertifikat enkripsi TLS/SSL port 443.',
  },

  // 4. Soal Ceklist (Pilihan Ganda Kompleks)
  {
    id: 'Q_INF_04',
    sessionId: 'SESI_INF_2026_01',
    order: 4,
    type: 'CEKLIST',
    question: 'Manakah di bawah ini yang merupakan sistem operasi berbasis kernel Linux open-source yang banyak digunakan di lab sekolah dan server modern? (Pilihlah lebih dari satu)',
    options: [
      { key: 'A', text: 'Ubuntu Desktop & Server' },
      { key: 'B', text: 'Microsoft Windows 11 Pro' },
      { key: 'C', text: 'Debian GNU/Linux' },
      { key: 'D', text: 'macOS Monterey' },
      { key: 'E', text: 'Arch Linux' },
    ],
    correctAnswer: 'A,C,E',
    scoreWeight: 20,
    explanation: 'Ubuntu, Debian, dan Arch adalah distro Linux bebas sumber terbuka. Windows dan macOS adalah sistem operasi proprietary komersial.',
  },

  // 5. Soal Esai
  {
    id: 'Q_INF_05',
    sessionId: 'SESI_INF_2026_01',
    order: 5,
    type: 'ESAI',
    question: 'Jelaskan mengapa kejujuran akademis (integritas) sangat penting dalam pelaksanaan ujian sekolah, serta bagaimana sistem pengawasan digital membantu menciptakan penilaian yang adil bagi seluruh siswa!',
    correctAnswer: 'Kejujuran akademis mencerminkan karakter disiplin dan kompetensi nyata siswa. Sistem digital anti-contek mencegah kecurangan sehingga nilai yang diperoleh benar-benar merefleksikan daya serap belajar masing-masing siswa secara adil.',
    scoreWeight: 40,
    explanation: 'Kriteria Penilaian Esai: Pemahaman konsep kejujuran (15 poin), analisis keadilan sistem digital (15 poin), dan tata bahasa/argumen runut (10 poin).',
  },
];

// Initial mock student results
export const INITIAL_EXAM_RESULTS: ExamStudentResult[] = [
  {
    id: 'RES_01',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600001',
    studentName: 'Ahmad Rizky Pratama',
    studentClass: '10 AKL 1',
    correctCountPG: 2,
    correctCountCeklist: 2,
    scoreEssay: 35,
    finalScore: 95,
    totalViolations: 0,
    status: 'Selesai',
    submittedAt: '2026-10-15T09:40:00Z',
    answers: {
      Q_INF_01: 'A',
      Q_INF_02: ['A', 'B', 'D', 'E'],
      Q_INF_03: 'C',
      Q_INF_04: ['A', 'C', 'E'],
      Q_INF_05: 'Kejujuran sangat krusial untuk mengukur kemampuan diri sendiri secara obyektif tanpa membohongi guru dan orang tua.',
    },
  },
  {
    id: 'RES_02',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600002',
    studentName: 'Siti Nurhaliza',
    studentClass: '10 AKL 1',
    correctCountPG: 2,
    correctCountCeklist: 1,
    scoreEssay: 30,
    finalScore: 80,
    totalViolations: 1,
    status: 'Selesai',
    submittedAt: '2026-10-15T09:45:12Z',
    answers: {
      Q_INF_01: 'A',
      Q_INF_02: ['A', 'B'],
      Q_INF_03: 'C',
      Q_INF_04: ['A', 'C', 'E'],
      Q_INF_05: 'Ujian anti contek membuat siswa percaya diri dan tidak bergantung pada orang lain saat menghadapi asesmen.',
    },
  },
  {
    id: 'RES_03',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600003',
    studentName: 'Budi Santoso',
    studentClass: '10 AKL 1',
    correctCountPG: 2,
    correctCountCeklist: 1,
    scoreEssay: 25,
    finalScore: 75,
    totalViolations: 0,
    status: 'Selesai',
    submittedAt: '2026-10-15T09:48:30Z',
    answers: { Q_INF_01: 'A', Q_INF_02: ['A', 'B'], Q_INF_03: 'C', Q_INF_04: ['A', 'C'] },
  },
  {
    id: 'RES_04',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600004',
    studentName: 'Dewi Lestari',
    studentClass: '10 AKL 1',
    correctCountPG: 2,
    correctCountCeklist: 2,
    scoreEssay: 38,
    finalScore: 98,
    totalViolations: 0,
    status: 'Selesai',
    submittedAt: '2026-10-15T09:35:10Z',
    answers: { Q_INF_01: 'A', Q_INF_02: ['A', 'B', 'D', 'E'], Q_INF_03: 'C', Q_INF_04: ['A', 'C', 'E'] },
  },
  {
    id: 'RES_05',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600005',
    studentName: 'Fajar Hidayat',
    studentClass: '10 AKL 1',
    correctCountPG: 1,
    correctCountCeklist: 1,
    scoreEssay: 20,
    finalScore: 65,
    totalViolations: 2,
    status: 'Selesai',
    submittedAt: '2026-10-15T09:50:00Z',
    answers: { Q_INF_01: 'B', Q_INF_02: ['A', 'C'], Q_INF_03: 'C', Q_INF_04: ['A'] },
  },
  {
    id: 'RES_06',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600006',
    studentName: 'Putri Anggraeni',
    studentClass: '10 AKL 1',
    correctCountPG: 2,
    correctCountCeklist: 2,
    scoreEssay: 32,
    finalScore: 90,
    totalViolations: 0,
    status: 'Selesai',
    submittedAt: '2026-10-15T09:42:15Z',
    answers: { Q_INF_01: 'A', Q_INF_02: ['A', 'B', 'D', 'E'], Q_INF_03: 'C', Q_INF_04: ['A', 'C', 'E'] },
  },
  {
    id: 'RES_07',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600007',
    studentName: 'Rian Pratama',
    studentClass: '10 AKL 1',
    correctCountPG: 1,
    correctCountCeklist: 0,
    scoreEssay: 15,
    finalScore: 50,
    totalViolations: 3,
    status: 'Didiskualifikasi',
    submittedAt: '2026-10-15T09:30:00Z',
    answers: { Q_INF_01: 'A', Q_INF_02: ['C'], Q_INF_03: 'A' },
  },
  {
    id: 'RES_08',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600008',
    studentName: 'Zahra Amelia',
    studentClass: '10 AKL 1',
    correctCountPG: 2,
    correctCountCeklist: 1,
    scoreEssay: 28,
    finalScore: 82,
    totalViolations: 0,
    status: 'Selesai',
    submittedAt: '2026-10-15T09:44:20Z',
    answers: { Q_INF_01: 'A', Q_INF_02: ['A', 'B', 'D'], Q_INF_03: 'C', Q_INF_04: ['A', 'C', 'E'] },
  },
];

export const INITIAL_EXAM_LOGS: ExamViolationLog[] = [
  {
    id: 'LOG_01',
    sessionId: 'SESI_INF_2026_01',
    nisn: '00600002',
    studentName: 'Siti Nurhaliza',
    studentClass: '10 AKL 1',
    timestamp: '2026-10-15T09:12:44Z',
    violationType: 'GANTI_TAB',
    violationCount: 1,
    actionTaken: 'Peringatan Layar (Strike 1/3)',
    details: 'Browser kehilangan fokus saat mendeteksi tab baru dibuka.',
  },
];

// Storage Helpers
export const loadExamSessions = (): ExamSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAM_SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_EXAM_SESSIONS;
};

export const saveExamSessions = (sessions: ExamSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_EXAM_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error(e);
  }
};

export const loadExamQuestions = (sessionId?: string): ExamQuestion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAM_QUESTIONS);
    if (raw) {
      const all: ExamQuestion[] = JSON.parse(raw);
      if (sessionId) {
        return all.filter((q) => q.sessionId === sessionId);
      }
      return all;
    }
  } catch (e) {
    console.error(e);
  }
  if (sessionId) {
    return INITIAL_EXAM_QUESTIONS.filter((q) => q.sessionId === sessionId);
  }
  return INITIAL_EXAM_QUESTIONS;
};

export const saveExamQuestions = (questions: ExamQuestion[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_EXAM_QUESTIONS, JSON.stringify(questions));
  } catch (e) {
    console.error(e);
  }
};

export const loadExamLogs = (): ExamViolationLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAM_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_EXAM_LOGS;
};

export const saveExamLogs = (logs: ExamViolationLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_EXAM_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error(e);
  }
};

export const loadExamResults = (): ExamStudentResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAM_RESULTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_EXAM_RESULTS;
};

export const saveExamResults = (results: ExamStudentResult[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_EXAM_RESULTS, JSON.stringify(results));
  } catch (e) {
    console.error(e);
  }
};

/**
 * Evaluates student answers and calculates automatic score for PG and Ceklist
 */
export const evaluateExamSubmission = (
  questions: ExamQuestion[],
  answers: Record<string, string | string[]>,
  essayScores: Record<string, number> = {}
) => {
  let correctPG = 0;
  let correctCeklist = 0;
  let totalScoreEarned = 0;
  let maxPossibleScore = 0;

  for (const q of questions) {
    maxPossibleScore += q.scoreWeight;
    const ans = answers[q.id];

    if (q.type === 'PG') {
      if (typeof ans === 'string' && ans.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase()) {
        correctPG++;
        totalScoreEarned += q.scoreWeight;
      }
    } else if (q.type === 'CEKLIST') {
      // Parse correct keys e.g. "A,B,D" -> ["A", "B", "D"]
      const targetKeys = q.correctAnswer
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .sort();

      const userKeys = Array.isArray(ans)
        ? ans.map((s) => String(s).trim().toUpperCase()).filter(Boolean).sort()
        : [];

      // Check exact match or proportional
      const isExactMatch =
        targetKeys.length === userKeys.length &&
        targetKeys.every((k, idx) => k === userKeys[idx]);

      if (isExactMatch) {
        correctCeklist++;
        totalScoreEarned += q.scoreWeight;
      } else {
        // Partial credit: calculate precision
        const correctSelected = userKeys.filter((k) => targetKeys.includes(k)).length;
        const wrongSelected = userKeys.filter((k) => !targetKeys.includes(k)).length;
        if (correctSelected > wrongSelected && targetKeys.length > 0) {
          const ratio = Math.max(0, (correctSelected - wrongSelected) / targetKeys.length);
          totalScoreEarned += Math.round(ratio * q.scoreWeight);
          if (ratio >= 0.7) correctCeklist++;
        }
      }
    } else if (q.type === 'ESAI') {
      const manualScore = essayScores[q.id];
      if (typeof manualScore === 'number') {
        totalScoreEarned += Math.min(q.scoreWeight, Math.max(0, manualScore));
      } else if (typeof ans === 'string' && ans.trim().length > 10) {
        // Default provisional estimate before teacher grades
        totalScoreEarned += Math.round(q.scoreWeight * 0.75);
      }
    }
  }

  const normalizedFinalScore = maxPossibleScore > 0 ? Math.round((totalScoreEarned / maxPossibleScore) * 100) : 0;

  return {
    correctPG,
    correctCeklist,
    totalScoreEarned,
    maxPossibleScore,
    normalizedFinalScore,
  };
};
