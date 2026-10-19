import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  Clock,
  UserCheck,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  UserX,
  Lock,
} from 'lucide-react';
import { Student, SchoolProfile, SchoolClass } from '../types/school';
import { soundManager } from '../utils/sound';

interface StudentsViewProps {
  students: Student[];
  profile: SchoolProfile;
  classes?: SchoolClass[];
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onOpenSyncModal: () => void;
  isAdmin?: boolean;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  profile,
  classes = [],
  onSaveStudent,
  onDeleteStudent,
  onOpenSyncModal,
  isAdmin = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Quick Daily Attendance tracker state
  const [attendance, setAttendance] = useState<Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'>>({});

  // Class list derived from Sheet 'kelas' or students
  const classList = React.useMemo(() => {
    if (classes && classes.length > 0) {
      return classes.map((c) => c.nama);
    }
    const set = new Set(students.map((s) => s.kelas).filter(Boolean));
    return Array.from(set).sort();
  }, [classes, students]);

  // Form fields
  const [formNisn, setFormNisn] = useState('');
  const [formNis, setFormNis] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState(classList[0] || '10 AKL 1');
  const [formJurusan, setFormJurusan] = useState('Akuntansi & Keuangan Lembaga (AKL)');
  const [formJk, setFormJk] = useState<'L' | 'P'>('L');
  const [formAlamat, setFormAlamat] = useState('Songgom, Brebes');
  const [formTelepon, setFormTelepon] = useState('');

  const filtered = students.filter((s) => {
    const matchSearch =
      searchQuery === '' ||
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.includes(searchQuery) ||
      s.jurusan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = filterKelas === 'all' || s.kelas === filterKelas;
    return matchSearch && matchClass;
  });

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setEditingStudent(null);
    setFormNisn('');
    setFormNis(`2425${Math.floor(1000 + Math.random() * 9000)}`);
    setFormNama('');
    setFormKelas('XII RPL 1');
    setFormJurusan('Rekayasa Perangkat Lunak');
    setFormJk('L');
    setFormAlamat('Desa Songgom, Kab. Brebes');
    setFormTelepon('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    if (!isAdmin) return;
    setEditingStudent(s);
    setFormNisn(s.nisn);
    setFormNis(s.nis);
    setFormNama(s.nama);
    setFormKelas(s.kelas);
    setFormJurusan(s.jurusan);
    setFormJk(s.jenisKelamin);
    setFormAlamat(s.alamat || '');
    setFormTelepon(s.teleponOrtu || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formNama.trim() || !formNisn.trim()) return;

    const newStudent: Student = {
      id: editingStudent ? editingStudent.id : `S-${Date.now()}`,
      nisn: formNisn.trim(),
      nis: formNis.trim(),
      nama: formNama.trim(),
      kelas: formKelas,
      jurusan: formJurusan,
      jenisKelamin: formJk,
      alamat: formAlamat.trim(),
      teleponOrtu: formTelepon.trim(),
      status: 'Aktif',
    };

    onSaveStudent(newStudent);
    soundManager.playSuccess();
    setIsFormOpen(false);
  };

  const handleSetAttendance = (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    soundManager.playTick();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Non-Admin Notice Banner */}
      {!isAdmin && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 gap-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Hanya-Lihat Siswa:</strong> Anda masuk sebagai Guru/GTK. Penambahan siswa baru, ubah NISN, dan penghapusan rombel dikelola khusus oleh <strong>Administrator</strong>. Anda tetap dapat mencatat presensi harian siswa di bawah.
            </span>
          </div>
          <span className="text-2xs font-extrabold px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 shrink-0">
            Akses Guru
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Data Siswa & Presensi Kejuruan ({profile.nama_sekolah})
          </h2>
          <p className="text-xs text-slate-500">
            Daftar peserta didik aktif, rombongan belajar, dan pencatatan presensi harian
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSyncModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets Siswa</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NISN, nama siswa, atau jurusan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
          >
            <option value="all">Semua Rombel / Kelas</option>
            {classList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 pl-5">NISN / NIS</th>
                <th className="p-3.5">Nama Siswa</th>
                <th className="p-3.5">Kelas & Jurusan</th>
                <th className="p-3.5 text-center">L/P</th>
                <th className="p-3.5">Presensi Hari Ini</th>
                <th className="p-3.5 text-right pr-5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => {
                const currentStatus = attendance[s.id] || 'Hadir';
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-2xs">
                      <strong className="text-blue-600 block">{s.nisn}</strong>
                      <span className="text-slate-400">NIS: {s.nis}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {s.nama}
                      </div>
                      <div className="text-2xs text-slate-500 line-clamp-1">{s.alamat}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{s.kelas}</span>
                      <span className="text-2xs text-slate-400">{s.jurusan}</span>
                    </td>
                    <td className="p-3.5 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded ${s.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {s.jenisKelamin}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as const).map((stat) => {
                          const isActive = currentStatus === stat;
                          return (
                            <button
                              key={stat}
                              onClick={() => handleSetAttendance(s.id, stat)}
                              className={`px-2 py-0.5 rounded-lg text-2xs font-bold transition-colors ${
                                isActive
                                  ? stat === 'Hadir'
                                    ? 'bg-emerald-600 text-white'
                                    : stat === 'Sakit'
                                    ? 'bg-amber-500 text-white'
                                    : stat === 'Izin'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-rose-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {stat}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus siswa ${s.nama}?`)) {
                                onDeleteStudent(s.id);
                                soundManager.playTick();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-2xs text-slate-400 font-medium px-2 py-0.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                          Aktif
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingStudent ? 'Edit Data Peserta Didik' : 'Tambah Peserta Didik Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NISN:
                  </label>
                  <input
                    type="text"
                    placeholder="0078123456"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIS Sekolah:
                  </label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Siswa:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas:
                  </label>
                  <input
                    type="text"
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Program Keahlian / Jurusan:
                  </label>
                  <input
                    type="text"
                    value={formJurusan}
                    onChange={(e) => setFormJurusan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={formJk}
                    onChange={(e) => setFormJk(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. HP / WA Wali:
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formTelepon}
                    onChange={(e) => setFormTelepon(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Domisili Siswa:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Songgom Lor, Karangsembung, Brebes"
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
