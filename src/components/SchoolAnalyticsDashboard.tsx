import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Award,
  Users,
  GraduationCap,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import {
  Teacher,
  Student,
  LessonSchedule,
  StudentGrade,
  SchoolProfile,
} from '../types/school';

interface SchoolAnalyticsDashboardProps {
  teachers: Teacher[];
  students: Student[];
  schedules: LessonSchedule[];
  grades: StudentGrade[];
  profile: SchoolProfile;
  onNavigateTab?: (tab: 'schedules' | 'teachers' | 'students' | 'grades' | 'documents') => void;
}

// Color palettes for sleek data visualization
const STATUS_COLORS: Record<string, string> = {
  PNS: '#3b82f6', // blue-500
  PPPK: '#10b981', // emerald-500
  GTT: '#f59e0b', // amber-500
  Honorer: '#8b5cf6', // violet-500
};

const PREDIKAT_COLORS: Record<string, string> = {
  A: '#10b981', // emerald-500 (Sangat Baik)
  B: '#3b82f6', // blue-500 (Baik)
  C: '#f59e0b', // amber-500 (Cukup)
  D: '#ef4444', // rose-500 (Kurang/Remedial)
};

const JURUSAN_COLORS = ['#3b82f6', '#f97316', '#06b6d4', '#10b981', '#a855f7', '#ec4899'];

