import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import loginTracker from '../services/loginTracker';
import './Login.css';

const Login = ({ onSignIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
                disabled={isLoading}
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
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
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
              disabled={isLoading || !username || !password}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
              disabled={isLoading}
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