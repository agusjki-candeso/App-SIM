import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Search,
  Filter,
  Trash2,
  Edit3,
  ExternalLink,
  Users,
  Eye,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Laptop,
  BarChart3,
  TrendingUp,
  Award,
  Percent,
  Printer,
  FileDown,
  FileText,
  Share2,
  QrCode,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  ExamQuestion,
  ExamSession,
  ExamViolationLog,
  ExamStudentResult,
  ExamQuestionType,
} from '../types/exam';
import { SchoolClass, Teacher, SchoolProfile } from '../types/school';
import {
  generateBankSoalCsvTemplate,
  generateExamResultsCsv,
  parseBankSoalRows,
  questionsToSheetRows,
  sessionsToSheetRows,
  SHEET_NAME_BANK_SOAL,
  SHEET_NAME_SESI,
} from '../utils/googleSheetsExamApi';
import { parseCsvTo2DArray, updateSheetRangeValues } from '../utils/googleSheetsApi';
import { soundManager } from '../utils/sound';
import { ExamResultPrintModal } from './ExamResultPrintModal';
import { ExamShareModal } from './ExamShareModal';

interface ExamManagementViewProps {
  sessions: ExamSession[];
  questions: ExamQuestion[];
  violationLogs: ExamViolationLog[];
  results: ExamStudentResult[];
  classes: SchoolClass[];
  teachers: Teacher[];
  profile?: SchoolProfile;
  spreadsheetId: string;
  accessToken?: string | null;
  onSaveSessions: (sessions: ExamSession[]) => void;
  onSaveQuestions: (questions: ExamQuestion[]) => void;
  onSaveResults: (results: ExamStudentResult[]) => void;
  onEnterStudentExamRoom: (session: ExamSession) => void;
  onSyncWithGrades?: (results: ExamStudentResult[]) => void;
}

