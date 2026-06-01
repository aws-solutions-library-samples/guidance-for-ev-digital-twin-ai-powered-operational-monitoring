import React, { useState } from 'react';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';
import loginTracker from '../services/loginTracker';
import awsmobile from '../aws-exports';
import './Login.css';

// Identity provider name registered in the Cognito User Pool for SAML
// federation. Must match the ProviderName configured in cognito-stack.yaml
// (CorporateSAMLProvider). Override via env var if a different IdP name is used.
const SSO_PROVIDER_NAME = process.env.REACT_APP_SSO_PROVIDER_NAME || 'CorporateSSO';

const Login = ({ onSignIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
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

  const handleSsoSignIn = async () => {
    setIsSsoLoading(true);
    setError('');

    try {
      console.log('Initiating corporate SSO sign-in...');
      // Redirect to the configured corporate SAML/OIDC provider
      await signInWithRedirect({
        provider: {
          custom: SSO_PROVIDER_NAME
        }
      });
      console.log('Redirect initiated');
    } catch (error) {
      console.error('Error signing in with corporate SSO:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Fallback: Direct redirect to Cognito hosted UI with the SSO provider
      console.log('Attempting fallback redirect...');
      const domain = awsmobile.oauth?.domain || '';
      const clientId = awsmobile.aws_user_pools_web_client_id || '';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const redirectUri = encodeURIComponent(isLocalhost ? 'http://localhost:3000/' : `${window.location.origin}/`);
      const url = `https://${domain}/oauth2/authorize?identity_provider=${encodeURIComponent(SSO_PROVIDER_NAME)}&redirect_uri=${redirectUri}&response_type=code&client_id=${clientId}&scope=openid`;
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

          {/* Corporate SSO Button */}
          <div className="sso-section">
            <button
              type="button"
              className="sso-button"
              onClick={handleSsoSignIn}
              disabled={isSsoLoading || isLoading}
            >
              <span className="sso-icon">🔐</span>
              {isSsoLoading ? 'Redirecting to Corporate SSO...' : 'Sign in with Corporate SSO'}
            </button>
            <p className="sso-hint">For SSO users</p>
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
                disabled={isLoading || isSsoLoading}
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
                  disabled={isLoading || isSsoLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isSsoLoading}
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
              disabled={isLoading || isSsoLoading || !username || !password}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
              disabled={isLoading || isSsoLoading}
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
