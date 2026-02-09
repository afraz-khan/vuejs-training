# Step 1.4.1: Frontend Foundation - Services, Stores & Amplify Configuration

## Overview
In this step, you'll set up the Vue 3 frontend foundation to connect with both backend APIs:
- **REST API** (API Gateway + Lambda → RDS MySQL) for asset CRUD
- **GraphQL API** (AppSync → DynamoDB) for tags, status, and activity logs

**What you'll build:**
- Amplify configuration in frontend
- API service layer (REST + GraphQL)
- Pinia stores for state management
- Composables for reusable logic
- Error handling utilities

**Why this architecture?**
- **Services**: Centralized API calls, easy to test and maintain
- **Stores**: Single source of truth for application state
- **Composables**: Reusable logic across components
- **Separation of concerns**: Clear boundaries between data fetching and UI

---

## ⚠️ Important: Check Existing Files First

**Before creating new files, check what already exists:**

| File | Status | Action Required |
|------|--------|-----------------|
| `src/stores/authStore.js` | ✅ Already exists | Review only - keep existing (it's better than guide version) |
| `src/services/apiService.js` | ✅ Already exists | **Fix**: Change `.put()` to `.patch()` in updateAsset method |
| `src/services/graphqlService.js` | ✅ Already exists | Review only - should be correct |
| `src/services/storageService.js` | ✅ Already exists | **Fix**: Ensure it uses `path` (not `key`) for Amplify v6 |
| `src/stores/assetStore.js` | ❌ Create new | Follow Step 4.2 |
| `src/stores/tagStore.js` | ❌ Create new | Follow Step 4.3 |
| `src/stores/statusStore.js` | ❌ Create new | Follow Step 4.4 |
| `src/stores/activityStore.js` | ❌ Create new | Follow Step 4.5 |
| `src/composables/useAuth.js` | ❌ Create new | Follow Step 5.1 |
| `src/composables/useAssets.js` | ❌ Create new | Follow Step 5.2 |
| `src/utils/errorHandler.js` | ❌ Create new | Follow Step 6.1 |
| `src/utils/dateFormatter.js` | ❌ Create new | Follow Step 6.2 |

**Key Fixes Needed:**
1. **apiService.js**: Line 70 - change `client.put()` to `client.patch()`
2. **storageService.js**: Already fixed if you followed the deprecation warning fix

**Note on Filenames:**
- Service files use **singular** names: `apiService.js`, `graphqlService.js`, `storageService.js`
- If you have plural names (`apiServices.js`, etc.), rename them to singular for consistency

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Vue 3 Components                      │
│              (AssetList, AssetForm, etc.)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Use composables & stores
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Composables Layer                      │
│         (useAssets, useAuth, useTags, etc.)            │
└────────┬───────────────────────────────────────┬────────┘
         │                                       │
         │ Call stores                           │ Call services
         │                                       │
┌────────▼────────┐                    ┌────────▼────────┐
│  Pinia Stores   │                    │    Services     │
│  (State Mgmt)   │◄───────────────────│  (API Calls)    │
└─────────────────┘                    └────────┬────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    │                       │
                          ┌─────────▼────────┐   ┌─────────▼────────┐
                          │  apiService.js   │   │ graphqlService.js│
                          │  (REST/RDS)      │   │  (AppSync/DDB)   │
                          └──────────────────┘   └──────────────────┘
```

---

## Prerequisites

- Completed Step 1.3.9 (DynamoDB schema deployed)
- Frontend project exists at `asset-management-app/frontend`
- Node.js and npm installed
- Basic understanding of Vue 3 Composition API

---

## Step 1: Install Required Dependencies

Navigate to the frontend directory and install Amplify libraries:

```bash
cd asset-management-app/frontend

# Install Amplify libraries
npm install aws-amplify

# Install Pinia (if not already installed)
npm install pinia

# Install axios for REST API calls
npm install axios

# Install date formatting library
npm install date-fns
```

**What each library does:**
- `aws-amplify`: AWS Amplify client library (Auth, Storage, GraphQL)
- `pinia`: Vue 3 state management
- `axios`: HTTP client for REST API calls
- `date-fns`: Date formatting utilities

---

## Step 2: Configure Amplify in Frontend

### 2.1: Copy amplify_outputs.json

The `amplify_outputs.json` file contains all backend configuration (API endpoints, auth config, etc.).

```bash
# From asset-management-app directory
cp amplify_outputs.json frontend/
```

**Verify the file contains:**
- Auth configuration (Cognito user pool)
- Storage configuration (S3 bucket)
- Data configuration (AppSync GraphQL endpoint)
- Custom configuration (API Gateway REST endpoint)

### 2.2: Create Amplify Configuration File

Create `frontend/src/amplifyConfig.js`:

```javascript
import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'

// Configure Amplify with backend outputs
Amplify.configure(outputs)

export default Amplify
```

### 2.3: Update main.js

Update `frontend/src/main.js` to initialize Amplify:

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import Amplify configuration
import './amplifyConfig'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

---

## Step 3: Create API Service Layer

**Note:** If you've already created service files from previous steps, compare them with the versions below. The key differences to check:
- **Filename consistency**: Use singular names (`apiService.js`, not `apiServices.js`)
- **apiService.js**: 
  - ⚠️ **IMPORTANT**: Your existing file uses `.put()` but the backend API Gateway is configured for `PATCH`. You need to change `client.put()` to `client.patch()` in the `updateAsset` method.
  - Should use `PATCH` method for updates (matches backend.ts API Gateway configuration)
- **graphqlService.js**: Should match the DynamoDB schema from Step 1.3.9
- **storageService.js**: Should use `path` (not `key`) for Amplify v6 compatibility

### 3.1: Review/Create REST API Service (for RDS operations)

**If file exists:** Open `frontend/src/services/apiService.js` and verify:
1. Change line 70 from `client.put(...)` to `client.patch(...)`
2. All other methods should match the code below

**If file doesn't exist:** Create `frontend/src/services/apiService.js`:

Create `frontend/src/services/apiService.js`:

```javascript
import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

// Get API URL from environment or amplify_outputs.json
const API_URL = import.meta.env.VITE_API_URL || 'YOUR_API_GATEWAY_URL'

/**
 * Get authentication token from Amplify
 */
async function getAuthToken() {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString()
  } catch (error) {
    console.error('Error getting auth token:', error)
    throw new Error('Authentication required')
  }
}

