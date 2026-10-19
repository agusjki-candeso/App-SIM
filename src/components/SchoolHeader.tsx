import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Users,
  GraduationCap,
  FileText,
  Award,
  Database,
  Settings,
  Sparkles,
  RefreshCw,
  Clock,
  MapPin,
  UserCheck,
  Shield,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  CalendarCheck,
  BookOpen,
  ChevronDown,
  Layers,
  CheckCircle2,
  Briefcase,
  Sliders,
  Laptop,
} from 'lucide-react';
import { SchoolProfile, Teacher } from '../types/school';
import { UserSession } from '../types/auth';

export type AppNavTab =
  | 'dashboard'
  | 'attendance'
  | 'journal'
  | 'grades'
  | 'cbt_exam'
  | 'schedules'
  | 'teachers'
  | 'students'
  | 'documents';

interface SchoolHeaderProps {
  profile: SchoolProfile;
  activeTab: AppNavTab;
  onTabChange: (tab: AppNavTab) => void;
  onOpenSyncModal: () => void;
  onOpenProfileModal: () => void;
  onOpenTeacherProfileModal?: () => void;
  onOpenUserManagementModal?: () => void;
  isSyncing?: boolean;
  userSession: UserSession | null;
  onLoginGoogle: () => void;
  onLogout: () => void;
  onRoleSwitch?: (role: 'admin' | 'guru' | 'kepala_sekolah') => void;
  teachers?: Teacher[];
  isAdmin?: boolean;
}

