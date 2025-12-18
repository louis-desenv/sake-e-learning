
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import useLocalStorage from './hooks/useLocalStorage';
import type { UserProfile } from './types';

import Onboarding from './components/Onboarding';
import BottomNav from './components/BottomNav';
import HomeDashboard from './pages/HomeDashboard';
import IaChat from './pages/IaChat';
import GuidedLearning from './pages/GuidedLearning';
import IaLibrary from './pages/IaLibrary';
import MyProfile from './pages/MyProfile';
import LiveKitChat from './pages/LiveKitChat';
import { HomeIcon } from './components/icons/NavIcons';
import AudioOnlyChat from './components/AudioOnlyChat';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const showHomeButton = location.pathname !== '/home' && location.pathname !== '/';

  return (
    <>
      {showHomeButton && (
        <Link 
          to="/home" 
          aria-label="Back to Home"
          className="fixed top-4 left-4 z-50 flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-gray-800 hover:bg-white hover:shadow-xl transition-all duration-300 group"
        >
          <HomeIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          <span className="font-semibold text-sm hidden sm:inline">Home</span>
        </Link>
      )}
      <div className={showHomeButton ? 'pt-16' : ''}>
        <Outlet />
      </div>
    </>
  );
};


const App: React.FC = () => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);

  if (!userProfile) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Onboarding onOnboardingComplete={setUserProfile} />
        </div>
    );
  }

  return (
    <UserProvider value={userProfile}>
      <HashRouter>
        <div className="min-h-screen bg-blue-50/50 font-sans">
          <main className="pb-20 md:pb-0">
             <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/home" />} />
                  <Route path="/home" element={<HomeDashboard />} />
                  <Route path="/chat" element={<IaChat />} />
                  <Route path="/guided-learning" element={<GuidedLearning />} />
                  <Route path="/library" element={<IaLibrary />} />
                  <Route path="/profile" element={<MyProfile />} />
                  <Route path="/livekit-chat" element={<AudioOnlyChat />} />
                </Route>
             </Routes>
          </main>
          <BottomNav />
        </div>
      </HashRouter>
    </UserProvider>
  );
};

export default App;