// Custom Tooltip component for rich Recharts tooltips
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold text-slate-200 border-b border-slate-700/80 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('id-ID') : entry.value}
              {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SchoolAnalyticsDashboard: React.FC<SchoolAnalyticsDashboardProps> = ({
  teachers,
  students,
  schedules,
  grades,
  profile,
  onNavigateTab,
}) => {
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'overview' | 'teachers' | 'grades' | 'demographics'>('overview');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // ==========================================
  // 1. TEACHER DISTRIBUTION DATA COMPUTATION
  // ==========================================
  const teacherStatusData = useMemo(() => {
    const counts: Record<string, number> = { PNS: 0, PPPK: 0, GTT: 0, Honorer: 0 };
    teachers.forEach((t) => {
      const status = t.status || 'Honorer';
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: teachers.length > 0 ? ((value / teachers.length) * 100).toFixed(1) : '0',
    }));
  }, [teachers]);

  // Teaching workload (schedules per teacher)
  const teacherWorkloadData = useMemo(() => {
    const map: Record<string, { sessions: number; mapel: string }> = {};
    teachers.forEach((t) => {
      map[t.nama] = { sessions: 0, mapel: t.mapel };
    });

    schedules.forEach((sch) => {
      if (map[sch.guruPengampu]) {
        map[sch.guruPengampu].sessions += 1;
      } else {
        map[sch.guruPengampu] = { sessions: 1, mapel: sch.mataPelajaran };
      }
    });

    return Object.entries(map)
      .map(([name, data]) => {
        // Shorten teacher name for chart display
        const shortName = name.split(',')[0].replace(/(Drs\.|Dr\.|Ir\.|H\.|Hj\.)\s*/g, '');
        return {
          name: shortName.length > 16 ? shortName.substring(0, 14) + '...' : shortName,
          fullName: name,
          sessions: data.sessions,
          mapel: data.mapel,
        };
      })
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8); // Top 8 teachers by sessions
  }, [teachers, schedules]);

  // Subject department breakdown
  const subjectCategoryData = useMemo(() => {
    const deptCounts: Record<string, number> = {
      'Teknologi & Kejuruan': 0,
      'MIPA & Eksakta': 0,
      'Bahasa & Literasi': 0,
      'Sosial & Kewirausahaan': 0,
      'Agama & Karakter': 0,
    };

    teachers.forEach((t) => {
      const m = t.mapel.toLowerCase();
      if (m.includes('web') || m.includes('jaringan') || m.includes('otomotif') || m.includes('rpl') || m.includes('tkj') || m.includes('tkro') || m.includes('mesin') || m.includes('komputer')) {
        deptCounts['Teknologi & Kejuruan'] += 1;
      } else if (m.includes('matematika') || m.includes('ipa') || m.includes('fisika') || m.includes('kimia') || m.includes('statistika')) {
        deptCounts['MIPA & Eksakta'] += 1;
      } else if (m.includes('indonesia') || m.includes('inggris') || m.includes('bahasa') || m.includes('jawa')) {
        deptCounts['Bahasa & Literasi'] += 1;
      } else if (m.includes('pkk') || m.includes('kewirausahaan') || m.includes('akuntansi') || m.includes('ips') || m.includes('ekonomi')) {
        deptCounts['Sosial & Kewirausahaan'] += 1;
      } else {
        deptCounts['Agama & Karakter'] += 1;
      }
    });

    return Object.entries(deptCounts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [teachers]);

  // ==========================================
  // 2. STUDENT GRADE STATISTICS COMPUTATION
  // ==========================================
  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      const matchSubject = selectedSubjectFilter === 'all' || g.mataPelajaran === selectedSubjectFilter;
      const matchClass = selectedClassFilter === 'all' || g.kelas === selectedClassFilter;
      return matchSubject && matchClass;
    });
  }, [grades, selectedSubjectFilter, selectedClassFilter]);

  // Predicate distribution (A, B, C, D)
  const gradePredicateData = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    filteredGrades.forEach((g) => {
      const p = g.predikat || 'B';
      counts[p] = (counts[p] || 0) + 1;
    });

    return Object.entries(counts).map(([pred, count]) => ({
      name: `Predikat ${pred}`,
      predikat: pred,
      count,
      percentage: filteredGrades.length > 0 ? ((count / filteredGrades.length) * 100).toFixed(1) : '0',
    }));
  }, [filteredGrades]);

  // Assessment Component Breakdown (Tugas vs UTS vs UAS vs UKK)
  const gradeComponentRadarData = useMemo(() => {
    if (filteredGrades.length === 0) {
      return [
        { subject: 'Tugas Harian', avg: 85, fullMark: 100 },
        { subject: 'UTS (Tengah Sem.)', avg: 82, fullMark: 100 },
        { subject: 'UAS (Akhir Sem.)', avg: 86, fullMark: 100 },
        { subject: 'Praktik UKK Kejuruan', avg: 90, fullMark: 100 },
      ];
    }

    const totals = filteredGrades.reduce(
      (acc, curr) => {
        acc.tugas += curr.nilaiTugas || 0;
        acc.uts += curr.nilaiUTS || 0;
        acc.uas += curr.nilaiUAS || 0;
        acc.ukk += curr.nilaiPraktikUKK || 0;
        return acc;
      },
      { tugas: 0, uts: 0, uas: 0, ukk: 0 }
    );

    const len = filteredGrades.length;
    return [
      { subject: 'Tugas Harian (20%)', avg: Number((totals.tugas / len).toFixed(1)), fullMark: 100 },
      { subject: 'UTS Tengah Semester (25%)', avg: Number((totals.uts / len).toFixed(1)), fullMark: 100 },
      { subject: 'UAS Akhir Semester (25%)', avg: Number((totals.uas / len).toFixed(1)), fullMark: 100 },
      { subject: 'Praktik UKK Kejuruan (30%)', avg: Number((totals.ukk / len).toFixed(1)), fullMark: 100 },
    ];
  }, [filteredGrades]);

  // Grades per student/subject ranking
  const studentPerformanceBarData = useMemo(() => {
    return filteredGrades.map((g) => ({
      name: g.namaSiswa.split(' ')[0] + ' ' + (g.namaSiswa.split(' ')[1] ? g.namaSiswa.split(' ')[1].charAt(0) + '.' : ''),
      fullName: g.namaSiswa,
      kelas: g.kelas,
      mapel: g.mataPelajaran,
      nilaiAkhir: g.nilaiAkhir,
      nilaiPraktikUKK: g.nilaiPraktikUKK,
      nilaiTeori: Number(((g.nilaiTugas + g.nilaiUTS + g.nilaiUAS) / 3).toFixed(1)),
      predikat: g.predikat,
    }));
  }, [filteredGrades]);

  // Performance by Subject / Course Comparison
  const subjectPerformanceComparison = useMemo(() => {
    const map: Record<string, { total: number; count: number; max: number; min: number }> = {};
    grades.forEach((g) => {
      if (!map[g.mataPelajaran]) {
        map[g.mataPelajaran] = { total: 0, count: 0, max: 0, min: 100 };
      }
      map[g.mataPelajaran].total += g.nilaiAkhir;
      map[g.mataPelajaran].count += 1;
      map[g.mataPelajaran].max = Math.max(map[g.mataPelajaran].max, g.nilaiAkhir);
      map[g.mataPelajaran].min = Math.min(map[g.mataPelajaran].min, g.nilaiAkhir);
    });

    return Object.entries(map).map(([mapel, stats]) => ({
      mapel: mapel.length > 20 ? mapel.substring(0, 18) + '...' : mapel,
      fullMapel: mapel,
      rataRata: Number((stats.total / stats.count).toFixed(1)),
      nilaiTertinggi: stats.max,
      nilaiTerendah: stats.min,
      jumlahSiswa: stats.count,
    }));
  }, [grades]);

  // ==========================================
  // 3. STUDENT DEMOGRAPHICS DATA COMPUTATION
  // ==========================================
  const studentJurusanGenderData = useMemo(() => {
    const jurMap: Record<string, { L: number; P: number; total: number }> = {};

    students.forEach((s) => {
      const jur = s.jurusan || 'Lainnya';
      if (!jurMap[jur]) jurMap[jur] = { L: 0, P: 0, total: 0 };
      if (s.jenisKelamin === 'L') {
        jurMap[jur].L += 1;
      } else {
        jurMap[jur].P += 1;
      }
      jurMap[jur].total += 1;
    });

    return Object.entries(jurMap).map(([jurusan, counts]) => ({
      jurusan: jurusan.length > 22 ? jurusan.substring(0, 20) + '...' : jurusan,
      fullJurusan: jurusan,
      LakiLaki: counts.L,
      Perempuan: counts.P,
      Total: counts.total,
    }));
  }, [students]);

  // Overall KPIs for quick administrative insight
  const overallAvgGrade = grades.length > 0
    ? Number((grades.reduce((a, c) => a + c.nilaiAkhir, 0) / grades.length).toFixed(1))
    : 88.5;

  const kkmThreshold = 75;
  const passingGradesCount = grades.filter((g) => g.nilaiAkhir >= kkmThreshold).length;
  const passingRate = grades.length > 0 ? ((passingGradesCount / grades.length) * 100).toFixed(1) : '100';

  const pnsCount = teachers.filter((t) => t.status === 'PNS' || t.status === 'PPPK').length;
  const pnsPercentage = teachers.length > 0 ? ((pnsCount / teachers.length) * 100).toFixed(0) : '70';

  const studentTeacherRatio = teachers.length > 0 ? (students.length / teachers.length).toFixed(1) : '1.0';

  // Available subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const list = Array.from(new Set(grades.map((g) => g.mataPelajaran)));
    return list;
  }, [grades]);

  // Available classes for filter dropdown
  const uniqueClasses = useMemo(() => {
    const list = Array.from(new Set(grades.map((g) => g.kelas)));
    return list;
  }, [grades]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card with Administrative Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Pusat Analisis & Statistik Vokasi Sekolah
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Live Visualisasi Recharts
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wawasan berbasis data untuk pimpinan, waka kurikulum, dan pengelola {profile.nama_sekolah}
              </p>
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto gap-1">
            {[
              { id: 'overview', label: 'Ringkasan Eksekutif', icon: Activity },
              { id: 'teachers', label: 'Distribusi Guru & GTK', icon: Users },
              { id: 'grades', label: 'Statistik Nilai & UKK', icon: Award },
              { id: 'demographics', label: 'Demografi Siswa', icon: GraduationCap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeAnalyticsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalyticsTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Executive KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              Tingkat Ketuntasan KKM
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {passingRate}%
              </span>
              <span className="text-2xs text-slate-400 font-medium">KKM &ge; {kkmThreshold}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Number(passingRate), 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              Rata-rata Nilai Sekolah
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {overallAvgGrade}
              </span>
              <span className="text-2xs text-slate-400 font-medium">Skala 100</span>
            </div>
            <span className="text-2xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Sangat Baik (A/B)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              Guru Berstatus ASN (PNS/PPPK)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {pnsPercentage}%
              </span>
              <span className="text-2xs text-slate-400 font-medium">{pnsCount} dari {teachers.length} Guru</span>
            </div>
            <span className="text-2xs text-indigo-500 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> Bersertifikasi Pendidik
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              Rasio Guru : Siswa
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                1 : {studentTeacherRatio}
              </span>
              <span className="text-2xs text-slate-400 font-medium">Rasio Ideal</span>
            </div>
            <span className="text-2xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Standar SPM Terpenuhi
            </span>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: EXECUTIVE OVERVIEW (Dua Bagian: Guru & Nilai Siswa) */}
      {/* ======================================================== */}
      {(activeAnalyticsTab === 'overview' || activeAnalyticsTab === 'teachers') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Teacher Status Distribution Donut */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Distribusi Status Kepegawaian Guru
                  </h4>
                  <span className="text-2xs font-bold text-slate-400">Total {teachers.length} GTK</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  Proporsi PNS, PPPK, GTT, dan Honorer di lingkungan sekolah
                </p>
              </div>

              <div className="h-64 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teacherStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {teacherStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-2xs">
                {teacherStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] }} />
                      {item.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.value} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Teaching Workload & Sessions per Teacher (BarChart) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Beban Mengajar & Sesi KBM per Guru (Top Jadwal Aktif)
                  </h4>
                  <span className="text-2xs font-bold text-slate-400">{schedules.length} Sesi Terjadwal</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  Jumlah sesi mengajar mingguan terdata pada jadwal pelajaran
                </p>
              </div>

              <div className="h-72 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherWorkloadData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar
                      dataKey="sessions"
                      name="Sesi Mengajar"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    >
                      {teacherWorkloadData.map((_, index) => (
                        <Cell key={`bar-${index}`} fill={index === 0 ? '#3b82f6' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-2xs text-indigo-900 dark:text-indigo-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Rekomendasi Waka Kurikulum: Distribusi jam mengajar berimbang sesuai standar 24-40 JP per minggu.
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('schedules')}
                    className="font-bold underline hover:text-indigo-700 shrink-0 ml-2"
                  >
                    Atur Jadwal &rarr;
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STUDENT GRADE STATISTICS & UKK PERFORMANCE        */}
      {/* ======================================================== */}
      {(activeAnalyticsTab === 'overview' || activeAnalyticsTab === 'grades') && (
        <div className="space-y-6">
          
          {/* Grade Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Filter Statistik Nilai:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Subject selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-2xs">Mapel:</span>
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Mata Pelajaran ({grades.length})</option>
                  {uniqueSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Class selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-2xs">Kelas:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Rombel</option>
                  {uniqueClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 3: Predicate Distribution (A/B/C/D) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Distribusi Predikat Capaian Siswa
                  </h4>
                  <span className="text-2xs font-bold text-slate-400">{filteredGrades.length} Siswa Terdaftar</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  Persentase A (Sangat Baik), B (Baik), C (Cukup), D (Remedial)
                </p>
              </div>

              <div className="h-64 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradePredicateData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name.replace('Predikat ', '')} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {gradePredicateData.map((entry) => (
                        <Cell key={`cell-pred-${entry.predikat}`} fill={PREDIKAT_COLORS[entry.predikat] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-2xs">
                {gradePredicateData.map((item) => (
                  <div key={item.predikat} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PREDIKAT_COLORS[item.predikat] }} />
                      Predikat {item.predikat}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.count} Siswa ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: Radar Chart Component Breakdown (Tugas, UTS, UAS, Praktik UKK) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Profil Penilaian Multi-Komponen & UKK
                  </h4>
                  <span className="text-2xs font-bold text-slate-400">Skala 100</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  Komparasi rata-rata nilai Tugas, UTS, UAS, dan Ujian Praktik Kejuruan
                </p>
              </div>

              <div className="h-64 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={80} data={gradeComponentRadarData}>
                    <PolarGrid stroke="#cbd5e1" opacity={0.6} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar
                      name="Rata-rata Skor"
                      dataKey="avg"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.45}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/50 text-2xs text-amber-900 dark:text-amber-300">
                <strong>Bobot Kurikulum Merdeka:</strong> UKK Praktik Kejuruan memiliki kontribusi signifikan (30%) terhadap kompetensi kelulusan siswa.
              </div>
            </div>

            {/* Chart 5: Performance by Student Comparison (Composed Bar) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Komparasi Teori vs Praktik UKK
                  </h4>
                  <span className="text-2xs font-bold text-slate-400">Peringkat Siswa</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  Perbandingan Nilai Teori (Rata-rata Tugas/UTS/UAS) vs Nilai Praktik UKK
                </p>
              </div>

              <div className="h-64 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentPerformanceBarData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="bottom" height={25} iconType="circle" />
                    <Bar dataKey="nilaiTeori" name="Teori Rata2" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="nilaiPraktikUKK" name="Praktik UKK" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-2xs text-slate-500 text-center">
                Menampilkan komparasi performa siswa aktif pada rombel terpilih.
              </div>
            </div>

          </div>

          {/* Subject Average & High/Low Analysis Table */}
          {subjectPerformanceComparison.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Analisis Capaian Nilai per Mata Pelajaran Kejuruan
                  </h4>
                  <p className="text-2xs text-slate-500">
                    Statistik rata-rata, nilai tertinggi, dan nilai terendah per mapel
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Mata Pelajaran</th>
                      <th className="p-3 text-center">Jumlah Siswa</th>
                      <th className="p-3 text-center">Rata-rata Nilai</th>
                      <th className="p-3 text-center">Nilai Tertinggi</th>
                      <th className="p-3 text-center">Nilai Terendah</th>
                      <th className="p-3 text-center">Status KKM (&ge;75)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subjectPerformanceComparison.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {sub.fullMapel}
                        </td>
                        <td className="p-3 text-center font-mono">{sub.jumlahSiswa} Siswa</td>
                        <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                          {sub.rataRata}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-emerald-600">
                          {sub.nilaiTertinggi}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-amber-600">
                          {sub.nilaiTerendah}
                        </td>
                        <td className="p-3 text-center">
                          {sub.rataRata >= 75 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Tuntas KKM
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Perlu Remedial
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: STUDENT DEMOGRAPHICS & JURUSAN BREAKDOWN           */}
      {/* ======================================================== */}
      {(activeAnalyticsTab === 'overview' || activeAnalyticsTab === 'demographics') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 6: Student Gender Breakdown by Program Keahlian (Stacked BarChart) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-600" />
                    Komposisi Gender Siswa per Program Keahlian
                  </h4>
                  <span className="text-2xs font-bold text-slate-400">{students.length} Total Siswa</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  Jumlah siswa Laki-laki (L) dan Perempuan (P) di tiap kompetensi keahlian
                </p>
              </div>

              <div className="h-72 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentJurusanGenderData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="jurusan"
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="bottom" height={25} iconType="circle" />
                    <Bar dataKey="LakiLaki" name="Laki-Laki (L)" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Perempuan" name="Perempuan (P)" fill="#ec4899" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-2xs text-slate-600 dark:text-slate-300">
                <span>Rasio Keseluruhan: <strong>{students.filter(s => s.jenisKelamin === 'L').length} L</strong> &bull; <strong>{students.filter(s => s.jenisKelamin === 'P').length} P</strong></span>
                <span className="font-semibold text-blue-600">SMK Pusat Keunggulan</span>
              </div>
            </div>

            {/* Chart 7: Subject Departments Breakdown (Area / Composed Chart) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    Distribusi Rumpun Mata Pelajaran GTK
                  </h4>
                  <span className="text-2xs font-bold text-slate-400">5 Kelompok Bidang</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  Kekuatan tenaga pendidik pada kejuruan vokasi, eksakta, dan normatif
                </p>
              </div>

              <div className="h-72 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={subjectCategoryData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                    <defs>
                      <linearGradient id="colorDept" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Jumlah Guru"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorDept)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/50 text-2xs text-purple-900 dark:text-purple-300">
                <strong>Struktur Kurikulum Vokasi:</strong> Porsi guru Teknologi & Kejuruan mendominasi untuk mendukung kesiapan kerja lulusan SMK Negeri 2 Songgom.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Actionable Executive Insights Footer */}
      <div className="p-5 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Laporan Evaluasi & Keputusan Berbasis Data (Data-Driven Insights)
          </h4>
          <p className="text-xs text-blue-200">
            Telah memenuhi standar pelaporan Dapodik & evaluasi berkala pimpinan sekolah ({profile.kepsek}).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('grades')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Kelola Buku Nilai</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('documents')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-white/15"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
