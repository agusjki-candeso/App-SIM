import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  ArrowLeft,
  HelpCircle,
  FileText,
  Check,
  X,
  Volume2,
} from 'lucide-react';
import {
  ExamQuestion,
  ExamSession,
  ExamViolationLog,
  ExamStudentResult,
  ExamViolationType,
} from '../types/exam';
import { Student } from '../types/school';
import {
  evaluateExamSubmission,
  saveExamResults,
  saveExamLogs,
  loadExamResults,
  loadExamLogs,
} from '../utils/examStorage';
import {
  recordViolationToGoogleSheets,
  saveStudentResultToGoogleSheets,
} from '../utils/googleSheetsExamApi';
import { soundManager } from '../utils/sound';

interface ExamAntiCheatRoomProps {
  session: ExamSession;
  questions: ExamQuestion[];
  students: Student[];
  spreadsheetId: string;
  accessToken?: string | null;
  initialToken?: string;
  onExit: () => void;
  onFinished: (result: ExamStudentResult) => void;
}

export const ExamAntiCheatRoom: React.FC<ExamAntiCheatRoomProps> = ({
  session,
  questions,
  students,
  spreadsheetId,
  accessToken,
  initialToken,
  onExit,
  onFinished,
}) => {
  // 3 Phases: 'gate' | 'in_exam' | 'result'
  const [phase, setPhase] = useState<'gate' | 'in_exam' | 'result'>('gate');

  // Gate State - Pre-populate from prop or URL if available
  const [inputToken, setInputToken] = useState(() => {
    if (initialToken) return initialToken.toUpperCase();
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) return urlToken.toUpperCase();
    } catch (e) {}
    return '';
  });
  const [selectedNisn, setSelectedNisn] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState(session.classes[0] || '10 AKL 1');
  const [integrityAgreed, setIntegrityAgreed] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  // Eligible students based on session's designated classes
  const sessionStudents = useMemo(() => {
    let list = students;
    if (session.classes && session.classes.length > 0) {
      const filtered = students.filter((s) => session.classes.includes(s.kelas));
      if (filtered.length > 0) list = filtered;
    }
    return [...list].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [students, session.classes]);

  // In-Exam State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [doubtful, setDoubtful] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(session.durationMinutes * 60);
  const [timeNotice, setTimeNotice] = useState<string | null>(null);

  // Anti-Cheat Watchdog State
  const [violationCount, setViolationCount] = useState(0);
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [currentViolationReason, setCurrentViolationReason] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<ExamStudentResult | null>(null);

  const isExamActiveRef = useRef(false);
  const isSubmittedRef = useRef(false);
  const violationCountRef = useRef(0);
  const answersRef = useRef(answers);
  const endTimeRef = useRef<number>(0);
  const warned5MinRef = useRef(false);
  const warned1MinRef = useRef(false);

  // Synchronize latest answers into ref and sessionStorage to guarantee zero data loss
  useEffect(() => {
    answersRef.current = answers;
    if (phase === 'in_exam' && selectedNisn) {
      try {
        sessionStorage.setItem(
          `smkn2songgom_exam_draft_${session.id}_${selectedNisn}`,
          JSON.stringify(answers)
        );
      } catch (e) {}
    }
  }, [answers, phase, selectedNisn, session.id]);

  // Filter questions for this session & sort
  const sessionQuestions = questions
    .filter((q) => q.sessionId === session.id)
    .sort((a, b) => a.order - b.order);

  const activeQuestion = sessionQuestions[currentIndex] || sessionQuestions[0];

  // Auto populate student details when selecting NISN
  const handleSelectStudent = (nisn: string) => {
    setSelectedNisn(nisn);
    const s = students.find((item) => item.nisn === nisn || item.nis === nisn);
    if (s) {
      setStudentName(s.nama);
      setStudentClass(s.kelas);
    }
  };

  // 1. Enter Exam Room & Request Fullscreen
  const handleStartExam = async () => {
    if (inputToken.trim().toUpperCase() !== session.token.trim().toUpperCase()) {
      setGateError('Token Ujian tidak valid. Silakan tanyakan kepada pengawas ruang.');
      soundManager.playError();
      return;
    }

    if (!studentName.trim() || !selectedNisn.trim()) {
      setGateError('Harap lengkapi NISN dan Nama Peserta Ujian.');
      soundManager.playError();
      return;
    }

    if (!integrityAgreed) {
      setGateError('Anda wajib menyetujui Pakta Integritas Ujian Sekolah.');
      soundManager.playError();
      return;
    }

    setGateError(null);

    // Request browser fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request bypassed or permission denied', e);
    }

    // Set wall-clock target deadline timestamp to prevent timer freezing/pausing
    const totalSecs = Math.max(1, session.durationMinutes) * 60;
    const targetEnd = Date.now() + totalSecs * 1000;
    endTimeRef.current = targetEnd;
    try {
      sessionStorage.setItem(`smkn2songgom_exam_end_${session.id}_${selectedNisn}`, String(targetEnd));
    } catch (e) {}

    // Restore any existing cached draft answers if re-entering
    const draftKey = `smkn2songgom_exam_draft_${session.id}_${selectedNisn}`;
    const savedDraft = sessionStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setAnswers(parsed);
        answersRef.current = parsed;
      } catch (e) {}
    } else {
      setAnswers({});
      answersRef.current = {};
    }

    warned5MinRef.current = false;
    warned1MinRef.current = false;
    isSubmittedRef.current = false;
    setIsAutoSubmitting(false);
    setSecondsRemaining(totalSecs);
    isExamActiveRef.current = true;
    violationCountRef.current = 0;
    setViolationCount(0);
    setPhase('in_exam');
    soundManager.playSuccess();
  };

  // 2. Submit Answers (Manual or Auto-Submit on Timeout / Disqualification)
  const handleForceSubmit = useCallback(
    (statusReason: 'Selesai' | 'Didiskualifikasi' | 'Waktu Habis' = 'Selesai') => {
      // Guard against double submission
      if (isSubmittedRef.current) return;
      isSubmittedRef.current = true;
      isExamActiveRef.current = false;

      // Show auto-submitting visual modal when timer expires
      if (statusReason === 'Waktu Habis') {
        setIsAutoSubmitting(true);
      }

      // Remove timer and draft cache from storage
      try {
        sessionStorage.removeItem(`smkn2songgom_exam_end_${session.id}_${selectedNisn}`);
        sessionStorage.removeItem(`smkn2songgom_exam_draft_${session.id}_${selectedNisn}`);
      } catch (e) {}

      // Exit fullscreen safely
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      // Always use answersRef.current to prevent stale state from timeout closures
      let currentAnswers = answersRef.current || answers || {};
      if (Object.keys(currentAnswers).length === 0 && selectedNisn) {
        try {
          const draft = sessionStorage.getItem(`smkn2songgom_exam_draft_${session.id}_${selectedNisn}`);
          if (draft) currentAnswers = JSON.parse(draft);
        } catch (e) {}
      }

      const evaluation = evaluateExamSubmission(sessionQuestions, currentAnswers);

      const result: ExamStudentResult = {
        id: `RES_${session.id}_${selectedNisn || Date.now()}`,
        sessionId: session.id,
        nisn: selectedNisn,
        studentName: studentName,
        studentClass: studentClass,
        correctCountPG: evaluation.correctPG,
        correctCountCeklist: evaluation.correctCeklist,
        scoreEssay: 0,
        finalScore: evaluation.normalizedFinalScore,
        totalViolations: violationCountRef.current,
        status: statusReason,
        submittedAt: new Date().toISOString(),
        answers: currentAnswers,
      };

      setFinalResult(result);
      setIsViolationModalOpen(false);
      setIsSubmitModalOpen(false);

      // Persist to local storage
      const existingResults = loadExamResults();
      const updatedResults = [
        result,
        ...existingResults.filter((r) => r.nisn !== result.nisn || r.sessionId !== result.sessionId),
      ];
      saveExamResults(updatedResults);

      // Sync to Google Sheets
      saveStudentResultToGoogleSheets(spreadsheetId, result, accessToken).catch((err) =>
        console.warn('Sync result to sheet error', err)
      );

      onFinished(result);

      if (statusReason === 'Waktu Habis') {
        soundManager.playError();
        // Give 1.2s for student to view the "Waktu Habis: Mengumpulkan Otomatis" modal, then smoothly switch to completion screen
        setTimeout(() => {
          setIsAutoSubmitting(false);
          setPhase('result');
          soundManager.playSuccess();
        }, 1200);
      } else {
        setPhase('result');
        soundManager.playSuccess();
      }
    },
    [session, selectedNisn, studentName, studentClass, sessionQuestions, answers, spreadsheetId, accessToken, onFinished]
  );

  const handleForceSubmitRef = useRef(handleForceSubmit);
  useEffect(() => {
    handleForceSubmitRef.current = handleForceSubmit;
  }, [handleForceSubmit]);

  // 3. Trigger Anti-Cheat Strike
  const triggerViolation = useCallback(
    async (type: ExamViolationType, description: string) => {
      if (!isExamActiveRef.current) return;

      soundManager.playError();
      const newCount = violationCountRef.current + 1;
      violationCountRef.current = newCount;
      setViolationCount(newCount);
      setCurrentViolationReason(description);
      setIsViolationModalOpen(true);

      const logId = `LOG_${Date.now()}_${newCount}`;
      const logEntry: ExamViolationLog = {
        id: logId,
        sessionId: session.id,
        nisn: selectedNisn,
        studentName: studentName,
        studentClass: studentClass,
        timestamp: new Date().toISOString(),
        violationType: type,
        violationCount: newCount,
        actionTaken:
          newCount >= session.maxViolations
            ? 'DISKUALIFIKASI / AUTO-SUBMIT LEMBAR UJIAN'
            : `Peringatan Layar (Strike #${newCount}/${session.maxViolations})`,
        details: description,
      };

      // Save locally
      const existingLogs = loadExamLogs();
      saveExamLogs([logEntry, ...existingLogs]);

      // Record to Google Sheets
      recordViolationToGoogleSheets(spreadsheetId, logEntry, accessToken).catch((err) =>
        console.warn('Failed recording violation to sheet', err)
      );

      // Check max limit strike
      if (newCount >= session.maxViolations) {
        handleForceSubmit('Didiskualifikasi');
      }
    },
    [session, selectedNisn, studentName, studentClass, spreadsheetId, accessToken, handleForceSubmit]
  );

  // 3. Register Anti-Cheat Event Listeners
  useEffect(() => {
    if (phase !== 'in_exam') return;

    // A. Visibility Change (Tab Switch or minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(
          'GANTI_TAB',
          'Terdeteksi beralih tab atau membuka jendela aplikasi lain di luar browser ujian.'
        );
      }
    };

    // B. Window Blur (Focus Loss, Popups, Split Screen)
    const handleWindowBlur = () => {
      // Small timeout to allow system focus transitions
      setTimeout(() => {
        if (!document.hasFocus() && isExamActiveRef.current) {
          triggerViolation(
            'KEHILANGAN_FOKUS',
            'Fokus layar ujian hilang (terindikasi membuka aplikasi samping atau notifikasi).'
          );
        }
      }, 300);
    };

    // C. Fullscreen Exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isExamActiveRef.current) {
        triggerViolation(
          'KELUAR_FULLSCREEN',
          'Siswa keluar dari mode layar penuh (Fullscreen) tanpa izin pengawas.'
        );
      }
    };

    // D. Right-Click Context Menu Prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation('SHORTCUT_TERLARANG', 'Klik kanan (Context Menu / Inspect) dinonaktifkan.');
      return false;
    };

    // E. Prohibited Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation('SHORTCUT_TERLARANG', 'Tombol F12 (Developer Tools) dilarang saat ujian.');
        return;
      }

      // Ctrl + Shift + I/J/C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        triggerViolation('SHORTCUT_TERLARANG', 'Kombinasi tombol Inspect Element diblokir.');
        return;
      }

      // Ctrl + C / Ctrl + V / Ctrl + U / Ctrl + P
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 'p')) {
        e.preventDefault();
        triggerViolation('COPY_PASTE', `Kombinasi Ctrl+${e.key.toUpperCase()} (Salin/Tempel/Cetak) diblokir.`);
        return;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, triggerViolation]);

  // 4. Timer Countdown with Wall-Clock Anchor & Anti-Freeze Prevention
  useEffect(() => {
    if (phase !== 'in_exam') return;

    // Check or restore target end timestamp from storage
    const storageKey = `smkn2songgom_exam_end_${session.id}_${selectedNisn}`;
    let targetEnd = endTimeRef.current;
    if (!targetEnd || targetEnd <= Date.now()) {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        targetEnd = parseInt(stored, 10);
      }
      if (!targetEnd || targetEnd <= Date.now()) {
        targetEnd = Date.now() + Math.max(1, session.durationMinutes) * 60 * 1000;
        try {
          sessionStorage.setItem(storageKey, String(targetEnd));
        } catch (e) {}
      }
      endTimeRef.current = targetEnd;
    }

    let timer: ReturnType<typeof setInterval> | null = null;

    const checkTimerTick = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.ceil((targetEnd - now) / 1000));
      setSecondsRemaining(diffSecs);

      // Warning thresholds (5 minutes & 1 minute)
      if (diffSecs === 300 && !warned5MinRef.current) {
        warned5MinRef.current = true;
        setTimeNotice('Peringatan: Waktu pengerjaan ujian tersisa 5 menit!');
        soundManager.playBeep();
        setTimeout(() => setTimeNotice(null), 5000);
      } else if (diffSecs === 60 && !warned1MinRef.current) {
        warned1MinRef.current = true;
        setTimeNotice('Perhatian: Waktu tersisa 1 menit! Segera periksa jawaban Anda.');
        soundManager.playError();
        setTimeout(() => setTimeNotice(null), 6000);
      } else if (diffSecs <= 10 && diffSecs > 0) {
        soundManager.playBeep();
      }

      // Time expired: auto-submit immediately exactly when countdown reaches zero
      if (diffSecs <= 0) {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        handleForceSubmitRef.current('Waktu Habis');
      }
    };

    checkTimerTick();
    timer = setInterval(checkTimerTick, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, session.durationMinutes, session.id, selectedNisn]);

  // Re-enter Fullscreen after violation modal confirmation
  const handleResumeFullscreen = async () => {
    setIsViolationModalOpen(false);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      // Continue anyway
    }
  };

  // Format Timer hh:mm:ss or mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answer Helpers
  const handleSelectPG = (optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: optionKey,
    }));
    soundManager.playPop();
  };

  const handleToggleChecklist = (optionKey: string) => {
    const current = (answers[activeQuestion.id] as string[]) || [];
    let updated: string[];
    if (current.includes(optionKey)) {
      updated = current.filter((k) => k !== optionKey);
    } else {
      updated = [...current, optionKey];
    }
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: updated,
    }));
    soundManager.playPop();
  };

  const handleEssayChange = (text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: text,
    }));
  };

  const toggleDoubtful = () => {
    setDoubtful((prev) => ({
      ...prev,
      [activeQuestion.id]: !prev[activeQuestion.id],
    }));
    soundManager.playBeep();
  };

  // Count answered questions
  const answeredCount = sessionQuestions.filter((q) => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    return String(ans).trim().length > 0;
  }).length;

  // =========================================================================
  // VIEW 1: GATE / PRE-EXAM INTEGRITY SCREEN
  // =========================================================================
  if (phase === 'gate') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <button
          onClick={onExit}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pusat Kendali</span>
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-3xs uppercase tracking-widest font-black text-blue-600 dark:text-blue-400">
              CBT ANTI-CHEAT CLIENT SHIELD &bull; UJIAN RESMI SEKOLAH
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {session.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-2xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Batas Waktu: <strong>{session.durationMinutes} Menit</strong> (Hitung Mundur Otomatis)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-2xs font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{sessionQuestions.length} Butir Soal</span>
              </span>
            </div>
          </div>

          {gateError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{gateError}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Token Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Token Sesi Ujian (Dari Pengawas Ruang) *
                </label>
                {session.token && (
                  <button
                    type="button"
                    onClick={() => setInputToken(session.token)}
                    className="text-2xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Token Pengawas: <span className="font-mono font-bold">{session.token}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Ketikkan token ujian resmi..."
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold tracking-widest text-center uppercase"
              />
            </div>

            {/* Quick Student Selector or Manual Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pilih Peserta Ujian / NISN *
                </label>
                <select
                  value={selectedNisn}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs"
                >
                  <option value="">-- Pilih Siswa Terdaftar ({sessionStudents.length} Siswa) --</option>
                  {sessionStudents.map((s) => (
                    <option key={s.id || s.nisn} value={s.nisn}>
                      {s.nama} ({s.nisn} - {s.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  placeholder="Ketikkan nama siswa..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Anti-Cheat Rules Box */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 space-y-2 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Ketentuan Protokol Anti-Contek &amp; Batasan Waktu:
              </span>
              <ul className="space-y-1.5 text-2xs list-disc pl-4 text-slate-600 dark:text-slate-400">
                <li>Ujian berjalan dalam <strong>Mode Layar Penuh (Fullscreen)</strong> anti-contek.</li>
                <li>Dilarang berpindah tab, meminimalkan browser, atau membuka aplikasi lain.</li>
                <li><strong>Timer Hitung Mundur Otomatis ({session.durationMinutes} Menit)</strong>: Berjalan berbasis jam nyata server dan <strong>tidak dapat dihentikan sementara (pause)</strong>.</li>
                <li>Ketika waktu mencapai <strong>00:00 (Waktu Habis)</strong>, lembar ujian akan <strong>otomatis dikunci dan dikumpulkan</strong> ke server pengawas.</li>
                <li>Jika pelanggaran anti-contek mencapai <strong>{session.maxViolations} kali</strong>, sesi ujian otomatis didiskualifikasi.</li>
              </ul>
            </div>

            {/* Integrity Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="integritas"
                checked={integrityAgreed}
                onChange={(e) => setIntegrityAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 cursor-pointer"
              />
              <label htmlFor="integritas" className="text-slate-600 dark:text-slate-300 text-2xs leading-relaxed cursor-pointer">
                Saya berjanji mengerjakan ujian ini dengan jujur, mandiri, tanpa bantuan orang lain atau mesin pencari, serta mematuhi tata tertib SMK Negeri 2 Songgom.
              </label>
            </div>
          </div>

          <button
            onClick={handleStartExam}
            className="w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
          >
            <Maximize2 className="w-5 h-5" />
            <span>Kunci Layar Penuh &amp; Mulai Ujian</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: IN-EXAM FULLSCREEN SHIELD
  // =========================================================================
  if (phase === 'in_exam') {
    const totalSessionSeconds = Math.max(1, session.durationMinutes) * 60;
    const timePercentage = Math.max(0, Math.min(100, (secondsRemaining / totalSessionSeconds) * 100));
    const isCriticalTime = secondsRemaining <= 60; // < 1 min
    const isUrgentTime = secondsRemaining <= 300; // < 5 mins
    const userAns = answers[activeQuestion?.id];
    const isDoubt = doubtful[activeQuestion?.id];

    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none overflow-hidden font-sans">
        {/* 
          TOP BAR: Anti-Cheat Telemetry, Student Identity & Timer
        */}
        <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[180px] sm:max-w-xs">
                {session.title}
              </span>
              <span className="text-3xs text-slate-400">
                {studentName} &bull; {selectedNisn} ({studentClass})
              </span>
            </div>
          </div>

          {/* Center: Enhanced Countdown Timer Pill */}
          <div
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2.5 font-mono font-black tabular-nums transition-all ${
              isCriticalTime
                ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/50 animate-pulse'
                : isUrgentTime
                ? 'bg-amber-950/90 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                : 'bg-slate-800/90 border-slate-700 text-amber-300'
            }`}
            title={`Sisa waktu pengerjaan: ${formatTime(secondsRemaining)} dari total ${session.durationMinutes} menit. Sistem anti-contek akan otomatis mengunci saat waktu habis.`}
          >
            <Clock
              className={`w-4 h-4 shrink-0 ${
                isCriticalTime ? 'text-rose-400 animate-spin' : isUrgentTime ? 'text-amber-400' : 'text-amber-400'
              }`}
            />
            <div className="flex flex-col items-center leading-none">
              <span className="text-sm tracking-wider font-mono font-black">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5 tracking-tight">
                {isCriticalTime ? 'Kritis (Auto-Submit)' : isUrgentTime ? 'Sisa < 5 Mnt' : 'Sisa Waktu'}
              </span>
            </div>
          </div>

          {/* Right: Anti-Cheat Strike Indicator & Finish Button */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-extrabold uppercase border ${
                violationCount === 0
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                Strike: {violationCount}/{session.maxViolations}
              </span>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim Jawaban</span>
            </button>
          </div>
        </header>

        {/* Anti-Cheat Real-Time Countdown Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 relative overflow-hidden shrink-0">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isCriticalTime
                ? 'bg-rose-500 animate-pulse'
                : isUrgentTime
                ? 'bg-amber-400'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${timePercentage}%` }}
          />
        </div>

        {/* Floating Time Alert Notification Banner */}
        {timeNotice && (
          <div className="bg-amber-500 text-slate-950 font-black text-xs py-2 px-4 text-center shadow-lg flex items-center justify-center gap-2 animate-bounce-short shrink-0">
            <Clock className="w-4 h-4 animate-spin text-slate-950" />
            <span>{timeNotice}</span>
          </div>
        )}

        {/* 
          MAIN TWO-ZONE STAGE: Left Question Body, Right Question Matrix
        */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
          {/* LEFT ZONE: Question Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto w-full">
            <div className="space-y-5">
              {/* Question Header Metadata */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs font-mono">
                    SOAL #{currentIndex + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-2xs font-extrabold uppercase ${
                      activeQuestion.type === 'PG'
                        ? 'bg-blue-900/40 text-blue-300 border border-blue-800'
                        : activeQuestion.type === 'CEKLIST'
                        ? 'bg-amber-900/40 text-amber-300 border border-amber-800'
                        : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {activeQuestion.type === 'PG'
                      ? 'Pilihan Ganda'
                      : activeQuestion.type === 'CEKLIST'
                      ? 'Pilihan Ganda Kompleks (Ceklist)'
                      : 'Esai / Uraian'}
                  </span>
                  <span className="text-2xs text-slate-400">
                    Bobot: {activeQuestion.scoreWeight} Pts
                  </span>
                </div>

                {/* Doubtful Toggle Button */}
                <button
                  onClick={toggleDoubtful}
                  className={`px-3 py-1 rounded-xl text-2xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDoubt
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{isDoubt ? 'Ragu-Ragu' : 'Tandai Ragu'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed whitespace-pre-wrap">
                {activeQuestion.question}
              </div>

              {/* Optional Question Image */}
              {activeQuestion.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 max-w-lg bg-slate-900">
                  <img
                    src={activeQuestion.imageUrl}
                    alt="Lampiran Soal"
                    className="w-full object-cover max-h-72"
                  />
                </div>
              )}

              {/* 
                ANSWER OPTIONS RENDERING
              */}
              {/* A. Pilihan Ganda (PG Single Selection) */}
              {activeQuestion.type === 'PG' && activeQuestion.options && (
                <div className="space-y-2.5 pt-2">
                  {activeQuestion.options.map((opt) => {
                    const isSelected = userAns === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectPG(opt.key)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-900/30'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="text-sm font-medium mt-0.5 leading-snug">
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* B. Ceklist (Multi-Select Pilihan Ganda Kompleks) */}
              {activeQuestion.type === 'CEKLIST' && activeQuestion.options && (
                <div className="space-y-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-2xs text-amber-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Soal Ceklist: Anda dapat memilih lebih dari satu jawaban yang benar. Centang semua opsi yang relevan.
                    </span>
                  </div>

                  {activeQuestion.options.map((opt) => {
                    const selectedList = (userAns as string[]) || [];
                    const isChecked = selectedList.includes(opt.key);

                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleToggleChecklist(opt.key)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-amber-600/20 border-amber-500 text-white shadow-md shadow-amber-900/30'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                            isChecked
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : opt.key}
                        </div>
                        <span className="text-sm font-medium mt-0.5 leading-snug">
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* C. Esai (Textarea) */}
              {activeQuestion.type === 'ESAI' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs text-slate-400 font-bold block">
                    Ketikkan Jawaban Uraian Anda di Bawah Ini:
                  </label>
                  <textarea
                    rows={6}
                    value={(userAns as string) || ''}
                    onChange={(e) => handleEssayChange(e.target.value)}
                    placeholder="Tuliskan penjelasan dan argumen jawaban Anda secara rinci..."
                    className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-900 text-white text-sm focus:border-blue-500 focus:outline-hidden leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-2xs text-slate-500">
                    <span>Otomatis tersimpan di cache lokal per kata.</span>
                    <span className="font-mono">
                      {((userAns as string) || '').trim().split(/\s+/).filter(Boolean).length} Kata
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Question Nav Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  setCurrentIndex((prev) => Math.max(0, prev - 1));
                  soundManager.playPop();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Soal Sebelumnya</span>
              </button>

              <span className="text-xs text-slate-400 font-mono">
                {currentIndex + 1} dari {sessionQuestions.length}
              </span>

              {currentIndex < sessionQuestions.length - 1 ? (
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => Math.min(sessionQuestions.length - 1, prev + 1));
                    soundManager.playPop();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Soal Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Selesai Ujian</span>
                </button>
              )}
            </div>
          </main>

          {/* RIGHT ZONE: Question Matrix Deck */}
          <aside className="w-full lg:w-72 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">Navigasi Soal</span>
                <span className="text-2xs text-slate-400 font-mono">
                  {answeredCount}/{sessionQuestions.length} Terjawab
                </span>
              </div>

              {/* Grid of Number Badges */}
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-64 sm:max-h-80 overflow-y-auto pr-1">
                {sessionQuestions.map((q, idx) => {
                  const ans = answers[q.id];
                  const hasAnswer =
                    ans !== undefined &&
                    (Array.isArray(ans) ? ans.length > 0 : String(ans).trim().length > 0);
                  const isDoubtfulState = doubtful[q.id];
                  const isActive = idx === currentIndex;

                  let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (hasAnswer) {
                    badgeColor = isDoubtfulState
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-emerald-600 text-white border-emerald-500';
                  } else if (isDoubtfulState) {
                    badgeColor = 'bg-amber-900/60 text-amber-300 border-amber-700';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        soundManager.playPop();
                      }}
                      className={`h-10 rounded-xl font-mono text-xs font-black border transition-all flex items-center justify-center cursor-pointer ${badgeColor} ${
                        isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-3xs text-slate-400 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
                  <span>Sudah Dijawab ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block" />
                  <span>Ragu-Ragu ({Object.values(doubtful).filter(Boolean).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 inline-block" />
                  <span>Belum Dijawab ({sessionQuestions.length - answeredCount})</span>
                </div>
              </div>
            </div>

            {/* Quick Finish Button on Side */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Kumpulkan Lembar Jawaban</span>
              </button>
            </div>
          </aside>
        </div>

        {/* 
          MODAL: EMERGENCY ANTI-CHEAT VIOLATION WARNING (STRIKE MODAL)
        */}
        {isViolationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl shadow-rose-950/60 animate-bounce-short">
              <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-500 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-2xs font-extrabold uppercase bg-rose-600 text-white tracking-widest inline-block">
                  PERINGATAN KECURANGAN #{violationCount}/{session.maxViolations}
                </span>
                <h2 className="text-lg font-black text-white mt-2">
                  Aktivitas Mencurigakan Terdeteksi!
                </h2>
                <p className="text-xs text-rose-200 mt-2 bg-rose-950/60 p-3 rounded-xl border border-rose-800/60 leading-relaxed">
                  {currentViolationReason}
                </p>
              </div>

              <div className="text-2xs text-slate-400 leading-relaxed">
                Insiden ini telah dicatat dengan stempel waktu ke server Google Sheets pengawas sekolah. Jika Anda melakukan pelanggaran hingga{' '}
                <strong className="text-white">{session.maxViolations} kali</strong>, sesi ujian Anda akan{' '}
                <strong className="text-rose-400">otomatis didiskualifikasi</strong>.
              </div>

              <button
                onClick={handleResumeFullscreen}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs cursor-pointer shadow-lg shadow-rose-600/30 transition-all uppercase tracking-wider"
              >
                Saya Mengerti &amp; Kembali ke Layar Penuh
              </button>
            </div>
          </div>
        )}

        {/* 
          MODAL: CONFIRM SUBMISSION
        */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Konfirmasi Pengumpulan Jawaban
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Apakah Anda yakin ingin menyelesaikan ujian dan mengirim jawaban ke server?
                </p>
              </div>

              {/* Status summary */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 space-y-1">
                <div>Total Soal: <strong>{sessionQuestions.length}</strong></div>
                <div>Sudah Dijawab: <strong className="text-emerald-400">{answeredCount}</strong></div>
                {sessionQuestions.length - answeredCount > 0 && (
                  <div className="text-amber-300 font-bold">
                    Perhatian: Masih ada {sessionQuestions.length - answeredCount} butir soal belum diisi!
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Periksa Kembali
                </button>
                <button
                  onClick={() => handleForceSubmit('Selesai')}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  Ya, Kirim Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 
          MODAL: AUTO-SUBMITTING OVERLAY WHEN COUNTDOWN REACHES ZERO
        */}
        {isAutoSubmitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md select-none">
            <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl shadow-amber-950/80 animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center ring-8 ring-amber-500/10">
                <Clock className="w-10 h-10 text-amber-400 animate-spin" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-2xs font-extrabold uppercase bg-amber-500 text-slate-950 tracking-wider inline-block">
                  WAKTU UJIAN TELAH HABIS (00:00)
                </span>
                <h2 className="text-xl font-black text-white">
                  Mengumpulkan Otomatis...
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Batas waktu pengerjaan telah berakhir. Sistem anti-contek secara otomatis mengamankan seluruh butir jawaban Anda dan mentransfernya ke server pengawas.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/60 text-xs text-slate-300 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="font-semibold text-emerald-300">Menyimpan semua jawaban &amp; memproses nilai...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Calculate answered metrics on completion screen
  const finalAnsweredCount = sessionQuestions.filter((q) => {
    const ans = finalResult?.answers?.[q.id];
    if (!ans) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    return String(ans).trim().length > 0;
  }).length;
  const finalUnansweredCount = Math.max(0, sessionQuestions.length - finalAnsweredCount);

  // =========================================================================
  // VIEW 3: EXAM RESULTS SCREEN
  // =========================================================================
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
            finalResult?.status === 'Didiskualifikasi'
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
              : finalResult?.status === 'Waktu Habis'
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {finalResult?.status === 'Didiskualifikasi' ? (
            <AlertTriangle className="w-9 h-9" />
          ) : finalResult?.status === 'Waktu Habis' ? (
            <Clock className="w-9 h-9" />
          ) : (
            <CheckCircle2 className="w-9 h-9" />
          )}
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-full text-2xs font-extrabold uppercase ${
              finalResult?.status === 'Didiskualifikasi'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                : finalResult?.status === 'Waktu Habis'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            STATUS: {finalResult?.status === 'Waktu Habis' ? 'WAKTU HABIS (AUTO-SUBMIT OTOMATIS)' : finalResult?.status}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            Lembar Jawaban Berhasil Diterima
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {session.title} &bull; SMK Negeri 2 Songgom Brebes
          </p>
        </div>

        {/* Timeout Explanation Alert if applicable */}
        {finalResult?.status === 'Waktu Habis' && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 text-left flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">Ujian Dikumpulkan Otomatis (Batas Waktu {session.durationMinutes} Menit Berakhir)</span>
              <p className="text-2xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                Sistem timer anti-contek telah mengunci pengerjaan tepat saat hitung mundur mencapai <strong className="text-amber-900 dark:text-amber-100 font-mono">00:00</strong>. Seluruh {finalAnsweredCount} butir jawaban yang Anda isi telah otomatis tersimpan aman di database server sekolah dan dihitung ke dalam nilai akhir.
              </p>
            </div>
          </div>
        )}

        {/* Score Box */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-3xs text-slate-400 uppercase font-bold block">NILAI AKHIR</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums">
              {finalResult?.finalScore}
            </span>
          </div>
          <div>
            <span className="text-3xs text-slate-400 uppercase font-bold block">BENAR PG</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {finalResult?.correctCountPG} soal
            </span>
          </div>
          <div>
            <span className="text-3xs text-slate-400 uppercase font-bold block">BENAR CEKLIST</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {finalResult?.correctCountCeklist} soal
            </span>
          </div>
          <div>
            <span className="text-3xs text-slate-400 uppercase font-bold block">PELANGGARAN</span>
            <span
              className={`text-lg font-black font-mono tabular-nums ${
                (finalResult?.totalViolations || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {finalResult?.totalViolations}x
            </span>
          </div>
        </div>

        {/* Answer Breakdown Detail Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-3xs text-slate-400 block font-bold">TOTAL SOAL</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sessionQuestions.length} Butir</span>
          </div>
          <div>
            <span className="text-3xs text-slate-400 block font-bold">SOAL TERJAWAB</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{finalAnsweredCount} Soal</span>
          </div>
          <div>
            <span className="text-3xs text-slate-400 block font-bold">BELUM TERISI</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{finalUnansweredCount} Soal</span>
          </div>
          <div>
            <span className="text-3xs text-slate-400 block font-bold">WAKTU SELESAI</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {finalResult?.submittedAt ? new Date(finalResult.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
            </span>
          </div>
        </div>

        {/* Google Sheets Sync Note */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 text-left space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Tersinkronisasi ke Google Sheets Database</span>
          </div>
          <p className="text-2xs text-blue-700 dark:text-blue-300 pl-6">
            Rincian jawaban ({finalAnsweredCount} terisi) telah tercatat pada Sheet <code className="font-mono font-bold">Ujian_Jawaban_Siswa</code> dan nilai akhir siap direkap ke rapor.
          </p>
        </div>

        <button
          onClick={onExit}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
        >
          Selesai &amp; Kembali ke Menu Utama
        </button>
      </div>
    </div>
  );
};
