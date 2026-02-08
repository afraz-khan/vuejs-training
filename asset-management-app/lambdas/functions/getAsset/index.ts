import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../../shared/src/utils/response'

/**
 * Get Asset by ID Lambda Handler
 * 
 * Retrieves a single asset by its ID
 * 
 * Path parameter:
 * - id: Asset ID (UUID)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get Asset Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Get asset ID from path parameters
    const assetId = event.pathParameters?.id

    if (!assetId) {
      return validationErrorResponse('Asset ID is required', 'id')
    }

    // Connect to database
    await connectToDatabase()

    // Find asset by ID
    const asset = await Asset.findByPk(assetId)

    if (!asset) {
      return errorResponse('Asset not found', 404)
    }

    console.log('Asset retrieved successfully:', asset.id)

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
    console.error('Error retrieving asset:', error)

    // Handle database errors
    if (error instanceof Error) {
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to retrieve asset')
  }
}