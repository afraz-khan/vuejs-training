# Step 1.3.7: Deploy RDS MySQL Database with AWS CDK (via Amplify Gen 2)

## 🎯 Goal
Deploy an RDS MySQL database using AWS CDK within Amplify Gen 2 backend, configure VPC networking, set up AWS Secrets Manager for credentials, and prepare for Lambda deployment.

**💰 Cost Note:** This setup uses AWS Free Tier eligible resources (db.t3.micro, 20GB storage) for learning purposes. Estimated cost: $0/month within free tier limits.

## 📚 What You'll Learn
- Using AWS CDK with Amplify Gen 2
- RDS MySQL deployment with CDK constructs
- VPC and security group configuration
- AWS Secrets Manager integration
- Infrastructure as Code (IaC) best practices

## 📋 Prerequisites
- [ ] Step 1.3.6 completed (All Lambda functions tested locally)
- [ ] AWS CLI installed and configured
- [ ] AWS account with appropriate permissions
- [ ] Local MySQL database working (for reference)

## 🚀 Step-by-Step Instructions

### 1. Verify AWS CDK Dependencies

The `aws-cdk-lib` package should already be installed in your amplify directory. Let's verify:

```bash
cd amplify
cat package.json
```

**Expected output:**
```json
{
  "type": "module",
  "dependencies": {
    "@aws-amplify/backend": "^1.20.0",
    "@aws-amplify/backend-data": "^1.6.3",
    "aws-cdk-lib": "^2.237.1"
  }
}
```

If `aws-cdk-lib` is missing, install it:

```bash
npm install aws-cdk-lib
```

**Save and verify!**

---

### 2. Review Backend Configuration with CDK

The `amplify/backend.ts` file has been configured with AWS CDK constructs for RDS MySQL. Let's review what's included:

Open `amplify/backend.ts` and review the configuration:

```typescript
import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { storage } from './storage/resource'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { RemovalPolicy, Duration } from 'aws-cdk-lib'

const backend = defineBackend({
  auth,
  storage,
})

// Get the CDK stack
const { stack } = backend

// Create VPC for RDS
const vpc = new ec2.Vpc(stack, 'HeraTrainingVPC', {
  maxAzs: 2,
  natGateways: 0,
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
    {
      cidrMask: 24,
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
    },
  ],
})

// Create VPC Endpoints for AWS services (required for Lambda in private subnet)
// Secrets Manager endpoint - allows Lambda to fetch database credentials
vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
  subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
})

// Create security group for RDS
const dbSecurityGroup = new ec2.SecurityGroup(stack, 'DBSecurityGroup', {
  vpc,
  description: 'Security group for RDS MySQL',
  allowAllOutbound: true,
})

// Create database credentials secret
const dbSecret = new secretsmanager.Secret(stack, 'DBSecret', {
  secretName: 'amplify-heratraining-db-credentials',
  description: 'RDS MySQL credentials for HeraTraining database',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({
      username: 'admin',
    }),
    generateStringKey: 'password',
    excludePunctuation: true,
    includeSpace: false,
    passwordLength: 32,
  },
})

// Create RDS MySQL instance
const dbInstance = new rds.DatabaseInstance(stack, 'HeraTrainingDB', {
  engine: rds.DatabaseInstanceEngine.mysql({
    version: rds.MysqlEngineVersion.VER_8_0_40, // Latest stable version
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T3,
    ec2.InstanceSize.MICRO // Smallest instance - FREE TIER eligible
  ),
  vpc,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
  },
  securityGroups: [dbSecurityGroup],
  databaseName: 'HeraTraining',
  credentials: rds.Credentials.fromSecret(dbSecret),
  allocatedStorage: 20, // Minimum storage - FREE TIER eligible
  maxAllocatedStorage: 100,
  backupRetention: Duration.days(7), // FREE within 20GB limit
  deleteAutomatedBackups: true,
  removalPolicy: RemovalPolicy.DESTROY, // Easy cleanup
  deletionProtection: false, // Easy cleanup for learning
  publiclyAccessible: false, // Security best practice
  multiAz: false, // Single-AZ for FREE TIER cost savings
  autoMinorVersionUpgrade: true,
  enablePerformanceInsights: false, // Disabled for cost savings
  storageEncrypted: true, // Security best practice (no extra cost)
  // monitoringInterval not specified = disabled (cost savings)
})

// Export database connection details
backend.addOutput({
  custom: {
    database: {
      endpoint: dbInstance.dbInstanceEndpointAddress,
      port: dbInstance.dbInstanceEndpointPort,
      databaseName: 'HeraTraining',
      secretArn: dbSecret.secretArn,
      securityGroupId: dbSecurityGroup.securityGroupId,
      vpcId: vpc.vpcId,
    },
  },
})
```

