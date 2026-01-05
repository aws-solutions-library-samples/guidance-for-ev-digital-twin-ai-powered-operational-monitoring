# Tire Order Worker Setup Guide

This guide walks you through setting up the async tire ordering infrastructure.

## Overview

We're creating:
1. **DynamoDB Table** - `tire-order-jobs` (stores job status)
2. **IAM Role** - `ev-digital-twin-tire-order-worker-role` (worker Lambda permissions)
3. **Worker Lambda** - `ev-digital-twin-tire-order-worker` (processes tire orders)
4. **Proxy Lambda Update** - Add permission to invoke worker

---

## Option 1: Automated Setup (Recommended)

Run the setup script:

```bash
chmod +x infrastructure/setup-tire-order-worker.sh
./infrastructure/setup-tire-order-worker.sh
```

This creates the DynamoDB table and IAM role automatically.

---

## Option 2: Manual Setup via AWS Console

### Step 1: Create DynamoDB Table

1. Go to **DynamoDB Console** → **Tables** → **Create table**
2. **Table name:** `tire-order-jobs`
3. **Partition key:** `job_id` (String)
4. **Table settings:** On-demand
5. Click **Create table**
6. After creation, go to **Additional settings** → **Time to Live (TTL)**
7. Enable TTL with attribute name: `ttl`

### Step 2: Create IAM Role

1. Go to **IAM Console** → **Roles** → **Create role**
2. **Trusted entity:** AWS service → Lambda
3. Click **Next**
4. **Don't attach any policies yet** → Click **Next**
5. **Role name:** `ev-digital-twin-tire-order-worker-role`
6. **Description:** Execution role for tire order worker Lambda
7. Click **Create role**

### Step 3: Attach Permissions to Role

1. Find the role you just created
2. Go to **Permissions** tab → **Add permissions** → **Create inline policy**
3. Switch to **JSON** tab
4. Copy the contents of `infrastructure/tire-order-worker-role-policy.json`
5. Paste into the editor
6. Click **Review policy**
7. **Name:** `TireOrderWorkerPolicy`
8. Click **Create policy**

### Step 4: Create Worker Lambda Function

1. Go to **Lambda Console** → **Create function**
2. **Function name:** `ev-digital-twin-tire-order-worker`
3. **Runtime:** Python 3.11
4. **Architecture:** x86_64
5. **Permissions:** Use an existing role → Select `ev-digital-twin-tire-order-worker-role`
6. Click **Create function**

### Step 5: Configure Worker Lambda

1. **Configuration** → **General configuration** → **Edit**
   - **Timeout:** 15 minutes (900 seconds)
   - **Memory:** 2048 MB
   - Click **Save**

2. **Configuration** → **Environment variables** → **Edit**
   - Add: `NOVAACT_API_KEY_SECRET_NAME` = `novaact-api-key`
   - Click **Save**

3. **Code** tab → Upload your code
   - Package: `tire_order_worker.py`, `agentcore_maintenance_agent.py`, `agentcore_runtime_app.py`, `knowledge-base/knowledge_base_tools.py`
   - Zip them: `zip -r tire-order-worker.zip *.py knowledge-base/knowledge_base_tools.py`
   - Upload via **Upload from** → **.zip file**

### Step 6: Update Proxy Lambda Permissions

Your proxy Lambda needs permission to invoke the worker Lambda.

1. Go to your **proxy Lambda** (`ev-digital-twin-agentcore-proxy`)
2. **Configuration** → **Permissions** → Click on the role name
3. **Add permissions** → **Create inline policy**
4. Use this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InvokeTireOrderWorker",
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-east-1:*:function:ev-digital-twin-tire-order-worker"
    }
  ]
}
```

5. **Name:** `InvokeTireOrderWorker`
6. Click **Create policy**

---

## Verification

Test that everything is set up correctly:

### 1. Test DynamoDB Table

```bash
aws dynamodb describe-table --table-name tire-order-jobs --region us-east-1
```

Should return table details.

### 2. Test IAM Role

```bash
aws iam get-role --role-name ev-digital-twin-tire-order-worker-role
```

Should return role details.

### 3. Test Worker Lambda

```bash
aws lambda get-function --function-name ev-digital-twin-tire-order-worker --region us-east-1
```

Should return function details.

### 4. Test Worker Lambda Invocation

Create a test event in Lambda console:

```json
{
  "job_id": "job-test-123",
  "vehicle_id": "1"
}
```

Invoke the function and check CloudWatch Logs for output.

---

## Troubleshooting

### Worker Lambda can't access DynamoDB
- Check IAM role has `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem` on `tire-order-jobs` table
- Verify table name is exactly `tire-order-jobs`

### Worker Lambda can't access Secrets Manager
- Check IAM role has `secretsmanager:GetSecretValue` permission
- Verify secret name matches environment variable

### Proxy Lambda can't invoke Worker Lambda
- Check proxy Lambda role has `lambda:InvokeFunction` permission
- Verify worker Lambda name is `ev-digital-twin-tire-order-worker`

### Worker Lambda times out
- Check timeout is set to 900 seconds (15 minutes)
- Check memory is at least 2048 MB

---

## Next Steps

After infrastructure is set up:

1. ✅ Deploy updated `lambda_complete.py` to proxy Lambda
2. ✅ Update frontend code (`agentcore.js` and `FleetPortal.js`)
3. ✅ Test the async tire ordering flow

See `docs/TIRE_ORDER_ASYNC_IMPLEMENTATION.md` for frontend integration guide.
