import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  BookOpen,
  Users,
  Play,
  ArrowRight,
  LogIn,
  KeyRound,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  School,
  Lock,
} from 'lucide-react';
import { ExamSession, ExamQuestion } from '../types/exam';
import { SchoolProfile, Student } from '../types/school';
import { soundManager } from '../utils/sound';

interface StudentExamPortalProps {
  sessions: ExamSession[];
  questions: ExamQuestion[];
  students: Student[];
  profile: SchoolProfile;
  onSelectSession: (session: ExamSession, token?: string) => void;
  onBackToLogin: () => void;
}

export const StudentExamPortal: React.FC<StudentExamPortalProps> = ({
  sessions,
  questions,
  students,
  profile,
  onSelectSession,
  onBackToLogin,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Active sessions only
  const activeSessions = sessions.filter((s) => s.status === 'Aktif');
  const otherSessions = sessions.filter((s) => s.status !== 'Aktif');

  const handleQuickTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError(null);

    const clean = tokenInput.trim().toUpperCase();
    if (!clean) {
      setTokenError('Silakan masukkan Token Ujian 6 karakter dari pengawas.');
      soundManager.playWarning();
      return;
    }

    // Find session with this token
    const matched = sessions.find((s) => s.token.trim().toUpperCase() === clean);
    if (!matched) {
      setTokenError(`Token "${clean}" tidak ditemukan. Pastikan token sudah benar atau tanyakan pengawas.`);
      soundManager.playError();
      return;
    }

    soundManager.playSuccess();
    onSelectSession(matched, clean);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Banner / Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/30 shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xs uppercase tracking-widest font-extrabold text-blue-400">
                PORTAL RESMI UJIAN SISWA
              </span>
              <span className="px-1.5 py-0.5 rounded text-3xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ONLINE</span>
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-white leading-tight">
              {profile.nama_sekolah} &bull; CBT Anti-Contek
            </h1>
          </div>
        </div>

        <button
          onClick={onBackToLogin}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/80 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Portal Guru / Admin</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>Computer Based Test (CBT) dengan Sistem Pengawasan Anti-Contek Ketat</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Selamat Datang di Ruang Ujian Mandiri Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Silakan pilih sesi ujian Anda di bawah ini atau masukkan <strong>Token Ujian</strong> yang telah dibagikan oleh guru pengawas untuk memulai asesmen sekolah.
          </p>
        </div>

        {/* Quick Token Bar */}
        <div className="max-w-xl mx-auto p-5 sm:p-6 rounded-3xl bg-linear-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/60 border-2 border-blue-500/40 shadow-2xl backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-sm font-black text-white">
              Punya Token Ujian? Masuk Cepat:
            </h3>
          </div>

          <form onSubmit={handleQuickTokenSubmit} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value.toUpperCase());
                  setTokenError(null);
                }}
                maxLength={10}
                placeholder="CONTOH: K7M2P9"
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-950/90 border border-blue-400/40 text-amber-300 font-mono font-black text-base tracking-widest uppercase placeholder-slate-600 focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-center"
              />
              <button
                type="submit"
                className="py-3 px-5 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/30 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <span>Masuk Ujian</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {tokenError && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-2xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{tokenError}</span>
              </div>
            )}
          </form>

          <p className="text-3xs text-slate-400 text-center">
            Token terdiri dari 6 karakter huruf & angka acak resmi yang diumumkan pengawas di papan tulis.
          </p>
        </div>

        {/* Section: Sesi Ujian Aktif Hari Ini */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Daftar Sesi Ujian Tersedia ({activeSessions.length})
              </h3>
            </div>
            <span className="text-2xs text-slate-400">
              Pilih ujian sesuai mata pelajaran & kelas Anda
            </span>
          </div>

          {activeSessions.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">
                Belum ada sesi ujian aktif saat ini
              </h4>
              <p className="text-2xs text-slate-500 max-w-sm mx-auto">
                Silakan hubungi guru mata pelajaran atau pengawas ruang untuk mengaktifkan sesi ujian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((session) => {
                const qCount = questions.filter((q) => q.sessionId === session.id).length;
                return (
                  <div
                    key={session.id}
                    className="p-5 rounded-3xl bg-linear-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/60 shadow-xl transition-all space-y-4 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-3xs uppercase tracking-widest font-black text-blue-400">
                          {session.subject}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-3xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Aktif
                        </span>
                      </div>

                      <h4 className="text-base font-black text-white group-hover:text-blue-300 transition-colors">
                        {session.title}
                      </h4>

                      <p className="text-2xs text-slate-400 mt-1">
                        Pengawas: <span className="text-slate-300 font-semibold">{session.teacher}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center text-2xs">
                      <div>
                        <span className="text-3xs text-slate-500 block">DURASI</span>
                        <span className="font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span>{session.durationMinutes}m</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-500 block">TOTAL SOAL</span>
                        <span className="font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                          <BookOpen className="w-3 h-3 text-emerald-400" />
                          <span>{qCount} Soal</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-500 block">TARGET</span>
                        <span className="font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-purple-400" />
                          <span className="truncate max-w-[60px]">{session.classes[0]}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectSession(session)}
                      className="w-full py-2.5 px-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Masuk Ruang Ujian Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Anti-Cheat Rules & Guidance Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white">
              Tata Tertib & Ketentuan Sistem Anti-Contek Resmi
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-2xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-blue-400 block">1. Wajib Layar Penuh</span>
              <p className="text-slate-400 text-3xs leading-relaxed">
                Ujian harus dikerjakan dalam mode Fullscreen. Keluar dari mode layar penuh dihitung sebagai pelanggaran.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-rose-400 block">2. Dilarang Pindah Tab</span>
              <p className="text-slate-400 text-3xs leading-relaxed">
                Sistem mendeteksi jika siswa membuka tab baru, browser lain, tombol Alt+Tab, atau split screen.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">3. Auto-Save Real-Time</span>
              <p className="text-slate-400 text-3xs leading-relaxed">
                Jawaban Anda tersimpan otomatis setiap detik. Tidak perlu takut kehilangan jawaban jika jaringan berkedip.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">4. Auto-Submit Timer</span>
              <p className="text-slate-400 text-3xs leading-relaxed">
                Saat waktu hitung mundur habis (00:00), seluruh jawaban akan otomatis dikumpulkan dan dinilai langsung.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-3xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">
          {profile.nama_sekolah} &bull; NPSN {profile.npsn} &bull; Brebes, Jawa Tengah
        </p>
        <p className="text-slate-600">
          Sistem Ujian Berbasis Komputer Anti-Contek &bull; Dikembangkan untuk Asesmen Akademik Mandiri & Transparan
        </p>
      </footer>
    </div>
  );
};
