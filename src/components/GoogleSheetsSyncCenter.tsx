import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  Download,
  Upload,
  ExternalLink,
  Code,
  Sparkles,
  RefreshCw,
  Table,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Shield,
  ShieldCheck,
  User,
  ArrowDownCircle,
  ArrowUpCircle,
  Link2,
} from 'lucide-react';
import {
  SchoolProfile,
  SchoolClass,
  Teacher,
  Student,
  LessonSchedule,
  StudentGrade,
} from '../types/school';
import { UserSession } from '../types/auth';
import {
  generateProfileCsv,
  parseProfileCsv,
  generateTeachersCsv,
  generateStudentsCsv,
  generateSchedulesCsv,
  generateGradesCsv,
  SchoolSyncSettings,
} from '../utils/schoolStorage';
import {
  fetchSpreadsheetMetadata,
  fetchSheetRangeValues,
  updateSheetRangeValues,
  fetchAllGoogleSheetsTabs,
  parseProfileRows,
  parseTeachersRows,
  parseStudentsRows,
  parseSchedulesRows,
  parseGradesRows,
} from '../utils/googleSheetsApi';
import { soundManager } from '../utils/sound';

interface GoogleSheetsSyncCenterProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SchoolProfile;
  onUpdateProfile: (profile: SchoolProfile) => void;
  classes?: SchoolClass[];
  onUpdateClasses?: (classes: SchoolClass[]) => void;
  teachers: Teacher[];
  onUpdateTeachers?: (teachers: Teacher[]) => void;
  students: Student[];
  onUpdateStudents?: (students: Student[]) => void;
  schedules: LessonSchedule[];
  onUpdateSchedules?: (schedules: LessonSchedule[]) => void;
  grades: StudentGrade[];
  onUpdateGrades?: (grades: StudentGrade[]) => void;
  settings: SchoolSyncSettings;
  onUpdateSettings: (settings: SchoolSyncSettings) => void;
  userSession: UserSession | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
}

