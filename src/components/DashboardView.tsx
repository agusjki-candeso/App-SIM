import React from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Award,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  BookOpen,
  MapPin,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Database,
  Printer,
  Compass,
} from 'lucide-react';
import {
  SchoolProfile,
  Teacher,
  Student,
  LessonSchedule,
  StudentGrade,
} from '../types/school';
import { JURUSAN_LIST } from '../utils/initialData';
import { SchoolAnalyticsDashboard } from './SchoolAnalyticsDashboard';

interface DashboardViewProps {
  profile: SchoolProfile;
  teachers: Teacher[];
  students: Student[];
  schedules: LessonSchedule[];
  grades: StudentGrade[];
  onNavigateTab: (tab: 'dashboard' | 'attendance' | 'journal' | 'grades' | 'schedules' | 'teachers' | 'students' | 'documents') => void;
  onOpenSyncModal: () => void;
  onOpenProfileModal: () => void;
  onOpenTeacherProfileModal?: () => void;
  isAdmin?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  teachers,
  students,
  schedules,
  grades,
  onNavigateTab,
  onOpenSyncModal,
  onOpenProfileModal,
  onOpenTeacherProfileModal,
  isAdmin = true,
}) => {
  // Determine current day in Indonesian
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = days[new Date().getDay()];
  const todaySchedules = schedules.filter((s) => s.hari === todayName);

  // Quick stats
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalSchedulesToday = todaySchedules.length;
  const averageGrade = grades.length > 0
    ? (grades.reduce((acc, curr) => acc + curr.nilaiAkhir, 0) / grades.length).toFixed(1)
    : '88.5';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Hero Welcome Card with School Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-900 via-indigo-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-blue-800/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-2 shadow-2xl shrink-0 flex items-center justify-center border-2 border-amber-400">
              <img
                src={profile.logo}
                alt={profile.nama_sekolah}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                  Sistem Informasi & Manajemen Sekolah
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  NPSN: {profile.npsn || '69989012'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {profile.nama_sekolah}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{profile.alamat}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0 self-stretch md:self-auto justify-end">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all border border-blue-400/40"
            >
              <span>📋 Form Absen Kelas</span>
            </button>
            <button
              onClick={() => onNavigateTab('journal')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all border border-purple-400/40"
            >
              <span>📖 Form Jurnal KBM</span>
            </button>
            <button
              onClick={onOpenSyncModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all border border-emerald-400/40"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sinkron Google Sheets</span>
            </button>
          </div>

        </div>

        {/* Headmaster Highlight Strip */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-800/80 text-amber-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-blue-300 text-2xs block uppercase tracking-wider font-semibold">Kepala Sekolah:</span>
              <strong className="text-white text-sm">{profile.kepsek}</strong>
              <span className="text-blue-300 ml-2">(NIP: {profile.nip_kepsek})</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={isAdmin ? onOpenProfileModal : (onOpenTeacherProfileModal || onOpenProfileModal)}
              className="text-2xs bg-indigo-950/70 hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-700/60 flex items-center gap-2 transition-all active:scale-95 text-left group cursor-pointer"
              title={isAdmin ? "Buka Pengaturan Profil Sekolah (Admin)" : "Buka Pengaturan Profil Guru"}
            >
              <span className="text-blue-300">Akun:</span>
              <strong className="text-amber-300 group-hover:text-amber-200">{profile.guru}</strong>
              <span className={`px-1.5 py-0.2 rounded text-3xs font-extrabold ${isAdmin ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-white'}`}>
                {isAdmin ? 'ADMIN' : 'GURU'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        <div
          onClick={() => onNavigateTab('students')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Total Siswa Terdaftar
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalStudents} <span className="text-xs font-semibold text-slate-400">Siswa</span>
          </p>
          <span className="text-2xs text-blue-600 font-bold mt-1 inline-flex items-center gap-0.5">
            Lihat Rombel & Presensi <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('teachers')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Guru & Tenaga Pendidik
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalTeachers} <span className="text-xs font-semibold text-slate-400">GTK</span>
          </p>
          <span className="text-2xs text-indigo-600 font-bold mt-1 inline-flex items-center gap-0.5">
            Daftar NIP & Mapel <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('schedules')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Jadwal Hari {todayName}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalSchedulesToday} <span className="text-xs font-semibold text-slate-400">Sesi KBM</span>
          </p>
          <span className="text-2xs text-amber-600 font-bold mt-1 inline-flex items-center gap-0.5">
            Buka Jadwal Mingguan <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('grades')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-xs cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-rata Nilai Kejuruan
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {averageGrade} <span className="text-xs font-semibold text-slate-400">/ 100</span>
          </p>
          <span className="text-2xs text-emerald-600 font-bold mt-1 inline-flex items-center gap-0.5">
            Buku Nilai & UKK <ChevronRight className="w-3 h-3" />
          </span>
        </div>

      </div>

      {/* Comprehensive Recharts Analytics & Visual Statistics Dashboard */}
      <SchoolAnalyticsDashboard
        teachers={teachers}
        students={students}
        schedules={schedules}
        grades={grades}
        profile={profile}
        onNavigateTab={onNavigateTab}
      />

      {/* Program Keahlian / Jurusan SMK N 2 Songgom */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Program Keahlian & Jurusan SMK Negeri 2 Songgom
            </h3>
            <p className="text-xs text-slate-500">
              Pendidikan vokasi berbasis industri, teknologi mutakhir, dan sertifikasi keahlian
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {JURUSAN_LIST.map((jurusan) => (
            <div
              key={jurusan.kode}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {jurusan.kode}
                </span>
                <span className="text-2xs text-slate-400 font-semibold">{jurusan.tingkat.length} Rombel</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {jurusan.nama}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kaprodi: <span className="text-slate-700 dark:text-slate-300 font-semibold">{jurusan.kaprodi}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's KBM Schedule & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Lessons List (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Jadwal KBM Aktif (Hari {todayName})
                </h3>
                <p className="text-xs text-slate-500">
                  {todaySchedules.length} Sesi pembelajaran terjadwal hari ini
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('schedules')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Lihat Semua Hari</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {todaySchedules.length > 0 ? (
              todaySchedules.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 gap-2 hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xs font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white shrink-0">
                      {item.waktuMulai} - {item.waktuSelesai}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.mataPelajaran}
                      </h4>
                      <p className="text-2xs text-slate-500">
                        Guru: <strong className="text-slate-700 dark:text-slate-300">{item.guruPengampu}</strong> | {item.kelas}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 shrink-0 self-start sm:self-center">
                    {item.ruang}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada jadwal KBM aktif untuk hari {todayName}.
              </div>
            )}
          </div>
        </div>

        {/* Quick Documents & Operations Shortcut (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Layanan Administrasi Cepat
            </h3>
            <p className="text-xs text-slate-500">
              Buat dan cetak dokumen resmi ber-KOP SMK Negeri 2 Songgom
            </p>
          </div>

          <div className="space-y-2">
            {[
              {
                title: 'Surat Keterangan Siswa Aktif',
                desc: 'Untuk beasiswa, bank, & keperluan dinas',
                action: () => onNavigateTab('documents'),
              },
              {
                title: 'Surat Tugas / Izin Guru (GTK)',
                desc: 'Penugasan pelatihan & dinas luar',
                action: () => onNavigateTab('documents'),
              },
              {
                title: 'Cetak Kartu Pelajar SMK',
                desc: 'ID card resmi dengan QR Code & Logo',
                action: () => onNavigateTab('documents'),
              },
              {
                title: 'Ekspor Data Google Sheets (P1)',
                desc: 'Salin atau unduh spreadsheet sekolah',
                action: onOpenSyncModal,
              },
            ].map((doc, idx) => (
              <button
                key={idx}
                onClick={doc.action}
                className="w-full text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-400 transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {doc.title}
                  </h4>
                  <p className="text-2xs text-slate-500">{doc.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>

          {/* Quick info footer */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-2xs text-slate-500 leading-relaxed">
            <strong>Catatan Kepala Sekolah:</strong> Pastikan seluruh data guru, presensi siswa, dan jadwal pelajaran telah disinkronkan dengan Google Sheets berkala.
          </div>
        </div>

      </div>

    </div>
  );
};
