import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  Search,
  FileSpreadsheet,
  Download,
  TrendingUp,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Filter,
  Users,
} from 'lucide-react';
import { StudentGrade, SchoolProfile, Student, SchoolClass } from '../types/school';
import { UserSession } from '../types/auth';
import { saveGradesToGoogleSheets, SPREADSHEET_ID_DEFAULT } from '../utils/googleSheetsApi';
import { soundManager } from '../utils/sound';

interface GradesViewProps {
  grades: StudentGrade[];
  students: Student[];
  profile: SchoolProfile;
  classes?: SchoolClass[];
  userSession?: UserSession | null;
  onSaveGrade: (grade: StudentGrade) => void;
  onSaveBatchGrades?: (grades: StudentGrade[]) => void;
  onDeleteGrade: (id: string) => void;
  onOpenSyncModal: () => void;
  isAdmin?: boolean;
}

export const GradesView: React.FC<GradesViewProps> = ({
  grades,
  students,
  profile,
  classes = [],
  userSession,
  onSaveGrade,
  onSaveBatchGrades,
  onDeleteGrade,
  onOpenSyncModal,
  isAdmin = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<StudentGrade | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Extract unique classes directly from Sheet 'kelas' or students
  const classesList = useMemo(() => {
    if (classes && classes.length > 0) {
      return classes.map((c) => c.nama);
    }
    const set = new Set(students.map((s) => s.kelas).filter(Boolean));
    return Array.from(set).sort();
  }, [classes, students]);

  // Form fields
  const [formStudentId, setFormStudentId] = useState(students[0]?.id || '');
  const [formKelas, setFormKelas] = useState(classesList[0] || '10 AKL 1');
  const [formMapel, setFormMapel] = useState('Informatika');
  const [formTP, setFormTP] = useState('Menggeneralisasi sifat-sifat Eksponen & Logaritma');
  const [formJenis, setFormJenis] = useState<'Ulangan' | 'Tugas' | 'UTS' | 'UAS' | 'Praktik UKK'>('Ulangan');
  const [formTugas, setFormTugas] = useState<number>(85);
  const [formUTS, setFormUTS] = useState<number>(85);
  const [formUAS, setFormUAS] = useState<number>(88);
  const [formUKK, setFormUKK] = useState<number>(90);

  // Batch grades state: studentId -> score
  const [batchScores, setBatchScores] = useState<Record<string, number>>({});

  const classStudents = useMemo(() => {
    return students.filter((s) => s.kelas === formKelas);
  }, [students, formKelas]);

  // Initialize batch scores
  React.useEffect(() => {
    const init: Record<string, number> = {};
    classStudents.forEach((s) => {
      init[s.id] = 85;
    });
    setBatchScores(init);
  }, [formKelas, classStudents]);

  const filtered = grades.filter((g) => {
    const matchSearch =
      g.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.nisn.includes(searchQuery) ||
      g.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = selectedClassFilter === 'ALL' || g.kelas === selectedClassFilter;
    return matchSearch && matchClass;
  });

  const calculateFinal = (t: number, uts: number, uas: number, ukk: number) => {
    const final = t * 0.2 + uts * 0.2 + uas * 0.2 + ukk * 0.4;
    return parseFloat(final.toFixed(1));
  };

  const getPredicate = (final: number): 'A' | 'B' | 'C' | 'D' => {
    if (final >= 90) return 'A';
    if (final >= 80) return 'B';
    if (final >= 70) return 'C';
    return 'D';
  };

  const handleOpenAdd = () => {
    setEditingGrade(null);
    setIsBatchMode(false);
    setFormStudentId(students[0]?.id || '');
    setFormMapel('Informatika');
    setFormTP('Menggeneralisasi sifat-sifat Eksponen');
    setFormJenis('Ulangan');
    setFormTugas(85);
    setFormUTS(85);
    setFormUAS(88);
    setFormUKK(90);
    setIsFormOpen(true);
  };

  const handleOpenBatch = () => {
    setIsBatchMode(true);
    setEditingGrade(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (g: StudentGrade) => {
    setEditingGrade(g);
    setIsBatchMode(false);
    setFormStudentId(g.studentId);
    setFormMapel(g.mataPelajaran);
    setFormTP(g.tp || 'Tujuan Pembelajaran');
    setFormJenis((g.jenis as any) || 'Ulangan');
    setFormTugas(g.nilaiTugas);
    setFormUTS(g.nilaiUTS);
    setFormUAS(g.nilaiUAS);
    setFormUKK(g.nilaiPraktikUKK);
    setIsFormOpen(true);
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formStudentId) || students[0];
    if (!st) return;

    setIsSyncingSheets(true);
    setNotification(null);

    const finalVal = calculateFinal(Number(formTugas), Number(formUTS), Number(formUAS), Number(formUKK));
    const pred = getPredicate(finalVal);

    const newGrade: StudentGrade = {
      id: editingGrade ? editingGrade.id : `NIL_${st.kelas.replace(/\s+/g, '_')}_${formMapel}_${formJenis}_${st.nis}_${Date.now()}`,
      studentId: st.id,
      nisn: st.nisn,
      namaSiswa: st.nama,
      kelas: st.kelas,
      mataPelajaran: formMapel,
      tp: formTP,
      jenis: formJenis,
      nilaiTugas: Number(formTugas),
      nilaiUTS: Number(formUTS),
      nilaiUAS: Number(formUAS),
      nilaiPraktikUKK: Number(formUKK),
      nilaiAkhir: finalVal,
      predikat: pred,
    };

    onSaveGrade(newGrade);

    try {
      await saveGradesToGoogleSheets(
        SPREADSHEET_ID_DEFAULT,
        [newGrade],
        userSession?.accessToken
      );
      soundManager.playSuccess();
      setNotification({
        type: 'success',
        message: `Nilai siswa ${st.nama} berhasil disimpan dan disinkronkan ke Google Sheets (GID: 626678318)!`,
      });
    } catch (err: any) {
      console.warn('Sheets auto-sync fallback:', err);
      soundManager.playSuccess();
      setNotification({
        type: 'success',
        message: `Nilai siswa tersimpan di sistem. Data siap disinkronkan ke Google Sheets.`,
      });
    } finally {
      setIsSyncingSheets(false);
      setIsFormOpen(false);
    }
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (classStudents.length === 0) return;

    setIsSyncingSheets(true);
    setNotification(null);

    const newGradesList: StudentGrade[] = classStudents.map((st) => {
      const score = Number(batchScores[st.id]) || 85;
      const pred = getPredicate(score);
      return {
        id: `NIL_${st.kelas.replace(/\s+/g, '_')}_${formMapel}_${formJenis}_${st.nis}_${Date.now()}`,
        studentId: st.id,
        nisn: st.nisn,
        namaSiswa: st.nama,
        kelas: st.kelas,
        mataPelajaran: formMapel,
        tp: formTP,
        jenis: formJenis,
        nilaiTugas: score,
        nilaiUTS: score,
        nilaiUAS: score,
        nilaiPraktikUKK: score,
        nilaiAkhir: score,
        predikat: pred,
      };
    });

    if (onSaveBatchGrades) {
      onSaveBatchGrades(newGradesList);
    } else {
      newGradesList.forEach((g) => onSaveGrade(g));
    }

    try {
      await saveGradesToGoogleSheets(
        SPREADSHEET_ID_DEFAULT,
        newGradesList,
        userSession?.accessToken
      );
      soundManager.playSuccess();
      setNotification({
        type: 'success',
        message: `Berhasil menyimpan nilai untuk ${newGradesList.length} siswa kelas ${formKelas} ke Google Sheets!`,
      });
    } catch (err: any) {
      console.warn('Sheets sync error:', err);
      soundManager.playSuccess();
      setNotification({
        type: 'success',
        message: `Nilai kelas ${formKelas} tersimpan di sistem.`,
      });
    } finally {
      setIsSyncingSheets(false);
      setIsFormOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Buku Nilai & Asesmen Kurikulum Merdeka</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Form Penilaian & Asesmen Siswa
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80">
              Input nilai tugas, ulangan harian, UTS, UAS, dan UKK kejuruan yang langsung tersimpan otomatis ke Google Sheets (GID: 626678318).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenBatch}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Input Nilai 1 Kelas</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Input Nilai Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari siswa, NISN, atau mata pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="ALL">Semua Kelas ({classesList.length})</option>
            {classesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={onOpenSyncModal}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sync Sheets</span>
          </button>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[180px]">Nama Siswa</th>
                <th className="py-3 px-4 min-w-[110px]">Kelas</th>
                <th className="py-3 px-4 min-w-[180px]">Mata Pelajaran & TP</th>
                <th className="py-3 px-3 text-center">Tugas</th>
                <th className="py-3 px-3 text-center">UTS</th>
                <th className="py-3 px-3 text-center">UAS</th>
                <th className="py-3 px-3 text-center">UKK</th>
                <th className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">Nilai Akhir</th>
                <th className="py-3 px-3 text-center">Predikat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ada data nilai yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {g.namaSiswa}
                      <span className="block text-3xs text-slate-400 font-mono font-normal">NISN: {g.nisn}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-2xs">
                        {g.kelas}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {g.mataPelajaran}
                      {g.tp && <span className="block text-3xs text-slate-400 font-normal truncate max-w-xs">{g.tp}</span>}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{g.nilaiTugas}</td>
                    <td className="py-3 px-3 text-center font-mono">{g.nilaiUTS}</td>
                    <td className="py-3 px-3 text-center font-mono">{g.nilaiUAS}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{g.nilaiPraktikUKK}</td>
                    <td className="py-3 px-3 text-center font-mono font-extrabold text-sm text-slate-900 dark:text-white">{g.nilaiAkhir}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-2xs font-extrabold ${
                          g.predikat === 'A'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : g.predikat === 'B'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {g.predikat}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
                          title="Edit Nilai"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => onDeleteGrade(g.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all"
                            title="Hapus Nilai"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form: Single or Batch Input */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>{isBatchMode ? `Input Nilai 1 Rombel (${formKelas})` : editingGrade ? 'Edit Nilai Siswa' : 'Input Nilai Siswa Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {isBatchMode ? (
              /* Batch Grading Form */
              <form onSubmit={handleSubmitBatch} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Kelas</label>
                    <select
                      value={formKelas}
                      onChange={(e) => setFormKelas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {classesList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
                    <input
                      type="text"
                      value={formMapel}
                      onChange={(e) => setFormMapel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jenis Asesmen</label>
                    <select
                      value={formJenis}
                      onChange={(e) => setFormJenis(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Ulangan">Ulangan Harian</option>
                      <option value="Tugas">Tugas Portofolio</option>
                      <option value="UTS">UTS / Sumatif Tengah</option>
                      <option value="UAS">UAS / Sumatif Akhir</option>
                      <option value="Praktik UKK">Ujian Kompetensi Keahlian (UKK)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tujuan Pembelajaran (TP)</label>
                  <input
                    type="text"
                    value={formTP}
                    onChange={(e) => setFormTP(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* List of students with score inputs */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {classStudents.map((st, idx) => (
                    <div key={st.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-2xs">{idx + 1}.</span>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{st.nama}</span>
                          <span className="block text-3xs text-slate-400 font-mono">NIS: {st.nis}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={batchScores[st.id] ?? 85}
                          onChange={(e) =>
                            setBatchScores({ ...batchScores, [st.id]: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono font-bold text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSyncingSheets}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Simpan Nilai 1 Rombel & Sinkron Google Sheets</span>
                </button>
              </form>
            ) : (
              /* Single Student Grade Form */
              <form onSubmit={handleSubmitSingle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Siswa</label>
                    <select
                      value={formStudentId}
                      onChange={(e) => setFormStudentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nama} ({s.kelas} - {s.nis})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
                    <input
                      type="text"
                      value={formMapel}
                      onChange={(e) => setFormMapel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400">Tugas (20%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formTugas}
                      onChange={(e) => setFormTugas(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400">UTS (20%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formUTS}
                      onChange={(e) => setFormUTS(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400">UAS (20%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formUAS}
                      onChange={(e) => setFormUAS(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-emerald-600">Praktik UKK (40%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formUKK}
                      onChange={(e) => setFormUKK(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-center font-mono font-bold text-emerald-700 dark:text-emerald-300"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold">
                  <span>Prediksi Nilai Akhir:</span>
                  <span className="text-emerald-600 font-mono text-sm">
                    {calculateFinal(Number(formTugas), Number(formUTS), Number(formUAS), Number(formUKK))} (Predikat: {getPredicate(calculateFinal(Number(formTugas), Number(formUTS), Number(formUAS), Number(formUKK)))})
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSyncingSheets}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Simpan Nilai & Sinkron Google Sheets</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