export const SchoolHeader: React.FC<SchoolHeaderProps> = ({
  profile,
  activeTab,
  onTabChange,
  onOpenSyncModal,
  onOpenProfileModal,
  onOpenTeacherProfileModal,
  onOpenUserManagementModal,
  isSyncing = false,
  userSession,
  onLoginGoogle,
  onLogout,
  teachers = [],
  isAdmin = true,
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const role = userSession?.role || (isAdmin ? 'admin' : 'guru');
  const isRoleAdmin = role === 'admin';
  const isRoleKepsek = role === 'kepala_sekolah';
  const isRoleGuru = role === 'guru';

  // Find matching teacher record if user is a teacher
  const matchingTeacher = teachers.find(
    (t) =>
      (userSession?.guruNip && t.nip && t.nip.replace(/\D/g, '') === userSession.guruNip.replace(/\D/g, '')) ||
      (userSession?.email && t.email && t.email.toLowerCase() === userSession.email.toLowerCase()) ||
      (userSession?.name && t.nama.toLowerCase().includes(userSession.name.toLowerCase()))
  );

  const teacherMapel = userSession?.guruMapel || matchingTeacher?.mapel || 'Guru Mata Pelajaran';
  const teacherNip = userSession?.guruNip || matchingTeacher?.nip || profile.nip_guru || '-';

  // Navigation Items with role-aware priority and badges
  const navItems: { id: AppNavTab; label: string; icon: any; badge?: string; desc?: string }[] = [
    {
      id: 'dashboard',
      label: 'Beranda',
      icon: Building2,
      desc: 'Ringkasan Statistik',
    },
    {
      id: 'attendance',
      label: 'Form Absen',
      icon: CalendarCheck,
      badge: isRoleGuru ? 'Utama' : undefined,
      desc: 'Kehadiran Siswa',
    },
    {
      id: 'journal',
      label: 'Form Jurnal',
      icon: BookOpen,
      badge: isRoleGuru ? 'KBM' : undefined,
      desc: 'Agenda Pembelajaran',
    },
    {
      id: 'grades',
      label: 'Form Nilai & UKK',
      icon: Award,
      desc: 'Penilaian Akademik',
    },
    {
      id: 'cbt_exam',
      label: 'Ujian Anti-Contek',
      icon: ShieldCheck,
      badge: 'CBT',
      desc: 'Bank Soal & Ujian Siswa',
    },
    {
      id: 'schedules',
      label: 'Jadwal KBM',
      icon: Calendar,
      desc: 'Jadwal Mengajar',
    },
    {
      id: 'students',
      label: 'Data Siswa & Kelas',
      icon: GraduationCap,
      badge: isRoleAdmin ? 'Master' : undefined,
      desc: 'Daftar Siswa',
    },
    {
      id: 'teachers',
      label: 'Guru & GTK',
      icon: Users,
      badge: isRoleAdmin ? 'Master' : undefined,
      desc: 'Dewan Pendidik',
    },
    {
      id: 'documents',
      label: 'Surat & Dokumen',
      icon: FileText,
      desc: 'Arsip & Cetak Resmi',
    },
  ];

  return (
    <header className="sticky top-0 z-40 shadow-lg font-sans">
      {/* 
        ========================================================================
        TOP BAR: Tailored & Distinctive Visual Identity by Role
        ========================================================================
      */}
      <div
        className={`px-3 sm:px-6 py-2.5 transition-colors duration-300 border-b ${
          isRoleAdmin
            ? 'bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 border-amber-500/30 text-white'
            : isRoleKepsek
            ? 'bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 border-blue-500/30 text-white'
            : 'bg-linear-to-r from-slate-950 via-slate-900 to-emerald-950 border-emerald-500/30 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* LEFT: School Logo & System Branding */}
          <div className="flex items-center gap-3">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={isRoleAdmin ? onOpenProfileModal : (onOpenTeacherProfileModal || onOpenProfileModal)}
              title={isRoleAdmin ? 'Pengaturan Profil Sekolah (Admin)' : 'Profil Guru & Sekolah'}
            >
              <div
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center overflow-hidden border-2 transition-transform duration-200 group-hover:scale-105 ${
                  isRoleAdmin
                    ? 'border-amber-400 shadow-amber-500/10'
                    : isRoleKepsek
                    ? 'border-blue-400 shadow-blue-500/10'
                    : 'border-emerald-400 shadow-emerald-500/10'
                }`}
              >
                <img
                  src={profile.logo}
                  alt={profile.nama_sekolah}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isRoleAdmin ? 'bg-amber-400' : isRoleKepsek ? 'bg-blue-400' : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-slate-950 ${
                    isRoleAdmin ? 'bg-amber-500' : isRoleKepsek ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span>{profile.nama_sekolah}</span>
                </h1>

                {/* Clear Role Badge with Distinct Colors */}
                {isRoleAdmin ? (
                  <span className="px-2 py-0.5 rounded-md text-2xs font-extrabold bg-amber-400 text-slate-950 border border-amber-300 shadow-xs flex items-center gap-1 tracking-wider uppercase">
                    <Shield className="w-3 h-3 fill-slate-950" />
                    <span>Administrator SIM</span>
                  </span>
                ) : isRoleKepsek ? (
                  <span className="px-2 py-0.5 rounded-md text-2xs font-extrabold bg-blue-500 text-white border border-blue-300 shadow-xs flex items-center gap-1 tracking-wider uppercase">
                    <Building2 className="w-3 h-3" />
                    <span>Kepala Sekolah</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-2xs font-extrabold bg-emerald-500 text-white border border-emerald-300 shadow-xs flex items-center gap-1 tracking-wider uppercase">
                    <UserCheck className="w-3 h-3" />
                    <span>Guru / GTK</span>
                  </span>
                )}

                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-2xs font-bold bg-slate-800/90 text-slate-300 border border-slate-700">
                  Akreditasi {profile.akreditasi || 'A'}
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-2xs font-medium bg-blue-950/80 text-blue-300 border border-blue-800/50">
                  TP 2024/2025
                </span>
              </div>

              {/* Dynamic Subtitle by Role */}
              <div className="flex items-center gap-2 text-2xs text-slate-300 mt-0.5 truncate">
                {isRoleAdmin ? (
                  <span className="text-amber-300/90 flex items-center gap-1 font-medium truncate">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Pusat Kendali Sistem Informasi Manajemen & Master Database</span>
                  </span>
                ) : isRoleKepsek ? (
                  <span className="text-blue-300/90 flex items-center gap-1 font-medium truncate">
                    <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>Portal Supervisi Manajerial, Evaluasi & Dokumen Resmi</span>
                  </span>
                ) : (
                  <span className="text-emerald-300/90 flex items-center gap-1 font-medium truncate">
                    <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>
                      {teacherMapel} &bull; NIP: {teacherNip}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Clock, User Profile Pill & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-end md:self-center flex-wrap">
            
            {/* Live Indonesian Clock Widget */}
            <div className="hidden lg:flex flex-col text-right px-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-mono font-bold text-amber-300 flex items-center justify-end gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{time} WIB</span>
              </span>
              <span className="text-3xs text-slate-400">{dateStr}</span>
            </div>

            {/* Active User Account Badge */}
            {userSession && (
              <div
                className={`flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 border transition-all ${
                  isRoleAdmin
                    ? 'bg-slate-900/80 border-amber-500/30'
                    : isRoleKepsek
                    ? 'bg-slate-900/80 border-blue-500/30'
                    : 'bg-slate-900/80 border-emerald-500/30'
                }`}
              >
                {/* User Avatar */}
                <div className="relative shrink-0">
                  {userSession.picture ? (
                    <img
                      src={userSession.picture}
                      alt={userSession.name}
                      className="w-7 h-7 rounded-xl object-cover border border-white/20"
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shadow-inner ${
                        isRoleAdmin
                          ? 'bg-amber-400 text-slate-950'
                          : isRoleKepsek
                          ? 'bg-blue-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {userSession.name ? userSession.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                {/* User Details */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs max-w-[130px] sm:max-w-[160px] truncate leading-tight">
                      {userSession.name}
                    </span>
                  </div>
                  <span className="text-3xs text-slate-400 truncate max-w-[130px]">
                    {isRoleGuru ? teacherMapel : userSession.email || `@${userSession.username}`}
                  </span>
                </div>

                {/* Role-Specific Direct Management Button */}
                {isRoleAdmin && onOpenUserManagementModal && (
                  <button
                    onClick={onOpenUserManagementModal}
                    className="p-1 px-2 text-2xs rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-400/30 flex items-center gap-1 transition-all cursor-pointer"
                    title="Buka Manajemen Akun Pengguna & Google Sheets Users"
                  >
                    <Shield className="w-3 h-3" />
                    <span className="hidden sm:inline">Kelola Akun</span>
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-2xs rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white transition-all flex items-center gap-1 border border-rose-500/30 cursor-pointer"
                  title="Keluar dari sesi ini"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline font-bold">Keluar</span>
                </button>
              </div>
            )}

            {/* Google Sheets Sync Hub Button */}
            <button
              onClick={onOpenSyncModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all border border-emerald-400/40 cursor-pointer"
              title="Pusat Sinkronisasi Real-time Database Google Sheets"
            >
              <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Google Sheets</span>
              <span className="sm:hidden">Sheets</span>
            </button>

            {/* Role-Aware Profile Settings Button */}
            {isRoleAdmin ? (
              <button
                onClick={onOpenProfileModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-amber-400/30 cursor-pointer shadow-sm"
                title="Pengaturan Profil Sekolah, Logo & Legalitas (Admin)"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Profil Sekolah</span>
              </button>
            ) : isRoleKepsek ? (
              <button
                onClick={onOpenProfileModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-blue-400/30 cursor-pointer shadow-sm"
                title="Profil Kepala Sekolah & Legitimasi Dokumen"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Profil Kepsek</span>
              </button>
            ) : (
              <button
                onClick={onOpenTeacherProfileModal || onOpenProfileModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-emerald-400/30 cursor-pointer shadow-sm"
                title="Biodata & Profil Guru Pribadi"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Profil Guru</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* 
        ========================================================================
        BOTTOM BAR: Clean, Modern Navigation Tabs & Context Indicator
        ========================================================================
      */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 gap-2">
            
            {/* Nav Tab Items */}
            <nav className="flex space-x-1 sm:space-x-1.5 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                let activeClass = 'bg-blue-600 text-white shadow-md shadow-blue-600/30';
                if (isRoleAdmin) {
                  activeClass = 'bg-linear-to-r from-blue-700 to-indigo-700 text-white shadow-md shadow-indigo-700/25';
                } else if (isRoleGuru) {
                  activeClass = 'bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/25';
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? activeClass
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-3xs px-1.5 py-0.2 rounded font-extrabold uppercase ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Role Context Pill on Right */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 text-2xs">
              {isRoleAdmin ? (
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-amber-500/5 border-amber-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    Master Data: <strong className="text-slate-900 dark:text-white">{teachers.length} Guru / GTK</strong> &bull; {profile.jumlah_rombel || '9'} Rombel
                  </span>
                </div>
              ) : isRoleKepsek ? (
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-blue-500/5 border-blue-500/20">
                  <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    Kepala Sekolah: <strong className="text-slate-900 dark:text-white">{profile.kepsek}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-emerald-500/5 border-emerald-500/20">
                  <Laptop className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    Ruang Mengajar: <strong className="text-slate-900 dark:text-white">{teacherMapel}</strong>
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
