import React, { useEffect, useRef, useState } from 'react';
import './BrowserLiveViewModal.css';

export function BrowserLiveViewModal({ isOpen, onClose, liveViewUrl }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dcvLoaded, setDcvLoaded] = useState(false);
  const connectionRef = useRef(null);

  // Load DCV Web Client SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.dcv) {
      setDcvLoaded(true);
      return;
    }

    // Load DCV SDK from local public folder
    const script = document.createElement('script');
    script.src = '/dcv-sdk/dcvjs-umd/dcv.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ DCV SDK loaded');

      // Set worker path
      if (window.dcv && window.dcv.setWorkerPath) {
        window.dcv.setWorkerPath(window.location.origin + '/dcv-sdk/dcvjs-umd/dcv/');
      }

      setDcvLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load DCV SDK');
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Connect to Live View
  useEffect(() => {
    if (!isOpen || !dcvLoaded || !liveViewUrl) return;

    let mounted = true;

    async function connectToLiveView() {
      try {
        setLoading(true);
        setError(null);

        const dcv = window.dcv;
        if (!dcv) {
          throw new Error('DCV SDK not loaded');
        }

        dcv.setLogLevel(dcv.LogLevel.ERROR);
        console.log('🔌 Connecting to browser live view...');

        // Extract base URL and SigV4 parameters
        const url = new URL(liveViewUrl);
        const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
        const sigV4Params = url.searchParams;
        
        console.log('🔑 Base URL:', baseUrl);
        console.log('🔑 SigV4 Params:', Array.from(sigV4Params.entries()));

        // Callback to inject AWS SigV4 query parameters
        const httpExtraSearchParams = () => {
          return sigV4Params;
        };

        // Authenticate and connect using base URL (DCV will add auth params via callback)
        dcv.authenticate(baseUrl, {
          promptCredentials: (authType, callback) => {
            callback(null, null);
          },
          httpExtraSearchParams: httpExtraSearchParams,
          success: (auth, result) => {
            if (!mounted) return;

            if (result && result[0]) {
              const { sessionId, authToken } = result[0];

              // Connect to DCV session using base URL
              dcv.connect({
                url: baseUrl,
                sessionId: sessionId,
                authToken: authToken,
                divId: 'dcv-display-container',
                baseUrl: window.location.origin + '/dcv-sdk/dcvjs-umd',
                observers: {
                  httpExtraSearchParams: httpExtraSearchParams,
                  firstFrame: () => {
                    if (!mounted) return;
                    console.log('✅ DCV Connected - Live view active!');
                    setLoading(false);
                  },
                  error: (error) => {
                    console.error('❌ DCV Error:', error);
                    if (!mounted) return;
                    setError(`Connection error: ${error.message || 'Unknown'}`);
                    setLoading(false);
                  },
                },
              })
                .then((conn) => {
                  if (!mounted) return;
                  connectionRef.current = conn;
                })
                .catch((error) => {
                  if (!mounted) return;
                  console.error('❌ Connection failed:', error);
                  setError(`Failed: ${error.message || 'Unknown'}`);
                  setLoading(false);
                });
            }
          },
          error: (auth, error) => {
            if (!mounted) return;
            console.error('❌ Auth failed:', error);
            setError(`Auth failed: ${error?.message || 'Unknown'}`);
            setLoading(false);
          },
        });

      } catch (error) {
        if (!mounted) return;
        console.error('❌ Failed to connect:', error);
        setError(error.message || 'Unknown error');
        setLoading(false);
      }
    }

    connectToLiveView();

    return () => {
      mounted = false;
      if (connectionRef.current) {
        try {
          connectionRef.current.disconnect();
          connectionRef.current = null;
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    };
  }, [isOpen, dcvLoaded, liveViewUrl]);

  if (!isOpen) return null;

  return (
    <div className="browser-live-view-modal-overlay" onClick={onClose}>
      <div className="browser-live-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="browser-live-view-header">
          <h2>🖥️ Browser Live View</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="browser-live-view-content">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Connecting to browser session...</p>
            </div>
          )}

          {error && (
            <div className="error-overlay">
              <p className="error-title">Connection Error</p>
              <p className="error-message">{error}</p>
              <button onClick={() => window.location.reload()}>Reload Page</button>
            </div>
          )}

          <div id="dcv-display-container" ref={containerRef}></div>
        </div>
      </div>
    </div>
  );
}
