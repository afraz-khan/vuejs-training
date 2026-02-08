import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
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
 * Update Asset Lambda Handler
 * 
 * Updates an existing asset (partial update - PATCH)
 * 
 * Path parameter:
 * - id: Asset ID (UUID)
 * 
 * Body (all optional):
 * {
 *   name: string
 *   description: string
 *   category: string
 *   imageKey: string
 * }
 * 
 * Note: ownerId cannot be changed
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Update Asset Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Get asset ID from path parameters
    const assetId = event.pathParameters?.id

    if (!assetId) {
      return validationErrorResponse('Asset ID is required', 'id')
    }

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

    // Check if there's anything to update
    if (Object.keys(body).length === 0) {
      return validationErrorResponse('At least one field must be provided for update')
    }

    // Connect to database
    await connectToDatabase()

    // Find asset
    const asset = await Asset.findByPk(assetId)

    if (!asset) {
      return errorResponse('Asset not found', 404)
    }

    // Build update object with validation
    const updates: any = {}

    if (body.name !== undefined) {
      const name = validateOptionalString(body.name)
      if (name) {
        validateLength(name, 'name', 1, 255)
        updates.name = name
      }
    }

    if (body.description !== undefined) {
      const description = validateOptionalString(body.description)
      if (description) {
        validateLength(description, 'description', 0, 5000)
      }
      updates.description = description
    }

    if (body.category !== undefined) {
      updates.category = validateCategory(body.category)
    }

    if (body.imageKey !== undefined) {
      updates.imageKey = validateOptionalString(body.imageKey)
    }

    // Prevent ownerId changes
    if (body.ownerId !== undefined) {
      return validationErrorResponse('Owner ID cannot be changed', 'ownerId')
    }

    // Update asset
    await asset.update(updates)

    console.log('Asset updated successfully:', asset.id)

    // Return success response
    return successResponse({
      id: asset.id,
      ownerId: asset.ownerId,
      name: asset.name,
      description: asset.description,
      category: asset.category,
      imageKey: asset.imageKey,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    })
  } catch (error) {
    console.error('Error updating asset:', error)

    // Handle validation errors
    if (error instanceof ValidationError) {
      return validationErrorResponse(error.message, error.field)
    }

    // Handle database errors
    if (error instanceof Error) {
      if (error.name === 'SequelizeValidationError') {
        return validationErrorResponse('Validation failed: ' + error.message)
      }
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to update asset')
  }
}