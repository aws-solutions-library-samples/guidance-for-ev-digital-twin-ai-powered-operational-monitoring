import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import loginTracker from './services/loginTracker';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserLiveViewPage } from './components/browser-live-view/BrowserLiveViewPage';
import awsExports from './aws-exports';

// Configure Amplify only in production
if (process.env.NODE_ENV === 'production') {
  Amplify.configure(awsExports);
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    // In development mode, bypass authentication for GenAI testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing authentication for GenAI testing');
      const demoUser = { username: 'demo-user' };
      
      // Track development mode login
      loginTracker.trackLogin(demoUser.username);
      
      setUser(demoUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('User not authenticated:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = (user) => {
    setUser(user);
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <Login onSignIn={handleSignIn} />
          } 
        />
        <Route 
          path="/browser-live-view" 
          element={<BrowserLiveViewPage />} 
        />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <div className="dashboard-container">
                {isAuthenticated && (
                  <div className="user-info">
                    <span>Welcome, {user?.username || 'User'}</span>
                    <button onClick={handleSignOut} className="sign-out-button">
                      Sign Out
                    </button>
                  </div>
                )}
                <Dashboard />
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;