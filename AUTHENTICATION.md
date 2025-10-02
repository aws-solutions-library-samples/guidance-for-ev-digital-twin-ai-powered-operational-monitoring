# 🔐 EV Digital Twin - Authentication Guide

## Overview

The EV Digital Twin application uses **AWS Cognito** for secure user authentication with a **login-first architecture**. Self-registration is disabled, and only administrators can create user accounts.

## 🏗️ Authentication Architecture

```
User → Login Page → AWS Cognito → Dashboard
                      ↓
                 Admin Creates Users
```

### Key Security Features

- ✅ **Admin-Only User Creation** - Self-registration disabled
- ✅ **Strong Password Policy** - 8+ characters with complexity requirements
- ✅ **Secure Login Flow** - AWS Cognito SRP (Secure Remote Password)
- ✅ **Session Management** - Automatic token refresh
- ✅ **Password Recovery** - Email-based password reset
- ✅ **HTTPS Only** - All authentication traffic encrypted

## 🚀 Getting Started

### Demo Credentials

After deployment, use these credentials to access the application:

- **Username**: `admin`
- **Email**: `admin@example.com`
- **Temporary Password**: `TempPass123!`

⚠️ **Important**: You must change the temporary password on first login.

### First Login Process

1. Visit the application URL
2. Enter demo credentials
3. You'll be prompted to set a new password
4. Password must meet these requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

## 👥 User Management

### Creating New Users

#### Option 1: AWS Console (Recommended)
1. Go to **AWS Console** → **Cognito** → **User Pools**
2. Select `ev-digital-twin-user-pool`
3. Click **"Create user"**
4. Fill in user details:
   - Username (required)
   - Email (required)
   - First Name (optional)
   - Last Name (optional)
5. Set temporary password or let AWS generate one
6. Click **"Create user"**

#### Option 2: Automated Script
Use the provided script for easier user creation:

```bash
# Run the user creation script
./scripts/create-user.sh
```

The script will:
- Prompt for user details
- Generate secure temporary passwords
- Create the user in Cognito
- Display login credentials

#### Option 3: AWS CLI
```bash
# Get User Pool ID
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name ev-digital-twin-cognito \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

# Create user
aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username "john.doe" \
    --user-attributes Name=email,Value=john.doe@company.com Name=given_name,Value=John Name=family_name,Value=Doe \
    --temporary-password "TempPass456!" \
    --message-action SUPPRESS
```

### Managing Existing Users

#### Reset User Password
```bash
# Reset to temporary password
aws cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username "john.doe" \
    --password "NewTempPass123!" \
    --temporary

# Set permanent password
aws cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username "john.doe" \
    --password "PermanentPass123!" \
    --permanent
```

#### Delete User
```bash
aws cognito-idp admin-delete-user \
    --user-pool-id $USER_POOL_ID \
    --username "john.doe"
```

#### List All Users
```bash
aws cognito-idp list-users \
    --user-pool-id $USER_POOL_ID \
    --query 'Users[*].{Username:Username,Email:Attributes[?Name==`email`].Value|[0],Status:UserStatus}'
```

## 🔒 Security Configuration

### Password Policy
- **Minimum Length**: 8 characters
- **Required Characters**:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*)

### Session Management
- **Access Token**: 1 hour validity
- **ID Token**: 1 hour validity
- **Refresh Token**: 30 days validity
- **Automatic Refresh**: Handled by AWS Amplify

### Account Recovery
- **Method**: Email-based password reset
- **Process**: User clicks "Forgot Password" → Receives email → Sets new password

## 🎨 UI Components

### Login Page Features
- **AWS-Style Design** - Matches AWS Console aesthetics
- **Responsive Layout** - Works on desktop and mobile
- **Password Visibility Toggle** - Show/hide password option
- **Loading States** - Visual feedback during authentication
- **Error Handling** - Clear error messages for failed logins

### Authentication Flow
1. **Landing Page** → Login form (unauthenticated users)
2. **Login Success** → Dashboard with user info bar
3. **Session Active** → Direct access to dashboard
4. **Session Expired** → Automatic redirect to login

## 🛠️ Development

### Local Development
The authentication system works in local development:

```bash
cd frontend/ev-digital-twin-tire-maintainence-system
npm start
```

The app will use the deployed Cognito User Pool for authentication.

### Environment Configuration
Authentication settings are configured in `src/aws-exports.js`:

```javascript
const awsmobile = {
  "aws_project_region": "us-east-1",
  "aws_cognito_region": "us-east-1", 
  "aws_user_pools_id": "us-east-1_XXXXXXXXX",
  "aws_user_pools_web_client_id": "XXXXXXXXXXXXXXXXXXXXXXXXXX",
  // ... other settings
};
```

## 🔧 Troubleshooting

### Common Issues

#### "User does not exist" Error
- **Cause**: Username not found in User Pool
- **Solution**: Verify username spelling or create the user

#### "Incorrect username or password" Error
- **Cause**: Wrong credentials or user not confirmed
- **Solution**: Check credentials or reset password

#### "Password does not conform to policy" Error
- **Cause**: Password doesn't meet complexity requirements
- **Solution**: Use password with uppercase, lowercase, numbers, and symbols

#### "User is not confirmed" Error
- **Cause**: User account not activated
- **Solution**: Admin must confirm user in AWS Console

### Debug Authentication Issues

#### Check User Status
```bash
aws cognito-idp admin-get-user \
    --user-pool-id $USER_POOL_ID \
    --username "john.doe"
```

#### View User Pool Configuration
```bash
aws cognito-idp describe-user-pool \
    --user-pool-id $USER_POOL_ID
```

## 📊 Monitoring

### CloudWatch Metrics
Cognito provides built-in metrics for:
- Sign-in attempts
- Sign-in successes/failures
- User registrations
- Password reset requests

### Logging
Authentication events are logged to CloudWatch for security monitoring.

## 🔄 Updates and Maintenance

### Updating Authentication Configuration
1. Modify `infrastructure/cognito-infrastructure.yaml`
2. Deploy changes:
   ```bash
   aws cloudformation deploy \
       --template-file infrastructure/cognito-infrastructure.yaml \
       --stack-name ev-digital-twin-cognito \
       --capabilities CAPABILITY_NAMED_IAM
   ```

### Backup and Recovery
- **User Data**: Backed up automatically by AWS
- **Configuration**: Stored in CloudFormation template
- **Recovery**: Redeploy CloudFormation stack if needed

## 📞 Support

For authentication issues:
1. Check AWS CloudWatch logs
2. Verify Cognito User Pool configuration
3. Test with demo credentials
4. Review user status in AWS Console

---

**Security Note**: This authentication system is designed for demo purposes with admin-controlled user access. For production use, consider additional security measures like MFA, advanced password policies, and audit logging.