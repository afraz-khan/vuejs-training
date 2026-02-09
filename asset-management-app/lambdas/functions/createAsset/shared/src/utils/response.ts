import type { APIGatewayProxyResult } from 'aws-lambda'

/**
 * Common CORS headers for all responses
 */
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
  'Access-Control-Allow-Credentials': 'true',
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: true,
      data,
    }),
  }
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  error?: any
): APIGatewayProxyResult {
  console.error('Error response:', { message, statusCode, error })
  
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  message: string,
  field?: string
): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: false,
      error: message,
      field,
    }),
  }
}
