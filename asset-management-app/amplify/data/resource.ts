import { defineData, type ClientSchema } from '@aws-amplify/backend'

/**
 * Define the data resource for RDS MySQL
 * 
 * This configures an RDS MySQL instance with:
 * - MySQL 8.0 engine
 * - VPC configuration for security
 * - Automated backups
 * - Multi-AZ for production (optional)
 */
export const data = defineData({
  name: 'HeraTrainingDB',
  
  // Database engine configuration
  engine: 'mysql',
  engineVersion: '8.0.35',
  
  // Instance configuration
  instanceType: 'db.t3.micro', // Free tier eligible
  
  // Storage configuration
  allocatedStorage: 20, // GB
  maxAllocatedStorage: 100, // Auto-scaling limit
  
  // Database credentials
  // These will be stored in AWS Secrets Manager automatically
  databaseName: 'HeraTraining',
  masterUsername: 'admin',
  
  // Backup configuration
  backupRetention: 7, // days
  
  // Security configuration
  publiclyAccessible: false, // Keep in private subnet
  
  // Deletion protection (enable for production)
  deletionProtection: false, // Set to true for production
  
  // Multi-AZ deployment (for production high availability)
  multiAZ: false, // Set to true for production
})

// Export the schema type for client usage
export type Schema = ClientSchema<typeof data>
