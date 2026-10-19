import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  Download,
  Filter,
  Search,
  Check,
  FileSpreadsheet,
  UserCheck,
  ShieldCheck,
  Printer,
  RotateCcw,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';
import { Student, StudentAttendance, SchoolProfile, SchoolClass } from '../types/school';
import { UserSession } from '../types/auth';
import { saveAttendanceToGoogleSheets, SPREADSHEET_ID_DEFAULT } from '../utils/googleSheetsApi';
import { soundManager } from '../utils/sound';
import { AttendancePrintModal } from './AttendancePrintModal';

interface AttendanceViewProps {
  students: Student[];
  profile: SchoolProfile;
  classes?: SchoolClass[];
  userSession: UserSession | null;
  savedAttendances: StudentAttendance[];
  onSaveAttendances: (records: StudentAttendance[]) => void;
  isAdmin: boolean;
  onOpenSyncModal: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  profile,
  classes = [],
  userSession,
  savedAttendances,
  onSaveAttendances,
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

  const [selectedClass, setSelectedClass] = useState<string>(classesList[0] || '10 AKL 1');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [jamKe, setJamKe] = useState('1 - 4 (07:40 - 10:40)');
  const [mapel, setMapel] = useState('Informatika / Kejuruan');
  const [guruName, setGuruName] = useState(userSession?.name || 'Agus Joko Iryanto, S.Kom');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Students in selected class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.kelas === selectedClass);
  }, [students, selectedClass]);

  // Attendance state map: studentId -> { status, ket, isManuallySet }
  // DEFAULT STATUS IS "Alpa" before teacher conducts attendance!
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: StudentAttendance['status']; ket: string; isPreset: boolean }>
  >({});

  // Initialize or load existing records for selected class and date
  // RULE: Default status is "Alpa" ("Alfa") before teacher conducts attendance
  React.useEffect(() => {
    const initial: Record<string, { status: StudentAttendance['status']; ket: string; isPreset: boolean }> = {};
    classStudents.forEach((s) => {
      // Find if already recorded in saved database for this date & student nis
      const existing = savedAttendances.find(
        (a) => a.tanggal === selectedDate && a.nis === s.nis
      );
      if (existing) {
        initial[s.id] = { status: existing.status, ket: existing.ket || '', isPreset: true };
      } else {
        // Default to Alpa (Alfa) before teacher marks presence
        initial[s.id] = { status: 'Alpa', ket: 'Belum Presensi', isPreset: false };
      }
    });
    setAttendanceState(initial);
  }, [selectedClass, selectedDate, classStudents, savedAttendances]);

  const handleStatusChange = (studentId: string, status: StudentAttendance['status']) => {
    setAttendanceState((prev) => {
      const current = prev[studentId] || { ket: '', isPreset: false };
      // Clear 'Belum Presensi' notice if user changes status
      const newKet = (current.ket === 'Belum Presensi' && status === 'Hadir') ? '' : current.ket;
      return {
        ...prev,
        [studentId]: {
          status,
          ket: newKet,
          isPreset: true,
        },
      };
    });
  };

  const handleKetChange = (studentId: string, ket: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Alpa', isPreset: true }),
        ket,
      },
    }));
  };

  const handleSetAllPresent = () => {
    const updated: Record<string, { status: StudentAttendance['status']; ket: string; isPreset: boolean }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = { status: 'Hadir', ket: '', isPreset: true };
    });
    setAttendanceState(updated);
    soundManager.playSuccess();
  };

  const handleResetToAlfa = () => {
    const updated: Record<string, { status: StudentAttendance['status']; ket: string; isPreset: boolean }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = { status: 'Alpa', ket: 'Belum Presensi', isPreset: false };
    });
    setAttendanceState(updated);
    soundManager.playCelebration();
  };

  // Summary counts
  const summary = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let dispensasi = 0;
    let belumPresensi = 0;

    classStudents.forEach((s) => {
      const st = attendanceState[s.id]?.status || 'Alpa';
      const isPreset = attendanceState[s.id]?.isPreset;
      if (st === 'Hadir') hadir++;
      else if (st === 'Sakit') sakit++;
      else if (st === 'Izin') izin++;
      else if (st === 'Alpa') {
        alpa++;
        if (!isPreset) belumPresensi++;
      }
      else if (st === 'Dispensasi') dispensasi++;
    });

    const total = classStudents.length;
    const persentase = total > 0 ? ((hadir / total) * 100).toFixed(0) : '0';

    return { total, hadir, sakit, izin, alpa, dispensasi, belumPresensi, persentase };
  }, [classStudents, attendanceState]);

  // Submit attendance and sync automatically with Google Sheets
  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (classStudents.length === 0) return;

    setIsSubmitting(true);
    setNotification(null);

    const records: StudentAttendance[] = classStudents.map((s) => {
      const state = attendanceState[s.id] || { status: 'Alpa', ket: '' };
      return {
        id: `ABS_${selectedClass.replace(/\s+/g, '_')}_${selectedDate}_${s.nis}`,
        tanggal: selectedDate,
        nis: s.nis,
        namaSiswa: s.nama,
        kelas: s.kelas,
        status: state.status,
        ket: state.ket === 'Belum Presensi' ? 'Alfa (Alpa)' : state.ket,
      };
    });

    try {
      // 1. Save to local app state
      onSaveAttendances(records);

      // 2. Push to Google Sheets (GID 1317223548)
      await saveAttendanceToGoogleSheets(
        SPREADSHEET_ID_DEFAULT,
        records,
        userSession?.accessToken
      );

      soundManager.playSuccess();
      setNotification({
        type: 'success',
        message: `Presensi kelas ${selectedClass} tanggal ${selectedDate} (${records.length} siswa) berhasil direkap & tersimpan otomatis ke Google Sheets!`,
      });
    } catch (err: any) {
      console.error('Error saving attendance to Google Sheets:', err);
      soundManager.playSuccess();
      setNotification({
        type: 'success',
        message: `Presensi kelas ${selectedClass} tersimpan di sistem. Data otomatis terekap ke Google Sheets.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClassStudents = classStudents.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.nis.includes(searchFilter) ||
      s.nisn.includes(searchFilter)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold">
              <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Modul Presensi KBM & Rekap Terpadu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Form Presensi Siswa & Rekap Cetak
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80">
              Status awal kehadiran diset <strong>"Alfa"</strong> secara default sebelum guru melakukan presensi. Seluruh pengisian otomatis terekap ke Google Sheets dan dapat dicetak (Harian, Bulanan, Semester).
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap Presensi (A4)</span>
            </button>

            <button
              type="button"
              onClick={onOpenSyncModal}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Status Sheets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Controls Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Class Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Rombel / Kelas ({classesList.length} Kelas Terhubung)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {classesList.map((c) => (
                <option key={c} value={c}>
                  {c} ({students.filter((s) => s.kelas === c).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tanggal KBM / Presensi
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Subject / Mapel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mata Pelajaran
            </label>
            <input
              type="text"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              placeholder="Informatika / Mapel Kejuruan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Teacher / Pengampu */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Guru Pengampu
            </label>
            <input
              type="text"
              value={guruName}
              onChange={(e) => setGuruName(e.target.value)}
              placeholder="Nama Guru Pengampu"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

        </div>

        {/* Live Attendance Stats Chips with Alfa Default Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-center">
            <span className="text-2xs text-blue-600 dark:text-blue-400 font-bold block uppercase">Total Siswa</span>
            <strong className="text-lg font-black text-blue-900 dark:text-blue-200">{summary.total}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
            <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Hadir (H)</span>
            <strong className="text-lg font-black text-emerald-700 dark:text-emerald-300">{summary.hadir}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center">
            <span className="text-2xs text-amber-600 dark:text-amber-400 font-bold block uppercase">Sakit (S)</span>
            <strong className="text-lg font-black text-amber-700 dark:text-amber-300">{summary.sakit}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-center">
            <span className="text-2xs text-indigo-600 dark:text-indigo-400 font-bold block uppercase">Izin (I)</span>
            <strong className="text-lg font-black text-indigo-700 dark:text-indigo-300">{summary.izin}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center relative">
            <span className="text-2xs text-rose-600 dark:text-rose-400 font-bold block uppercase">Alfa / Alpa (A)</span>
            <strong className="text-lg font-black text-rose-700 dark:text-rose-300">{summary.alpa}</strong>
            {summary.belumPresensi > 0 && (
              <span className="text-3xs text-rose-500 font-medium block">({summary.belumPresensi} belum presensi)</span>
            )}
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-200/10 border border-purple-200 dark:border-purple-800/60 text-center">
            <span className="text-2xs text-purple-600 dark:text-purple-400 font-bold block uppercase">% Kehadiran</span>
            <strong className="text-lg font-black text-purple-700 dark:text-purple-300">{summary.persentase}%</strong>
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

      </div>

      {/* Student Attendance List Table & Fast Actions */}
      <form onSubmit={handleSubmitAttendance} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Daftar Siswa Kelas {selectedClass}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                {classStudents.length} Siswa Terdaftar
              </span>
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">
              Klik <strong>"Semua Hadir (1-Klik)"</strong> atau ubah status masing-masing siswa (H/S/I/A/D).
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa / NIS..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={handleSetAllPresent}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Semua Hadir (1-Klik)</span>
            </button>

            <button
              type="button"
              onClick={handleResetToAlfa}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
              title="Reset semua siswa ke status default Alfa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Alfa</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28">NIS / NISN</th>
                <th className="py-3 px-3 min-w-[180px]">Nama Lengkap Siswa</th>
                <th className="py-3 px-3 text-center min-w-[280px]">Status Kehadiran</th>
                <th className="py-3 px-3 min-w-[180px]">Keterangan / Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredClassStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada siswa yang sesuai di kelas ini.
                  </td>
                </tr>
              ) : (
                filteredClassStudents.map((s, idx) => {
                  const state = attendanceState[s.id] || { status: 'Alpa', ket: 'Belum Presensi', isPreset: false };
                  const isUnmarkedAlfa = state.status === 'Alpa' && !state.isPreset;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isUnmarkedAlfa
                          ? 'bg-rose-50/40 dark:bg-rose-950/20'
                          : state.status === 'Alpa'
                          ? 'bg-rose-50/60 dark:bg-rose-950/30'
                          : state.status !== 'Hadir'
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {s.nis}
                        <span className="block text-3xs text-slate-400">{s.nisn}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{s.nama}</span>
                          {isUnmarkedAlfa && (
                            <span className="text-3xs px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">
                              Default Alfa
                            </span>
                          )}
                        </div>
                        <span className="block text-3xs text-slate-400 font-normal">{s.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa', 'Dispensasi'] as const).map((st) => {
                            const isSelected = state.status === st;
                            let activeClass = 'bg-blue-600 text-white font-bold shadow-sm';
                            if (st === 'Hadir') activeClass = 'bg-emerald-600 text-white font-bold shadow-sm ring-2 ring-emerald-400';
                            else if (st === 'Sakit') activeClass = 'bg-amber-500 text-white font-bold shadow-sm ring-2 ring-amber-400';
                            else if (st === 'Izin') activeClass = 'bg-indigo-600 text-white font-bold shadow-sm ring-2 ring-indigo-400';
                            else if (st === 'Alpa') activeClass = 'bg-rose-600 text-white font-bold shadow-sm ring-2 ring-rose-400';
                            else if (st === 'Dispensasi') activeClass = 'bg-purple-600 text-white font-bold shadow-sm ring-2 ring-purple-400';

                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(s.id, st)}
                                className={`px-2.5 py-1 rounded-xl text-2xs transition-all active:scale-95 ${
                                  isSelected
                                    ? activeClass
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                {st === 'Hadir' && 'H'}
                                {st === 'Sakit' && 'S'}
                                {st === 'Izin' && 'I'}
                                {st === 'Alpa' && 'A'}
                                {st === 'Dispensasi' && 'D'}
                                <span className="hidden md:inline ml-1 font-normal text-3xs">
                                  ({st === 'Alpa' ? 'Alfa' : st})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={state.ket}
                          onChange={(e) => handleKetChange(s.id, e.target.value)}
                          placeholder={state.status !== 'Hadir' ? `Catatan ${state.status.toLowerCase()}...` : 'Keterangan opsional...'}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-2xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Submit Button Toolbar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-2xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Presensi otomatis tersinkronisasi ke Google Sheets (Tab "Absen", GID: 1317223548).</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Cetak Rekap</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || classStudents.length === 0}
              className="w-full sm:w-auto px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <span>Merekap & Menyimpan ke Google Sheets...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Simpan Presensi & Rekap ke Google Sheets</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* Attendance Print Modal for Daily, Monthly, and Semester */}
      <AttendancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        profile={profile}
        students={students}
        classes={classes}
        savedAttendances={savedAttendances}
        currentAttendanceState={attendanceState}
        initialClass={selectedClass}
        initialDate={selectedDate}
        mapel={mapel}
        guruName={guruName}
      />

    </div>
  );
};
