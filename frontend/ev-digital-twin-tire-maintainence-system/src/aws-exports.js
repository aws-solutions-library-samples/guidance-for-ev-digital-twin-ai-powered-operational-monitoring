// AWS Cognito configuration for EV Digital Twin
// Account 844874421931 configuration

// Detect if running locally
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const redirectUrl = isLocalhost 
  ? 'http://localhost:3000/' 
  : `${window.location.origin}/`;

const awsmobile = {
  "aws_project_region": "us-east-1",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "us-east-1_qJ3MBXrdC",
  "aws_user_pools_web_client_id": "5d0g8d19gvuum4lp6oucbe9stt",
  "oauth": {
    "domain": "ev-digital-twin.auth.us-east-1.amazoncognito.com",
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