// AWS Credentials Management for Bedrock Access
export const setAWSCredentials = (credentials) => {
  // Store credentials globally for Bedrock service access
  window.AWS_CREDENTIALS = credentials;
  
  // Also set in process.env for immediate use (in development only)
  if (process.env.NODE_ENV === 'development') {
    process.env.REACT_APP_AWS_ACCESS_KEY_ID = credentials.accessKeyId;
    process.env.REACT_APP_AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
    process.env.REACT_APP_AWS_SESSION_TOKEN = credentials.sessionToken;
  }
  
  console.log('AWS credentials set for Bedrock access');
};

export const getAWSCredentials = () => {
  return window.AWS_CREDENTIALS || {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
    sessionToken: process.env.REACT_APP_AWS_SESSION_TOKEN || ''
  };
};

export const hasValidCredentials = () => {
  const creds = getAWSCredentials();
  return !!(creds.accessKeyId && creds.secretAccessKey);
};

// Auto-set credentials from current session if available
if (typeof window !== 'undefined') {
  // Try to get credentials from URL parameters (for demo purposes)
  const urlParams = new URLSearchParams(window.location.search);
  const accessKey = urlParams.get('aws_access_key_id');
  const secretKey = urlParams.get('aws_secret_access_key');
  const sessionToken = urlParams.get('aws_session_token');
  
  if (accessKey && secretKey) {
    setAWSCredentials({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      sessionToken: sessionToken
    });
  }
}