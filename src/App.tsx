/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SchoolHeader, AppNavTab } from './components/SchoolHeader';
import { DashboardView } from './components/DashboardView';
import { AttendanceView } from './components/AttendanceView';
import { TeachingJournalView } from './components/TeachingJournalView';
import { SchedulesView } from './components/SchedulesView';
import { TeachersView } from './components/TeachersView';
import { StudentsView } from './components/StudentsView';
import { GradesView } from './components/GradesView';
import { OfficialDocumentGenerator } from './components/OfficialDocumentGenerator';
import { GoogleSheetsSyncCenter } from './components/GoogleSheetsSyncCenter';
import { SchoolProfileModal } from './components/SchoolProfileModal';
import { TeacherProfileModal } from './components/TeacherProfileModal';
import { LoginDashboardView } from './components/LoginDashboardView';
import { UserManagementModal } from './components/UserManagementModal';
import { ExamManagementView } from './components/ExamManagementView';
import { ExamAntiCheatRoom } from './components/ExamAntiCheatRoom';
import { StudentExamPortal } from './components/StudentExamPortal';
import {
  ExamSession,
  ExamQuestion,
  ExamViolationLog,
  ExamStudentResult,
} from './types/exam';
import {
  loadExamSessions,
  saveExamSessions,
  loadExamQuestions,
  saveExamQuestions,
  loadExamLogs,
  saveExamLogs,
  loadExamResults,
  saveExamResults,
} from './utils/examStorage';
import {
  SchoolProfile,
  SchoolClass,
  Teacher,
  Student,
  LessonSchedule,
  StudentGrade,
  StudentAttendance,
  TeachingJournal,
} from './types/school';
import { UserSession, UserRole, UserAccount, LoginSecurityState } from './types/auth';
import {
  loadSchoolProfile,
  saveSchoolProfile,
  loadSchoolClasses,
  saveSchoolClasses,
  loadTeachers,
  saveTeachers,
  loadStudents,
  saveStudents,
  loadLessonSchedules,
  saveLessonSchedules,
  loadStudentGrades,
  saveStudentGrades,
  loadAttendances,
  saveAttendances,
  loadJournals,
  saveJournals,
  loadSchoolSettings,
  saveSchoolSettings,
  loadUserAccounts,
  saveUserAccounts,
  loadLoginSecurity,
  saveLoginSecurity,
  SchoolSyncSettings,
} from './utils/schoolStorage';
import {
  saveUserAccountToGoogleSheets,
  saveAllUsersToGoogleSheets,
  fetchUsersFromGoogleSheets,
  SPREADSHEET_ID_DEFAULT,
} from './utils/googleSheetsApi';
import {
  googleSignIn,
  logoutGoogle,
  initAuth,
  setCachedAccessToken,
} from './utils/firebaseAuth';
import { soundManager } from './utils/sound';

const AUTH_STORAGE_KEY = 'smkn2songgom_auth_session';

