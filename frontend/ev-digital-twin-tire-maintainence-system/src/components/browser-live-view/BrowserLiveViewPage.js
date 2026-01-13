import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function BrowserLiveViewPage() {
  const [searchParams] = useSearchParams();
  const liveViewUrl = searchParams.get('url');
  
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
    if (!dcvLoaded || !liveViewUrl) return;

    let mounted = true;

    async function connectToLiveView() {
      try {
        setLoading(true);
        setError(null);

        const dcv = window.dcv;
        if (!dcv) {
          throw new Error('DCV SDK not loaded');
        }

        // ✅ Wait for container to have dimensions
        const container = document.getElementById('dcv-display-container');
        if (!container) {
          throw new Error('Container not found');
        }

        // Wait for container to have actual dimensions (retry up to 10 times)
        let rect = container.getBoundingClientRect();
        let retries = 0;
        while ((rect.width === 0 || rect.height === 0) && retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          rect = container.getBoundingClientRect();
          retries++;
        }

        if (rect.width === 0 || rect.height === 0) {
          console.warn('⚠️ Container still has zero dimensions, using fallback');
          rect = { width: 1920, height: 1080 };
        }

        console.log(`📐 Container dimensions: ${rect.width}×${rect.height}`);

        dcv.setLogLevel(dcv.LogLevel.ERROR);
        console.log('🔌 Connecting to browser live view...');

        // Callback to inject AWS SigV4 query parameters
        // CRITICAL: Must match signature (method, url, body) and return URLSearchParams
        const httpExtraSearchParams = (method, url, body) => {
          const searchParams = new URL(liveViewUrl).searchParams;
          return searchParams;
        };

        console.log('🔑 Live View URL:', liveViewUrl);
        console.log('🔑 SigV4 Params:', Array.from(new URL(liveViewUrl).searchParams.entries()));

        // Authenticate and connect using the presigned URL directly
        dcv.authenticate(liveViewUrl, {
          promptCredentials: (authType, callback) => {
            callback(null, null);
          },
          httpExtraSearchParams: httpExtraSearchParams,
          success: (auth, result) => {
            if (!mounted) return;

            if (result && result[0]) {
              const { sessionId, authToken } = result[0];

              // Connect to DCV session using presigned URL
              dcv.connect({
                url: liveViewUrl,
                sessionId: sessionId,
                authToken: authToken,
                divId: 'dcv-display-container',
                baseUrl: window.location.origin + '/dcv-sdk/dcvjs-umd',
                screenScaling: 'stretch-to-window',  // ✅ Force scaling
                screenWidth: Math.floor(rect.width) || window.innerWidth,  // ✅ Explicit width
                screenHeight: Math.floor(rect.height) || (window.innerHeight - 50), // ✅ Explicit height
                observers: {
                  httpExtraSearchParams: httpExtraSearchParams,  // CRITICAL for WebSocket
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
            // Don't show error immediately - DCV SDK will retry automatically
            // Only show error if connection doesn't succeed within 3 seconds
            setTimeout(() => {
              if (!mounted || connectionRef.current) return;
              setError(`Auth failed: ${error?.message || 'Unknown'}`);
              setLoading(false);
            }, 3000);
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
  }, [dcvLoaded, liveViewUrl]);

  if (!liveViewUrl) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>❌ No Live View URL Provided</h2>
        <p>Please provide a valid live view URL in the query parameters.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#000' }}>
      <div style={{ padding: '10px', backgroundColor: '#1a1a1a', color: '#fff', borderBottom: '1px solid #333' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>🖥️ Browser Live View</h2>
      </div>

      <div style={{ width: '100%', height: 'calc(100vh - 50px)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', backgroundColor: '#000' }}>
        {loading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#fff'
          }}>
            <div style={{ 
              border: '4px solid #333', 
              borderTop: '4px solid #37bc12', 
              borderRadius: '50%', 
              width: '50px', 
              height: '50px', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Connecting to browser session...</p>
          </div>
        )}

        {error && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#fff',
            backgroundColor: '#ff4444',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Connection Error</p>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        )}

        <div id="dcv-display-container" ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
