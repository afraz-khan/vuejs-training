import { defineStorage } from '@aws-amplify/backend';

/**
 * Define and configure your storage resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/storage
 */
export const storage = defineStorage({
  name: 'assetImages',
  access: (allow) => ({
    // Path pattern: assets/{userId}/{assetId}/filename.jpg
    // This provides better organization and user isolation
    'assets/{entity_id}/*': [
      // Authenticated users can read, write, delete files in their own folder
      // {entity_id} will be replaced with the user's Cognito ID
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
});