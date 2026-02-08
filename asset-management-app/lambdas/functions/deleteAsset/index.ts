import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../../shared/src/utils/response'

/**
 * Delete Asset Lambda Handler
 * 
 * Deletes an asset by ID (hard delete)
 * 
 * Path parameter:
 * - id: Asset ID (UUID)
 * 
 * Note: This is a hard delete. For production, consider implementing soft deletes.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Delete Asset Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Get asset ID from path parameters
    const assetId = event.pathParameters?.id

    if (!assetId) {
      return validationErrorResponse('Asset ID is required', 'id')
    }

    // Connect to database
    await connectToDatabase()

    // Find asset
    const asset = await Asset.findByPk(assetId)

    if (!asset) {
      // Return 204 for idempotency (already deleted or never existed)
      return {
        statusCode: 204,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: '',
      }
    }

    // Delete asset
    await asset.destroy()

    console.log('Asset deleted successfully:', assetId)

    // Return 204 No Content (successful deletion)
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: '',
    }
  } catch (error) {
    console.error('Error deleting asset:', error)

    // Handle database errors
    if (error instanceof Error) {
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to delete asset')
  }
}