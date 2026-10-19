import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Share2,
  ExternalLink,
  Printer,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Clock,
  Users,
  BookOpen,
  Sparkles,
  Info,
} from 'lucide-react';
import QRCode from 'qrcode';
import { ExamSession } from '../types/exam';
import { SchoolProfile } from '../types/school';
import { soundManager } from '../utils/sound';

interface ExamShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ExamSession;
  questionCount: number;
  profile?: SchoolProfile;
  onOpenAsStudent: (session: ExamSession) => void;
}

export const ExamShareModal: React.FC<ExamShareModalProps> = ({
  isOpen,
  onClose,
  session,
  questionCount,
  profile,
  onOpenAsStudent,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  // Build the direct student exam URL
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const studentExamUrl = `${baseUrl}?cbt=1&session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(session.token)}`;
  const portalUrl = `${baseUrl}?cbt=1`;

  // Generate QR Code data URL whenever studentExamUrl changes
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(studentExamUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, studentExamUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(studentExamUrl);
      setCopiedUrl(true);
      soundManager.playSuccess();
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(session.token);
      setCopiedToken(true);
      soundManager.playSuccess();
      setTimeout(() => setCopiedToken(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className={`w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl transition-all overflow-hidden ${
          isProjectorMode ? 'max-w-4xl' : 'max-w-2xl'
        }`}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-3xs uppercase tracking-widest font-extrabold text-blue-200 block">
                Akses Langsung Siswa &bull; CBT Anti-Contek
              </span>
              <h3 className="text-base font-black text-white leading-tight">
                Bagikan Tautan & QR Code Ujian
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title={isProjectorMode ? 'Kecilkan Tampilan' : 'Mode Proyektor Kelas (Besarkan Teks)'}
            >
              {isProjectorMode ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Mode Normal</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Mode Proyektor</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Sesi Info Pill */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-2xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {session.subject} &bull; {session.title}
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                Pengawas: {session.teacher}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-2xs font-bold text-slate-600 dark:text-slate-300">
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{session.durationMinutes} Menit</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{questionCount} Soal</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{session.classes.join(', ')}</span>
              </span>
            </div>
          </div>

          {/* MAIN ACCESS CARD: QR CODE & TOKEN */}
          <div
            className={`grid gap-6 items-center ${
              isProjectorMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
            }`}
          >
            {/* Left Column: QR Code */}
            <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-3">
              <span className="text-2xs uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
                SCAN QR DENGAN KAMERA HP / TABLET
              </span>

              <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code Akses Siswa"
                    className={isProjectorMode ? 'w-64 h-64 sm:w-72 sm:h-72 object-contain' : 'w-48 h-48 sm:w-56 sm:h-56 object-contain'}
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                    <QrCode className="w-12 h-12 animate-pulse" />
                  </div>
                )}
              </div>

              <p className="text-2xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Arahkan kamera smartphone ke kode QR di atas untuk langsung membuka ruang ujian tanpa ketik tautan.
              </p>
            </div>

            {/* Right Column: Token Ujian & Direct URL */}
            <div className="space-y-4">
              {/* Token Ujian Card */}
              <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 text-white shadow-xl space-y-2">
                <span className="text-3xs uppercase tracking-widest font-black text-amber-400 block">
                  TOKEN UJIAN SISWA
                </span>
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`font-black font-mono tracking-widest text-amber-300 ${
                      isProjectorMode ? 'text-4xl sm:text-5xl' : 'text-3xl'
                    }`}
                  >
                    {session.token}
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                        <span>Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-950" />
                        <span>Salin Token</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-2xs text-slate-400 leading-tight">
                  Tampilkan token ini di papan tulis atau proyektor untuk dimasukkan siswa saat gerbang ujian.
                </p>
              </div>

              {/* Direct Link Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                  Tautan Langsung Siswa (Direct URL)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={studentExamUrl}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-2xs font-mono text-slate-800 dark:text-slate-200 select-all focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-3xs text-blue-600/80 dark:text-blue-400 leading-relaxed">
                  Bagikan link ini ke grup WhatsApp kelas. Siswa yang mengeklik link ini akan otomatis diarahkan ke sesi ini dengan token yang sudah terisi.
                </p>
              </div>

              {/* Student Instructions */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 space-y-1.5 text-2xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Petunjuk Bagi Siswa:</span>
                </div>
                <ol className="list-decimal list-inside space-y-0.5 text-3xs leading-relaxed">
                  <li>Siswa buka link atau scan QR code pada HP/Laptop masing-masing.</li>
                  <li>Pilih Nama Siswa sesuai daftar kelas dan masukkan Token Ujian.</li>
                  <li>Setujui Pakta Integritas & izinkan Mode Layar Penuh (Fullscreen).</li>
                  <li>Dilarang berpindah aplikasi/tab browser (tercatat otomatis oleh sistem).</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-2xs text-slate-500">
              Link Portal Siswa Umum: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{portalUrl}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenAsStudent(session);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Uji Coba Masuk Sebagai Siswa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
