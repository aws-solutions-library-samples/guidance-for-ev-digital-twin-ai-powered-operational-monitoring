import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import loginTracker from './services/loginTracker';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserLiveViewPage } from './components/browser-live-view/BrowserLiveViewPage';
import ChatWidget from './components/shared/ChatWidget';
import awsExports from './aws-exports';

// Configure Amplify - needed for both dev and prod for OAuth testing
Amplify.configure(awsExports);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  // Set to true to bypass auth in development (for quick testing without login)
  const [bypassAuth] = useState(false);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth events (OAuth redirects, sign in/out)
    const hubListener = Hub.listen('auth', async ({ payload }) => {
      console.log('Auth event:', payload.event);
      
      switch (payload.event) {
        case 'signedIn':
          console.log('User signed in via OAuth');
          await checkAuthState();
          break;
        case 'signedOut':
          setUser(null);
          setIsAuthenticated(false);
          break;
        case 'tokenRefresh':
          console.log('Token refreshed');
          break;
        case 'tokenRefresh_failure':
          console.error('Token refresh failed');
          setUser(null);
          setIsAuthenticated(false);
          break;
        case 'signInWithRedirect':
          console.log('Sign in with redirect initiated');
          break;
        case 'signInWithRedirect_failure':
          console.error('Sign in with redirect failed:', payload.data);
          setIsLoading(false);
          break;
        default:
          break;
      }
    });

    return () => hubListener();
  }, []);

  const checkAuthState = async () => {
    // Optional: bypass authentication for quick GenAI testing in development
    if (process.env.NODE_ENV === 'development' && bypassAuth) {
      console.log('Development mode: Bypassing authentication (bypassAuth=true)');
      const demoUser = { username: 'demo-user' };
      loginTracker.trackLogin(demoUser.username);
      setUser(demoUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      
      // Get user attributes from session for federated users
      let username = currentUser.username;
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken;
        if (idToken) {
          // For federated users, extract email from token
          const email = idToken.payload?.email;
          if (email) {
            username = email;
          }
        }
      } catch (sessionError) {
        console.log('Could not fetch session details:', sessionError);
      }
      
      // Track login for federated users
      loginTracker.trackLogin(username);
      
      setUser({ ...currentUser, username });
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
    } catch (error) {
      console.error('Error signing out:', error);
    }
    // Clear all cached auth state
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('CognitoIdentityServiceProvider') || key.startsWith('amplify-'))) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
    // Redirect to Cognito logout with correct client_id to reset the domain cookie,
    // then Cognito redirects back and the browser fetches fresh index.html (no-cache)
    const domain = awsExports.oauth?.domain;
    const clientId = awsExports.aws_user_pools_web_client_id;
    const logoutUri = encodeURIComponent(`${window.location.origin}/`);
    window.location.href = `https://${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
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
                <ChatWidget />
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;