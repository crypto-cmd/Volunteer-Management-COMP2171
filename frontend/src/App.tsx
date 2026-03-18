import "./index.css";
import React, { useState } from 'react';
import VolunteerTimesheet from "./VolunteerTimesheet";
import { ToastContainer } from "./Toast";

// --- HOME COMPONENT ---
function Home({ navigateTo }) {
  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Volunteer Management System</h1>
        <p className="text-xl text-gray-600">Faculty of Science and Technology Guild Committee</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Timesheet Module Card */}
        <div
          onClick={() => navigateTo('timesheet')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-2xl">
            ⏱️
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">My Timesheet</h2>
          <p className="text-gray-600 text-sm">View your logged hours, track your attendance history, and see your impact.</p>
        </div>

        {/* Placeholder for other SRS features */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-4 text-2xl">
            📅
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Activities & Events</h2>
          <p className="text-gray-500 text-sm">Browse upcoming volunteer opportunities and register. (Coming Soon)</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-4 text-2xl">
            🏆
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Awards & Badges</h2>
          <p className="text-gray-500 text-sm">View your achievements and milestones. (Coming Soon)</p>
        </div>
      </div>
    </div>
  );
}

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