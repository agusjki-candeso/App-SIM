import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  UserCheck,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { Teacher, SchoolProfile } from '../types/school';
import { soundManager } from '../utils/sound';

interface TeachersViewProps {
  teachers: Teacher[];
  profile: SchoolProfile;
  onSaveTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onOpenSyncModal: () => void;
  onOpenTeacherProfileModal?: () => void;
  isAdmin?: boolean;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  profile,
  onSaveTeacher,
  onDeleteTeacher,
  onOpenSyncModal,
  onOpenTeacherProfileModal,
  isAdmin = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form fields
  const [formNip, setFormNip] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formMapel, setFormMapel] = useState('');
  const [formJabatan, setFormJabatan] = useState('Guru Produktif');
  const [formStatus, setFormStatus] = useState<'PNS' | 'PPPK' | 'GTT' | 'Honor'>('PNS');
  const [formEmail, setFormEmail] = useState('');
  const [formTelepon, setFormTelepon] = useState('');

  const filtered = teachers.filter((t) => {
    const matchSearch =
      searchQuery === '' ||
      t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.includes(searchQuery) ||
      t.mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.jabatan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setEditingTeacher(null);
    setFormNip('');
    setFormNama('');
    setFormMapel('');
    setFormJabatan('Guru Mata Pelajaran');
    setFormStatus('PNS');
    setFormEmail('');
    setFormTelepon('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    if (!isAdmin) return;
    setEditingTeacher(t);
    setFormNip(t.nip);
    setFormNama(t.nama);
    setFormMapel(t.mapel);
    setFormJabatan(t.jabatan);
    setFormStatus(t.status);
    setFormEmail(t.email || '');
    setFormTelepon(t.telepon || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formNama.trim()) return;

    const newTeacher: Teacher = {
      id: editingTeacher ? editingTeacher.id : `G-${Date.now()}`,
      nip: formNip.trim() || '-',
      nama: formNama.trim(),
      mapel: formMapel.trim() || 'Umum',
      jabatan: formJabatan.trim(),
      status: formStatus,
      email: formEmail.trim(),
      telepon: formTelepon.trim(),
    };

    onSaveTeacher(newTeacher);
    soundManager.playSuccess();
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Non-Admin Notice Banner */}
      {!isAdmin && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 gap-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Hanya-Lihat (Read-Only):</strong> Anda masuk sebagai Guru/GTK. Penambahan data GTK, perubahan NIP/Mapel, dan penghapusan guru hanya dapat dilakukan oleh <strong>Administrator</strong>.
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
            <Users className="w-5 h-5 text-indigo-600" />
            Data Guru & Tenaga Kependidikan (GTK)
          </h2>
          <p className="text-xs text-slate-500">
            Daftar tenaga pendidik resmi {profile.nama_sekolah} Kab. Brebes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSyncModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets GTK</span>
          </button>

          {!isAdmin && onOpenTeacherProfileModal && (
            <button
              onClick={onOpenTeacherProfileModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Pengaturan Profil Guru Saya</span>
            </button>
          )}
          
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Data Guru</span>
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
            placeholder="Cari nama guru, NIP, atau mata pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'PNS', 'PPPK', 'GTT'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 shadow-xs transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-100 dark:border-indigo-800">
                    {t.nama.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {t.nama}
                    </h3>
                    <p className="text-2xs font-mono text-slate-500">
                      NIP: {t.nip}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-2xs font-extrabold px-2 py-0.5 rounded-md ${
                    t.status === 'PNS'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : t.status === 'PPPK'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.mapel}
                </div>
                <div className="text-2xs text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-indigo-500" />
                  <span>{t.jabatan}</span>
                </div>
              </div>

              <div className="text-2xs text-slate-500 space-y-1">
                {t.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{t.email}</span>
                  </div>
                )}
                {t.telepon && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{t.telepon}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus guru ${t.nama}?`)) {
                        onDeleteTeacher(t.id);
                        soundManager.playTick();
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <span className="text-2xs text-slate-400 font-medium px-2 py-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-slate-400" />
                  <span>GTK Terdaftar</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingTeacher ? 'Edit Data Tenaga Pendidik (GTK)' : 'Tambah Tenaga Pendidik Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap & Gelar:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso, S.Kom., M.T."
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIP / NUPTK:
                  </label>
                  <input
                    type="text"
                    placeholder="198205142008..."
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kepegawaian:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT">GTT / Honorer</option>
                    <option value="Honor">Honor Sekolah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran yang Diampu:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pemrograman Web & Mobile, Matematika"
                  value={formMapel}
                  onChange={(e) => setFormMapel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tugas Tambahan / Jabatan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ketua Program Keahlian RPL, Waka Kurikulum"
                  value={formJabatan}
                  onChange={(e) => setFormJabatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp / HP:
                  </label>
                  <input
                    type="text"
                    value={formTelepon}
                    onChange={(e) => setFormTelepon(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Data GTK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
