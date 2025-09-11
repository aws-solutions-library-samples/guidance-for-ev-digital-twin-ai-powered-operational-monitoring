# AWS Amplify Setup Guide

## Prerequisites
1. Install AWS CLI: `brew install awscli` (macOS)
2. Install Amplify CLI: `npm install -g @aws-amplify/cli`
3. Configure AWS credentials: `aws configure`

## Setup Steps

1. **Initialize Amplify in your project:**
   ```bash
   amplify init
   ```
   - Project name: homemade-ev-digital-twin
   - Environment: dev
   - Default editor: Visual Studio Code
   - App type: javascript
   - Framework: react
   - Source directory: src
   - Build command: npm run build
   - Start command: npm start

2. **Add Authentication:**
   ```bash
   amplify add auth
   ```
   - Default configuration
   - Username
   - No advanced settings

3. **Add API (optional for data storage):**
   ```bash
   amplify add api
   ```
   - GraphQL
   - API name: evdata
   - Authorization: Amazon Cognito User Pool

4. **Deploy to AWS:**
   ```bash
   amplify push
   ```

5. **Add hosting:**
   ```bash
   amplify add hosting
   ```
   - Amazon CloudFront and S3

6. **Publish:**
   ```bash
   amplify publish
   ```

## After Setup
- Replace the placeholder `aws-exports.js` with the generated one
- Uncomment the Amplify.configure line in `src/index.js`