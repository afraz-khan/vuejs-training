import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { Op } from 'sequelize'
import { connectToDatabase } from '../../shared/src/config/dbHelper'
import { Asset } from '../../shared/src/models'
import {
  successResponse,
  errorResponse,
} from '../../shared/src/utils/response'

/**
 * List Assets Lambda Handler
 * 
 * Retrieves a list of assets with optional filtering and pagination
 * 
 * Query parameters:
 * - ownerId: Filter by owner ID (optional)
 * - category: Filter by category (optional)
 * - limit: Number of items per page (default: 10, max: 100)
 * - offset: Number of items to skip (default: 0)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('List Assets Lambda invoked')
  console.log('Event:', JSON.stringify(event, null, 2))

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {}
    const ownerId = queryParams.ownerId
    const category = queryParams.category
    const limit = Math.min(parseInt(queryParams.limit || '10'), 100)
    const offset = parseInt(queryParams.offset || '0')

    // Connect to database
    await connectToDatabase()

    // Build where clause for filtering
    const where: any = {}
    if (ownerId) {
      where.ownerId = ownerId
    }
    if (category) {
      where.category = category
    }

    // Query assets with pagination
    const { count, rows: assets } = await Asset.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    })

    console.log(`Retrieved ${assets.length} assets (total: ${count})`)

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit)
    const currentPage = Math.floor(offset / limit) + 1

    // Return success response with pagination
    return successResponse({
      assets: assets.map((asset) => ({
        id: asset.id,
        ownerId: asset.ownerId,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        imageKey: asset.imageKey,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      })),
      pagination: {
        total: count,
        limit,
        offset,
        currentPage,
        totalPages,
        hasMore: offset + limit < count,
      },
    })
  } catch (error) {
    console.error('Error listing assets:', error)

    // Handle database errors
    if (error instanceof Error) {
      if (error.name === 'SequelizeDatabaseError') {
        return errorResponse('Database error occurred', 500)
      }
    }

    // Generic error
    return errorResponse('Failed to list assets')
  }
}