**This configuration creates:**
- VPC with 2 availability zones
- Private and public subnets
- Security group for RDS
- AWS Secrets Manager secret for credentials
- RDS MySQL 8.0.40 instance (**db.t3.micro - FREE TIER ELIGIBLE**)
- 20GB storage with auto-scaling to 100GB (**FREE TIER: 20GB free**)
- Single-AZ deployment (Multi-AZ disabled for cost savings)
- No NAT Gateway (cost savings)
- Storage encryption enabled (security, no extra cost)
- Enhanced monitoring disabled (cost savings)

**💰 Free Tier Benefits:**
- db.t3.micro: 750 hours/month free for 12 months
- 20 GB storage: Free for 12 months
- 20 GB backup storage: Free
- After 12 months: ~$15-17/month

---

### 3. Deploy the Infrastructure

**💰 IMPORTANT - Free Tier Note:**
This deployment uses AWS Free Tier eligible resources:
- ✅ db.t3.micro instance (750 hours/month free)
- ✅ 20 GB storage (free for 12 months)
- ✅ Single-AZ deployment (no standby replica)
- ✅ No NAT Gateway (cost savings)

**Estimated cost: $0.40/month (Secrets Manager only) during free tier**

Navigate back to the root of asset-management-app:

```bash
cd ..  # Back to asset-management-app root
```

Deploy using Amplify sandbox:

```bash
npx ampx sandbox
```

**This command will:**
1. Synthesize CloudFormation templates from CDK code
2. Create a CloudFormation stack
3. Deploy VPC, subnets, and security groups
4. Create RDS MySQL instance (takes 10-15 minutes)
5. Store database credentials in Secrets Manager
6. Generate `amplify_outputs.json` with connection details

**Expected output:**
```
✨ Amplify Sandbox

Setting up...
[====================================] 100%

Deploying resources...
  ✓ VPC created
  ✓ Subnets created
  ✓ Security groups configured
  ✓ Secrets Manager secret created
  ⏳ RDS MySQL instance creating... (this takes 10-15 minutes)

✅ Resources deployed:
  - Auth: Cognito User Pool
  - Storage: S3 Bucket (assetImages)
  - Database: RDS MySQL (HeraTrainingDB)

📝 Outputs saved to: amplify_outputs.json

🔐 Database credentials stored in AWS Secrets Manager:
  Secret Name: amplify-heratraining-db-credentials

🌐 Sandbox URL: https://xxxxx.amplifyapp.com
```

**Important:** The RDS deployment will take 10-15 minutes. Be patient!

**⚠️ If deployment fails:**

If you see an error about MySQL version not being available, you may need to:

1. **Delete the failed CloudFormation stack:**
```bash
# Option 1: Using Amplify CLI
npx ampx sandbox delete

# Option 2: Using AWS Console
# Go to CloudFormation → Stacks → Select the failed stack → Delete
```

2. **The MySQL version has been updated to 8.0.40** (latest stable version)

3. **Try deploying again:**
```bash
npx ampx sandbox
```

---

### 4. Retrieve Database Credentials from Secrets Manager

After deployment completes, get the database credentials:

**Using AWS CLI:**

```bash
# List secrets to find the exact name
aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `amplify-heratraining`)].Name' --output table

# Get the secret value (replace SECRET_NAME with actual name)
aws secretsmanager get-secret-value \
  --secret-id amplify-heratraining-db-credentials \
  --query SecretString \
  --output text | jq
```

