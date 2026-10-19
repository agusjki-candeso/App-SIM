import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  FileDown,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  Filter,
} from 'lucide-react';
import { ExamSession, ExamStudentResult } from '../types/exam';
import { SchoolProfile } from '../types/school';
import { printElement, downloadPrintableHtml } from '../utils/printHelper';
import { generateExamResultsCsv } from '../utils/googleSheetsExamApi';
import { soundManager } from '../utils/sound';

interface ExamResultPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ExamSession;
  results: ExamStudentResult[];
  profile?: SchoolProfile;
  allSessions?: ExamSession[];
  onSelectSession?: (sessionId: string) => void;
}

export const ExamResultPrintModal: React.FC<ExamResultPrintModalProps> = ({
  isOpen,
  onClose,
  session,
  results,
  profile,
  allSessions,
  onSelectSession,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Fallback default school profile if not provided
  const school = profile || {
    id: 'smkn2songgom',
    nama_sekolah: 'SMK NEGERI 2 SONGGOM',
    alamat: 'Jl. Raya Songgom - Larangan KM 2, Songgom Lor, Kec. Songgom, Kab. Brebes, Jawa Tengah 52266',
    kepsek: 'Drs. H. Mulyono, M.Pd.',
    nip_kepsek: '19680512 199403 1 008',
    guru: session?.teacher || 'Agus Joko Iryanto, S.Kom',
    nip_guru: '19850720 201101 1 012',
    logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=120&fit=crop&crop=faces',
    npsn: '69985959',
    akreditasi: 'A (Unggul)',
    email: 'smkn2songgom.brebes@gmail.com',
    telepon: '(0283) 6184001',
    website: 'https://smkn2songgom.sch.id',
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract distinct classes from this session's results or session.classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    session?.classes?.forEach((c) => set.add(c));
    results.forEach((r) => {
      if (r.studentClass) set.add(r.studentClass);
    });
    return Array.from(set).sort();
  }, [session, results]);

  // Filter results by selected class
  const filteredResults = useMemo(() => {
    if (selectedClassFilter === 'ALL') return results;
    return results.filter((r) => r.studentClass === selectedClassFilter);
  }, [results, selectedClassFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredResults.length;
    const scores = filteredResults.map((r) => r.finalScore);
    const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
    const max = total > 0 ? Math.max(...scores) : 0;
    const min = total > 0 ? Math.min(...scores) : 0;
    const tuntas = filteredResults.filter((r) => r.finalScore >= 75).length;
    const remidial = total - tuntas;
    const passPct = total > 0 ? Math.round((tuntas / total) * 100) : 0;
    const violations = filteredResults.reduce((acc, r) => acc + (r.totalViolations || 0), 0);

    return { total, avg, max, min, tuntas, remidial, passPct, violations };
  }, [filteredResults]);

  if (!isOpen) return null;

  const docTitle = `Hasil_Ujian_${(session?.title || 'CBT').replace(/\s+/g, '_')}_${selectedClassFilter.replace(/\s+/g, '_')}`;

  const handlePrint = async () => {
    soundManager.playSuccess();
    setIsPrinting(true);
    setPrintNotice('Membuka dialog cetak browser & opsi Simpan PDF...');

    try {
      await printElement('exam-results-printable-area', {
        title: `Laporan Hasil Asesmen Ujian CBT - ${session?.title || 'SMK Negeri 2 Songgom'}`,
        landscape: orientation === 'landscape',
      });
      setPrintNotice('Dialog cetak dibuka. Pilih printer fisik atau opsi "Simpan sebagai PDF".');
      setTimeout(() => setPrintNotice(null), 5000);
    } catch (err) {
      console.warn('Print error fallback', err);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadHtml = () => {
    soundManager.playSuccess();
    downloadPrintableHtml(
      'exam-results-printable-area',
      `${docTitle}.html`,
      `Laporan Resmi Hasil Ujian CBT - ${session?.title || ''}`
    );
  };

  const handleExportCsv = () => {
    soundManager.playSuccess();
    const csvContent = generateExamResultsCsv(session, filteredResults, school.nama_sekolah);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${docTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-100 dark:bg-slate-900 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
      >
        {/* Top Control Bar (Non-Printable) */}
        <div className="no-print p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Ekspor &amp; Cetak Hasil Ujian CBT</span>
                <span className="px-2 py-0.5 rounded text-3xs font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  PDF &bull; CSV &bull; HTML
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {session?.title} &bull; {session?.subject} ({session?.token})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Session Selector if available */}
            {allSessions && allSessions.length > 1 && onSelectSession && (
              <select
                value={session.id}
                onChange={(e) => onSelectSession(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                {allSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.token})
                  </option>
                ))}
              </select>
            )}

            {/* Class Filter */}
            {availableClasses.length > 1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="ALL">Semua Kelas ({availableClasses.join(', ')})</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      Kelas {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Orientation Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-2xs font-bold">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  orientation === 'portrait'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Potret
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  orientation === 'landscape'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Lanskap
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Unduh data nilai dalam file spreadsheet CSV (bisa dibuka di Excel / Google Sheets)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>

            {/* Standalone HTML Export */}
            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Unduh salinan digital dokumen HTML mandiri"
            >
              <FileDown className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Unduh HTML</span>
            </button>

            {/* Print / Save to PDF Button */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              title="Cetak langsung atau pilih 'Save as PDF' di browser"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Menyiapkan...' : 'Cetak / Simpan PDF'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Bar */}
        {printNotice && (
          <div className="no-print bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800/50 px-4 py-2 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{printNotice}</span>
          </div>
        )}

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/60 flex justify-center">
          <div
            id="exam-results-printable-area"
            className={`bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-300 w-full ${
              orientation === 'landscape' ? 'max-w-[1020px]' : 'max-w-[820px]'
            } transition-all duration-300`}
            style={{
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#0f172a',
            }}
          >
            {/* KOP SURAT RESMI */}
            <div className="flex items-center gap-4 sm:gap-6 border-b-4 border-double border-slate-900 pb-4 mb-5">
              <img
                src={school.logo}
                alt="Logo Sekolah"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
              />
              <div className="text-center flex-1">
                <span className="text-2xs sm:text-xs font-bold tracking-widest uppercase block text-slate-700">
                  PEMERINTAH PROVINSI JAWA TENGAH
                </span>
                <span className="text-2xs sm:text-xs font-bold tracking-wider uppercase block text-slate-700">
                  DINAS PENDIDIKAN DAN KEBUDAYAAN
                </span>
                <h1 className="text-base sm:text-xl font-black tracking-wide text-slate-900 uppercase">
                  {school.nama_sekolah}
                </h1>
                <p className="text-3xs sm:text-2xs text-slate-600 mt-0.5 leading-snug">
                  {school.alamat}
                </p>
                <div className="text-3xs text-slate-500 mt-0.5 flex flex-wrap items-center justify-center gap-x-3">
                  <span>NPSN: {school.npsn || '69985959'}</span>
                  <span>Akreditasi: {school.akreditasi || 'A'}</span>
                  <span>Email: {school.email || 'info@smkn2songgom.sch.id'}</span>
                  <span>Web: {school.website || 'smkn2songgom.sch.id'}</span>
                </div>
              </div>
            </div>

            {/* DOCUMENT TITLE */}
            <div className="text-center my-4 space-y-1">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider underline">
                BERITA ACARA &amp; DAFTAR REKAPITULASI NILAI UJIAN (CBT)
              </h2>
              <p className="text-xs font-medium text-slate-700">
                Sistem Asesmen Sekolah Berbasis Komputer Anti-Contek (Computer Based Test)
              </p>
            </div>

            {/* METADATA SESI */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-5">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-32 text-slate-500 font-semibold">Judul Asesmen:</span>
                  <span className="font-bold text-slate-900">{session?.title || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-slate-500 font-semibold">Mata Pelajaran:</span>
                  <span className="font-bold text-slate-900">{session?.subject || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-slate-500 font-semibold">Sasaran Kelas:</span>
                  <span className="font-bold text-slate-900">
                    {selectedClassFilter === 'ALL'
                      ? session?.classes?.join(', ') || 'Semua Kelas'
                      : selectedClassFilter}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex">
                  <span className="w-32 text-slate-500 font-semibold">Guru Pengampu:</span>
                  <span className="font-bold text-slate-900">{session?.teacher || school.guru}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-slate-500 font-semibold">Kode Token / Sesi:</span>
                  <span className="font-mono font-bold text-blue-800">{session?.token || '-'} ({session?.durationMinutes} Menit)</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-slate-500 font-semibold">Batas KKM:</span>
                  <span className="font-bold text-emerald-800">75 (Skala 100)</span>
                </div>
              </div>
            </div>

            {/* KPI STATISTIK RINGKAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-center">
                <span className="text-3xs text-slate-500 font-bold uppercase block">Total Peserta</span>
                <span className="text-lg font-black font-mono text-slate-900">{stats.total} Siswa</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-center">
                <span className="text-3xs text-slate-500 font-bold uppercase block">Rata-Rata Kelas</span>
                <span className="text-lg font-black font-mono text-blue-700">{stats.avg} / 100</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-center">
                <span className="text-3xs text-slate-500 font-bold uppercase block">Ketuntasan KKM</span>
                <span className="text-lg font-black font-mono text-emerald-700">{stats.passPct}% ({stats.tuntas}/{stats.total})</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-center">
                <span className="text-3xs text-slate-500 font-bold uppercase block">Perlu Remedial</span>
                <span className="text-lg font-black font-mono text-rose-700">{stats.remidial} Siswa</span>
              </div>
            </div>

            {/* TABEL HASIL SISWA */}
            <div className="overflow-x-auto border border-slate-900 rounded-lg mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-bold uppercase text-3xs tracking-wider">
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-8">No</th>
                    <th className="py-2.5 px-2.5 border-r border-slate-300 w-24">NISN</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Nama Lengkap Siswa</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-20">Kelas</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-16">Benar PG</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-20">Benar Ceklist</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-16">Skor Esai</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-16">Nilai Akhir</th>
                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-12">Predikat</th>
                    <th className="py-2.5 px-2.5 border-r border-slate-300 text-center w-20">KKM (&ge; 75)</th>
                    <th className="py-2.5 px-2 text-center w-24">Integritas CBT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500 italic">
                        Belum ada data nilai siswa untuk sesi / kelas ini.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((r, idx) => {
                      let predikat = 'D';
                      if (r.finalScore >= 85) predikat = 'A';
                      else if (r.finalScore >= 75) predikat = 'B';
                      else if (r.finalScore >= 60) predikat = 'C';

                      const isTuntas = r.finalScore >= 75;

                      return (
                        <tr
                          key={r.id}
                          className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                        >
                          <td className="py-2 px-2 border-r border-slate-300 text-center font-mono text-3xs">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-300 font-mono text-3xs">
                            {r.nisn}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900">
                            {r.studentName}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 text-center text-3xs">
                            {r.studentClass}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 text-center font-mono text-3xs">
                            {r.correctCountPG}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 text-center font-mono text-3xs">
                            {r.correctCountCeklist}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 text-center font-mono text-3xs">
                            {r.scoreEssay}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-black text-xs text-slate-900">
                            {r.finalScore}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 text-center font-black text-xs">
                            {predikat}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-300 text-center font-bold text-3xs">
                            <span
                              className={`px-1.5 py-0.5 rounded text-3xs font-extrabold ${
                                isTuntas
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isTuntas ? 'TUNTAS' : 'REMEDIAL'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center text-3xs">
                            {r.totalViolations > 0 ? (
                              <span className="text-rose-700 font-bold">
                                {r.totalViolations}x langgar
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Bersih</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* CATATAN & PENGESAHAN TANDA TANGAN */}
            <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-slate-300">
              {/* Kolom Kiri: Catatan Pengawas & Mengetahui Kepala Sekolah */}
              <div className="flex flex-col justify-between">
                <div className="text-3xs text-slate-500 space-y-0.5">
                  <span className="font-bold text-slate-700 block">Catatan Sistem Anti-Contek (CBT Shield):</span>
                  <p>&bull; Dokumen sah dan dihasilkan otomatis melalui sistem asesmen SMK Negeri 2 Songgom.</p>
                  <p>&bull; Nilai dihitung proporsional dari soal Pilihan Ganda, Ceklist, dan Uraian Esai.</p>
                  <p>&bull; Total insiden kecurangan yang dicegah dan tercatat: {stats.violations} kejadian.</p>
                </div>

                <div className="mt-8 text-center">
                  <span className="block text-slate-600">Mengetahui,</span>
                  <span className="font-bold text-slate-900 block">Kepala SMK Negeri 2 Songgom</span>
                  <div className="h-16" />
                  <span className="font-bold underline text-slate-900 block uppercase">
                    {school.kepsek}
                  </span>
                  <span className="text-3xs text-slate-600 block">
                    NIP. {school.nip_kepsek}
                  </span>
                </div>
              </div>

              {/* Kolom Kanan: Guru Mata Pelajaran */}
              <div className="flex flex-col justify-end text-center">
                <span className="block text-slate-600">
                  Brebes, {printDateStr}
                </span>
                <span className="font-bold text-slate-900 block">
                  Guru Pengampu Mata Pelajaran / Penguji,
                </span>
                <div className="h-16" />
                <span className="font-bold underline text-slate-900 block uppercase">
                  {session?.teacher || school.guru}
                </span>
                <span className="text-3xs text-slate-600 block">
                  NIP. {school.nip_guru || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
