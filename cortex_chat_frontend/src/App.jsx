// src/App.jsx
import React from 'react';
import { useAuth, AuthProvider } from './hooks/useAuth.jsx'; // Assuming AuthProvider is here
import { StompProvider } from './contexts/StompContext.jsx'; // Import StompProvider
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';

import WelcomePage from './pages/WelcomePage.jsx'; 
import LoginPage from './pages/LoginPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const ProtectedRouteContent = ({ element: Element }) => { 
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (Element === ChatPage) {
    return (
      <StompProvider>
        <Element />
      </StompProvider>
    );
  }
  return <Element />; 
};

const ProtectedRoute = ({ element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <ProtectedRouteContent element={element} /> : <Navigate to="/login" replace />;
};

const RootPageHandler = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/chat" replace /> : <WelcomePage />;
};

const PublicOnlyRoute = ({ element: Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/chat" replace /> : <Element />;
};


function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<RootPageHandler />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<ProtectedRoute element={ChatPage} />} /> {/* Pass ChatPage */}
        <Route path="/profile" element={<ProtectedRoute element={ProfilePage} />} /> {/* Pass ProfilePage */}
      </Routes>
    </div>
  );
}

// Main App component that includes all providers
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;