import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'

/**
 * Define the backend with all resources
 * 
 * Resources:
 * - auth: Cognito authentication
 * - data: RDS MySQL database
 * - storage: S3 bucket for assets
 * 
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  storage,
})
