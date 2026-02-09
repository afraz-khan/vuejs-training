import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { storage } from './storage/resource'
import { data } from './data/resource'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import { RemovalPolicy, Duration } from 'aws-cdk-lib'

const backend = defineBackend({
  auth,
  storage,
  data,
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

// Allow Lambda to access RDS
dbSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(3306),
  'Allow Lambda to access RDS'
)

// Create Lambda execution role with necessary permissions
const lambdaRole = new iam.Role(stack, 'LambdaExecutionRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
})

// Grant Lambda access to Secrets Manager
dbSecret.grantRead(lambdaRole)

// Common Lambda environment variables
const lambdaEnvironment = {
  DB_HOST: dbInstance.dbInstanceEndpointAddress,
  DB_PORT: '3306',
  DB_NAME: 'HeraTraining',
  DB_USER: 'admin',
  DB_SECRET_NAME: dbSecret.secretName,
  NODE_ENV: 'production',
}

// Common Lambda configuration
const lambdaConfig = {
  runtime: lambda.Runtime.NODEJS_20_X,
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  securityGroups: [dbSecurityGroup],
  environment: lambdaEnvironment,
  role: lambdaRole,
  timeout: Duration.minutes(5),
  memorySize: 256,
}

// Create Lambda functions
const createAssetFn = new lambda.Function(stack, 'CreateAssetFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-createAsset',
  code: lambda.Code.fromAsset('lambdas/functions/createAsset'),
  handler: 'dist/index.handler',
})

const getAssetFn = new lambda.Function(stack, 'GetAssetFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-getAsset',
  code: lambda.Code.fromAsset('lambdas/functions/getAsset'),
  handler: 'dist/index.handler',
})

const listAssetsFn = new lambda.Function(stack, 'ListAssetsFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-listAssets',
  code: lambda.Code.fromAsset('lambdas/functions/listAssets'),
  handler: 'dist/index.handler',
})

const updateAssetFn = new lambda.Function(stack, 'UpdateAssetFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-updateAsset',
  code: lambda.Code.fromAsset('lambdas/functions/updateAsset'),
  handler: 'dist/index.handler',
})

const deleteAssetFn = new lambda.Function(stack, 'DeleteAssetFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-deleteAsset',
  code: lambda.Code.fromAsset('lambdas/functions/deleteAsset'),
  handler: 'dist/index.handler',
})

const syncSchemaFn = new lambda.Function(stack, 'SyncSchemaFunction', {
  ...lambdaConfig,
  functionName: 'asset-management-syncSchema',
  code: lambda.Code.fromAsset('lambdas/functions/syncSchema'),
  handler: 'dist/index.handler',
})

// Create API Gateway
const api = new apigateway.RestApi(stack, 'AssetManagementApi', {
  restApiName: 'Asset Management API',
  description: 'API for managing assets',
  deployOptions: {
    stageName: 'prod',
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
    dataTraceEnabled: true,
  },
})

// Create API resources and methods
const assets = api.root.addResource('assets')

// Add CORS support for /assets resource
assets.addCorsPreflight({
  allowOrigins: ['*'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
})

// POST /assets - Create asset
assets.addMethod('POST', new apigateway.LambdaIntegration(createAssetFn))

// GET /assets - List assets
assets.addMethod('GET', new apigateway.LambdaIntegration(listAssetsFn))

// GET /assets/{id} - Get asset by ID
const asset = assets.addResource('{id}')

// Add CORS support for the {id} resource
asset.addCorsPreflight({
  allowOrigins: ['*'],
  allowMethods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
})

asset.addMethod('GET', new apigateway.LambdaIntegration(getAssetFn))

// PATCH /assets/{id} - Update asset
asset.addMethod('PATCH', new apigateway.LambdaIntegration(updateAssetFn))

// DELETE /assets/{id} - Delete asset
asset.addMethod('DELETE', new apigateway.LambdaIntegration(deleteAssetFn))

// Add sync-schema endpoint (for one-time use)
// Note: Lambda invoked asynchronously to avoid API Gateway 29-second timeout
const admin = api.root.addResource('admin')
const syncSchema = admin.addResource('sync-schema')
syncSchema.addMethod(
  'POST',
  new apigateway.LambdaIntegration(syncSchemaFn, {
    proxy: false,
    integrationResponses: [
      {
        statusCode: '202',
        responseTemplates: {
          'application/json': `{
            "message": "Database sync started in background. Check CloudWatch logs for progress.",
            "logGroup": "/aws/lambda/asset-management-syncSchema"
          }`,
        },
      },
    ],
    requestTemplates: {
      'application/json': '{"statusCode": 200}',
    },
    passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
  }),
  {
    methodResponses: [
      {
        statusCode: '202',
      },
    ],
  }
)

// Grant API Gateway permission to invoke Lambda asynchronously
syncSchemaFn.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'))

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
    api: {
      url: api.url,
      name: api.restApiName,
      id: api.restApiId,
    },
  },
})