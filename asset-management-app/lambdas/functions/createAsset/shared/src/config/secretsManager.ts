import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'
import type { DatabaseSecret } from '../types'

// Cache secrets to avoid repeated API calls
const secretCache: Record<string, any> = {}

/**
 * Get secret from AWS Secrets Manager
 * Caches the result for Lambda container reuse
 */
export async function getSecret(secretName: string): Promise<any> {
  // Return cached secret if available
  if (secretCache[secretName]) {
    console.log(`Using cached secret: ${secretName}`)
    return secretCache[secretName]
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
  })

  try {
    console.log(`Fetching secret: ${secretName}`)
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    )

    let secret: any
    if (response.SecretString) {
      secret = JSON.parse(response.SecretString)
    } else if (response.SecretBinary) {
      // Binary secret (rare for DB credentials)
      const buff = Buffer.from(response.SecretBinary)
      secret = JSON.parse(buff.toString('ascii'))
    } else {
      throw new Error('Secret has no string or binary value')
    }

    // Cache the secret
    secretCache[secretName] = secret
    console.log(`✅ Secret fetched and cached: ${secretName}`)
    return secret
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error fetching secret ${secretName}:`, error)
    throw new Error(`Failed to fetch secret: ${errorMessage}`)
  }
}

/**
 * Get database credentials from Secrets Manager
 */
export async function getDatabaseCredentials(): Promise<DatabaseSecret> {
  const secretName = process.env.DB_SECRET_NAME

  if (!secretName) {
    throw new Error('DB_SECRET_NAME environment variable not set')
  }

  const secret = await getSecret(secretName)

  return {
    host: secret.host,
    port: secret.port || 3306,
    database: secret.dbname || secret.database,
    username: secret.username,
    password: secret.password,
  }
}

/**
 * Clear secret cache (useful for testing)
 */
export function clearSecretCache(): void {
  Object.keys(secretCache).forEach((key) => delete secretCache[key])
  console.log('Secret cache cleared')
}