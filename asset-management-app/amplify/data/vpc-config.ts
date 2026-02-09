import { CfnDBInstance } from 'aws-cdk-lib/aws-rds'

/**
 * VPC Configuration for RDS
 * 
 * This is optional - Amplify creates a VPC by default
 * Use this for custom VPC requirements
 */
export const vpcConfig = {
  // VPC CIDR block
  cidrBlock: '10.0.0.0/16',
  
  // Subnets
  subnets: {
    private: [
      { cidr: '10.0.1.0/24', availabilityZone: 'us-east-1a' },
      { cidr: '10.0.2.0/24', availabilityZone: 'us-east-1b' },
    ],
    public: [
      { cidr: '10.0.101.0/24', availabilityZone: 'us-east-1a' },
      { cidr: '10.0.102.0/24', availabilityZone: 'us-east-1b' },
    ],
  },
  
  // Security group rules
  securityGroup: {
    ingress: [
      {
        // Allow MySQL traffic from Lambda security group
        port: 3306,
        protocol: 'tcp',
        description: 'MySQL access from Lambda',
      },
    ],
  },
}