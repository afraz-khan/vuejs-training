import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { v4 as uuidv4 } from 'uuid'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
  validateRequired,
  validateOptionalString,
  validateCategory,
  validateLength,
  ValidationError,
} from '../../shared/src/utils/validation'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../../shared/src/utils/response'

/**
 * Create Asset Lambda Handler
 * 
 * Creates a new asset in the database
 * 
 * Expected input:
 * {
 *   ownerId: string (required)
 *   name: string (required, 1-255 chars)
 *   description: string (optional)
 *   category: string (required, one of: image, document, video, other)
 *   imageKey: string (optional)
 * }
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Create Asset Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Parse request body
    if (!event.body) {
      return validationErrorResponse('Request body is required')
    }

    let body: any
    try {
      body = JSON.parse(event.body)
    } catch (error) {
      return validationErrorResponse('Invalid JSON in request body')
    }

    // Validate input
    const ownerId = validateRequired(body.ownerId, 'ownerId')
    const name = validateRequired(body.name, 'name')
    const category = validateCategory(body.category)
    const description = validateOptionalString(body.description)
    const imageKey = validateOptionalString(body.imageKey)

    // Validate field lengths
    validateLength(name, 'name', 1, 255)
    if (description) {
      validateLength(description, 'description', 0, 5000)
    }

    // Connect to database
    await connectToDatabase()

    // Create asset
    const asset = await Asset.create({
      id: uuidv4(),
      ownerId,
      name,
      description,
      category,
      imageKey,
    })

    console.log('Asset created successfully:', asset.id)

    // Return success response
    return successResponse(
      {
        id: asset.id,
        ownerId: asset.ownerId,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        imageKey: asset.imageKey,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      },
      201
    )
  } catch (error) {
    console.error('Error creating asset:', error)

    // Handle validation errors
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message, error.field)
    }

    // Handle database errors
    if (error instanceof Error) {
      // Check for specific database errors
      if (error.name === 'SequelizeValidationError') {
        return validationErrorResponse('Validation failed: ' + error.message)
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return errorResponse('Asset already exists', 409)
      }
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to create asset')
  }
}