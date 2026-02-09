# Step 1.1.4: Deploy Backend to AWS Sandbox

## 🎯 Goal
Deploy your Amplify backend (Auth, Storage) to AWS sandbox environment and verify everything works.

## 📚 What You'll Learn
- How to deploy Amplify Gen 2 to AWS
- What AWS Sandbox is and why it's useful
- How to verify your deployment
- Understanding AWS resources created
- How to check deployment status

## 📋 Prerequisites
- [ ] Steps 1.1.1, 1.1.2, 1.1.3 completed
- [ ] You're in the `asset-management-app` directory
- [ ] AWS CLI configured with valid credentials
- [ ] No TypeScript errors (`npx tsc --noEmit --project amplify/tsconfig.json`)

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the right directory:

```bash
pwd
```

Expected: `/Users/apple/.../vuejs-training/asset-management-app`

---

### 2. Check AWS Credentials
Verify your AWS CLI is configured:

```bash
aws sts get-caller-identity
```

Expected output (with your account details):
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

If this fails, run `aws configure` to set up your credentials.

---

### 3. Review What Will Be Deployed
Let's check what we've configured:

```bash
# Check auth configuration
cat amplify/auth/resource.ts

# Check storage configuration
cat amplify/storage/resource.ts

# Check backend configuration
cat amplify/backend.ts
```

You should see:
- ✅ Auth with email login
- ✅ Storage with user-isolated paths
- ✅ Both imported in backend.ts

---

### 4. Start the Sandbox Deployment
Now let's deploy! Run this command:

```bash
npx ampx sandbox
```

**What is Sandbox?**
- A personal development environment in AWS
- Deploys to your AWS account
- Isolated from production
- Can be deleted anytime
- Perfect for learning and testing

---

### 5. Watch the Deployment Process
You'll see output like this:

```
[Sandbox] Deploying resources. This will take a few minutes...

[Sandbox] Deploying: Auth (Cognito User Pool)
[Sandbox] Deploying: Storage (S3 Bucket)
[Sandbox] Deploying: Data (AppSync API)

[Sandbox] ✓ Auth deployed
[Sandbox] ✓ Storage deployed
[Sandbox] ✓ Data deployed

[Sandbox] Deployment complete!
```

⏱️ **This will take 3-5 minutes** - perfect time for a coffee break! ☕

**Note**: The first deployment always takes longer. Subsequent deployments are faster.

---

### 6. Understand What's Being Created
While it deploys, here's what AWS is creating:

**Cognito User Pool:**
- User authentication service
- Email/password login
- Email verification
- User management

**S3 Bucket:**
- Storage for asset images
- User-isolated folders
- Access policies configured

**AppSync API:**
- GraphQL API endpoint
- DynamoDB tables (for future use)
- Authorization rules

**IAM Roles:**
- Permissions for authenticated users
- Permissions for Lambda functions (later)
- Service-to-service permissions

---

### 7. Wait for "Deployment Complete"
When deployment finishes, you'll see:

```
✨ Total time: 4m 32s

[Sandbox] Watching for file changes...
[Sandbox] To delete all the resources, press Ctrl+C
```

**Important**: Keep this terminal window open! The sandbox stays active as long as this process runs.

---

### 8. Open a New Terminal
Since the sandbox is running in your current terminal, open a NEW terminal window/tab for the next steps.

Navigate to your project:

```bash
cd /path/to/vuejs-training/asset-management-app
```

---

### 9. Verify Cognito User Pool Created
Check if Cognito User Pool was created:

```bash
aws cognito-idp list-user-pools --max-results 10
```

Look for a pool with a name like `amplify-assetmanagementapp-sandbox-auth-...`

You should see output with your user pool details.

---

### 10. Verify S3 Bucket Created
Check if S3 bucket was created:

```bash
aws s3 ls | grep amplify
```

Look for a bucket like `amplify-assetmanagementapp-sandbox-storage-...`

---

### 11. Check Amplify Outputs
Amplify generates a configuration file with all the resource details:

```bash
cat amplify_outputs.json
```

You should see:
```json
{
  "auth": {
    "user_pool_id": "us-east-1_XXXXXXXXX",
    "user_pool_client_id": "XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "identity_pool_id": "us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    "aws_region": "us-east-1"
  },
  "storage": {
    "bucket_name": "amplify-assetmanagementapp-...",
    "aws_region": "us-east-1"
  }
}
```

