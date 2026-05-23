import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Auth from './components/Auth';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check local storage for existing session
    const savedUser = localStorage.getItem('vision_detect_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user session:', e);
      }
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('vision_detect_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vision_detect_user');
  };

  // Block dashboard access unless signed in
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen">
      <Home 
        toggleTheme={toggleTheme} 
        darkMode={darkMode} 
        user={user} 
        onLogout={handleLogout} 
      />
    </div>
  );
}

export default App;
