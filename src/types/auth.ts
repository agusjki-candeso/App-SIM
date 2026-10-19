export type UserRole = 'admin' | 'guru' | 'kepala_sekolah' | 'guest';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  nama: string;
  email: string;
  nip: string;
  mapel?: string;
  jabatan?: string;
  status: 'Aktif' | 'Nonaktif';
  lastLogin?: string;
  fotoUrl?: string;
}

export interface LoginSecurityState {
  failedAttempts: number;
  lockoutUntil: number; // Unix timestamp in ms
  lastAttemptAt?: string;
  isLocked: boolean;
}

export interface UserSession {
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  accessToken: string;
  username?: string;
  guruNip?: string;
  guruMapel?: string;
  userId?: string;
}

export interface GoogleSheetsInfo {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
  }[];
}

