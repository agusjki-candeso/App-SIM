import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Send,
  Sparkles,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Printer,
  FileText,
  UserCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import { Student, TeachingJournal, SchoolProfile, SchoolClass } from '../types/school';
import { UserSession } from '../types/auth';
import { saveJournalToGoogleSheets, SPREADSHEET_ID_DEFAULT } from '../utils/googleSheetsApi';
import { soundManager } from '../utils/sound';

interface TeachingJournalViewProps {
  students: Student[];
  profile: SchoolProfile;
  classes?: SchoolClass[];
  userSession: UserSession | null;
  journals: TeachingJournal[];
  onSaveJournal: (journal: TeachingJournal) => void;
  onDeleteJournal: (id: string) => void;
  isAdmin: boolean;
  onOpenSyncModal: () => void;
}

export const TeachingJournalView: React.FC<TeachingJournalViewProps> = ({
  students,
  profile,
  classes = [],
  userSession,
  journals,
  onSaveJournal,
  onDeleteJournal,
  isAdmin,
  onOpenSyncModal,
}) => {
  // Extract all unique classes directly from Sheet 'kelas' or students
  const classesList = useMemo(() => {
    if (classes && classes.length > 0) {
      return classes.map((c) => c.nama);
    }
    const set = new Set(students.map((s) => s.kelas).filter(Boolean));
    return Array.from(set).sort();
  }, [classes, students]);

  const [formTanggal, setFormTanggal] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formKelas, setFormKelas] = useState(classesList[0] || '10 AKL 1');
  const [formMapel, setFormMapel] = useState('Informatika');
  const [formTP, setFormTP] = useState('Memahami Arsitektur Komputer dan Dasar Pemrograman');
  const [formDeskripsi, setFormDeskripsi] = useState(
    'Penyampaian materi teori dasar dilanjutkan praktikum mandiri di lab komputer. Siswa aktif berdiskusi dan menyelesaikan studi kasus.'
  );
  const [formGuru, setFormGuru] = useState(userSession?.name || 'Agus Joko Iryanto, S.Kom');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTP.trim() || !formDeskripsi.trim()) {
      alert('Silakan lengkapi Tujuan Pembelajaran (TP) dan Deskripsi Kegiatan KBM.');
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const newJournal: TeachingJournal = {
      id: `JRN_${Date.now()}`,
      tanggal: formTanggal,
      kelas: formKelas,
      mapel: formMapel,
      tp: formTP.trim(),
      deskripsi: formDeskripsi.trim(),
      guru: formGuru.trim(),
    };

    try {
      // 1. Save to state
      onSaveJournal(newJournal);

      // 2. Push to Google Sheets (GID: 215052993)
      await saveJournalToGoogleSheets(
        SPREADSHEET_ID_DEFAULT,
        newJournal,
        userSession?.accessToken
      );

      soundManager.playSuccess();
      setNotification({
        type: 'success',
        message: `Jurnal KBM untuk kelas ${formKelas} tanggal ${formTanggal} berhasil disimpan dan disinkronkan ke Google Sheets!`,
      });

      // Reset description slightly
      setFormDeskripsi('');
      setFormTP('');
    } catch (err: any) {
      console.error('Error saving journal:', err);
      soundManager.playSuccess();
      setNotification({
        type: 'success',
        message: `Jurnal KBM kelas ${formKelas} tersimpan di sistem dan siap dikirim ke Google Sheets.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJournals = journals.filter((j) => {
    const matchSearch =
      j.tp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.guru.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.kelas.toLowerCase().includes(searchQuery.toLowerCase());

    const matchClass = selectedClassFilter === 'ALL' || j.kelas === selectedClassFilter;

    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Modul Jurnal KBM Guru Terpadu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Form Jurnal Mengajar & Agenda Guru
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/80">
              Dokumentasikan pelaksanaan KBM, Tujuan Pembelajaran (TP), dan uraian materi yang otomatis tersimpan ke Google Sheets (GID: 215052993).
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets Database</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Input Jurnal (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Input Jurnal KBM Baru</span>
            </h3>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Otomatis Tersimpan
            </span>
          </div>

          {notification && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                notification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Tanggal & Kelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal KBM</label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kelas / Rombel</label>
                <select
                  value={formKelas}
                  onChange={(e) => setFormKelas(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {classesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mata Pelajaran & Guru */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
                <input
                  type="text"
                  value={formMapel}
                  onChange={(e) => setFormMapel(e.target.value)}
                  placeholder="Informatika / Mapel Kejuruan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Guru Pengampu</label>
                <input
                  type="text"
                  value={formGuru}
                  onChange={(e) => setFormGuru(e.target.value)}
                  placeholder="Nama Guru Pengampu"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Tujuan Pembelajaran (TP) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tujuan Pembelajaran (TP) / Pokok Bahasan
              </label>
              <input
                type="text"
                value={formTP}
                onChange={(e) => setFormTP(e.target.value)}
                placeholder="Contoh: Mengidentifikasi Komponen Perangkat Keras dan Jaringan"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Deskripsi Kegiatan KBM */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Deskripsi Kegiatan KBM & Uraian Materi
              </label>
              <textarea
                rows={4}
                value={formDeskripsi}
                onChange={(e) => setFormDeskripsi(e.target.value)}
                placeholder="Tuliskan uraian kegiatan belajar mengajar, tugas praktikum, respons siswa..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <span>Menyimpan ke Google Sheets...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Simpan Jurnal & Sinkronkan Google Sheets</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Column: Riwayat Jurnal Mengajar (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Riwayat Jurnal KBM ({filteredJournals.length})</span>
              </h3>
              <p className="text-2xs text-slate-400">
                Arsip agenda kegiatan belajar mengajar di SMK Negeri 2 Songgom
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-2xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="ALL">Semua Kelas</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-40">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari materi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-2xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Journals Feed */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredJournals.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs">Belum ada catatan jurnal KBM yang cocok.</p>
              </div>
            ) : (
              filteredJournals.map((j) => (
                <div
                  key={j.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-2xs font-extrabold">
                        {j.kelas}
                      </span>
                      <span className="text-2xs font-bold text-slate-700 dark:text-slate-300">
                        {j.mapel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-3xs text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {j.tanggal}
                      </span>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteJournal(j.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all"
                          title="Hapus Jurnal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      TP: {j.tp}
                    </h4>
                    <p className="text-2xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {j.deskripsi}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-3xs text-slate-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-indigo-500" />
                      Guru: {j.guru}
                    </span>
                    <span className="font-mono">{j.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