**Expected output:**
```json
{
  "username": "admin",
  "password": "GENERATED_32_CHAR_PASSWORD",
  "engine": "mysql",
  "host": "heratrainingdb-xxxxx.us-east-1.rds.amazonaws.com",
  "port": 3306,
  "dbname": "HeraTraining"
}
```

**Save these credentials!** You'll need them for Lambda configuration.

---

### 5. Review amplify_outputs.json

Check the generated outputs file:

```bash
cat amplify_outputs.json
```

**Expected structure:**
```json
{
  "auth": {
    "user_pool_id": "us-east-1_xxxxx",
    "user_pool_client_id": "xxxxx",
    "identity_pool_id": "us-east-1:xxxxx"
  },
  "storage": {
    "bucket_name": "amplify-assetimages-xxxxx",
    "region": "us-east-1"
  },
  "custom": {
    "database": {
      "endpoint": "heratrainingdb-xxxxx.us-east-1.rds.amazonaws.com",
      "port": "3306",
      "databaseName": "HeraTraining",
      "secretArn": "arn:aws:secretsmanager:us-east-1:xxxxx:secret:xxxxx",
      "securityGroupId": "sg-xxxxx",
      "vpcId": "vpc-xxxxx"
    }
  }
}
```

**This file contains all connection details for your infrastructure!**

---

### 6. Update Lambda Environment Configuration

**Note:** Lambda environment variables will be automatically configured by AWS CDK in the next step (1.3.8). You don't need to create any additional environment files for AWS deployment.

The Lambda functions will receive these environment variables from CDK:
- `DB_HOST` - RDS endpoint address
- `DB_PORT` - Database port (3306)
- `DB_NAME` - Database name (HeraTraining)
- `DB_USER` - Database username (admin)
- `DB_SECRET_NAME` - Secrets Manager secret name
- `AWS_REGION` - AWS region
- `NODE_ENV` - Set to 'production'

The database password will be fetched from AWS Secrets Manager at runtime.

**Save the file!**

---

### 7. Verify VPC and Security Group Configuration

Check the deployed VPC and security groups in AWS Console:

**VPC Console:**
1. Go to AWS Console → VPC
2. Find VPC with name containing "HeraTrainingVPC"
3. Verify:
   - 2 availability zones
   - Private and public subnets
   - No NAT gateway (cost savings)

**Security Groups:**
1. Go to AWS Console → EC2 → Security Groups
2. Find "DBSecurityGroup"
3. Verify:
   - Inbound: Will be configured for Lambda access in next step
   - Outbound: All traffic allowed

**RDS Console:**
1. Go to AWS Console → RDS → Databases
2. Find "HeraTrainingDB"
3. Verify:
   - Engine: MySQL 8.0.40
   - Instance class: db.t3.micro
   - Storage: 20 GB (auto-scaling to 100 GB)
   - Multi-AZ: No (single AZ for cost savings)
   - Public access: No (private subnet only)

---

### 8. Test Database Connectivity (Optional)

**Note:** You cannot test AWS RDS from your local machine directly because it's in a private subnet. You have three options:

**Option A: Wait for Lambda deployment (Recommended)**
- We'll test connectivity when deploying Lambda functions in Step 1.3.8

**Option B: Use AWS CloudShell**
1. Open AWS CloudShell in AWS Console
2. Install MySQL client: `sudo yum install mysql -y`
3. Connect: `mysql -h YOUR_RDS_ENDPOINT -u admin -p`

**Option C: Create a bastion host**
- Deploy an EC2 instance in the public subnet
- SSH into it and connect to RDS from there

**For this training, we'll use Option A and test via Lambda.**

---

### 9. Prepare for Schema Sync

The database is created but empty. We need to sync the schema (create tables). We'll do this via Lambda in the next step.

The `lambdas/functions/syncSchema/index.ts` file has been created for this purpose:

```typescript
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { sequelize } from '../../shared/src/config/database'

export const handler = async () => {
  console.log('🔄 Syncing database schema...')

  try {
    await connectToDatabase()
    console.log('✅ Connected to database')

    await sequelize.sync({ alter: true })
    console.log('✅ Schema synced successfully')

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Database schema synced successfully',
      }),
    }
  } catch (error) {
    console.error('❌ Schema sync failed:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}
```

