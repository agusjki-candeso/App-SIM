import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Users,
  Building2,
  Key,
  Lock,
  Plus,
  Trash2,
  Save,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  ShieldAlert,
  Unlock,
  Sparkles,
} from 'lucide-react';
import { UserAccount, LoginSecurityState } from '../types/auth';
import { soundManager } from '../utils/sound';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  securityState: LoginSecurityState;
  onSaveUsers: (users: UserAccount[]) => void;
  onResetSecurityLockout: () => void;
  onSyncUsersToSheets: () => Promise<void>;
  isSyncing?: boolean;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  securityState,
  onSaveUsers,
  onResetSecurityLockout,
  onSyncUsersToSheets,
  isSyncing = false,
}) => {
  const [userList, setUserList] = useState<UserAccount[]>(users);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'admin' | 'guru' | 'kepala_sekolah'>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState<Partial<UserAccount>>({
    username: '',
    password: '',
    role: 'guru',
    nama: '',
    email: '',
    nip: '',
    mapel: '',
    status: 'Aktif',
  });

  // Sync state when props change
  React.useEffect(() => {
    setUserList(users);
  }, [users]);

  if (!isOpen) return null;

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateField = (id: string, field: keyof UserAccount, value: any) => {
    setUserList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  };

  const handleSaveAll = () => {
    onSaveUsers(userList);
    setStatusMessage({ type: 'success', text: 'Data pengguna berhasil disimpan secara lokal!' });
    soundManager.playSuccess();
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSyncToSheets = async () => {
    try {
      setStatusMessage(null);
      await onSyncUsersToSheets();
      setStatusMessage({ type: 'success', text: 'Database user berhasil disinkronkan ke Google Sheets tab (user)!' });
      soundManager.playSuccess();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Gagal sinkron ke Google Sheets' });
      soundManager.playError();
    }
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.nama) {
      setStatusMessage({ type: 'error', text: 'Nama dan Username wajib diisi!' });
      soundManager.playWarning();
      return;
    }

    const created: UserAccount = {
      id: `USR_${Date.now()}`,
      username: newUser.username.trim().toLowerCase(),
      password: newUser.password?.trim() || 'guru123',
      role: newUser.role || 'guru',
      nama: newUser.nama.trim(),
      email: newUser.email?.trim() || `${newUser.username}@smkn2songgom.sch.id`,
      nip: newUser.nip?.trim() || '-',
      mapel: newUser.mapel?.trim() || '-',
      status: 'Aktif',
      lastLogin: new Date().toISOString(),
    };

    const updated = [created, ...userList];
    setUserList(updated);
    onSaveUsers(updated);
    setShowAddForm(false);
    setNewUser({
      username: '',
      password: '',
      role: 'guru',
      nama: '',
      email: '',
      nip: '',
      mapel: '',
      status: 'Aktif',
    });
    setStatusMessage({ type: 'success', text: `Pengguna ${created.nama} berhasil ditambahkan!` });
    soundManager.playSuccess();
  };

  const handleDeleteUser = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${nama}?`)) {
      const updated = userList.filter((u) => u.id !== id);
      setUserList(updated);
      onSaveUsers(updated);
      setStatusMessage({ type: 'success', text: `Akun ${nama} telah dihapus.` });
      soundManager.playCelebration();
    }
  };

  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nip && u.nip.includes(searchQuery));
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Strip */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Manajemen Keamanan & Pengguna SIM</span>
                <span className="px-2 py-0.5 rounded-md text-3xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Sheets (user)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kelola hak akses Admin, Kepala Sekolah, dan Guru serta perlindungan anti-brute force
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`px-6 py-3 text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/70 border-b border-emerald-800 text-emerald-300'
                : 'bg-rose-950/70 border-b border-rose-800 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Security Overview & Controls Strip */}
        <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 text-xs">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Total Akun: <strong>{userList.length}</strong></span>
            </div>

            {securityState.isLocked && (
              <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Pengaman Login Aktif (Terkunci)</span>
                <button
                  onClick={() => {
                    onResetSecurityLockout();
                    setStatusMessage({ type: 'success', text: 'Kunci keamanan berhasil direset!' });
                  }}
                  className="ml-2 px-2 py-0.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-3xs font-bold flex items-center gap-1"
                >
                  <Unlock className="w-3 h-3" />
                  Reset Lockout
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'Tutup Form' : 'Tambah Pengguna Baru'}</span>
            </button>

            <button
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron ke Sheets (user)'}</span>
            </button>

            <button
              onClick={handleSaveAll}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Simpan Lokal</span>
            </button>
          </div>

        </div>

        {/* Add User Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddNewUser} className="p-6 bg-slate-950/80 border-b border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Tambah Akun Pengguna Baru</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-2xs font-semibold text-slate-300 block mb-1">Peran / Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="admin">Administrator SIM</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                  <option value="guru">Guru / Tenaga Pendidik</option>
                </select>
              </div>

              <div>
                <label className="text-2xs font-semibold text-slate-300 block mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso, S.Pd"
                  value={newUser.nama}
                  onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                  required
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-2xs font-semibold text-slate-300 block mb-1">Username Login</label>
                <input
                  type="text"
                  placeholder="Contoh: budisantoso"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-2xs font-semibold text-slate-300 block mb-1">Kata Sandi / PIN</label>
                <input
                  type="text"
                  placeholder="Default: guru123"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-2xs font-semibold text-slate-300 block mb-1">NIP / NUPTK</label>
                <input
                  type="text"
                  placeholder="198101..."
                  value={newUser.nip}
                  onChange={(e) => setNewUser({ ...newUser, nip: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-2xs font-semibold text-slate-300 block mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Informatika / Kejuruan"
                  value={newUser.mapel}
                  onChange={(e) => setNewUser({ ...newUser, mapel: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                Simpan Pengguna
              </button>
            </div>
          </form>
        )}

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIP, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-2xs w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedRoleFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedRoleFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({userList.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('admin')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedRoleFilter === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin ({userList.filter((u) => u.role === 'admin').length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('kepala_sekolah')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedRoleFilter === 'kepala_sekolah' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kepsek ({userList.filter((u) => u.role === 'kepala_sekolah').length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('guru')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedRoleFilter === 'guru' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Guru ({userList.filter((u) => u.role === 'guru').length})
            </button>
          </div>
        </div>

        {/* User Table List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-2xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Peran</th>
                  <th className="p-3">Nama & NIP</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Kata Sandi</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredUsers.map((user) => {
                  const isEditing = editingUserId === user.id;
                  const isPasswordVisible = showPasswordMap[user.id] || false;

                  return (
                    <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                      
                      {/* Role Badge */}
                      <td className="p-3">
                        {user.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-300 text-3xs font-extrabold">
                            <ShieldCheck className="w-3 h-3" />
                            ADMIN
                          </span>
                        )}
                        {user.role === 'kepala_sekolah' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-300 text-3xs font-extrabold">
                            <Building2 className="w-3 h-3" />
                            KEPSEK
                          </span>
                        )}
                        {user.role === 'guru' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-3xs font-extrabold">
                            <Users className="w-3 h-3" />
                            GURU
                          </span>
                        )}
                      </td>

                      {/* Name & NIP */}
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={user.nama}
                              onChange={(e) => handleUpdateField(user.id, 'nama', e.target.value)}
                              className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                            <input
                              type="text"
                              value={user.nip}
                              onChange={(e) => handleUpdateField(user.id, 'nip', e.target.value)}
                              className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-2xs text-slate-400 font-mono"
                            />
                          </div>
                        ) : (
                          <div>
                            <strong className="text-white block font-medium">{user.nama}</strong>
                            <span className="text-2xs text-slate-400 font-mono">NIP. {user.nip || '-'}</span>
                          </div>
                        )}
                      </td>

                      {/* Username */}
                      <td className="p-3 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={user.username}
                            onChange={(e) => handleUpdateField(user.id, 'username', e.target.value)}
                            className="p-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                          />
                        ) : (
                          <span className="text-slate-200">{user.username}</span>
                        )}
                      </td>

                      {/* Password with View Toggle */}
                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={user.password}
                              onChange={(e) => handleUpdateField(user.id, 'password', e.target.value)}
                              className="p-1 bg-slate-900 border border-slate-700 rounded text-xs text-amber-300 font-mono w-28"
                            />
                          ) : (
                            <span className="text-amber-300">
                              {isPasswordVisible ? user.password : '••••••••'}
                            </span>
                          )}
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(user.id)}
                              className="text-slate-500 hover:text-slate-300 p-1"
                              title="Tampilkan / Sembunyikan Sandi"
                            >
                              {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={user.status}
                            onChange={(e) => handleUpdateField(user.id, 'status', e.target.value)}
                            className="p-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          >
                            <option value="Aktif">Aktif</option>
                            <option value="Nonaktif">Nonaktif</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-3xs font-bold ${
                              user.status === 'Aktif'
                                ? 'bg-emerald-950 border border-emerald-700/60 text-emerald-400'
                                : 'bg-rose-950 border border-rose-700/60 text-rose-400'
                            }`}
                          >
                            {user.status}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                handleSaveAll();
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-2xs font-bold"
                            >
                              Selesai
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingUserId(user.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-2xs font-bold transition-all"
                            >
                              Edit
                            </button>
                          )}

                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.nama)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-all"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-2xs text-slate-400">
          <span>
            Database terintegrasi otomatis dengan Google Sheets tab <strong>user</strong> (GID 158463269).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
