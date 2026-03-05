// AWS Cognito configuration for EV Digital Twin
// Values are driven by environment variables so each deployment
// automatically picks up the correct User Pool and client ID.
// Set REACT_APP_COGNITO_* in your .env.local / .env.production files.

// Detect if running locally
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const redirectUrl = isLocalhost 
  ? 'http://localhost:3000/' 
  : `${window.location.origin}/`;

const awsmobile = {
  "aws_project_region": process.env.REACT_APP_COGNITO_REGION || "us-east-1",
  "aws_cognito_region": process.env.REACT_APP_COGNITO_REGION || "us-east-1",
  "aws_user_pools_id": process.env.REACT_APP_COGNITO_USER_POOL_ID || "us-east-1_CrSxdrt6f",
  "aws_user_pools_web_client_id": process.env.REACT_APP_COGNITO_CLIENT_ID || "5pnsuntr6epe0s6v17lqq4bfms",
  "oauth": {
    "domain": process.env.REACT_APP_COGNITO_DOMAIN || "ev-digital-twin.auth.us-east-1.amazoncognito.com",
    "scope": ["email", "openid", "profile"],
    "redirectSignIn": redirectUrl,
    "redirectSignOut": redirectUrl,
    "responseType": "code"
  },
  "aws_cognito_username_attributes": ["EMAIL"],
  "aws_cognito_social_providers": [],
  "aws_cognito_signup_attributes": ["EMAIL"],
  "aws_cognito_mfa_configuration": "OFF",
  "aws_cognito_mfa_types": ["SMS"],
  "aws_cognito_password_protection_settings": {
    "passwordPolicyMinLength": 8,
    "passwordPolicyCharacters": [
      "REQUIRES_LOWERCASE",
      "REQUIRES_UPPERCASE", 
      "REQUIRES_NUMBERS",
      "REQUIRES_SYMBOLS"
    ]
  },
  "aws_cognito_verification_mechanisms": ["EMAIL"],
  "aws_cognito_signup_disabled": true
};

export default awsmobile;