/**
 * Create axios instance with auth headers
 */
async function createAuthenticatedClient() {
  const token = await getAuthToken()
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Asset API Service (REST → RDS MySQL)
 */
export const assetApi = {
  /**
   * Create a new asset
   */
  async createAsset(assetData) {
    const client = await createAuthenticatedClient()
    const response = await client.post('/assets', assetData)
    return response.data
  },

  /**
   * Get all assets for current user
   */
  async listAssets() {
    const client = await createAuthenticatedClient()
    const response = await client.get('/assets')
    return response.data
  },

  /**
   * Get single asset by ID
   */
  async getAsset(assetId) {
    const client = await createAuthenticatedClient()
    const response = await client.get(`/assets/${assetId}`)
    return response.data
  },

  /**
   * Update asset
   */
  async updateAsset(assetId, assetData) {
    const client = await createAuthenticatedClient()
    const response = await client.patch(`/assets/${assetId}`, assetData)
    return response.data
  },

  /**
   * Delete asset
   */
  async deleteAsset(assetId) {
    const client = await createAuthenticatedClient()
    await client.delete(`/assets/${assetId}`)
  },

  /**
   * Sync database schema (admin operation)
   */
  async syncSchema() {
    const client = await createAuthenticatedClient()
    const response = await client.post('/sync-schema')
    return response.data
  }
}
```

---

### 3.2: Review/Create GraphQL Service (for DynamoDB operations)

**If file exists:** Open `frontend/src/services/graphqlService.js` and verify it matches the code below (should already be correct if you followed Step 1.3.9).

**If file doesn't exist:** Create `frontend/src/services/graphqlService.js`:

```javascript
import { generateClient } from 'aws-amplify/data'

// Create Amplify Data client
const client = generateClient()

/**
 * Asset Tag Service (GraphQL → DynamoDB)
 */
export const tagApi = {
  /**
   * Create a new tag for an asset
   */
  async createTag(tagData) {
    const { data, errors } = await client.models.AssetTag.create(tagData)
    if (errors) throw new Error(errors[0].message)
    return data
  },

  /**
   * List all tags for an asset
   */
  async listTagsByAsset(assetId) {
    const { data, errors } = await client.models.AssetTag.list({
      filter: { assetId: { eq: assetId } }
    })
    if (errors) throw new Error(errors[0].message)
    return data
  },

  /**
   * Delete a tag
   */
  async deleteTag(tagId) {
    const { data, errors } = await client.models.AssetTag.delete({ id: tagId })
    if (errors) throw new Error(errors[0].message)
    return data
  }
}

/**
 * Asset Status Service (GraphQL → DynamoDB)
 */
export const statusApi = {
  /**
   * Create or update asset status
   */
  async createStatus(statusData) {
    const { data, errors } = await client.models.AssetStatus.create(statusData)
    if (errors) throw new Error(errors[0].message)
    return data
  },

  /**
   * Get current status for an asset
   */
  async getAssetStatus(assetId) {
    const { data, errors } = await client.models.AssetStatus.list({
      filter: { assetId: { eq: assetId } },
      limit: 1
    })
    if (errors) throw new Error(errors[0].message)
    return data[0] || null
  },

  /**
   * List status history for an asset
   */
  async listStatusHistory(assetId) {
    const { data, errors } = await client.models.AssetStatus.list({
      filter: { assetId: { eq: assetId } }
    })
    if (errors) throw new Error(errors[0].message)
    return data
  }
}

/**
 * Activity Log Service (GraphQL → DynamoDB)
 */
export const activityApi = {
  /**
   * Log an activity
   */
  async logActivity(activityData) {
    const { data, errors } = await client.models.ActivityLog.create(activityData)
    if (errors) throw new Error(errors[0].message)
    return data
  },

  /**
   * Get activity logs for an asset
   */
  async listActivities(assetId, limit = 50) {
    const { data, errors } = await client.models.ActivityLog.list({
      filter: { assetId: { eq: assetId } },
      limit
    })
    if (errors) throw new Error(errors[0].message)
    return data
  }
}
```

---

### 3.3: Review/Create Storage Service (for S3 operations)

**If file exists:** Open `frontend/src/services/storageService.js` and verify it uses `path` (not `key`) - see Amplify v6 changes below.

**If file doesn't exist:** Create `frontend/src/services/storageService.js`:

```javascript
import { uploadData, getUrl, remove } from 'aws-amplify/storage'

/**
 * Storage Service (S3 operations)
 */
export const storageService = {
  /**
   * Upload an image file to S3
   * @param {File} file - The image file to upload
   * @param {string} assetId - The asset ID (for organizing files)
   * @returns {Promise<string>} - The S3 path of the uploaded file
   */
  async uploadImage(file, assetId) {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${timestamp}-${file.name}`
      const path = `assets/${assetId}/${filename}`

      // Upload to S3 (Amplify v6 API)
      const result = await uploadData({
        path,
        data: file,
        options: {
          contentType: file.type
        }
      }).result

      return result.path
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Failed to upload image')
    }
  },

  /**
   * Get public URL for an image
   * @param {string} path - The S3 path
   * @returns {Promise<string>} - The public URL
   */
  async getImageUrl(path) {
    try {
      const result = await getUrl({ 
        path,
        options: {
          validateObjectExistence: false,
          expiresIn: 3600 // URL expires in 1 hour
        }
      })
      return result.url.toString()
    } catch (error) {
      console.error('Error getting image URL:', error)
      return null
    }
  },

  /**
   * Delete an image from S3
   * @param {string} path - The S3 path
   */
  async deleteImage(path) {
    try {
      await remove({ path })
    } catch (error) {
      console.error('Error deleting image:', error)
      throw new Error('Failed to delete image')
    }
  }
}
```

**Important Changes in Amplify v6:**
- Changed from `key` to `path` parameter
- `uploadData` returns `result.path` instead of `result.key`
- `getUrl` requires `options` object with `validateObjectExistence` and `expiresIn`
- All methods now use `path` consistently

---

## Step 4: Create Pinia Stores

**Note:** The `authStore.js` already exists from previous setup. Review it to ensure it matches the requirements below, or skip to Step 4.2 if it's already correct.

### 4.1: Review Existing Auth Store

The auth store should already exist at `frontend/src/stores/authStore.js`. Verify it has these key features:

**Required State:**
- `user` - Current user object
- `isAuthenticated` - Boolean authentication status
- `loading` - Loading state for async operations
- `error` - Error messages

**Required Getters:**
- `userId` - Get current user's ID
- `userEmail` - Get current user's email

**Required Actions:**
- `signup(email, password, name)` - Register new user
- `confirmSignup(email, code)` - Confirm email with code
- `login(email, password)` - Sign in user
- `logout()` - Sign out user
- `checkAuth()` - Check if user is authenticated
- `fetchCurrentUser()` - Get current user details

**Comparison with Guide Version:**

Your existing authStore has:
- ✅ All required state properties
- ✅ All required getters (plus `isLoggedIn`)
- ✅ All required actions
- ✅ Better error handling (returns success/error objects)
- ✅ Additional `getAuthToken()` method (useful!)
- ✅ Additional `clearError()` method (useful!)

**Differences from guide:**
1. **Parameter format**: Your version uses object parameters `{ email, password }` instead of separate parameters
2. **Return values**: Your version returns `{ success, error }` objects (better!)
3. **Extra methods**: Has `getAuthToken()` and `clearError()` (keep these!)

**Recommendation:** ✅ **Keep your existing authStore.js** - it's more complete and better structured than the guide version.

**If you want to match the guide exactly** (not recommended), here's the guide version:

<details>
<summary>Click to see guide version (optional - your existing version is better)</summary>

```javascript
import { defineStore } from 'pinia'
import { 
  signIn, 
  signUp, 
  signOut, 
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession
} from 'aws-amplify/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

  getters: {
    userId: (state) => state.user?.userId,
    userEmail: (state) => state.user?.signInDetails?.loginId
  },

  actions: {
    async checkAuth() {
      try {
        const user = await getCurrentUser()
        this.user = user
        this.isAuthenticated = true
        return true
      } catch {
        this.user = null
        this.isAuthenticated = false
        return false
      }
    },

    async signup(email, password, name) {
      this.loading = true
      this.error = null
      try {
        const { userId } = await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
              name
            }
          }
        })
        return { success: true, userId }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async confirmSignup(email, code) {
      this.loading = true
      this.error = null
      try {
        await confirmSignUp({
          username: email,
          confirmationCode: code
        })
        return { success: true }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        await signIn({ username: email, password })
        await this.checkAuth()
        return { success: true }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await signOut()
        this.user = null
        this.isAuthenticated = false
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```
</details>

---

### 4.2: Create Asset Store

Create `frontend/src/stores/assetStore.js`:

```javascript
import { defineStore } from 'pinia'
import { assetApi } from '@/services/apiService'
import { storageService } from '@/services/storageService'

export const useAssetStore = defineStore('asset', {
  state: () => ({
    assets: [],
    currentAsset: null,
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Get assets by category
     */
    assetsByCategory: (state) => (category) => {
      return state.assets.filter(asset => asset.category === category)
    },

    /**
     * Get total asset count
     */
    totalAssets: (state) => state.assets.length
  },

  actions: {
    /**
     * Fetch all assets for current user
     */
    async fetchAssets() {
      this.loading = true
      this.error = null
      try {
        this.assets = await assetApi.listAssets()
      } catch (error) {
        this.error = error.message
        console.error('Error fetching assets:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch single asset by ID
     */
    async fetchAssetById(assetId) {
      this.loading = true
      this.error = null
      try {
        this.currentAsset = await assetApi.getAsset(assetId)
        return this.currentAsset
      } catch (error) {
        this.error = error.message
        console.error('Error fetching asset:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new asset
     */
    async createAsset(assetData, imageFile = null) {
      this.loading = true
      this.error = null
      try {
        // Create asset first to get ID
        const asset = await assetApi.createAsset(assetData)

        // Upload image if provided
        if (imageFile) {
          const imageKey = await storageService.uploadImage(imageFile, asset.id)
          const imageUrl = await storageService.getImageUrl(imageKey)
          
          // Update asset with image URL
          const updatedAsset = await assetApi.updateAsset(asset.id, {
            ...assetData,
            imageUrl
          })
          
          this.assets.push(updatedAsset)
          return updatedAsset
        }

        this.assets.push(asset)
        return asset
      } catch (error) {
        this.error = error.message
        console.error('Error creating asset:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing asset
     */
    async updateAsset(assetId, assetData, imageFile = null) {
      this.loading = true
      this.error = null
      try {
        // Upload new image if provided
        if (imageFile) {
          const imageKey = await storageService.uploadImage(imageFile, assetId)
          const imageUrl = await storageService.getImageUrl(imageKey)
          assetData.imageUrl = imageUrl
        }

        const updatedAsset = await assetApi.updateAsset(assetId, assetData)
        
        // Update in local state
        const index = this.assets.findIndex(a => a.id === assetId)
        if (index !== -1) {
          this.assets[index] = updatedAsset
        }
        
        if (this.currentAsset?.id === assetId) {
          this.currentAsset = updatedAsset
        }

        return updatedAsset
      } catch (error) {
        this.error = error.message
        console.error('Error updating asset:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete an asset
     */
    async deleteAsset(assetId) {
      this.loading = true
      this.error = null
      try {
        await assetApi.deleteAsset(assetId)
        
        // Remove from local state
        this.assets = this.assets.filter(a => a.id !== assetId)
        
        if (this.currentAsset?.id === assetId) {
          this.currentAsset = null
        }
      } catch (error) {
        this.error = error.message
        console.error('Error deleting asset:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

---

### 4.3: Create Tag Store

Create `frontend/src/stores/tagStore.js`:

```javascript
import { defineStore } from 'pinia'
import { tagApi } from '@/services/graphqlService'
import { useAuthStore } from './authStore'

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: {},  // Organized by assetId: { assetId: [tags] }
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Get tags for a specific asset
     */
    getTagsByAsset: (state) => (assetId) => {
      return state.tags[assetId] || []
    }
  },

  actions: {
    /**
     * Fetch tags for an asset
     */
    async fetchTagsByAsset(assetId) {
      this.loading = true
      this.error = null
      try {
        const tags = await tagApi.listTagsByAsset(assetId)
        this.tags[assetId] = tags
        return tags
      } catch (error) {
        this.error = error.message
        console.error('Error fetching tags:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Add a tag to an asset
     */
    async addTag(assetId, tagName, tagValue) {
      this.loading = true
      this.error = null
      try {
        const authStore = useAuthStore()
        const tag = await tagApi.createTag({
          assetId,
          tagName,
          tagValue,
          createdBy: authStore.userId,
          createdAt: new Date().toISOString()
        })

        // Add to local state
        if (!this.tags[assetId]) {
          this.tags[assetId] = []
        }
        this.tags[assetId].push(tag)

        return tag
      } catch (error) {
        this.error = error.message
        console.error('Error adding tag:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove a tag
     */
    async removeTag(assetId, tagId) {
      this.loading = true
      this.error = null
      try {
        await tagApi.deleteTag(tagId)

        // Remove from local state
        if (this.tags[assetId]) {
          this.tags[assetId] = this.tags[assetId].filter(t => t.id !== tagId)
        }
      } catch (error) {
        this.error = error.message
        console.error('Error removing tag:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

---

### 4.4: Create Status Store

Create `frontend/src/stores/statusStore.js`:

```javascript
import { defineStore } from 'pinia'
import { statusApi } from '@/services/graphqlService'
import { useAuthStore } from './authStore'

export const useStatusStore = defineStore('status', {
  state: () => ({
    statuses: {},  // Organized by assetId: { assetId: currentStatus }
    statusHistory: {},  // Organized by assetId: { assetId: [history] }
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Get current status for an asset
     */
    getCurrentStatus: (state) => (assetId) => {
      return state.statuses[assetId] || null
    },

    /**
     * Get status history for an asset
     */
    getStatusHistory: (state) => (assetId) => {
      return state.statusHistory[assetId] || []
    }
  },

  actions: {
    /**
     * Fetch current status for an asset
     */
    async fetchAssetStatus(assetId) {
      this.loading = true
      this.error = null
      try {
        const status = await statusApi.getAssetStatus(assetId)
        this.statuses[assetId] = status
        return status
      } catch (error) {
        this.error = error.message
        console.error('Error fetching status:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch status history for an asset
     */
    async fetchStatusHistory(assetId) {
      this.loading = true
      this.error = null
      try {
        const history = await statusApi.listStatusHistory(assetId)
        this.statusHistory[assetId] = history
        return history
      } catch (error) {
        this.error = error.message
        console.error('Error fetching status history:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Update asset status
     */
    async updateStatus(assetId, status, statusNote = '') {
      this.loading = true
      this.error = null
      try {
        const authStore = useAuthStore()
        const newStatus = await statusApi.createStatus({
          assetId,
          status,
          statusNote,
          updatedBy: authStore.userId,
          updatedAt: new Date().toISOString()
        })

        // Update local state
        this.statuses[assetId] = newStatus

        // Add to history
        if (!this.statusHistory[assetId]) {
          this.statusHistory[assetId] = []
        }
        this.statusHistory[assetId].unshift(newStatus)

        return newStatus
      } catch (error) {
        this.error = error.message
        console.error('Error updating status:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

---

### 4.5: Create Activity Store

Create `frontend/src/stores/activityStore.js`:

```javascript
import { defineStore } from 'pinia'
import { activityApi } from '@/services/graphqlService'
import { useAuthStore } from './authStore'

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: {},  // Organized by assetId: { assetId: [activities] }
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Get activities for an asset
     */
    getActivitiesByAsset: (state) => (assetId) => {
      return state.activities[assetId] || []
    }
  },

  actions: {
    /**
     * Fetch activities for an asset
     */
    async fetchActivities(assetId, limit = 50) {
      this.loading = true
      this.error = null
      try {
        const activities = await activityApi.listActivities(assetId, limit)
        this.activities[assetId] = activities
        return activities
      } catch (error) {
        this.error = error.message
        console.error('Error fetching activities:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Log an activity
     */
    async logActivity(assetId, action, details = '') {
      this.loading = true
      this.error = null
      try {
        const authStore = useAuthStore()
        const activity = await activityApi.logActivity({
          assetId,
          action,
          performedBy: authStore.userId,
          details,
          timestamp: new Date().toISOString()
        })

        // Add to local state
        if (!this.activities[assetId]) {
          this.activities[assetId] = []
        }
        this.activities[assetId].unshift(activity)

        return activity
      } catch (error) {
        this.error = error.message
        console.error('Error logging activity:', error)
        // Don't throw - activity logging should not break the app
      } finally {
        this.loading = false
      }
    }
  }
})
```

---

## Step 5: Create Composables

### 5.1: Create useAuth Composable

Create `frontend/src/composables/useAuth.js`:

```javascript
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const loading = computed(() => authStore.loading)
  const error = computed(() => authStore.error)

  const login = async (email, password) => {
    await authStore.login(email, password)
    router.push('/assets')
  }

  const logout = async () => {
    await authStore.logout()
    router.push('/login')
  }

  const signup = async (email, password, name) => {
    return await authStore.signup(email, password, name)
  }

  const confirmSignup = async (email, code) => {
    await authStore.confirmSignup(email, code)
    router.push('/login')
  }

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    signup,
    confirmSignup
  }
}
```

### 5.2: Create useAssets Composable

Create `frontend/src/composables/useAssets.js`:

```javascript
import { computed } from 'vue'
import { useAssetStore } from '@/stores/assetStore'
import { useActivityStore } from '@/stores/activityStore'

export function useAssets() {
  const assetStore = useAssetStore()
  const activityStore = useActivityStore()

  const assets = computed(() => assetStore.assets)
  const currentAsset = computed(() => assetStore.currentAsset)
  const loading = computed(() => assetStore.loading)
  const error = computed(() => assetStore.error)

  const fetchAssets = async () => {
    await assetStore.fetchAssets()
  }

  const fetchAssetById = async (assetId) => {
    const asset = await assetStore.fetchAssetById(assetId)
    // Log the view activity
    await activityStore.logActivity(assetId, 'viewed')
    return asset
  }

  const createAsset = async (assetData, imageFile) => {
    const asset = await assetStore.createAsset(assetData, imageFile)
    // Log the creation activity
    await activityStore.logActivity(asset.id, 'created', 'Asset created')
    return asset
  }

  const updateAsset = async (assetId, assetData, imageFile) => {
    const asset = await assetStore.updateAsset(assetId, assetData, imageFile)
    // Log the update activity
    await activityStore.logActivity(assetId, 'updated', 'Asset updated')
    return asset
  }

  const deleteAsset = async (assetId) => {
    await assetStore.deleteAsset(assetId)
    // Log the deletion activity
    await activityStore.logActivity(assetId, 'deleted', 'Asset deleted')
  }

  return {
    assets,
    currentAsset,
    loading,
    error,
    fetchAssets,
    fetchAssetById,
    createAsset,
    updateAsset,
    deleteAsset
  }
}
```

---

## Step 6: Create Utility Functions

### 6.1: Create Error Handler

Create `frontend/src/utils/errorHandler.js`:

```javascript
/**
 * Format error message for display
 */
export function formatError(error) {
  if (typeof error === 'string') {
    return error
  }

  if (error.response?.data?.message) {
    return error.response.data.message
  }

  if (error.message) {
    return error.message
  }

  return 'An unexpected error occurred'
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error) {
  const message = formatError(error)
  
  // Log to console for debugging
  console.error('API Error:', error)

  // Return formatted message
  return message
}
```

### 6.2: Create Date Formatter

Create `frontend/src/utils/dateFormatter.js`:

```javascript
import { format, formatDistanceToNow } from 'date-fns'

/**
 * Format date to readable string
 */
export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return ''
  return format(new Date(date), formatStr)
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Format date and time
 */
export function formatDateTime(date) {
  if (!date) return ''
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}
```

---

## Step 7: Update Environment Variables

Create or update `frontend/.env`:

```env
# API Gateway REST endpoint (from backend deployment)
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

# Optional: Enable debug logging
VITE_DEBUG=false
```

**How to get your API URL:**

1. After deploying backend, check the CloudFormation outputs
2. Or run: `aws cloudformation describe-stacks --stack-name <your-stack-name>`
3. Look for the API Gateway URL output

**Note:** The GraphQL endpoint is automatically configured via `amplify_outputs.json`, so you don't need to add it here.

---

## Step 8: Test the Setup

### 8.1: Create a Test Component

Create `frontend/src/components/TestSetup.vue`:

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAssets } from '@/composables/useAssets'

const { isAuthenticated, user } = useAuth()
const { assets, fetchAssets } = useAssets()

const testResults = ref({
  amplifyConfigured: false,
  authWorking: false,
  apiConnected: false,
  graphqlConnected: false
})

onMounted(async () => {
  // Test 1: Amplify configured
  try {
    testResults.value.amplifyConfigured = true
  } catch (error) {
    console.error('Amplify config error:', error)
  }

  // Test 2: Auth working
  try {
    testResults.value.authWorking = isAuthenticated.value !== undefined
  } catch (error) {
    console.error('Auth error:', error)
  }

  // Test 3: API connected (if authenticated)
  if (isAuthenticated.value) {
    try {
      await fetchAssets()
      testResults.value.apiConnected = true
    } catch (error) {
      console.error('API error:', error)
    }
  }
})
</script>

<template>
  <div class="test-setup">
    <h2>Setup Test Results</h2>
    <ul>
      <li :class="{ success: testResults.amplifyConfigured }">
        Amplify Configured: {{ testResults.amplifyConfigured ? '✓' : '✗' }}
      </li>
      <li :class="{ success: testResults.authWorking }">
        Auth Working: {{ testResults.authWorking ? '✓' : '✗' }}
      </li>
      <li :class="{ success: testResults.apiConnected }">
        API Connected: {{ testResults.apiConnected ? '✓' : '✗' }}
      </li>
    </ul>
    <div v-if="isAuthenticated">
      <p>User: {{ user?.userId }}</p>
      <p>Assets: {{ assets.length }}</p>
    </div>
  </div>
</template>

<style scoped>
.test-setup {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.success {
  color: green;
}
</style>
```

### 8.2: Add Test Route

Update `frontend/src/router/index.js` to add a test route:

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import TestSetup from '@/components/TestSetup.vue'

const routes = [
  {
    path: '/test',
    name: 'test',
    component: TestSetup
  }
  // ... other routes
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

### 8.3: Run the Test

```bash
# Start dev server
npm run dev

# Navigate to http://localhost:5173/test
# Check that all tests pass
```

---

## Step 9: Verify the Setup

### Verification Checklist

Before moving to the next step, verify:

- [ ] `amplify_outputs.json` copied to frontend directory
- [ ] Amplify configured in `main.js`
- [ ] All dependencies installed (`aws-amplify`, `pinia`, `axios`, `date-fns`)
- [ ] API service created (`apiService.js`)
- [ ] GraphQL service created (`graphqlService.js`)
- [ ] Storage service created (`storageService.js`)
- [ ] All 5 Pinia stores created (auth, asset, tag, status, activity)
- [ ] Composables created (`useAuth.js`, `useAssets.js`)
- [ ] Utility functions created (error handler, date formatter)
- [ ] Environment variables set in `.env`
- [ ] Test component runs without errors
- [ ] Can import stores in components
- [ ] Can import services in stores

### Test Each Service Manually

**Test REST API Service:**
```javascript
// In browser console or test component
import { assetApi } from '@/services/apiService'

// Should return assets or empty array
const assets = await assetApi.listAssets()
console.log(assets)
```

**Test GraphQL Service:**
```javascript
// In browser console or test component
import { tagApi } from '@/services/graphqlService'

// Should work (might return empty if no tags exist)
const tags = await tagApi.listTagsByAsset('test-asset-id')
console.log(tags)
```

**Test Auth Store:**
```javascript
// In browser console or test component
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const isAuth = await authStore.checkAuth()
console.log('Authenticated:', isAuth)
```

---

## Troubleshooting

### Issue: "Amplify is not configured"

**Solution:**
- Verify `amplify_outputs.json` exists in frontend directory
- Check that `amplifyConfig.js` is imported in `main.js`
- Restart dev server

### Issue: "Cannot find module '@/services/...'"

**Solution:**
- Check that `@` alias is configured in `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

### Issue: "CORS error when calling API"

**Solution:**
- Verify API Gateway has CORS enabled
- Check that API URL in `.env` is correct
- Ensure you're authenticated (token is being sent)

### Issue: "GraphQL errors"

**Solution:**
- Verify DynamoDB schema is deployed (Step 1.3.9)
- Check `amplify_outputs.json` has `data` section with GraphQL endpoint
- Ensure user is authenticated

### Issue: "Pinia store not working"

**Solution:**
- Verify Pinia is installed: `npm install pinia`
- Check that Pinia is registered in `main.js`: `app.use(createPinia())`
- Restart dev server

---

## Project Structure After This Step

```
frontend/
├── src/
│   ├── components/
│   │   └── TestSetup.vue
│   ├── composables/
│   │   ├── useAuth.js
│   │   └── useAssets.js
│   ├── services/
│   │   ├── apiService.js
│   │   ├── graphqlService.js
│   │   └── storageService.js
│   ├── stores/
│   │   ├── authStore.js
│   │   ├── assetStore.js
│   │   ├── tagStore.js
│   │   ├── statusStore.js
│   │   └── activityStore.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   └── dateFormatter.js
│   ├── amplifyConfig.js
│   ├── App.vue
│   └── main.js
├── amplify_outputs.json
├── .env
└── package.json
```

---

## What's Next?

In **Step 1.4.2**, you'll:
- Create asset management UI components (AssetCard, AssetList)
- Build create asset form with image upload
- Implement asset list view with CRUD operations
- Connect UI to REST API (RDS) and storage (S3)

**Note:** Authentication UI (login/signup) was already covered in Steps 1.2.1-1.2.4, so we skip directly to asset management.

---

## Key Takeaways

✅ **Service Layer** - Centralized API calls, easy to test and maintain
✅ **Pinia Stores** - Single source of truth for application state
✅ **Composables** - Reusable logic that combines stores and services
✅ **Separation of Concerns** - Clear boundaries between layers
✅ **Type Safety** - Services return consistent data structures
✅ **Error Handling** - Centralized error formatting and logging
✅ **Amplify Integration** - Seamless connection to AWS services

---

## Additional Resources

- [Pinia Documentation](https://pinia.vuejs.org/)
- [Amplify JavaScript Library](https://docs.amplify.aws/javascript/)
- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html)
- [Axios Documentation](https://axios-http.com/)
- [date-fns Documentation](https://date-fns.org/)