export const ExamManagementView: React.FC<ExamManagementViewProps> = ({
  sessions,
  questions,
  violationLogs,
  results,
  classes,
  teachers,
  profile,
  spreadsheetId,
  accessToken,
  onSaveSessions,
  onSaveQuestions,
  onSaveResults,
  onEnterStudentExamRoom,
  onSyncWithGrades,
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'questions' | 'proctoring' | 'results' | 'analytics'>('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Modals
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingSession, setSharingSession] = useState<ExamSession | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<ExamQuestion | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Session Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Informatika');
  const [newDuration, setNewDuration] = useState(60);
  const [newMaxViolations, setNewMaxViolations] = useState(3);
  const [newSelectedClasses, setNewSelectedClasses] = useState<string[]>(['10 AKL 1']);
  const [newTeacher, setNewTeacher] = useState(teachers[0]?.nama || 'Agus Joko Iryanto, S.Kom');
  const [newRandomizeQuestions, setNewRandomizeQuestions] = useState(true);

  // Question Form State
  const [qType, setQType] = useState<ExamQuestionType>('PG');
  const [qQuestion, setQQuestion] = useState('');
  const [qImage, setQImage] = useState('');
  const [qOptionA, setQOptionA] = useState('');
  const [qOptionB, setQOptionB] = useState('');
  const [qOptionC, setQOptionC] = useState('');
  const [qOptionD, setQOptionD] = useState('');
  const [qOptionE, setQOptionE] = useState('');
  const [qCorrectPG, setQCorrectPG] = useState('A');
  const [qCorrectChecklist, setQCorrectChecklist] = useState<string[]>(['A', 'C']);
  const [qCorrectEssay, setQCorrectEssay] = useState('');
  const [qWeight, setQWeight] = useState(10);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const sessionQuestions = questions.filter((q) => !selectedSessionId || q.sessionId === selectedSessionId);
  const filteredQuestions = sessionQuestions.filter((q) => {
    if (filterType === 'ALL') return true;
    return q.type === filterType;
  });

  const sessionResults = results.filter((r) => !selectedSessionId || r.sessionId === selectedSessionId);
  const sessionLogs = violationLogs.filter((l) => !selectedSessionId || l.sessionId === selectedSessionId);

  // Score Distribution Buckets for Recharts BarChart
  const scoreBuckets = [
    {
      range: '85 - 100',
      grade: 'A (Sangat Baik)',
      count: sessionResults.filter((r) => r.finalScore >= 85).length,
      fill: '#10B981', // Emerald
    },
    {
      range: '75 - 84',
      grade: 'B (Baik / Tuntas)',
      count: sessionResults.filter((r) => r.finalScore >= 75 && r.finalScore < 85).length,
      fill: '#3B82F6', // Blue
    },
    {
      range: '60 - 74',
      grade: 'C (Cukup)',
      count: sessionResults.filter((r) => r.finalScore >= 60 && r.finalScore < 75).length,
      fill: '#F59E0B', // Amber
    },
    {
      range: '< 60',
      grade: 'D (Remidial)',
      count: sessionResults.filter((r) => r.finalScore < 60).length,
      fill: '#F43F5E', // Rose
    },
  ];

  // Passing Rate (Tuntas vs Belum Tuntas) for Recharts PieChart
  const tuntasCount = sessionResults.filter((r) => r.finalScore >= 75).length;
  const remidialCount = sessionResults.filter((r) => r.finalScore < 75).length;
  const passingRateData = [
    { name: 'Tuntas (>= 75)', value: tuntasCount, fill: '#10B981' },
    { name: 'Remidial (< 75)', value: remidialCount, fill: '#F43F5E' },
  ];

  // Question Type Mastery calculations
  const pgQuestionsCount = sessionQuestions.filter((q) => q.type === 'PG').length;
  const ceklistQuestionsCount = sessionQuestions.filter((q) => q.type === 'CEKLIST').length;

  const avgPGAccuracy =
    sessionResults.length > 0 && pgQuestionsCount > 0
      ? Math.round(
          (sessionResults.reduce((acc, r) => acc + r.correctCountPG, 0) /
            (sessionResults.length * pgQuestionsCount)) *
            100
        )
      : 85;

  const avgCeklistAccuracy =
    sessionResults.length > 0 && ceklistQuestionsCount > 0
      ? Math.round(
          (sessionResults.reduce((acc, r) => acc + r.correctCountCeklist, 0) /
            (sessionResults.length * ceklistQuestionsCount)) *
            100
        )
      : 78;

  const avgEssayScore =
    sessionResults.length > 0
      ? Math.round(sessionResults.reduce((acc, r) => acc + r.scoreEssay, 0) / sessionResults.length)
      : 28;

  // Stats KPI:
  const scoresArray = sessionResults.map((r) => r.finalScore);
  const avgScore = scoresArray.length > 0 ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length) : 0;
  const maxScore = scoresArray.length > 0 ? Math.max(...scoresArray) : 0;
  const minScore = scoresArray.length > 0 ? Math.min(...scoresArray) : 0;
  const passPercent = sessionResults.length > 0 ? Math.round((tuntasCount / sessionResults.length) * 100) : 0;

  // Helper to generate 6-character random secure exam token
  const generateRandomToken = (prefix: string = 'EXAM') => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix.slice(0, 3).toUpperCase()}-${code}`;
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    soundManager.playBeep();
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = generateBankSoalCsvTemplate(selectedSession?.id || 'SESI_INF_01');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Template_BankSoal_GoogleSheets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundManager.playSuccess();
  };

  const handleDirectExportCsv = (sessionToExport?: ExamSession) => {
    const targetSession = sessionToExport || selectedSession;
    if (!targetSession) {
      alert('Sesi ujian tidak ditemukan.');
      return;
    }
    const targetResults = results.filter((r) => r.sessionId === targetSession.id);
    if (targetResults.length === 0) {
      alert(`Belum ada data nilai siswa untuk sesi "${targetSession.title}".`);
      return;
    }
    const csvContent = generateExamResultsCsv(targetSession, targetResults, profile?.nama_sekolah);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Hasil_Ujian_${targetSession.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    soundManager.playSuccess();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCsvTo2DArray(text);
        const parsed = parseBankSoalRows(rows);
        if (parsed.length === 0) {
          alert('Format file CSV tidak sesuai atau tidak ada baris soal yang terdeteksi.');
          return;
        }

        // Assign current selected sessionId if not provided in CSV
        const enriched = parsed.map((p, idx) => ({
          ...p,
          sessionId: selectedSession?.id || p.sessionId,
          order: sessionQuestions.length + idx + 1,
        }));

        const updated = [...questions, ...enriched];
        onSaveQuestions(updated);
        soundManager.playSuccess();
        alert(`Berhasil mengimpor ${enriched.length} butir soal ke Bank Soal!`);
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file CSV. Pastikan format tabel sesuai template.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSyncToGoogleSheets = async () => {
    if (!accessToken || accessToken.startsWith('dev-')) {
      alert('Fitur sinkronisasi langsung memerlukan Login dengan Google di header. Anda tetap dapat menggunakan fitur "Download CSV" untuk mengunggah ke Google Drive.');
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Sedang menyinkronkan data Bank Soal & Sesi Ujian ke Google Sheets...');

    try {
      // 1. Sync Sesi Ujian
      const sesiRows = sessionsToSheetRows(sessions);
      await updateSheetRangeValues(
        spreadsheetId,
        `${SHEET_NAME_SESI}!A1:M${sesiRows.length + 1}`,
        sesiRows,
        accessToken
      ).catch((err) => console.warn('Sync sesi error:', err));

      // 2. Sync Bank Soal
      const soalRows = questionsToSheetRows(questions);
      await updateSheetRangeValues(
        spreadsheetId,
        `${SHEET_NAME_BANK_SOAL}!A1:M${soalRows.length + 1}`,
        soalRows,
        accessToken
      ).catch((err) => console.warn('Sync soal error:', err));

      soundManager.playSuccess();
      setSyncStatusMsg('Berhasil disinkronkan ke Google Sheets!');
      setTimeout(() => setSyncStatusMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      setSyncStatusMsg(`Gagal sinkron: ${err.message || 'Periksa izin Google Sheets'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Judul sesi ujian wajib diisi');
      return;
    }

    const token = generateRandomToken(newSubject.replace(/[^a-zA-Z]/g, '').slice(0, 3));
    const newSession: ExamSession = {
      id: `SESI_${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject,
      classes: newSelectedClasses.length > 0 ? newSelectedClasses : ['10 AKL 1'],
      teacher: newTeacher,
      token: token,
      durationMinutes: Number(newDuration) || 60,
      randomizeQuestions: newRandomizeQuestions,
      randomizeOptions: true,
      maxViolations: Number(newMaxViolations) || 3,
      status: 'Aktif',
      createdAt: new Date().toISOString(),
    };

    const updated = [newSession, ...sessions];
    onSaveSessions(updated);
    setSelectedSessionId(newSession.id);
    setIsCreateSessionModalOpen(false);
    setNewTitle('');
    soundManager.playSuccess();
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qQuestion.trim()) {
      alert('Teks pertanyaan tidak boleh kosong');
      return;
    }

    let finalCorrectAnswer = '';
    let options: { key: string; text: string }[] | undefined = undefined;

    if (qType === 'PG') {
      options = [
        { key: 'A', text: qOptionA || 'Opsi A' },
        { key: 'B', text: qOptionB || 'Opsi B' },
        { key: 'C', text: qOptionC || 'Opsi C' },
        { key: 'D', text: qOptionD || 'Opsi D' },
      ];
      if (qOptionE.trim()) {
        options.push({ key: 'E', text: qOptionE.trim() });
      }
      finalCorrectAnswer = qCorrectPG;
    } else if (qType === 'CEKLIST') {
      options = [
        { key: 'A', text: qOptionA || 'Pernyataan A' },
        { key: 'B', text: qOptionB || 'Pernyataan B' },
        { key: 'C', text: qOptionC || 'Pernyataan C' },
        { key: 'D', text: qOptionD || 'Pernyataan D' },
      ];
      if (qOptionE.trim()) {
        options.push({ key: 'E', text: qOptionE.trim() });
      }
      finalCorrectAnswer = qCorrectChecklist.sort().join(',');
      if (!finalCorrectAnswer) {
        alert('Pilih minimal satu kunci jawaban yang benar untuk soal ceklist.');
        return;
      }
    } else {
      // ESAI
      finalCorrectAnswer = qCorrectEssay.trim() || 'Rubrik penilaian guru.';
    }

    if (editingQuestion) {
      const updated = questions.map((q) =>
        q.id === editingQuestion.id
          ? {
              ...q,
              type: qType,
              question: qQuestion.trim(),
              imageUrl: qImage.trim() || undefined,
              options,
              correctAnswer: finalCorrectAnswer,
              scoreWeight: Number(qWeight) || 10,
            }
          : q
      );
      onSaveQuestions(updated);
    } else {
      const newQ: ExamQuestion = {
        id: `SOAL_${Date.now()}`,
        sessionId: selectedSession?.id || 'SESI_DEFAULT',
        order: sessionQuestions.length + 1,
        type: qType,
        question: qQuestion.trim(),
        imageUrl: qImage.trim() || undefined,
        options,
        correctAnswer: finalCorrectAnswer,
        scoreWeight: Number(qWeight) || 10,
      };
      onSaveQuestions([...questions, newQ]);
    }

    setIsAddQuestionModalOpen(false);
    setEditingQuestion(null);
    soundManager.playSuccess();
  };

  const handleEditQuestionOpen = (q: ExamQuestion) => {
    setEditingQuestion(q);
    setQType(q.type);
    setQQuestion(q.question);
    setQImage(q.imageUrl || '');
    setQWeight(q.scoreWeight);

    if (q.options) {
      const optMap: Record<string, string> = {};
      q.options.forEach((o) => (optMap[o.key] = o.text));
      setQOptionA(optMap['A'] || '');
      setQOptionB(optMap['B'] || '');
      setQOptionC(optMap['C'] || '');
      setQOptionD(optMap['D'] || '');
      setQOptionE(optMap['E'] || '');
    } else {
      setQOptionA('');
      setQOptionB('');
      setQOptionC('');
      setQOptionD('');
      setQOptionE('');
    }

    if (q.type === 'PG') {
      setQCorrectPG(q.correctAnswer || 'A');
    } else if (q.type === 'CEKLIST') {
      setQCorrectChecklist(q.correctAnswer.split(',').map((s) => s.trim().toUpperCase()));
    } else {
      setQCorrectEssay(q.correctAnswer || '');
    }

    setIsAddQuestionModalOpen(true);
  };

  const handleOpenDeleteQuestionModal = (q: ExamQuestion) => {
    setQuestionToDelete(q);
  };

  const handleConfirmDeleteQuestion = () => {
    if (!questionToDelete) return;
    const qId = questionToDelete.id;
    const updated = questions.filter((q) => q.id !== qId);
    onSaveQuestions(updated);
    setQuestionToDelete(null);
    soundManager.playPop();
    setToastMsg('Butir soal berhasil dihapus dari Bank Soal.');
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 
        TOP BANNER: CBT Anti-Cheat Overview & Quick Stats
      */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/50 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                CBT Anti-Cheat Engine v2.4
              </span>
              <span className="text-2xs text-slate-400">
                Terhubung Google Sheets ({spreadsheetId.slice(0, 10)}...)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pusat Manajemen Ujian Sekolah Anti-Contek
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola sesi ujian, bank soal multi-tipe (Pilihan Ganda, Esai, Ceklist), pantau integritas ujian secara waktu riil, dan sinkronkan hasil nilai langsung ke spreadsheet rapor sekolah.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (selectedSession) {
                  onEnterStudentExamRoom(selectedSession);
                } else {
                  alert('Pilih sesi ujian terlebih dahulu');
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
              title="Buka Ruang Ujian Siswa Berbasis Komputer (CBT Anti-Contek)"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Masuk Ruang Ujian Siswa (CBT)</span>
            </button>

            <button
              onClick={handleSyncToGoogleSheets}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron ke Sheets'}</span>
            </button>
          </div>
        </div>

        {/* Sync notification banner */}
        {syncStatusMsg && (
          <div className="mt-4 p-2.5 rounded-xl bg-blue-900/60 border border-blue-500/40 text-xs text-blue-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-3xs text-slate-400 block font-medium">TOTAL SESI</span>
            <span className="text-lg font-black text-white font-mono tabular-nums">{sessions.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-3xs text-slate-400 block font-medium">BANK SOAL</span>
            <span className="text-lg font-black text-blue-400 font-mono tabular-nums">{questions.length} butir</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-3xs text-slate-400 block font-medium">SISWA MENYELESAIKAN</span>
            <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">{results.length} siswa</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-3xs text-slate-400 block font-medium">TOTAL PELANGGARAN TERDETEKSI</span>
            <span className="text-lg font-black text-rose-400 font-mono tabular-nums">{violationLogs.length} insiden</span>
          </div>
        </div>
      </div>

      {/* 
        NAVIGATION TABS
      */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daftar Sesi Ujian ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bank Soal ({sessionQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('proctoring')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'proctoring'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Papan Pengawas & Log Pelanggaran ({sessionLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'results'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rekap Nilai Siswa ({sessionResults.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Grafik Distribusi Nilai</span>
          </button>
        </div>

        {/* Filter Sesi Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-2xs font-semibold text-slate-500">Pilih Sesi:</span>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.token})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 
        TAB 1: SESI UJIAN
      */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sesi Ujian Aktif & Terjadwal
              </h2>
              <p className="text-xs text-slate-500">
                Atur jadwal asesmen, durasi pengerjaan, dan bagikan Token Ujian kepada peserta di ruangan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSharingSession(selectedSession);
                  setIsShareModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                title="Bagikan Tautan Langsung & QR Code Siswa untuk Sesi Terpilih"
              >
                <QrCode className="w-4 h-4" />
                <span>Bagikan Link & QR Siswa</span>
              </button>
              <button
                onClick={() => setIsCreateSessionModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Sesi Ujian Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => {
              const qCount = questions.filter((q) => q.sessionId === session.id).length;
              const rCount = results.filter((r) => r.sessionId === session.id).length;
              const lCount = violationLogs.filter((l) => l.sessionId === session.id).length;
              const isSelected = session.id === selectedSessionId;

              return (
                <div
                  key={session.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
                        {session.subject} &bull; {session.durationMinutes} Menit
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {session.title}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                        session.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  {/* Token Box */}
                  <div className="my-3 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between border border-slate-800">
                    <div>
                      <span className="text-3xs text-slate-400 uppercase tracking-widest block font-bold">
                        TOKEN UJIAN SISWA
                      </span>
                      <span className="text-lg font-black text-amber-300 font-mono tracking-widest">
                        {session.token}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyToken(session.token)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedToken === session.token ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Salin Token</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Metadata Row */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Kelas: {session.classes.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Batas Toleransi: Maksimal {session.maxViolations}x Peringatan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>
                        {qCount} Butir Soal &bull; {rCount} Hasil Masuk &bull; {lCount} Insiden
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setActiveTab('questions');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold text-center cursor-pointer transition-all"
                    >
                      Buka Bank Soal ({qCount})
                    </button>
                    <button
                      onClick={() => {
                        setSharingSession(session);
                        setIsShareModalOpen(true);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-purple-200 dark:border-purple-800"
                      title="Bagikan Tautan Langsung & QR Code Siswa untuk Sesi Ini"
                    >
                      <Share2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Link & QR</span>
                    </button>
                    {rCount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          setIsPrintModalOpen(true);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-indigo-200 dark:border-indigo-800"
                        title="Ekspor PDF / Cetak Hasil & Unduh CSV Nilai Sesi Ini"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ekspor Nilai ({rCount})</span>
                      </button>
                    )}
                    <button
                      onClick={() => onEnterStudentExamRoom(session)}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      title="Mulai Ujian CBT Resmi untuk Sesi Ini"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Mulai Ujian</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 
        TAB 2: BANK SOAL (PG, ESAI, CEKLIST)
      */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bank Soal: {selectedSession?.title || 'Sesi Ujian'}
              </h2>
              <p className="text-xs text-slate-500">
                Mendukung 3 tipe butir soal: Pilihan Ganda (PG), Ceklist (Multi-Pilihan), dan Esai.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadCsvTemplate}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Download template spreadsheet untuk diisi di Google Sheets / Excel"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span>Template CSV</span>
              </button>

              <label className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>Import CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setQType('PG');
                  setQQuestion('');
                  setQImage('');
                  setQOptionA('');
                  setQOptionB('');
                  setQOptionC('');
                  setQOptionD('');
                  setQOptionE('');
                  setQCorrectPG('A');
                  setQCorrectChecklist(['A', 'C']);
                  setQCorrectEssay('');
                  setQWeight(10);
                  setIsAddQuestionModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Butir Soal</span>
              </button>
            </div>
          </div>

          {/* Success Toast Notification */}
          {toastMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{toastMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 p-1"
              >
                &times;
              </button>
            </div>
          )}

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-2xs font-semibold text-slate-500">Filter Tipe Soal:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {['ALL', 'PG', 'CEKLIST', 'ESAI'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    filterType === t
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t === 'ALL' ? 'Semua Tipe' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Belum ada butir soal untuk filter ini
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tambahkan butir soal dengan menekan tombol "+ Buat Butir Soal" atau unggah data dari Google Sheets / file CSV.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-black text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-2xs font-extrabold uppercase ${
                          q.type === 'PG'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : q.type === 'CEKLIST'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {q.type === 'PG' ? 'Pilihan Ganda' : q.type === 'CEKLIST' ? 'Ceklist (Multi)' : 'Esai / Uraian'}
                      </span>
                      <span className="text-2xs text-slate-500">Bobot: {q.scoreWeight} Poin</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditQuestionOpen(q)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        title="Edit Butir Soal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteQuestionModal(q)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                        title="Hapus Butir Soal"
                        aria-label="Hapus Butir Soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                    {q.question}
                  </div>

                  {/* Optional Image */}
                  {q.imageUrl && (
                    <div className="max-w-md rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img src={q.imageUrl} alt="Lampiran Soal" className="w-full object-cover max-h-56" />
                    </div>
                  )}

                  {/* Options Display */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {q.options.map((opt) => {
                        const isCorrect =
                          q.type === 'PG'
                            ? q.correctAnswer === opt.key
                            : q.correctAnswer.split(',').map((s) => s.trim().toUpperCase()).includes(opt.key);

                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                              isCorrect
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-2xs ${
                                isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Key / Rubric */}
                  {q.type === 'ESAI' && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-3xs uppercase font-extrabold text-slate-500 block">
                        KUNCI JAWABAN / PANDUAN RUBRIK PENILAIAN
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 italic">{q.correctAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 
        TAB 3: PROCTORING & LOG PELANGGARAN
      */}
      {activeTab === 'proctoring' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Papan Pengawasan Waktu Riil (Anti-Cheat Proctoring)
            </h2>
            <p className="text-xs text-slate-500">
              Merekam setiap aktivitas mencurigakan: pindah tab (blur), keluar fullscreen, shortcut terlarang, dan status auto-submit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Summary Cards */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Aturan Keamanan Sesi Ini
                </span>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
                  <li>&bull; <strong>Wajib Fullscreen</strong>: Layar penuh otomatis terkunci.</li>
                  <li>&bull; <strong>Deteksi Tab</strong>: Tercatat seketika saat window blur.</li>
                  <li>&bull; <strong>Blokir Shortcut</strong>: F12, Ctrl+C, Ctrl+V, Alt+Tab dicegah.</li>
                  <li>&bull; <strong>Auto-Diskualifikasi</strong>: Otomatis terkunci jika &gt; {selectedSession?.maxViolations || 3}x pelanggaran.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">Status Sinkronisasi Audit:</span>
                Semua log pelanggaran otomatis tercatat di Google Sheets sheet <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono font-bold">Ujian_Log_Pelanggaran</code> sebagai bukti otentik pengawas.
              </div>
            </div>

            {/* Right: Live Log Table */}
            <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Daftar Insiden Pelanggaran Terakhir ({sessionLogs.length})
                </span>
                <span className="text-2xs text-slate-500">Live Timestamp</span>
              </div>

              {sessionLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Belum ada insiden pelanggaran yang tercatat pada sesi ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                  {sessionLogs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.studentName}
                          </span>
                          <span className="text-2xs text-slate-500">
                            ({log.nisn} &bull; {log.studentClass})
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          {log.details || log.violationType}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {log.violationType} #{log.violationCount}
                        </span>
                        <span className="block text-3xs text-slate-400 mt-0.5 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString('id-ID')} WIB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 
        TAB 4: REKAP NILAI SISWA
      */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Rekap Hasil Ujian Siswa
              </h2>
              <p className="text-xs text-slate-500">
                Nilai soal PG dan Ceklist terhitung otomatis. Guru dapat mengoreksi skor esai dan mengekspor ke rapor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDirectExportCsv()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                title="Unduh seluruh rekap nilai dalam file CSV (kompatibel Excel & Google Sheets)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor CSV</span>
              </button>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                title="Buka pratinjau dokumen resmi, cetak, atau Simpan sebagai PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Ekspor PDF</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-xs"
              >
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>Lihat Grafik Recharts</span>
              </button>

              {onSyncWithGrades && (
                <button
                  onClick={() => {
                    onSyncWithGrades(sessionResults);
                    soundManager.playSuccess();
                    alert(`Berhasil menyalin ${sessionResults.length} nilai ujian ke Sheet Nilai Utama Sekolah!`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Kirim ke Rapor Sekolah</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-2xs">
                  <tr>
                    <th className="px-4 py-3">Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Benar PG</th>
                    <th className="px-4 py-3">Benar Ceklist</th>
                    <th className="px-4 py-3">Skor Esai</th>
                    <th className="px-4 py-3">Nilai Akhir</th>
                    <th className="px-4 py-3">Pelanggaran</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {sessionResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Belum ada siswa yang menyelesaikan ujian pada sesi ini.
                      </td>
                    </tr>
                  ) : (
                    sessionResults.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {res.studentName}
                          <span className="block text-2xs font-normal text-slate-400">NISN: {res.nisn}</span>
                        </td>
                        <td className="px-4 py-3">{res.studentClass}</td>
                        <td className="px-4 py-3 font-mono tabular-nums">{res.correctCountPG} soal</td>
                        <td className="px-4 py-3 font-mono tabular-nums">{res.correctCountCeklist} soal</td>
                        <td className="px-4 py-3 font-mono tabular-nums">{res.scoreEssay} pts</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-black font-mono tabular-nums text-xs ${
                              res.finalScore >= 75
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {res.finalScore}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {res.totalViolations > 0 ? (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {res.totalViolations}x
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold">0 (Bersih)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-md text-2xs font-extrabold inline-flex items-center gap-1.5 ${
                              res.status === 'Waktu Habis'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : res.status === 'Didiskualifikasi'
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            }`}
                          >
                            {res.status === 'Waktu Habis' ? (
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            ) : res.status === 'Didiskualifikasi' ? (
                              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span>{res.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 
        TAB 5: GRAFIK & ANALISIS DISTRIBUSI NILAI (RECHARTS)
      */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-2xs font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Visualisasi Recharts
                </span>
                <span className="text-2xs text-slate-400">
                  {selectedSession?.title}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                Distribusi Nilai Siswa &amp; Performa Kelas
              </h2>
              <p className="text-xs text-slate-500">
                Membantu guru menganalisis sebaran nilai, kurva kelulusan KKM, dan daya serap tipe soal (PG, Esai, Ceklist) secara cepat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                title="Cetak Laporan Resmi / Simpan PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Ekspor PDF</span>
              </button>

              <button
                onClick={() => handleDirectExportCsv()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                title="Unduh Data Nilai CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>

              <button
                onClick={() => setActiveTab('results')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Buka Tabel Rekap Nilai</span>
              </button>
            </div>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-3xs font-extrabold uppercase tracking-wider">Rata-Rata Kelas</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  {avgScore}
                </span>
                <span className="text-2xs text-slate-400">/ 100</span>
              </div>
              <span className="text-3xs text-slate-500 block">
                {avgScore >= 75 ? '● Di atas standar KKM (75)' : '▲ Di bawah KKM'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-3xs font-extrabold uppercase tracking-wider">Ketuntasan (&ge; 75)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {passPercent}%
                </span>
                <span className="text-2xs text-slate-400">({tuntasCount}/{sessionResults.length})</span>
              </div>
              <span className="text-3xs text-emerald-600 dark:text-emerald-400 block font-medium">
                {tuntasCount} siswa mencapai KKM
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-3xs font-extrabold uppercase tracking-wider">Nilai Tertinggi</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  {maxScore}
                </span>
                <span className="text-2xs text-slate-400">Poin</span>
              </div>
              <span className="text-3xs text-slate-500 block">
                Skor sempurna / predikat A
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-3xs font-extrabold uppercase tracking-wider">Perlu Remidial</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                  {remidialCount}
                </span>
                <span className="text-2xs text-slate-400">Siswa</span>
              </div>
              <span className="text-3xs text-rose-500 block">
                Skor terendah: {minScore} poin
              </span>
            </div>
          </div>

          {/* Charts Row: Bar Chart & Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recharts BarChart (Distribusi Rentang Nilai) */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Grafik Distribusi Sebaran Nilai Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jumlah siswa per kategori predikat akademis
                  </p>
                </div>
                <span className="text-2xs font-mono text-slate-400">
                  Total: {sessionResults.length} Peserta
                </span>
              </div>

              {sessionResults.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  Belum ada data nilai ujian yang tersinkronisasi pada sesi ini.
                </div>
              ) : (
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scoreBuckets}
                      margin={{ top: 20, right: 20, left: -15, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        tickLine={false}
                        axisLine={{ stroke: '#94A3B8', opacity: 0.3 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        tickLine={false}
                        axisLine={{ stroke: '#94A3B8', opacity: 0.3 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const pct = sessionResults.length > 0 ? Math.round((data.count / sessionResults.length) * 100) : 0;
                            return (
                              <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                                <span className="font-bold text-blue-300 block">{data.grade}</span>
                                <div>Rentang Nilai: <strong>{data.range}</strong></div>
                                <div>Jumlah Siswa: <strong className="text-emerald-400">{data.count} siswa</strong> ({pct}%)</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={48}>
                        {scoreBuckets.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legend Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-2xs">
                {scoreBuckets.map((b) => (
                  <div key={b.range} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.fill }} />
                    <span className="text-slate-600 dark:text-slate-300 truncate">
                      {b.grade}: <strong>{b.count}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1 Col: Recharts PieChart (Ketuntasan KKM) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  Proporsi Ketuntasan KKM
                </h3>
                <p className="text-xs text-slate-500">
                  Batas kriteria minimum: 75 Poin
                </p>
              </div>

              {sessionResults.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  Tidak ada data
                </div>
              ) : (
                <div className="h-60 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={passingRateData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {passingRateData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const pct = sessionResults.length > 0 ? Math.round((data.value / sessionResults.length) * 100) : 0;
                            return (
                              <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 text-xs">
                                <div><strong>{data.name}</strong></div>
                                <div>{data.value} Siswa ({pct}%)</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {passPercent}%
                    </span>
                    <span className="text-3xs text-slate-400 uppercase font-bold">
                      Tuntas KKM
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-2xs text-slate-600 dark:text-slate-300">
                Siswa yang belum tuntas ({remidialCount} anak) disarankan mengikuti program remedial terjadwal.
              </div>
            </div>
          </div>

          {/* Format Soal Mastery Analysis (PG, Ceklist, Esai) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Analisis Daya Serap Siswa Berdasarkan Tipe Soal
              </h3>
              <p className="text-xs text-slate-500">
                Membandingkan tingkat akurasi pemahaman siswa pada soal Pilihan Ganda tunggal, Ceklist (kompleks), dan Uraian Esai.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PG */}
              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 dark:text-blue-200">1. Pilihan Ganda (PG)</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{avgPGAccuracy}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${avgPGAccuracy}%` }} />
                </div>
                <p className="text-3xs text-slate-500">
                  Tingkat akurasi jawaban benar untuk opsi tunggal A, B, C, D, E.
                </p>
              </div>

              {/* Ceklist */}
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">2. Ceklist (Multi-Pilihan)</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{avgCeklistAccuracy}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgCeklistAccuracy}%` }} />
                </div>
                <p className="text-3xs text-slate-500">
                  Akurasi identifikasi seluruh pernyataan benar tanpa salah pilih.
                </p>
              </div>

              {/* Esai */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">3. Esai &amp; Uraian Nalar</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{avgEssayScore} pts</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((avgEssayScore / 40) * 100))}%` }} />
                </div>
                <p className="text-3xs text-slate-500">
                  Rata-rata skor rubrik pemahaman konseptual dan argumen siswa.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        MODAL: BUAT SESI UJIAN BARU
      */}
      {isCreateSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Buat Sesi Ujian Sekolah Baru
              </h3>
              <button
                onClick={() => setIsCreateSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Sesi Ujian *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Asesmen Akhir Semester Gasal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Kelas Sasaran
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  {classes.map((c) => {
                    const isChecked = newSelectedClasses.includes(c.nama);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setNewSelectedClasses(newSelectedClasses.filter((x) => x !== c.nama));
                          } else {
                            setNewSelectedClasses([...newSelectedClasses, c.nama]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-2xs font-bold transition-all ${
                          isChecked
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {c.nama}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Batas Peringatan Curang
                  </label>
                  <select
                    value={newMaxViolations}
                    onChange={(e) => setNewMaxViolations(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 Kali (Ketat - Sekali Curang Kunci)</option>
                    <option value={2}>2 Kali Peringatan</option>
                    <option value={3}>3 Kali Peringatan (Standar)</option>
                    <option value={5}>5 Kali Peringatan (Longgar)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Guru Pengawas
                  </label>
                  <input
                    type="text"
                    value={newTeacher}
                    onChange={(e) => setNewTeacher(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="randomize"
                  checked={newRandomizeQuestions}
                  onChange={(e) => setNewRandomizeQuestions(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="randomize" className="text-slate-700 dark:text-slate-300 font-medium">
                  Acak urutan butir soal per siswa
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Simpan & Rilis Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        MODAL: BUAT / EDIT BUTIR SOAL (PG, ESAI, CEKLIST)
      */}
      {isAddQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingQuestion ? 'Edit Butir Soal' : 'Tambah Butir Soal Baru'}
              </h3>
              <button
                onClick={() => setIsAddQuestionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              {/* Type Selector Tabs */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pilih Format / Tipe Soal *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQType('PG')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      qType === 'PG'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    1. Pilihan Ganda (PG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQType('CEKLIST')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      qType === 'CEKLIST'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    2. Ceklist (Multi-Pilih)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQType('ESAI')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      qType === 'ESAI'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    3. Esai / Uraian
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Teks Pertanyaan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={qQuestion}
                  onChange={(e) => setQQuestion(e.target.value)}
                  placeholder="Ketikkan teks soal di sini..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Optional Image URL */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  URL Gambar Lampiran (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={qImage}
                  onChange={(e) => setQImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Options for PG & Ceklist */}
              {qType !== 'ESAI' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Pilihan Jawaban (A, B, C, D, E) & Tentukan Kunci Jawaban
                  </label>

                  {[
                    { key: 'A', val: qOptionA, setter: setQOptionA },
                    { key: 'B', val: qOptionB, setter: setQOptionB },
                    { key: 'C', val: qOptionC, setter: setQOptionC },
                    { key: 'D', val: qOptionD, setter: setQOptionD },
                    { key: 'E', val: qOptionE, setter: setQOptionE },
                  ].map((item) => {
                    const isSelectedPG = qCorrectPG === item.key;
                    const isSelectedChecklist = qCorrectChecklist.includes(item.key);

                    return (
                      <div key={item.key} className="flex items-center gap-2">
                        {/* Selector indicator */}
                        {qType === 'PG' ? (
                          <button
                            type="button"
                            onClick={() => setQCorrectPG(item.key)}
                            className={`w-7 h-7 rounded-lg font-bold text-xs shrink-0 flex items-center justify-center transition-all ${
                              isSelectedPG
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                            title={`Tandai ${item.key} sebagai kunci jawaban benar`}
                          >
                            {item.key}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelectedChecklist) {
                                setQCorrectChecklist(qCorrectChecklist.filter((k) => k !== item.key));
                              } else {
                                setQCorrectChecklist([...qCorrectChecklist, item.key]);
                              }
                            }}
                            className={`w-7 h-7 rounded-lg font-bold text-xs shrink-0 flex items-center justify-center transition-all ${
                              isSelectedChecklist
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                            title={`Centang ${item.key} sebagai salah satu kunci benar`}
                          >
                            {isSelectedChecklist ? '✓' : item.key}
                          </button>
                        )}

                        <input
                          type="text"
                          placeholder={`Teks pilihan ${item.key}${item.key === 'E' ? ' (Opsional)' : ''}`}
                          value={item.val}
                          onChange={(e) => item.setter(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    );
                  })}

                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-3xs">
                    {qType === 'PG' ? (
                      <span>Klik tombol huruf (A/B/C/D) yang berwarna hijau untuk memilih kunci jawaban benar.</span>
                    ) : (
                      <span>Klik tombol kotak centang untuk menandai <strong>semua opsi yang benar</strong> (Ceklist multi-jawaban). Kunci saat ini: <strong>{qCorrectChecklist.join(', ') || 'Belum dipilih'}</strong></span>
                    )}
                  </div>
                </div>
              )}

              {/* Essay Rubric */}
              {qType === 'ESAI' && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Panduan Jawaban / Rubrik Penilaian Guru
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Kunci kata yang harus ada: RAM, volatile, memori utama..."
                    value={qCorrectEssay}
                    onChange={(e) => setQCorrectEssay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Score Weight */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Bobot Skor Nilai Soal Ini
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={qWeight}
                  onChange={(e) => setQWeight(Number(e.target.value))}
                  className="w-32 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Simpan ke Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXAM RESULT PRINT & PDF MODAL */}
      {isPrintModalOpen && selectedSession && (
        <ExamResultPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          session={selectedSession}
          results={sessionResults}
          profile={profile}
          allSessions={sessions}
          onSelectSession={(sessionId) => setSelectedSessionId(sessionId)}
        />
      )}

      {/* EXAM SHARE LINK & QR MODAL */}
      {isShareModalOpen && (sharingSession || selectedSession) && (
        <ExamShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSharingSession(null);
          }}
          session={sharingSession || selectedSession}
          questionCount={
            questions.filter((q) => q.sessionId === (sharingSession?.id || selectedSession?.id)).length
          }
          profile={profile}
          onOpenAsStudent={(s) => onEnterStudentExamRoom(s)}
        />
      )}

      {/* CONFIRM DELETE QUESTION MODAL */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Butir Soal?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini akan menghapus butir soal berikut secara permanen dari Bank Soal:
              </p>
            </div>

            {/* Question preview box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-2xs text-slate-500 uppercase">
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {questionToDelete.type === 'PG' ? 'Pilihan Ganda' : questionToDelete.type === 'CEKLIST' ? 'Ceklist' : 'Esai'}
                </span>
                <span>Bobot: {questionToDelete.scoreWeight} Poin</span>
              </div>
              <p className="line-clamp-3 font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                "{questionToDelete.question}"
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteQuestion}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Soal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

