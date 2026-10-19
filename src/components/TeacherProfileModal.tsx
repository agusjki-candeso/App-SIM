import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Save,
  RotateCcw,
  Sparkles,
  Mail,
  Phone,
  BookOpen,
  Award,
  Shield,
  Briefcase,
  User,
  CheckCircle2,
  Camera,
  Layers,
} from 'lucide-react';
import { Teacher, SchoolProfile } from '../types/school';
import { UserSession } from '../types/auth';
import { soundManager } from '../utils/sound';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession | null;
  teachers: Teacher[];
  profile: SchoolProfile;
  onSaveTeacher: (updatedTeacher: Teacher) => void;
  onUpdateSessionName?: (newName: string) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  userSession,
  teachers,
  profile,
  onSaveTeacher,
  onUpdateSessionName,
}) => {
  // Find current teacher by email or name matching
  const currentTeacher = React.useMemo(() => {
    if (!userSession) return null;
    const byEmail = teachers.find(
      (t) => t.email && t.email.toLowerCase() === userSession.email.toLowerCase()
    );
    if (byEmail) return byEmail;

    const byName = teachers.find(
      (t) => t.nama.toLowerCase().includes(userSession.name.toLowerCase()) ||
             userSession.name.toLowerCase().includes(t.nama.toLowerCase())
    );
    if (byName) return byName;

    // Fallback: look for Agus Joko Iryanto
    const byAgus = teachers.find((t) => t.nama.toLowerCase().includes('agus'));
    if (byAgus) return byAgus;

    return teachers[0] || null;
  }, [userSession, teachers]);

  const [formData, setFormData] = useState<Teacher>({
    id: currentTeacher?.id || 'G-DEFAULT',
    nip: currentTeacher?.nip || '198101162022211006',
    nama: userSession?.name || currentTeacher?.nama || 'Agus Joko Iryanto, S.Kom',
    mapel: currentTeacher?.mapel || 'Informatika / Pemrograman Web',
    jabatan: currentTeacher?.jabatan || 'Guru Produktif / Wali Kelas',
    status: currentTeacher?.status || 'PPPK',
    email: userSession?.email || currentTeacher?.email || 'agusjki.1681@gmail.com',
    telepon: currentTeacher?.telepon || '085742111168',
    fotoUrl: userSession?.picture || currentTeacher?.fotoUrl || '',
  });

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (currentTeacher) {
      setFormData({
        id: currentTeacher.id,
        nip: currentTeacher.nip || '198101162022211006',
        nama: userSession?.name || currentTeacher.nama,
        mapel: currentTeacher.mapel || 'Informatika / Kejuruan',
        jabatan: currentTeacher.jabatan || 'Guru Mata Pelajaran',
        status: currentTeacher.status || 'PPPK',
        email: userSession?.email || currentTeacher.email || '',
        telepon: currentTeacher.telepon || '',
        fotoUrl: userSession?.picture || currentTeacher.fotoUrl || '',
      });
    }
  }, [currentTeacher, userSession, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;

    onSaveTeacher(formData);
    if (onUpdateSessionName) {
      onUpdateSessionName(formData.nama);
    }
    soundManager.playSuccess();
    setNotification('Profil Guru berhasil diperbarui!');
    setTimeout(() => {
      setNotification(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-emerald-950/40 via-blue-950/30 to-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pengaturan Profil Guru & GTK
                </h3>
                <span className="px-2 py-0.5 rounded-md text-2xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Akses Guru
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Kelola data pribadi pengajar, NIP/NUPTK, mata pelajaran, dan kontak Anda
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

        {/* Live ID Card Preview */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-md border border-blue-800/40 flex items-center gap-4">
            <div className="relative shrink-0">
              {formData.fotoUrl ? (
                <img
                  src={formData.fotoUrl}
                  alt={formData.nama}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center border-2 border-amber-300 shadow-md">
                  {formData.nama.charAt(0) || 'G'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md text-3xs font-extrabold bg-emerald-500 text-white border border-white">
                {formData.status}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-3xs font-bold text-amber-300 uppercase tracking-wider block">
                {profile.nama_sekolah}
              </span>
              <h4 className="text-sm font-black text-white truncate">
                {formData.nama || 'Nama Guru'}
              </h4>
              <p className="text-2xs text-blue-200 font-mono">
                NIP: {formData.nip || '-'}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-3xs text-blue-100/90">
                <span className="px-2 py-0.5 rounded-md bg-white/10 font-semibold">
                  📚 {formData.mapel || 'Mapel'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 font-semibold">
                  💼 {formData.jabatan || 'Jabatan'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {notification && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Guru */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Nama Lengkap & Gelar:</span>
              </label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Agus Joko Iryanto, S.Kom"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            {/* NIP / NUPTK */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>NIP / NUPTK / NPK:</span>
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="Contoh: 198101162022211006"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mata Pelajaran */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Mata Pelajaran Utama:</span>
              </label>
              <input
                type="text"
                value={formData.mapel}
                onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                placeholder="Contoh: Informatika / Kejuruan"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Jabatan / Tugas Tambahan */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Jabatan / Tugas Tambahan:</span>
              </label>
              <input
                type="text"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="Contoh: Guru Produktif / Wali Kelas 10 AKL 1"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status Kepegawaian */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Status Kepegawaian:</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
              >
                <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                <option value="PPPK">PPPK (P3K)</option>
                <option value="GTT">GTT (Guru Tidak Tetap)</option>
                <option value="Honor">Guru Honorer / Yayasan</option>
              </select>
            </div>

            {/* No Telepon / WhatsApp */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>No. HP / WhatsApp:</span>
              </label>
              <input
                type="text"
                value={formData.telepon || ''}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="0857..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Email Guru */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Email Akun:</span>
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@gmail.com"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Kata Sandi / Keamanan Login */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Kata Sandi / PIN Login Saya:</span>
              </label>
              <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Otomatis Sinkron Sheets
              </span>
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400">
              Kata sandi ini digunakan untuk autentikasi login Anda pada portal SIM SMK Negeri 2 Songgom.
            </p>
          </div>

          {/* Foto URL */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>URL Foto Profil (Opsional):</span>
            </label>
            <input
              type="text"
              value={formData.fotoUrl || ''}
              onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
              placeholder="https://... atau biarkan kosong untuk memakai foto akun Google"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="text-2xs text-slate-400">
              Perubahan profil guru akan langsung tersimpan di sistem SIM Sekolah.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Profil Guru</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