**We'll deploy and run this Lambda in Step 1.3.8.**

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `aws-cdk-lib` is installed in amplify directory
- [ ] `amplify/backend.ts` contains CDK constructs for RDS
- [ ] `npx ampx sandbox` deployed successfully
- [ ] RDS MySQL instance is running (check AWS Console)
- [ ] Database credentials stored in Secrets Manager
- [ ] VPC and security groups created
- [ ] `amplify_outputs.json` generated with database details

---

## 🔍 Understanding What You Built

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Cognito    │      │  S3 Bucket   │                    │
│  │  User Pool   │      │ (assetImages)│                    │
│  └──────────────┘      └──────────────┘                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                 │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌──────────────────────┐  │  │
│  │  │ Private Subnet  │      │  Private Subnet      │  │  │
│  │  │  10.0.1.0/24    │      │  10.0.2.0/24         │  │  │
│  │  │  (AZ-1)         │      │  (AZ-2)              │  │  │
│  │  │                 │      │                      │  │  │
│  │  │  ┌───────────┐  │      │                      │  │  │
│  │  │  │    RDS    │  │      │                      │  │  │
│  │  │  │   MySQL   │  │      │                      │  │  │
│  │  │  │ (Primary) │  │      │                      │  │  │
│  │  │  └───────────┘  │      │                      │  │  │
│  │  │                 │      │                      │  │  │
│  │  └─────────────────┘      └──────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌──────────────────────┐  │  │
│  │  │ Public Subnet   │      │  Public Subnet       │  │  │
│  │  │  10.0.101.0/24  │      │  10.0.102.0/24       │  │  │
│  │  │  (AZ-1)         │      │  (AZ-2)              │  │  │
│  │  └─────────────────┘      └──────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │         Security Group (DBSecurityGroup)     │   │  │
│  │  │  - Inbound: Port 3306 (MySQL)               │   │  │
│  │  │  - Source: Lambda Security Group (next step)│   │  │
│  │  │  - Outbound: All traffic                    │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AWS Secrets Manager                     │  │
│  │                                                       │  │
│  │  Secret: amplify-heratraining-db-credentials        │  │
│  │  {                                                   │  │
│  │    "username": "admin",                             │  │
│  │    "password": "xxxxx",                             │  │
│  │    "host": "heratrainingdb-xxxxx.rds.amazonaws.com",│  │
│  │    "port": 3306,                                    │  │
│  │    "dbname": "HeraTraining"                         │  │
│  │  }                                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### CDK vs CloudFormation vs Terraform

