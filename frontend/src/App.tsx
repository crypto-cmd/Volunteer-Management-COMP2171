import "./index.css";
import { useEffect, useState } from 'react';
import VolunteerTimesheet from "./pages/VolunteerTimesheet";
import Home from "@pages/Home";
import { ToastContainer } from "./components/Toast";
import Events from "@pages/Events";
import Login from "@pages/Login";
import Profile from "@pages/Profile";
import Announcements from "@pages/Announcements";
import Badges from "@pages/Badges";
import { AuthApiService, type UserProfile } from "@services/AuthApiService";

const authApi = new AuthApiService();
const SESSION_KEY = "vm_current_user";


export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as UserProfile;
      setCurrentUser(parsed);
      setCurrentView('home');

      authApi.getProfile(parsed.studentId)
        .then((freshProfile) => {
          setCurrentUser(freshProfile);
          localStorage.setItem(SESSION_KEY, JSON.stringify(freshProfile));
        })
        .catch(() => {
          localStorage.removeItem(SESSION_KEY);
          setCurrentUser(null);
          setCurrentView('login');
        });
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentView('home');
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  };

  const handleProfileUpdated = (profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    localStorage.removeItem(SESSION_KEY);
  };

  if (!currentUser || currentView === 'login') {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <header className="bg-blue-800 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div
            className="font-bold text-xl tracking-wide cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            FSTGC Volunteer Portal
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>Welcome, {currentUser.name || currentUser.studentId}</span>
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="py-6">
        {currentView === 'home' && <Home navigateTo={setCurrentView} />}
        {currentView === 'timesheet' && <VolunteerTimesheet navigateTo={setCurrentView} role={currentUser.role} />}
        {currentView === 'events' && <Events navigateTo={setCurrentView} role={currentUser.role} />}
        {currentView === 'announcements' && <Announcements navigateTo={setCurrentView} role={currentUser.role} />}
        {currentView === 'badges' && <Badges navigateTo={setCurrentView} role={currentUser.role} currentStudentId={currentUser.studentId} />}
        {currentView === 'profile' && (
          <Profile
            currentUser={currentUser}
            navigateTo={setCurrentView}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {/* Toast Notifications */}
        <ToastContainer />
      </main>
    </div>
  );
}