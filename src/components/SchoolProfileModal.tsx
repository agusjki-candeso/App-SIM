import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Save,
  RotateCcw,
  Sparkles,
  Link,
  ShieldCheck,
  User,
  MapPin,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { SchoolProfile } from '../types/school';
import { INITIAL_SCHOOL_PROFILE } from '../utils/initialData';
import { soundManager } from '../utils/sound';

interface SchoolProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SchoolProfile;
  onSaveProfile: (profile: SchoolProfile) => void;
  isAdmin?: boolean;
}

export const SchoolProfileModal: React.FC<SchoolProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  isAdmin = true,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    onSaveProfile(formData);
    soundManager.playSuccess();
    onClose();
  };

  const handleResetToDefault = () => {
    if (!isAdmin) return;
    if (confirm('Kembalikan profil ke data bawaan SMK Negeri 2 Songgom?')) {
      setFormData(INITIAL_SCHOOL_PROFILE);
      soundManager.playTick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-blue-950/30 to-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAdmin ? 'Pengaturan Profil Resmi Sekolah' : 'Profil & Informasi Resmi Sekolah'}
                </h3>
                {!isAdmin && (
                  <span className="px-2 py-0.5 rounded-md text-2xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Hanya-Lihat (Admin Only)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Perbarui identitas, KOP surat resmi, dan data kepala sekolah'
                  : 'Informasi identitas instansi dan data kepala sekolah'}
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

        {!isAdmin && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Perhatian:</strong> Hanya Administrator yang dapat merubah atau mengedit identitas, KOP, nama Kepala Sekolah, dan kontak sekolah.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          {/* Record ID & Logo URL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ID Record (id):
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                URL Logo Sekolah (logo):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  disabled={!isAdmin}
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-2xs text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                  required
                />
                <div className="w-10 h-10 rounded-xl border bg-white p-1 shrink-0 flex items-center justify-center">
                  <img
                    src={formData.logo}
                    alt="Pratinjau Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nama Sekolah */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Sekolah Resmi (nama_sekolah):
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formData.nama_sekolah}
              onChange={(e) => setFormData({ ...formData, nama_sekolah: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Alamat Lengkap */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Lengkap Sekolah (alamat):
            </label>
            <textarea
              rows={2}
              disabled={!isAdmin}
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Kepala Sekolah & NIP */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-3">
            <h4 className="text-2xs font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Identitas Kepala Sekolah
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kepala Sekolah (kepsek):
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.kepsek}
                  onChange={(e) => setFormData({ ...formData, kepsek: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NIP Kepala Sekolah (nip_kepsek):
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.nip_kepsek}
                  onChange={(e) => setFormData({ ...formData, nip_kepsek: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Guru / Operator & NIP */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-2xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              Operator / Guru Aktif (Google Sheets)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Operator (guru):
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.guru}
                  onChange={(e) => setFormData({ ...formData, guru: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NIP Guru (nip_guru):
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.nip_guru}
                  onChange={(e) => setFormData({ ...formData, nip_guru: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Optional: NPSN & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NPSN:
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.npsn || ''}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Akreditasi:
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.akreditasi || ''}
                onChange={(e) => setFormData({ ...formData, akreditasi: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Website:
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-2xs text-slate-900 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-xs"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