**This file is crucial** - your frontend will use it to connect to AWS!

---

### 12. Test Cognito - Create a Test User
Let's create a test user to verify Cognito works:

```bash
# Get your User Pool ID from amplify_outputs.json
USER_POOL_ID=$(cat amplify_outputs.json | grep user_pool_id | cut -d'"' -f4)

# Create a test user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

Expected output:
```json
{
    "User": {
        "Username": "test@example.com",
        "Enabled": true,
        "UserStatus": "FORCE_CHANGE_PASSWORD",
        ...
    }
}
```

---

### 13. Verify the Test User
List users in the pool:

```bash
aws cognito-idp list-users --user-pool-id $USER_POOL_ID
```

You should see your test user!

---

### 14. Test S3 - Upload a Test File
Let's verify S3 storage works:

```bash
# Get bucket name
BUCKET_NAME=$(cat amplify_outputs.json | grep bucket_name | cut -d'"' -f4)

# Create a test file
echo "Test image" > test.txt

# Try to upload (this will fail - that's expected!)
aws s3 cp test.txt s3://$BUCKET_NAME/assets/test-user/test-asset/test.txt
```

**Expected**: This should fail with "Access Denied" because we're not authenticated!

This proves the security is working - only authenticated users can upload.

---

### 15. Check AWS Console (Optional)
You can also verify in the AWS Console:

1. Go to https://console.aws.amazon.com/
2. Navigate to **Cognito** → You should see your User Pool
3. Navigate to **S3** → You should see your bucket
4. Navigate to **AppSync** → You should see your API

---

### 16. Review Sandbox Status
Go back to your original terminal (where sandbox is running).

You should see:
```
[Sandbox] Watching for file changes...
[Sandbox] Sandbox is ready!
```

This means:
- ✅ Backend is deployed
- ✅ Resources are active
- ✅ Watching for code changes
- ✅ Will auto-deploy updates

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] Sandbox deployment completed successfully
- [ ] No error messages in deployment output
- [ ] `amplify_outputs.json` file exists
- [ ] Cognito User Pool created (verified with AWS CLI)
- [ ] S3 Bucket created (verified with AWS CLI)
- [ ] Test user created successfully
- [ ] Sandbox process still running (don't close it!)
- [ ] Can see resources in AWS Console (optional)

---

## 🔍 Understanding What Happened

### What is AWS Sandbox?
Sandbox is Amplify Gen 2's development environment:
- **Personal**: Each developer gets their own
- **Isolated**: Doesn't affect production or other developers
- **Live**: Changes deploy automatically
- **Temporary**: Can be deleted anytime
- **Fast**: Optimized for quick iterations

### Deployment Process
```
1. Read your TypeScript configuration files
   ↓
2. Generate CloudFormation templates
   ↓
3. Deploy to AWS CloudFormation
   ↓
4. Create resources (Cognito, S3, etc.)
   ↓
5. Configure permissions and policies
   ↓
6. Generate amplify_outputs.json
   ↓
7. Watch for file changes
```

### Resources Created

**Cognito User Pool:**
- Location: AWS Cognito service
- Purpose: User authentication
- Cost: Free tier covers most development
- Name pattern: `amplify-{appname}-sandbox-auth-{random}`

**S3 Bucket:**
- Location: AWS S3 service
- Purpose: File storage
- Cost: Pay per GB stored + requests
- Name pattern: `amplify-{appname}-sandbox-storage-{random}`

**AppSync API:**
- Location: AWS AppSync service
- Purpose: GraphQL API
- Cost: Pay per request
- Name pattern: `amplify-{appname}-sandbox-data-{random}`

**IAM Roles:**
- Location: AWS IAM service
- Purpose: Permissions management
- Cost: Free
- Multiple roles for different services

### amplify_outputs.json
This file contains:
- Resource IDs and ARNs
- API endpoints
- Region information
- Configuration for frontend

**Important**: This file is auto-generated. Don't edit it manually!

---

## 🎓 Key Concepts

### 1. Infrastructure as Code
- Your TypeScript files define infrastructure
- CloudFormation creates actual resources
- Reproducible and version-controlled
- Can be deployed to multiple environments

### 2. Sandbox vs Production
- **Sandbox**: For development, personal, temporary
- **Production**: For real users, shared, permanent
- Same code, different environments
- Deploy to production later with `npx ampx deploy`

### 3. Hot Reloading
- Sandbox watches for file changes
- Automatically redeploys when you save
- Fast feedback loop
- Great for development

### 4. Resource Naming
- AWS adds random suffixes to names
- Prevents naming conflicts
- Allows multiple sandboxes
- Format: `amplify-{app}-{env}-{service}-{random}`

---

## 🐛 Troubleshooting

### Issue: "AWS credentials not configured"
**Solution**: 
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
```

