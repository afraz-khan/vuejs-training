# 🚀 Ready to Deploy Lambda Functions and API Gateway

## ✅ What's Been Completed

1. **Backend Configuration Updated** (`amplify/backend.ts`)
   - Added 6 Lambda functions (createAsset, getAsset, listAssets, updateAsset, deleteAsset, syncSchema)
   - Configured VPC access for Lambda to connect to RDS
   - Set up API Gateway REST API with all CRUD endpoints
   - Configured IAM roles and permissions
   - Added Secrets Manager access for database credentials

2. **Lambda Functions Prepared**
   - Shared code copied to each function directory
   - All dependencies bundled
   - TypeScript configurations in place

3. **API Gateway Routes Configured**
   - `POST /assets` → createAsset
   - `GET /assets` → listAssets
   - `GET /assets/{id}` → getAsset
   - `PATCH /assets/{id}` → updateAsset
   - `DELETE /assets/{id}` → deleteAsset
   - `POST /admin/sync-schema` → syncSchema

## 🎯 Next Steps

### Step 1: Deploy to AWS

From the `asset-management-app` directory, run:

```bash
npx ampx sandbox
```

This will:
- Deploy all Lambda functions to AWS
- Create the API Gateway
- Configure VPC networking
- Set up IAM roles and permissions
- Output the API Gateway URL

**Expected deployment time:** 5-10 minutes

### Step 2: Save the API Gateway URL

After deployment completes, you'll see output like:

```
✅ Deployment complete!

API Gateway URL: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

**Save this URL!** You'll need it for testing and frontend integration.

### Step 3: Sync Database Schema

Once deployed, create the database tables by calling the sync-schema endpoint:

```bash
# Replace with your actual API Gateway URL
API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"

curl -X POST "$API_URL/admin/sync-schema" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Database schema synced successfully"
}
```

### Step 4: Test the API

Test creating an asset:

```bash
curl -X POST "$API_URL/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "user-123",
    "name": "Test Asset",
    "description": "Testing deployed API",
    "category": "image",
    "imageKey": "assets/user-123/test.jpg"
  }'
```

Test listing assets:

```bash
curl "$API_URL/assets"
```

## 📋 Architecture Overview

```
Internet
   ↓
API Gateway (Public)
   ↓
Lambda Functions (Private Subnet)
   ↓
RDS MySQL (Private Subnet)
   ↓
Secrets Manager (Database Credentials)
```

## 🔧 Configuration Details

### Lambda Configuration
- **Runtime:** Node.js 20.x
- **Memory:** 256 MB
- **Timeout:** 30 seconds (60 for syncSchema)
- **VPC:** Private isolated subnets
- **Environment Variables:**
  - DB_HOST, DB_PORT, DB_NAME, DB_USER
  - DB_SECRET_NAME (for Secrets Manager)
  - AWS_REGION, NODE_ENV=production

### API Gateway Configuration
- **Stage:** prod
- **CORS:** Enabled for all origins
- **Logging:** INFO level with data trace
- **Methods:** POST, GET, PATCH, DELETE

### Security
- Lambda functions in private subnets (no internet access)
- RDS not publicly accessible
- Database password in Secrets Manager
- Security groups restrict access to port 3306 only

## 💰 Cost Estimate

**During AWS Free Tier (first 12 months):**
- Lambda: 1M requests/month free
- API Gateway: 1M requests/month free
- RDS: 750 hours/month free (db.t3.micro)
- Secrets Manager: ~$0.40/month (not free)

**Estimated monthly cost:** ~$0.40 (Secrets Manager only)

## 🐛 Troubleshooting

### If deployment fails:

1. **Check AWS credentials:**
   ```bash
   aws sts get-caller-identity
   ```

2. **View CloudFormation events:**
   - Go to AWS Console → CloudFormation
   - Find stack: `amplify-assetmanagementapp-*`
   - Check Events tab for errors

3. **Common issues:**
   - VPC limits reached → Delete unused VPCs
   - Lambda limits reached → Request limit increase
   - Insufficient permissions → Check IAM role

### If Lambda functions fail:

1. **View CloudWatch Logs:**
   ```bash
   aws logs tail /aws/lambda/asset-management-createAsset --follow
   ```

2. **Check environment variables:**
   - Go to Lambda console
   - Select function
   - Check Configuration → Environment variables

3. **Test database connection:**
   - Call the syncSchema endpoint
   - Check CloudWatch logs for connection errors

## 📚 Reference

- **Step Guide:** `STEP_1.3.8_GUIDE.md`
- **Backend Config:** `amplify/backend.ts`
- **Lambda Functions:** `lambdas/functions/`
- **Shared Code:** `lambdas/shared/src/`

## ✨ What You'll Have After Deployment

- ✅ 6 Lambda functions running in AWS
- ✅ API Gateway with REST API endpoints
- ✅ VPC networking configured
- ✅ Database connection established
- ✅ Full CRUD operations available
- ✅ Production-ready backend infrastructure

---

**Ready to deploy?** Run `npx ampx sandbox` from the `asset-management-app` directory!
