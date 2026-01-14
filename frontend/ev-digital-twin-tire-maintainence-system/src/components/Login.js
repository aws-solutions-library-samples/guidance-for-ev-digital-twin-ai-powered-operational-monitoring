import React, { useState } from 'react';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';
import loginTracker from '../services/loginTracker';
import './Login.css';

const Login = ({ onSignIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMidwayLoading, setIsMidwayLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await signIn({
        username,
        password,
      });
      
      console.log('Sign in successful:', user);
      
      // Track successful login (fire-and-forget)
      loginTracker.trackLogin(username);
      
      onSignIn(user);
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMidwaySignIn = async () => {
    setIsMidwayLoading(true);
    setError('');
    
    try {
      console.log('Initiating Midway sign-in...');
      // Redirect to Midway OIDC provider
      await signInWithRedirect({
        provider: {
          custom: 'Midway'
        }
      });
      console.log('Redirect initiated');
    } catch (error) {
      console.error('Error signing in with Midway:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Fallback: Direct redirect to Cognito hosted UI with Midway provider
      console.log('Attempting fallback redirect...');
      const domain = 'ev-digital-twin.auth.us-east-1.amazoncognito.com';
      const clientId = '5pnsuntr6epe0s6v17lqq4bfms';
      const redirectUri = encodeURIComponent('http://localhost:3000/');
      const url = `https://${domain}/oauth2/authorize?identity_provider=Midway&redirect_uri=${redirectUri}&response_type=code&client_id=${clientId}&scope=openid`;
      console.log('Redirect URL:', url);
      window.location.href = url;
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    alert('Please contact your administrator to reset your password.');
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <div className="aws-logo">
              <div className="aws-icon">🔶</div>
            </div>
            <h1 className="login-title">Sign in</h1>
          </div>

          {/* Midway SSO Button */}
          <div className="midway-section">
            <button
              type="button"
              className="midway-button"
              onClick={handleMidwaySignIn}
              disabled={isMidwayLoading || isLoading}
            >
              <span className="midway-icon">🔐</span>
              {isMidwayLoading ? 'Redirecting to Midway...' : 'Sign in with Amazon Midway'}
            </button>
            <p className="midway-hint">For Amazon employees</p>
          </div>

          <div className="divider">
            <span className="divider-text">or</span>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="Enter your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading || isMidwayLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input password-input"
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || isMidwayLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isMidwayLoading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="sign-in-button"
              disabled={isLoading || isMidwayLoading || !username || !password}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
              disabled={isLoading || isMidwayLoading}
            >
              Forgot your password?
            </button>
          </form>

          <div className="login-footer">
            <p className="copyright">
              Copyright © 2024 Amazon Web Services, Inc. or its affiliates. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;