export default function App() {
  const [profile, setProfile] = useState<SchoolProfile>(() => loadSchoolProfile());
  const [classes, setClasses] = useState<SchoolClass[]>(() => loadSchoolClasses());
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadTeachers());
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [schedules, setSchedules] = useState<LessonSchedule[]>(() => loadLessonSchedules());
  const [grades, setGrades] = useState<StudentGrade[]>(() => loadStudentGrades());
  const [attendances, setAttendances] = useState<StudentAttendance[]>(() => loadAttendances());
  const [journals, setJournals] = useState<TeachingJournal[]>(() => loadJournals());
  const [settings, setSettings] = useState<SchoolSyncSettings>(() => loadSchoolSettings());

  // User Accounts & Security States
  const [users, setUsers] = useState<UserAccount[]>(() => loadUserAccounts());
  const [securityState, setSecurityState] = useState<LoginSecurityState>(() => loadLoginSecurity());

  // CBT Exam States
  const [examSessions, setExamSessions] = useState<ExamSession[]>(() => loadExamSessions());
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>(() => loadExamQuestions());
  const [examViolationLogs, setExamViolationLogs] = useState<ExamViolationLog[]>(() => loadExamLogs());
  const [examResults, setExamResults] = useState<ExamStudentResult[]>(() => loadExamResults());
  const [activeExamSession, setActiveExamSession] = useState<ExamSession | null>(null);
  const [isStudentPortalActive, setIsStudentPortalActive] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('cbt') === '1' ||
        params.get('cbt') === 'true' ||
        params.has('session') ||
        params.has('token')
      );
    } catch (e) {
      return false;
    }
  });

  // Automatically load active session from URL query param if student clicked direct link or scanned QR
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      const tokenParam = params.get('token');
      if (sessionParam) {
        const found = examSessions.find(
          (s) =>
            s.id.toLowerCase() === sessionParam.toLowerCase() ||
            s.token.toUpperCase() === sessionParam.toUpperCase()
        );
        if (found) {
          setActiveExamSession(found);
          setIsStudentPortalActive(true);
        }
      } else if (tokenParam) {
        const found = examSessions.find(
          (s) => s.token.toUpperCase() === tokenParam.toUpperCase()
        );
        if (found) {
          setActiveExamSession(found);
          setIsStudentPortalActive(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [examSessions]);

  // User Authentication & Role State
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<AppNavTab>('dashboard');

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTeacherProfileModalOpen, setIsTeacherProfileModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCachedAccessToken(token);
        setUserSession((prev) => {
          const userEmail = (user.email || '').toLowerCase();
          const matchedUser = users.find(
            (u) => (u.email && u.email.toLowerCase() === userEmail) || u.username === userEmail.split('@')[0]
          );

          let detectedRole: UserRole = 'guru';
          if (matchedUser) {
            detectedRole = matchedUser.role;
          } else if (userEmail === 'agusjki.1681@gmail.com' || userEmail.includes('admin')) {
            detectedRole = 'admin';
          } else if (userEmail.includes('kepsek') || userEmail.includes('smkn2songgom.brebes')) {
            detectedRole = 'kepala_sekolah';
          }

          return {
            email: user.email || prev?.email || 'agusjki.1681@gmail.com',
            name: user.displayName || matchedUser?.nama || prev?.name || 'Agus Joko Iryanto, S.Kom',
            picture: user.photoURL || prev?.picture,
            role: prev?.role || detectedRole,
            accessToken: token,
            username: matchedUser?.username || userEmail.split('@')[0],
            guruNip: matchedUser?.nip,
            guruMapel: matchedUser?.mapel,
            userId: matchedUser?.id,
          };
        });
      },
      () => {
        // user signed out
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [users]);

  // Auto-save session
  useEffect(() => {
    if (userSession) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
      if (userSession.accessToken) {
        setCachedAccessToken(userSession.accessToken);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [userSession]);

  // Auto-save changes to localStorage
  useEffect(() => {
    saveSchoolProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveSchoolClasses(classes);
  }, [classes]);

  useEffect(() => {
    saveTeachers(teachers);
  }, [teachers]);

  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveLessonSchedules(schedules);
  }, [schedules]);

  useEffect(() => {
    saveStudentGrades(grades);
  }, [grades]);

  useEffect(() => {
    saveAttendances(attendances);
  }, [attendances]);

  useEffect(() => {
    saveJournals(journals);
  }, [journals]);

  useEffect(() => {
    saveSchoolSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveUserAccounts(users);
  }, [users]);

  useEffect(() => {
    saveLoginSecurity(securityState);
  }, [securityState]);

  // Automatically fetch / sync user accounts from Google Sheets "users" on startup
  useEffect(() => {
    let isMounted = true;
    const loadLiveUsers = async () => {
      try {
        const sheetsUsers = await fetchUsersFromGoogleSheets(
          SPREADSHEET_ID_DEFAULT,
          userSession?.accessToken
        );
        if (isMounted && sheetsUsers && sheetsUsers.length > 0) {
          setUsers((prev) => {
            // Merge with local changes if any, prioritizing live Sheets data
            const merged = [...sheetsUsers];
            prev.forEach((p) => {
              if (!merged.some((m) => m.id === p.id || m.username === p.username)) {
                merged.push(p);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.warn('Auto fetch users from Google Sheets skipped:', err);
      }
    };
    loadLiveUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh callback from Google Sheets
  const handleRefreshUsersFromSheets = async () => {
    const sheetsUsers = await fetchUsersFromGoogleSheets(
      SPREADSHEET_ID_DEFAULT,
      userSession?.accessToken
    );
    if (sheetsUsers && sheetsUsers.length > 0) {
      setUsers(sheetsUsers);
      saveUserAccounts(sheetsUsers);
    }
  };

  // Handle Google Login Flow with smart user role lookup
  const handleGoogleLogin = async () => {
    try {
      setIsSyncing(true);
      const res = await googleSignIn();
      if (!res) {
        // User closed or dismissed the popup
        return;
      }

      const { user, accessToken } = res;
      const userEmail = (user.email || '').toLowerCase();
      const matchedUser = users.find(
        (u) => (u.email && u.email.toLowerCase() === userEmail) || u.username === userEmail.split('@')[0]
      );

      let role: UserRole = 'guru';
      if (matchedUser) {
        role = matchedUser.role;
      } else if (userEmail === 'agusjki.1681@gmail.com' || userEmail.includes('admin')) {
        role = 'admin';
      } else if (userEmail.includes('kepsek') || userEmail.includes('smkn2songgom.brebes')) {
        role = 'kepala_sekolah';
      }

      const newSession: UserSession = {
        email: user.email || 'agusjki.1681@gmail.com',
        name: user.displayName || matchedUser?.nama || 'Agus Joko Iryanto, S.Kom',
        picture: user.photoURL || undefined,
        role: role,
        accessToken: accessToken,
        username: matchedUser?.username || userEmail.split('@')[0],
        guruNip: matchedUser?.nip,
        guruMapel: matchedUser?.mapel,
        userId: matchedUser?.id,
      };
      setUserSession(newSession);
      soundManager.playSuccess();
    } catch (err: any) {
      console.warn('Firebase Google Login issue:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setUserSession(null);
    soundManager.playCelebration();
  };

  const handleRoleSwitch = (newRole: 'admin' | 'guru' | 'kepala_sekolah') => {
    if (userSession) {
      setUserSession({
        ...userSession,
        role: newRole,
      });
      soundManager.playSuccess();
    }
  };

  // Handler for Profile Update
  const handleUpdateProfile = (newProfile: SchoolProfile) => {
    setProfile(newProfile);
    soundManager.playSuccess();
  };

  // Update user after login and auto-sync to Sheets
  const handleUpdateUserLogin = async (updatedUser: UserAccount) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === updatedUser.id);
      if (exists) {
        return prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      }
      return [updatedUser, ...prev];
    });

    // Auto-save to Google Sheets "user" in background
    try {
      saveUserAccountToGoogleSheets(
        SPREADSHEET_ID_DEFAULT,
        updatedUser,
        userSession?.accessToken,
        settings.webhookUrl
      );
    } catch (e) {
      console.warn('Auto sync user login failed', e);
    }
  };

  // Bulk sync all users to Google Sheets
  const handleSyncAllUsersToSheets = async () => {
    setIsSyncing(true);
    try {
      await saveAllUsersToGoogleSheets(
        SPREADSHEET_ID_DEFAULT,
        users,
        userSession?.accessToken,
        settings.webhookUrl
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Attendance Handlers
  const handleSaveAttendances = (records: StudentAttendance[]) => {
    setAttendances((prev) => {
      const copy = [...prev];
      records.forEach((newRec) => {
        const idx = copy.findIndex((a) => a.tanggal === newRec.tanggal && a.nis === newRec.nis);
        if (idx >= 0) {
          copy[idx] = newRec;
        } else {
          copy.push(newRec);
        }
      });
      return copy;
    });
  };

  // Teaching Journal Handlers
  const handleSaveJournal = (journal: TeachingJournal) => {
    setJournals((prev) => {
      const idx = prev.findIndex((j) => j.id === journal.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = journal;
        return copy;
      }
      return [journal, ...prev];
    });
  };

  const handleDeleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
  };

  // Grade Handlers
  const handleSaveGrade = (grade: StudentGrade) => {
    setGrades((prev) => {
      const idx = prev.findIndex(
        (g) => g.nisn === grade.nisn && g.mataPelajaran === grade.mataPelajaran
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = grade;
        return copy;
      }
      return [grade, ...prev];
    });
  };

  const handleSaveBatchGrades = (newGrades: StudentGrade[]) => {
    setGrades((prev) => {
      const copy = [...prev];
      newGrades.forEach((ng) => {
        const idx = copy.findIndex((g) => g.nisn === ng.nisn && g.mataPelajaran === ng.mataPelajaran);
        if (idx >= 0) {
          copy[idx] = ng;
        } else {
          copy.push(ng);
        }
      });
      return copy;
    });
  };

  const handleDeleteGrade = (nisn: string, mataPelajaran: string) => {
    setGrades((prev) => prev.filter((g) => !(g.nisn === nisn && g.mataPelajaran === mataPelajaran)));
  };

  // Schedule Handlers
  const handleSaveSchedule = (schedule: LessonSchedule) => {
    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.id === schedule.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = schedule;
        return copy;
      }
      return [...prev, schedule];
    });
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Teacher Handlers
  const handleSaveTeacher = (teacher: Teacher) => {
    setTeachers((prev) => {
      const idx = prev.findIndex((t) => t.id === teacher.id || t.nip === teacher.nip);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = teacher;
        return copy;
      }
      return [...prev, teacher];
    });
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  // Student Handlers
  const handleSaveStudent = (student: Student) => {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.nisn === student.nisn || s.nis === student.nis);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = student;
        return copy;
      }
      return [...prev, student];
    });
  };

  const handleDeleteStudent = (nisn: string) => {
    setStudents((prev) => prev.filter((s) => s.nisn !== nisn));
  };

  // CBT Exam Handlers
  const handleSaveExamSessions = (newSessions: ExamSession[]) => {
    setExamSessions(newSessions);
    saveExamSessions(newSessions);
  };

  const handleSaveExamQuestions = (newQuestions: ExamQuestion[]) => {
    setExamQuestions(newQuestions);
    saveExamQuestions(newQuestions);
  };

  const handleSaveExamResults = (newResults: ExamStudentResult[]) => {
    setExamResults(newResults);
    saveExamResults(newResults);
  };

  const handleSyncExamResultsToGrades = (cbtResults: ExamStudentResult[]) => {
    setGrades((prev) => {
      const updated = [...prev];
      for (const res of cbtResults) {
        const pred = res.finalScore >= 85 ? 'A' : res.finalScore >= 75 ? 'B' : res.finalScore >= 60 ? 'C' : 'D';
        const newGrade: StudentGrade = {
          id: `CBT_${res.sessionId}_${res.nisn}`,
          studentId: res.nisn,
          nisn: res.nisn,
          namaSiswa: res.studentName,
          kelas: res.studentClass,
          mataPelajaran: 'Informatika',
          tp: 'Asesmen CBT Anti-Cheat',
          jenis: 'Ujian Sekolah (CBT)',
          nilaiTugas: res.finalScore,
          nilaiUTS: res.finalScore,
          nilaiUAS: res.finalScore,
          nilaiPraktikUKK: res.finalScore,
          nilaiAkhir: res.finalScore,
          predikat: pred as any,
        };

        const existingIdx = updated.findIndex(
          (g) => g.nisn === res.nisn && (g.tp === 'Asesmen CBT Anti-Cheat' || g.id === newGrade.id)
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = newGrade;
        } else {
          updated.push(newGrade);
        }
      }
      saveStudentGrades(updated);
      return updated;
    });
  };

  // If student exam room is active, render the fullscreen anti-cheat exam room directly
  if (activeExamSession) {
    return (
      <ExamAntiCheatRoom
        session={activeExamSession}
        questions={examQuestions}
        students={students}
        spreadsheetId={settings.spreadsheetId || SPREADSHEET_ID_DEFAULT}
        accessToken={userSession?.accessToken}
        onExit={() => setActiveExamSession(null)}
        onFinished={(res) => {
          setExamResults((prev) => {
            const updated = [res, ...prev.filter((r) => r.id !== res.id)];
            saveExamResults(updated);
            return updated;
          });
        }}
      />
    );
  }

  // If student portal is active (via direct link ?cbt=1, ?session=..., or clicking "Portal CBT Siswa" on login)
  if (isStudentPortalActive) {
    return (
      <StudentExamPortal
        sessions={examSessions}
        questions={examQuestions}
        students={students}
        profile={profile}
        onSelectSession={(session) => {
          setActiveExamSession(session);
        }}
        onBackToLogin={() => setIsStudentPortalActive(false)}
      />
    );
  }

  // Authentication check: if no active session, show Login Dashboard
  if (!userSession) {
    return (
      <LoginDashboardView
        profile={profile}
        teachers={teachers}
        users={users}
        securityState={securityState}
        onUpdateSecurity={setSecurityState}
        onUpdateUserLogin={handleUpdateUserLogin}
        onLoginSuccess={(session) => setUserSession(session)}
        onGoogleOAuthLogin={handleGoogleLogin}
        onRefreshUsersFromSheets={handleRefreshUsersFromSheets}
        isSyncing={isSyncing}
        onOpenStudentPortal={() => setIsStudentPortalActive(true)}
      />
    );
  }

  const isAdmin = userSession.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Official Top School Header */}
      <SchoolHeader
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenTeacherProfileModal={() => setIsTeacherProfileModalOpen(true)}
        onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
        isSyncing={isSyncing}
        userSession={userSession}
        onLoginGoogle={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onRoleSwitch={handleRoleSwitch}
        teachers={teachers}
        isAdmin={isAdmin}
      />

      {/* Main Tab Views Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            classes={classes}
            teachers={teachers}
            students={students}
            schedules={schedules}
            grades={grades}
            onNavigateTab={setActiveTab}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onOpenTeacherProfileModal={() => setIsTeacherProfileModalOpen(true)}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            students={students}
            classes={classes}
            profile={profile}
            userSession={userSession}
            savedAttendances={attendances}
            onSaveAttendances={handleSaveAttendances}
            isAdmin={isAdmin}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}

        {activeTab === 'journal' && (
          <TeachingJournalView
            students={students}
            classes={classes}
            profile={profile}
            userSession={userSession}
            journals={journals}
            onSaveJournal={handleSaveJournal}
            onDeleteJournal={handleDeleteJournal}
            isAdmin={isAdmin}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}

        {activeTab === 'grades' && (
          <GradesView
            grades={grades}
            students={students}
            classes={classes}
            profile={profile}
            userSession={userSession}
            onSaveGrade={handleSaveGrade}
            onSaveBatchGrades={handleSaveBatchGrades}
            onDeleteGrade={handleDeleteGrade}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'cbt_exam' && (
          <ExamManagementView
            sessions={examSessions}
            questions={examQuestions}
            violationLogs={examViolationLogs}
            results={examResults}
            classes={classes}
            teachers={teachers}
            profile={profile}
            spreadsheetId={settings.spreadsheetId || SPREADSHEET_ID_DEFAULT}
            accessToken={userSession?.accessToken}
            onSaveSessions={handleSaveExamSessions}
            onSaveQuestions={handleSaveExamQuestions}
            onSaveResults={handleSaveExamResults}
            onEnterStudentExamRoom={(session) => setActiveExamSession(session)}
            onSyncWithGrades={handleSyncExamResultsToGrades}
          />
        )}

        {activeTab === 'schedules' && (
          <SchedulesView
            schedules={schedules}
            classes={classes}
            profile={profile}
            teachers={teachers}
            onSaveSchedule={handleSaveSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'teachers' && (
          <TeachersView
            teachers={teachers}
            profile={profile}
            onSaveTeacher={handleSaveTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onOpenTeacherProfileModal={() => setIsTeacherProfileModalOpen(true)}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            classes={classes}
            profile={profile}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'documents' && (
          <OfficialDocumentGenerator
            profile={profile}
            students={students}
            teachers={teachers}
          />
        )}
      </main>

      {/* Google Sheets Sync Hub Modal */}
      <GoogleSheetsSyncCenter
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        classes={classes}
        onUpdateClasses={setClasses}
        teachers={teachers}
        onUpdateTeachers={setTeachers}
        students={students}
        onUpdateStudents={setStudents}
        schedules={schedules}
        onUpdateSchedules={setSchedules}
        grades={grades}
        onUpdateGrades={setGrades}
        settings={settings}
        onUpdateSettings={setSettings}
        userSession={userSession}
        onLoginGoogle={handleGoogleLogin}
        onLogoutGoogle={handleGoogleLogout}
      />

      {/* School Profile & Headmaster Edit Modal (Only accessible by Admin or Kepsek) */}
      <SchoolProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
        isAdmin={isAdmin || userSession.role === 'kepala_sekolah'}
      />

      {/* Teacher / GTK Profile Modal (For Guru role) */}
      <TeacherProfileModal
        isOpen={isTeacherProfileModalOpen}
        onClose={() => setIsTeacherProfileModalOpen(false)}
        userSession={userSession}
        teachers={teachers}
        profile={profile}
        onSaveTeacher={(updatedTeacher) => {
          handleSaveTeacher(updatedTeacher);
          // Also sync current active operator name
          setProfile((prev) => ({
            ...prev,
            guru: updatedTeacher.nama,
            nip_guru: updatedTeacher.nip,
          }));
        }}
        onUpdateSessionName={(newName) => {
          if (userSession) {
            setUserSession((prev) => (prev ? { ...prev, name: newName } : null));
          }
        }}
      />

      {/* User Management & Security Lockout Modal (Admin) */}
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        users={users}
        securityState={securityState}
        onSaveUsers={setUsers}
        onResetSecurityLockout={() =>
          setSecurityState({
            failedAttempts: 0,
            lockoutUntil: 0,
            isLocked: false,
          })
        }
        onSyncUsersToSheets={handleSyncAllUsersToSheets}
        isSyncing={isSyncing}
      />

      {/* Clean Modern Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          SIM Sekolah Terpadu &bull; {profile.nama_sekolah}
        </p>
        <p className="text-2xs text-slate-400 mt-0.5">
          Sistem Informasi Manajemen Terintegrasi &bull; {profile.alamat}
        </p>
      </footer>

    </div>
  );
}