**AWS CDK (What we're using):**
- ✅ Write infrastructure in TypeScript/JavaScript
- ✅ Type safety and IDE autocomplete
- ✅ Reusable constructs and patterns
- ✅ Integrates seamlessly with Amplify Gen 2
- ✅ Compiles to CloudFormation

**CloudFormation:**
- JSON/YAML templates
- AWS native
- More verbose

**Terraform:**
- HCL language
- Multi-cloud support
- Separate from AWS ecosystem

**Why CDK for this project:**
- Already using TypeScript for Lambda functions
- Amplify Gen 2 uses CDK under the hood
- Better developer experience
- Type-safe infrastructure code

### Resource Costs (Approximate)

**✅ FREE TIER ELIGIBLE (First 12 Months):**
- **RDS db.t3.micro:** 750 hours/month FREE (covers 24/7 usage)
- **Storage (20 GB):** FREE for 12 months
- **Backup storage (20 GB):** FREE
- **Data transfer:** 15 GB/month FREE
- **Secrets Manager:** First 30 days FREE, then $0.40/month

**💰 Total Cost During Free Tier: ~$0.40/month (Secrets Manager only)**

**After Free Tier (12 months):**
- RDS db.t3.micro: ~$15/month
- Storage (20GB): ~$2.30/month
- Backup storage: ~$1.90/month (20GB)
- Secrets Manager: $0.40/month

**Total after free tier: ~$19/month**

**💡 Cost Optimization Tips:**
- Delete the database when not in use (RemovalPolicy.DESTROY is set)
- Use `npx ampx sandbox delete` to tear down all resources
- Monitor usage in AWS Cost Explorer
- Set up billing alerts

---

## 🎓 Key Concepts

### 1. Infrastructure as Code (IaC)

**Benefits:**
- Version control for infrastructure
- Reproducible deployments
- Easy rollback
- Documentation as code
- Automated testing

**CDK Example:**
```typescript
// This code creates actual AWS resources!
const vpc = new ec2.Vpc(stack, 'MyVPC', {
  maxAzs: 2,
})
```

### 2. VPC Security

**Private Subnets:**
- No direct internet access
- Database not accessible from internet
- Only accessible from within VPC
- Lambda functions must be in same VPC

**Security Groups:**
- Act as virtual firewalls
- Stateful (return traffic automatically allowed)
- Control inbound/outbound traffic
- Rule: Allow port 3306 from Lambda SG only

### 3. Secrets Manager vs Environment Variables

**Secrets Manager:**
- ✅ Encrypted at rest (KMS)
- ✅ Automatic rotation
- ✅ Audit logging (CloudTrail)
- ✅ Fine-grained access control (IAM)
- ✅ Versioning
- ❌ Additional cost ($0.40/month)

**Environment Variables:**
- ✅ Free
- ✅ Simple to use
- ❌ Not encrypted by default
- ❌ No rotation
- ❌ Visible in Lambda console
- ❌ No audit trail

**Best Practice:** Use Secrets Manager for production databases.

### 4. RDS Configuration Explained

**Instance Type (db.t3.micro):**
- **FREE TIER ELIGIBLE** ✅
- 2 vCPUs
- 1 GB RAM
- Burstable performance
- 750 hours/month free for 12 months
- Perfect for development/testing/learning

**Storage (20 GB with auto-scaling to 100 GB):**
- **20 GB FREE for 12 months** ✅
- General Purpose SSD (gp2)
- Auto-scales when 90% full
- No downtime during scaling
- Pay only for what you use (after free tier)

**Backup Retention (7 days):**
- Automated daily backups
- Point-in-time recovery
- Stored in S3
- No additional cost for 7 days

**Multi-AZ (Disabled for cost):**
- Single AZ: One database instance
- Multi-AZ: Standby replica in different AZ
- Automatic failover
- Enable for production!

---

## 📝 Notes

- RDS deployment takes 10-15 minutes
- Database is in private subnet (not publicly accessible)
- Credentials are automatically generated (32 characters)
- **Multi-AZ is disabled for FREE TIER cost savings** (enable for production)
- **Deletion protection is disabled** (easy cleanup for learning)
- Automated backups retained for 7 days (free within 20GB limit)
- Database name is `HeraTraining` (matches local setup)
- Master username is `admin` (not `root` like local MySQL)
- No NAT gateway (Lambda will need VPC endpoints for internet access)
- **db.t3.micro is FREE TIER eligible** (750 hours/month for 12 months)
- **20 GB storage is FREE** for 12 months

---

## 🧹 Cleanup (To Avoid Charges)

When you're done with the training and want to delete all resources:

```bash
# Delete the entire sandbox (removes ALL resources)
npx ampx sandbox delete

# Confirm deletion when prompted
```

This will delete:
- RDS MySQL instance
- VPC and subnets
- Security groups
- Secrets Manager secret
- S3 bucket
- Cognito User Pool

**💡 Tip:** You can also delete individual resources in AWS Console if needed.

---

## 🎯 What's Next?

In the next step (1.3.8), we'll:
- Deploy Lambda functions to AWS
- Configure Lambda VPC access to RDS
- Set up API Gateway REST API
- Configure Lambda environment variables
- Deploy schema sync Lambda
- Test all endpoints in AWS
- Set up CloudWatch monitoring

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.3.7! 🎉

**You now have:**
- ✅ Production RDS MySQL database deployed via CDK
- ✅ VPC and security groups configured
- ✅ Database credentials in Secrets Manager
- ✅ Infrastructure as Code in `backend.ts`
- ✅ Connection details in `amplify_outputs.json`
- ✅ Ready for Lambda deployment!

---

**Ready for Step 1.3.8 (Lambda & API Gateway Deployment)?** Let me know when you've completed this step and RDS is deployed! 🚀
