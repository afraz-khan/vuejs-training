import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { connectToDatabase } from '../shared/src/config/dbHelper'
import { Asset } from '../shared/src/models'

/**
 * Example Lambda handler showing proper database connection usage
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Connect to database (reuses connection if available)
    await connectToDatabase()

    // Your business logic here
    const assets = await Asset.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: assets,
      }),
    }
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    }
  }
  // Note: We don't close the connection here
  // Lambda will reuse it for the next invocation
}