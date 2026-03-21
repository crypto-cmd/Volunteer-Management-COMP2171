import "./index.css";
import React, { useState } from 'react';
import VolunteerTimesheet from "./pages/VolunteerTimesheet";
import Home from "./pages/Home";
import { ToastContainer } from "./components/Toast";

// --- MAIN APP ENTRY POINT ---
export default function App() {
  const [currentView, setCurrentView] = useState('home');

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
          <div className="text-sm">
            Welcome, Volunteer
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="py-6">
        {currentView === 'home' && <Home navigateTo={setCurrentView} />}
        {currentView === 'timesheet' && <VolunteerTimesheet navigateTo={setCurrentView} />}

        {/* Toast Notifications */}
        <ToastContainer />
      </main>
    </div>
  );
}