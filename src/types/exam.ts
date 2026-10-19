export type ExamQuestionType = 'PG' | 'ESAI' | 'CEKLIST';

export interface ExamOption {
  key: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface ExamQuestion {
  id: string;
  sessionId: string;
  order: number;
  type: ExamQuestionType;
  question: string;
  imageUrl?: string;
  options?: ExamOption[]; // Digunakan untuk PG & CEKLIST
  correctAnswer: string; // 'A' untuk PG, 'A,C,D' untuk CEKLIST, keyword/rubrik untuk ESAI
  scoreWeight: number; // Bobot nilai, default misal 2.5 atau 10
  explanation?: string;
}

export interface ExamSession {
  id: string;
  title: string;
  subject: string;
  classes: string[]; // Contoh: ['10 AKL 1', '10 DPIB 1']
  teacher: string;
  token: string; // Contoh: 'INF-8291'
  durationMinutes: number; // Contoh: 60
  startTime?: string;
  endTime?: string;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  maxViolations: number; // Default: 3
  status: 'Draft' | 'Aktif' | 'Selesai';
  createdAt: string;
}

export type ExamViolationType =
  | 'GANTI_TAB'
  | 'KELUAR_FULLSCREEN'
  | 'COPY_PASTE'
  | 'SHORTCUT_TERLARANG'
  | 'KEHILANGAN_FOKUS';

export interface ExamViolationLog {
  id: string;
  sessionId: string;
  nisn: string;
  studentName: string;
  studentClass: string;
  timestamp: string;
  violationType: ExamViolationType;
  violationCount: number;
  actionTaken: string;
  details?: string;
}

export interface ExamStudentAnswer {
  questionId: string;
  type: ExamQuestionType;
  answer: string | string[]; // string untuk PG/ESAI, string[] untuk CEKLIST (contoh: ['A', 'C'])
  isDoubtful?: boolean; // Ragu-ragu
  scoreEarned?: number;
}

export interface ExamStudentResult {
  id: string;
  sessionId: string;
  nisn: string;
  studentName: string;
  studentClass: string;
  correctCountPG: number;
  correctCountCeklist: number;
  scoreEssay: number;
  finalScore: number;
  totalViolations: number;
  status: 'Sedang Mengerjakan' | 'Selesai' | 'Didiskualifikasi' | 'Waktu Habis';
  submittedAt: string;
  answers: Record<string, string | string[]>;
}
