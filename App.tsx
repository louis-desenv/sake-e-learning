
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import useLocalStorage from './hooks/useLocalStorage';
import type { UserProfile } from './types';

import Onboarding from './components/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import BottomNav from './components/BottomNav';
import PageTransition from './components/PageTransition';
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
      {
      
    

      showHomeButton && (
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
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
    </>
  );
};


const App: React.FC = () => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);

  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-blue-50/50 font-sans">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/" element={<Navigate to="/home" />} />
              <Route path="/home" element={
                <UserProvider value={userProfile}>
                  <HomeDashboard />
                </UserProvider>
              } />
              <Route path="/chat" element={
                <UserProvider value={userProfile}>
                  <IaChat />
                </UserProvider>
              } />
              <Route path="/guided-learning" element={
                <UserProvider value={userProfile}>
                  <GuidedLearning />
                </UserProvider>
              } />
              <Route path="/library" element={
                <UserProvider value={userProfile}>
                  <IaLibrary />
                </UserProvider>
              } />
              <Route path="/profile" element={
                <UserProvider value={userProfile}>
                  <MyProfile />
                </UserProvider>
              } />
              <Route path="/livekit-chat" element={
                <UserProvider value={userProfile}>
                  <AudioOnlyChat />
                </UserProvider>
              } />
            </Route>
          </Routes>

          {/* Show BottomNav only on protected routes */}
          <BottomNav />
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