export const GoogleSheetsSyncCenter: React.FC<GoogleSheetsSyncCenterProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  classes = [],
  onUpdateClasses,
  teachers,
  onUpdateTeachers,
  students,
  onUpdateStudents,
  schedules,
  onUpdateSchedules,
  grades,
  onUpdateGrades,
  settings,
  onUpdateSettings,
  userSession,
  onLoginGoogle,
  onLogoutGoogle,
}) => {
  const [activeSheetTab, setActiveSheetTab] = useState<'api_direct' | 'profile' | 'teachers' | 'students' | 'schedules' | 'grades' | 'cbt_exam_schema' | 'webhook'>('api_direct');
  const [copied, setCopied] = useState<string | null>(null);
  const [pasteInput, setPasteInput] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>(settings.webhookUrl);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('1hpH6qjMBIC_HsiK-gYFWu_mXdGHSrP00YW_G13ATFHA');
  const [sheetRange, setSheetRange] = useState<string>('A1:Z50');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [detectedSheets, setDetectedSheets] = useState<{ title: string; sheetId: number }[]>([]);
  const [selectedSheetTitle, setSelectedSheetTitle] = useState<string>('');

  if (!isOpen) return null;

  const profileCsv = generateProfileCsv(profile);
  const teachersCsv = generateTeachersCsv(teachers);
  const studentsCsv = generateStudentsCsv(students);
  const schedulesCsv = generateSchedulesCsv(schedules);
  const gradesCsv = generateGradesCsv(grades);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    soundManager.playSuccess();
    setTimeout(() => setCopied(null), 3000);
  };

  const handleDownloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundManager.playSuccess();
  };

  const handleApplyPasteProfile = () => {
    if (!pasteInput.trim()) {
      setImportStatus({ type: 'error', message: 'Tempelkan teks baris Google Sheets terlebih dahulu.' });
      return;
    }

    const parsed = parseProfileCsv(pasteInput.trim());
    if (parsed) {
      onUpdateProfile(parsed);
      setImportStatus({
        type: 'success',
        message: `Berhasil memperbarui data profil "${parsed.nama_sekolah}" dari Google Sheets!`,
      });
      soundManager.playSuccess();
      setPasteInput('');
    } else {
      setImportStatus({
        type: 'error',
        message: 'Format data tidak sesuai. Pastikan format kolom: id,logo,nama_sekolah,alamat,kepsek,nip_kepsek,guru,nip_guru',
      });
    }
  };

  /**
   * Direct API: Fetch Live Data from User's Google Sheet
   */
  const handleFetchFromGoogleSheets = async () => {
    setIsSyncing(true);
    setImportStatus({ type: 'info', message: 'Menghubungkan & menyinkronkan seluruh tab Google Sheets...' });

    try {
      const token = userSession?.accessToken;
      
      // Fetch comprehensive tabs from the Google Sheets database
      const allData = await fetchAllGoogleSheetsTabs(spreadsheetId.trim(), token);

      let updatedCount = 0;

      if (allData.profile) {
        onUpdateProfile({
          ...profile,
          ...allData.profile,
        });
        updatedCount++;
      }

      if (allData.classes && allData.classes.length > 0 && onUpdateClasses) {
        onUpdateClasses(allData.classes);
        updatedCount += allData.classes.length;
      }

      if (allData.teachers && allData.teachers.length > 0 && onUpdateTeachers) {
        onUpdateTeachers(allData.teachers);
        updatedCount += allData.teachers.length;
      }

      if (allData.students && allData.students.length > 0 && onUpdateStudents) {
        onUpdateStudents(allData.students);
        updatedCount += allData.students.length;
      }

      if (allData.schedules && allData.schedules.length > 0 && onUpdateSchedules) {
        onUpdateSchedules(allData.schedules);
      }

      setImportStatus({
        type: 'success',
        message: `Sinkronisasi Sukses! Berhasil memuat ${allData.classes?.length || 0} Data Rombel Kelas, ${allData.teachers?.length || 0} Data Guru & ${allData.students?.length || 0} Data Siswa dari Google Sheets.`,
      });
      soundManager.playSuccess();
    } catch (err: any) {
      console.error('Google Sheets Fetch Error:', err);
      setImportStatus({
        type: 'error',
        message: `Gagal membaca Google Sheets: ${err.message || 'Pastikan izin akses diberikan atau login dengan Google.'}`,
      });
      soundManager.playCelebration();
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Direct API: Push / Upload Current App State to User's Google Sheet
   */
  const handlePushToGoogleSheets = async () => {
    if (!userSession?.accessToken || userSession.accessToken.startsWith('dev-') || userSession.accessToken.startsWith('local-')) {
      setImportStatus({
        type: 'error',
        message: 'Diperlukan autentikasi Google asli untuk menulis ke Google Sheets. Silakan klik tombol "Login Google" di kanan atas.',
      });
      return;
    }

    if (userSession.role !== 'admin') {
      setImportStatus({ type: 'error', message: 'Akses Ditolak: Hanya pengguna dengan peran "Admin" yang dapat menulis ke Google Sheets.' });
      return;
    }

    setIsSyncing(true);
    setImportStatus({ type: 'info', message: 'Mengirim data ke Google Sheets...' });

    try {
      // Prepare 2D array matching exact schema: id,logo,nama_sekolah,alamat,kepsek,nip_kepsek,guru,nip_guru
      const values = [
        ['id', 'logo', 'nama_sekolah', 'alamat', 'kepsek', 'nip_kepsek', 'guru', 'nip_guru'],
        [
          profile.id,
          profile.logo,
          profile.nama_sekolah,
          profile.alamat,
          profile.kepsek,
          profile.nip_kepsek,
          profile.guru,
          profile.nip_guru,
        ],
      ];

      const targetRange = selectedSheetTitle ? `'${selectedSheetTitle}'!A1:H2` : 'A1:H2';
      await updateSheetRangeValues(spreadsheetId.trim(), targetRange, values, userSession.accessToken);

      setImportStatus({
        type: 'success',
        message: `Berhasil menulis data profil ${profile.nama_sekolah} ke Google Sheets!`,
      });
      soundManager.playSuccess();
    } catch (err: any) {
      console.error('Google Sheets Push Error:', err);
      setImportStatus({
        type: 'error',
        message: `Gagal menulis ke Google Sheets: ${err.message || 'Periksa izin tulis spreadsheet.'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveWebhook = () => {
    onUpdateSettings({
      ...settings,
      webhookUrl: webhookUrl.trim(),
    });
    setImportStatus({ type: 'success', message: 'Pengaturan Webhook Google Sheets berhasil disimpan!' });
    soundManager.playSuccess();
  };

  const appsScriptCode = `// Google Apps Script untuk SMK Negeri 2 Songgom
// Pasang script ini di Google Sheets -> Ekstensi -> Apps Script -> Deploy sebagai Web App
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Simpan data profil sekolah
    if (data.profile) {
      var p = data.profile;
      sheet.getRange(1, 1, 1, 8).setValues([[
        "id", "logo", "nama_sekolah", "alamat", "kepsek", "nip_kepsek", "guru", "nip_guru"
      ]]);
      sheet.getRange(2, 1, 1, 8).setValues([[
        p.id, p.logo, p.nama_sekolah, p.alamat, p.kepsek, p.nip_kepsek, p.guru, p.nip_guru
      ]]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Sinkronisasi Berhasil" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-emerald-950/40 via-blue-950/40 to-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Pusat Sinkronisasi Google Sheets & Database Sekolah
              </h3>
              <p className="text-xs text-slate-400">
                Akses Terpadu Google Sheets API &bull; Peran Admin & Guru &bull; {profile.nama_sekolah}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / Role Bar */}
        <div className="px-6 py-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            {userSession ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  Terhubung: <strong className="text-indigo-700 dark:text-indigo-300 font-bold">{userSession.email}</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold ${userSession.role === 'admin' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-white'}`}>
                  Peran: {userSession.role === 'admin' ? 'Administrator (Full Akses)' : 'Guru (Baca & Nilai)'}
                </span>
              </div>
            ) : (
              <span className="text-slate-600 dark:text-slate-400">
                Mode Tamu. Masuk dengan Google untuk membaca & menulis langsung ke spreadsheet Anda.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {userSession ? (
              <button
                onClick={onLogoutGoogle}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold text-2xs flex items-center gap-1 border border-rose-200 dark:border-rose-900"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={onLoginGoogle}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xs flex items-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-3 h-3" />
                <span>Login Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Sheet Category Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-800/40 overflow-x-auto gap-2 py-2">
          {[
            { id: 'api_direct', label: '🚀 Live Sync (Google Sheets API)', count: 'Otomatis' },
            { id: 'profile', label: '1. Profil Sekolah (Data Utama)', count: '1 Baris' },
            { id: 'teachers', label: '2. Data Guru & GTK', count: `${teachers.length} Guru` },
            { id: 'students', label: '3. Data Siswa', count: `${students.length} Siswa` },
            { id: 'schedules', label: '4. Jadwal Pelajaran', count: `${schedules.length} Jadwal` },
            { id: 'grades', label: '5. Nilai & UKK', count: `${grades.length} Nilai` },
            { id: 'cbt_exam_schema', label: '6. CBT Anti-Contek (Database)', count: '4 Sheet' },
            { id: 'webhook', label: '7. Apps Script Webhook', count: 'Alternatif' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSheetTab(tab.id as any);
                setImportStatus(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeSheetTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-2xs opacity-80 font-normal">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Notification / Feedback */}
          {importStatus && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : importStatus.type === 'info'
                  ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {importStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
              {importStatus.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 text-blue-600 animate-spin" />}
              {importStatus.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* TAB 0: LIVE SYNC VIA GOOGLE SHEETS API */}
          {activeSheetTab === 'api_direct' && (
            <div className="space-y-5">
              <div className="bg-linear-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    Koneksi Langsung Spreadsheet Google (OAuth 2.0)
                  </h4>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Menghubungkan langsung ke spreadsheet ID: <code className="bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-600">{spreadsheetId}</code>.
                </p>
              </div>

              {/* Spreadsheet ID & Sheet Selector Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    ID Spreadsheet Google:
                  </label>
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="1hpH6qjMBIC_HsiK-gYFWu_mXdGHSrP00YW_G13ATFHA"
                    className="w-full p-2.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                  <span className="text-2xs text-slate-500">
                    ID dari URL: docs.google.com/spreadsheets/d/<strong>[ID_SPREADSHEET]</strong>/edit
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pilih Lembar (Sheet / Tab):
                  </label>
                  {detectedSheets.length > 0 ? (
                    <select
                      value={selectedSheetTitle}
                      onChange={(e) => setSelectedSheetTitle(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-semibold"
                    >
                      {detectedSheets.map((s) => (
                        <option key={s.sheetId} value={s.title}>
                          {s.title} (ID: {s.sheetId})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={selectedSheetTitle}
                      onChange={(e) => setSelectedSheetTitle(e.target.value)}
                      placeholder="Contoh: Sheet1 atau Profil"
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  )}
                  <span className="text-2xs text-slate-500">
                    Tab aktif di spreadsheet (default lembar pertama).
                  </span>
                </div>
              </div>

              {/* Action Buttons: Pull & Push */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleFetchFromGoogleSheets}
                  disabled={isSyncing}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownCircle className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Tarik Data Terbaru dari Google Sheets</span>
                </button>

                <button
                  onClick={handlePushToGoogleSheets}
                  disabled={isSyncing || !userSession || userSession.role !== 'admin'}
                  className={`py-3 px-4 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                    userSession?.role === 'admin'
                      ? 'bg-blue-600 hover:bg-blue-700 active:scale-98'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                  title={userSession?.role !== 'admin' ? 'Peran Admin diperlukan untuk menulis ke Sheets' : 'Kirim data saat ini ke Sheets'}
                >
                  <ArrowUpCircle className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Kirim & Update ke Google Sheets (Admin)</span>
                </button>
              </div>

              {/* Status and instructions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Struktur Kolom yang Didukung Otomatis:
                </h5>
                <ul className="list-disc list-inside space-y-1 text-2xs">
                  <li><strong>Profil Sekolah:</strong> <code>id, logo, nama_sekolah, alamat, kepsek, nip_kepsek, guru, nip_guru</code></li>
                  <li><strong>Data Guru:</strong> <code>nip, nama, mapel, jabatan, status, telepon, email</code></li>
                  <li><strong>Data Siswa:</strong> <code>nisn, nis, nama, kelas, jurusan, jenis_kelamin, telepon_ortu, alamat</code></li>
                  <li><strong>Jadwal Pelajaran:</strong> <code>hari, jam_ke, waktu_mulai, waktu_selesai, mata_pelajaran, guru_pengampu, kelas, ruang</code></li>
                  <li><strong>Buku Nilai:</strong> <code>nisn, nama_siswa, kelas, mata_pelajaran, nilai_tugas, nilai_uts, nilai_uas, nilai_praktik_ukk, nilai_akhir, predikat</code></li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 1: PROFILE ROW (EXACT USER CSV FORMAT) */}
          {activeSheetTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Format Google Sheets Resmi (Sesuai Skema Data)
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Struktur kolom tabel utama: <code className="bg-emerald-200/50 dark:bg-emerald-900/50 px-1 py-0.5 rounded font-mono font-bold">id,logo,nama_sekolah,alamat,kepsek,nip_kepsek,guru,nip_guru</code>
                </p>
              </div>

              {/* Data Table Preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">id</th>
                        <th className="p-2.5">logo</th>
                        <th className="p-2.5">nama_sekolah</th>
                        <th className="p-2.5">alamat</th>
                        <th className="p-2.5">kepsek</th>
                        <th className="p-2.5">nip_kepsek</th>
                        <th className="p-2.5">guru</th>
                        <th className="p-2.5">nip_guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-mono">
                        <td className="p-2.5 font-bold text-blue-600">{profile.id}</td>
                        <td className="p-2.5 max-w-[120px] truncate text-slate-500" title={profile.logo}>{profile.logo}</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white font-sans">{profile.nama_sekolah}</td>
                        <td className="p-2.5 max-w-[200px] truncate font-sans" title={profile.alamat}>{profile.alamat}</td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 font-sans">{profile.kepsek}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{profile.nip_kepsek}</td>
                        <td className="p-2.5 font-sans font-semibold text-emerald-600">{profile.guru}</td>
                        <td className="p-2.5">{profile.nip_guru}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw CSV Text Box & Action Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Teks CSV / Google Sheets:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(profileCsv, 'profile')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      {copied === 'profile' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === 'profile' ? 'Tersalin!' : 'Salin CSV / Sheets'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadCsv(profileCsv, 'smkn2songgom_profil.csv')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh CSV</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  rows={3}
                  value={profileCsv}
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Update / Paste from Google Sheets Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Perbarui Profil dari Google Sheets (Tempelkan Baris CSV):
                </label>
                <textarea
                  rows={2}
                  placeholder={`Tempel baris dari Google Sheets disini, contoh:\nP1,https://i.ibb.co/k2Qs4p65/logosmk2songgom.png,SMK Negeri 2 Songgom,"Jl. Raksa Wijaya, Wetan, Karangsembung, Kec. Songgom, Kabupaten Brebes","Wigit Marseto Adji, S,Pd., M.Si",196910161997021003,Administrator,-`}
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleApplyPasteProfile}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Terapkan Data dari Google Sheets</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TEACHERS CSV */}
          {activeSheetTab === 'teachers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sheet Data Guru & Tenaga Kependidikan ({teachers.length} Data)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kolom: nip, nama, mapel, jabatan, status, telepon, email
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(teachersCsv, 'teachers')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                  >
                    {copied === 'teachers' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Seluruh Data Guru</span>
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(teachersCsv, 'smkn2songgom_data_guru.csv')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                rows={8}
                value={teachersCsv}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {/* TAB 3: STUDENTS CSV */}
          {activeSheetTab === 'students' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sheet Data Siswa SMK ({students.length} Data)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kolom: nisn, nis, nama, kelas, jurusan, jenis_kelamin, telepon_ortu, alamat
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(studentsCsv, 'students')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                  >
                    {copied === 'students' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Data Siswa</span>
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(studentsCsv, 'smkn2songgom_data_siswa.csv')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                rows={8}
                value={studentsCsv}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {/* TAB 4: SCHEDULES CSV */}
          {activeSheetTab === 'schedules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sheet Jadwal Pelajaran ({schedules.length} Sesi)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kolom: hari, jam_ke, waktu_mulai, waktu_selesai, mata_pelajaran, guru_pengampu, kelas, ruang
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(schedulesCsv, 'schedules')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                  >
                    {copied === 'schedules' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Jadwal</span>
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(schedulesCsv, 'smkn2songgom_jadwal_kbm.csv')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                rows={8}
                value={schedulesCsv}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {/* TAB 5: GRADES CSV */}
          {activeSheetTab === 'grades' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sheet Buku Nilai & Ujian Kejuruan ({grades.length} Rekap)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kolom: nisn, nama_siswa, kelas, mata_pelajaran, nilai_tugas, nilai_uts, nilai_uas, nilai_praktik_ukk, nilai_akhir, predikat
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(gradesCsv, 'grades')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                  >
                    {copied === 'grades' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Buku Nilai</span>
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(gradesCsv, 'smkn2songgom_rekap_nilai.csv')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                rows={8}
                value={gradesCsv}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {/* TAB 6: CBT EXAM SCHEMA & TEMPLATE */}
          {activeSheetTab === 'cbt_exam_schema' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Struktur Database Google Sheets: Modul Ujian Sekolah Anti-Contek
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  Sistem CBT ini terhubung ke 4 sheet terstandarisasi untuk memisahkan bank soal (PG, Esai, Ceklist), sesi ujian bertoken, audit kecurangan siswa secara waktu riil, dan lembar jawaban otomatis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block text-2xs">
                    1. Sheet: Ujian_BankSoal
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-2xs">
                    Menyimpan butir soal tipe PG, Esai, dan Ceklist (pilihan ganda kompleks).
                  </p>
                  <code className="text-3xs bg-white dark:bg-slate-900 p-1.5 rounded block text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700 font-mono">
                    id_soal, id_sesi, nomor_urut, tipe_soal, pertanyaan, gambar_url, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, kunci_jawaban, bobot_skor
                  </code>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block text-2xs">
                    2. Sheet: Ujian_Sesi
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-2xs">
                    Pengaturan sesi, token akses acak 6-karakter, kelas sasaran, durasi menit, dan batas toleransi curang.
                  </p>
                  <code className="text-3xs bg-white dark:bg-slate-900 p-1.5 rounded block text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700 font-mono">
                    id_sesi, judul_ujian, mata_pelajaran, kelas, guru_pengampu, token_ujian, durasi_menit, waktu_mulai, waktu_selesai, acak_soal, acak_opsi, max_pelanggaran, status
                  </code>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 block text-2xs">
                    3. Sheet: Ujian_Log_Pelanggaran
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-2xs">
                    Audit trail anti-contek (Ganti Tab, Keluar Fullscreen, Shortcut Terlarang, Kehilangan Fokus).
                  </p>
                  <code className="text-3xs bg-white dark:bg-slate-900 p-1.5 rounded block text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700 font-mono">
                    id_log, id_sesi, nisn, nama_siswa, kelas, waktu_kejadian, jenis_pelanggaran, pelanggaran_ke, tindakan
                  </code>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block text-2xs">
                    4. Sheet: Ujian_Jawaban_Siswa
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-2xs">
                    Rekap lembar jawaban, hitung otomatis skor PG & Ceklist, koreksi esai, dan nilai akhir.
                  </p>
                  <code className="text-3xs bg-white dark:bg-slate-900 p-1.5 rounded block text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700 font-mono">
                    id_hasil, id_sesi, nisn, nama_siswa, kelas, total_benar_pg, total_benar_ceklist, skor_esai, nilai_akhir, total_pelanggaran, status_pengerjaan, waktu_submit, detail_jawaban
                  </code>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Format Header Template Bank Soal CSV:
                </span>
                <textarea
                  readOnly
                  rows={4}
                  value="id_soal,id_sesi,nomor_urut,tipe_soal,pertanyaan,gambar_url,opsi_a,opsi_b,opsi_c,opsi_d,opsi_e,kunci_jawaban,bobot_skor&#10;SOAL_001,SESI_INF_01,1,PG,Perangkat keras masukan komputer adalah...,,Keyboard,Monitor,Printer,RAM,,A,10&#10;SOAL_002,SESI_INF_01,2,CEKLIST,Pilihlah sistem operasi open-source!,,Ubuntu,Windows 11,Debian,macOS,Fedora,A,C,E,15&#10;SOAL_003,SESI_INF_01,3,ESAI,Jelaskan perbedaan RAM dan SSD!,,,,,,,,RAM volatile sedangkan SSD non-volatile,20"
                  className="w-full p-2.5 font-mono text-2xs bg-slate-950 text-slate-200 rounded-xl border border-slate-800"
                />
              </div>
            </div>
          )}

          {/* TAB 7: WEBHOOK LIVE SYNC */}
          {activeSheetTab === 'webhook' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  Koneksi Webhook Google Apps Script (Live Bi-Directional Sync)
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Hubungkan Google Sheets Anda langsung ke aplikasi web ini agar setiap perubahan disimpan langsung ke spreadsheet secara otomatis tanpa login tambahan.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    onClick={handleSaveWebhook}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                  >
                    Simpan Webhook
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kode Apps Script Siap Pasang:
                  </span>
                  <button
                    onClick={() => handleCopyText(appsScriptCode, 'script')}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    {copied === 'script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Kode Apps Script</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-slate-200 text-2xs font-mono rounded-2xl overflow-x-auto max-h-48 border border-slate-800">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-2xs text-slate-500 flex items-center gap-1">
            <span>Identitas Aktif:</span>
            <strong className="text-slate-900 dark:text-white">{profile.nama_sekolah} ({profile.id})</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