### Issue: "Deployment failed"
**Solution**: 
1. Check error message carefully
2. Verify AWS credentials have proper permissions
3. Check if you have TypeScript errors: `npx tsc --noEmit --project amplify/tsconfig.json`
4. Try again: Stop sandbox (Ctrl+C) and restart

### Issue: "amplify_outputs.json not created"
**Solution**: 
- Wait for deployment to complete fully
- Check for error messages
- File is created after successful deployment

### Issue: "Cannot find user pool"
**Solution**: 
- Make sure deployment completed
- Check correct AWS region: `aws configure get region`
- Verify in AWS Console

### Issue: Sandbox process stopped unexpectedly
**Solution**: 
- Check terminal for error messages
- Restart: `npx ampx sandbox`
- Check AWS service limits

### Issue: "Access Denied" errors
**Solution**: 
- Verify AWS credentials have admin permissions
- Check IAM user has necessary policies
- Contact AWS administrator if using organization account

---

## 📝 Notes

- **Keep sandbox running** during development
- Sandbox auto-deploys changes when you save files
- First deployment takes 3-5 minutes
- Subsequent deployments take 30-60 seconds
- Sandbox resources are in your AWS account (you can see them in console)
- Sandbox costs money (but very little during development)
- Delete sandbox when done: Ctrl+C, then confirm deletion

---

## 💰 Cost Considerations

**Sandbox costs are minimal:**
- Cognito: Free tier covers 50,000 MAUs (Monthly Active Users)
- S3: ~$0.023 per GB/month
- AppSync: $4 per million requests
- **Typical development cost**: $0-5 per month

**To minimize costs:**
- Delete sandbox when not using: Ctrl+C
- Don't leave sandbox running overnight
- Clean up test data regularly

---

## 🎯 What's Next?

In the next step (1.1.5), we'll:
- Create a Vue 3 frontend project
- Install necessary dependencies
- Configure Amplify in the frontend
- Connect to our deployed backend

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.1.4! 🎉

**You now have:**
- ✅ Backend deployed to AWS
- ✅ Cognito User Pool active
- ✅ S3 Bucket created
- ✅ AppSync API ready
- ✅ Sandbox watching for changes
- ✅ Ready to build frontend!

---

## 📸 Expected State

**Terminal 1 (Sandbox running):**
```
[Sandbox] Watching for file changes...
[Sandbox] Sandbox is ready!
```

**Terminal 2 (Available for commands):**
```
~/vuejs-training/asset-management-app $
```

**AWS Resources Created:**
- ✅ Cognito User Pool
- ✅ S3 Bucket
- ✅ AppSync API
- ✅ IAM Roles
- ✅ CloudFormation Stack

**Files Created:**
- ✅ `amplify_outputs.json` (frontend configuration)

---

## 🔗 Additional Resources

- [Amplify Sandbox Documentation](https://docs.amplify.aws/gen2/deploy-and-host/sandbox-environments/)
- [AWS Cognito Pricing](https://aws.amazon.com/cognito/pricing/)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [AWS AppSync Pricing](https://aws.amazon.com/appsync/pricing/)

---

## 💡 Pro Tips

1. **Keep sandbox running** while developing
2. **Use separate terminal** for other commands
3. **Check AWS Console** to see your resources
4. **Monitor costs** in AWS Billing Dashboard
5. **Delete sandbox** when taking breaks
6. **Commit code** before major changes
7. **Read error messages** carefully - they're usually helpful

---

**Ready for Step 1.1.5?** Let me know when you've completed this step and your sandbox is running! 🚀

This is a big milestone - you now have a real backend running in AWS! 🎊
