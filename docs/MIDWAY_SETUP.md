# Midway (Amazon Federate) Authentication Setup

This guide explains how to configure Midway SSO authentication for Amazon employees.

## Overview

Midway authentication allows Amazon employees to sign in using their corporate credentials without needing a separate username/password for this application.

## Architecture

```
User clicks "Sign in with Amazon Midway"
    ↓
Cognito redirects to Midway SAML endpoint
    ↓
User authenticates with Midway (badge tap, PIN, etc.)
    ↓
Midway returns SAML assertion to Cognito
    ↓
Cognito creates/updates user and issues tokens
    ↓
User redirected back to application (authenticated)
```

## Prerequisites

1. AWS Account with Cognito User Pool deployed
2. Access to Amazon Federate (Midway) configuration
3. CloudFront domain for callback URLs

## Setup Steps

### Step 1: Get Cognito User Pool Details

After deploying the Cognito stack, note these values:

```bash
# Get User Pool ID
aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-cognito \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
  --output text --profile demo

# Get User Pool Domain
aws cloudformation describe-stacks \
  --stack-name ev-digital-twin-cognito \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolDomain'].OutputValue" \
  --output text --profile demo
```

### Step 2: Register Application with Amazon Federate

1. Go to Amazon Federate portal: https://federate.amazon.com
2. Register a new SAML application with these settings:

| Setting | Value |
|---------|-------|
| Application Name | EV Digital Twin |
| ACS URL | `https://<user-pool-domain>/saml2/idpresponse` |
| Entity ID | `urn:amazon:cognito:sp:<user-pool-id>` |
| Name ID Format | Email |

Example values:
- ACS URL: `https://ev-digital-twin-844874421931.auth.us-east-1.amazoncognito.com/saml2/idpresponse`
- Entity ID: `urn:amazon:cognito:sp:us-east-1_qJ3MBXrdC`

### Step 3: Configure Attribute Mapping

Map these SAML attributes in Federate:

| SAML Attribute | Cognito Attribute |
|----------------|-------------------|
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` | email |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname` | given_name |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname` | family_name |

### Step 4: Update Cognito Stack

Deploy the updated Cognito stack with Midway configuration:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cognito-stack.yaml \
  --stack-name ev-digital-twin-cognito \
  --parameter-overrides \
    CallbackURL=https://d1bo5awedntspd.cloudfront.net/ \
    MidwayMetadataURL=https://midway-auth.amazon.com/SSO/saml/metadata \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile demo
```

### Step 5: Update Callback URLs

After deployment, add your CloudFront domain to the allowed callback URLs:

```bash
# Get the User Pool Client ID
CLIENT_ID=$(aws cognito-idp list-user-pool-clients \
  --user-pool-id us-east-1_qJ3MBXrdC \
  --query "UserPoolClients[0].ClientId" \
  --output text --profile demo)

# Update callback URLs
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_qJ3MBXrdC \
  --client-id $CLIENT_ID \
  --callback-urls \
    "https://d1bo5awedntspd.cloudfront.net/" \
    "https://d1bo5awedntspd.cloudfront.net" \
    "http://localhost:3000/" \
    "http://localhost:3000" \
  --logout-urls \
    "https://d1bo5awedntspd.cloudfront.net/" \
    "https://d1bo5awedntspd.cloudfront.net" \
    "http://localhost:3000/" \
    "http://localhost:3000" \
  --supported-identity-providers COGNITO Midway \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes email openid profile \
  --allowed-o-auth-flows-user-pool-client \
  --profile demo
```

### Step 6: Update Frontend Configuration

Update `src/aws-exports.js` with the OAuth configuration:

```javascript
const awsmobile = {
  // ... existing config ...
  "oauth": {
    "domain": "ev-digital-twin-844874421931.auth.us-east-1.amazoncognito.com",
    "scope": ["email", "openid", "profile"],
    "redirectSignIn": "https://d1bo5awedntspd.cloudfront.net/",
    "redirectSignOut": "https://d1bo5awedntspd.cloudfront.net/",
    "responseType": "code"
  }
};
```

### Step 7: Rebuild and Deploy Frontend

```bash
cd frontend/ev-digital-twin-tire-maintainence-system
npm run build
aws s3 sync build/ s3://ev-digital-twin-frontend-844874421931 --delete --profile demo
aws cloudfront create-invalidation --distribution-id E2EXAMPLE --paths "/*" --profile demo
```

## Testing

1. Open the CloudFront URL: https://d1bo5awedntspd.cloudfront.net
2. Click "Sign in with Amazon Midway"
3. Authenticate with your Amazon credentials (badge tap, PIN, etc.)
4. You should be redirected back to the application, authenticated

## Troubleshooting

### "Invalid redirect_uri" Error

Ensure the callback URL in `aws-exports.js` exactly matches one of the URLs configured in Cognito User Pool Client.

### "Identity provider not found" Error

Verify the Midway identity provider is configured in Cognito:

```bash
aws cognito-idp describe-identity-provider \
  --user-pool-id us-east-1_qJ3MBXrdC \
  --provider-name Midway \
  --profile demo
```

### SAML Assertion Errors

Check CloudWatch logs for the Cognito User Pool:
- Look for SAML assertion parsing errors
- Verify attribute mapping is correct

### User Not Created

Ensure the Cognito User Pool allows federated users:
- `AdminCreateUserConfig.AllowAdminCreateUserOnly` should be `false`

## Security Considerations

1. **Token Expiry**: Access tokens expire after 1 hour, ID tokens after 1 hour, refresh tokens after 30 days
2. **HTTPS Only**: All callback URLs must use HTTPS (except localhost for development)
3. **Domain Verification**: Only verified domains can be used as callback URLs

## References

- [Amazon Federate Documentation](https://w.amazon.com/bin/view/AWS_Training_and_Certification/Curriculum/Engineering/Architecture/LeveragingAmznFederate/)
- [Cognito SAML Identity Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-saml-idp.html)
- [AWS Amplify Auth](https://docs.amplify.aws/lib/auth/social/q/platform/js/)
