# Step 1.4.4: Asset Tags Management (GraphQL Integration)

## 🎯 Goal
Integrate GraphQL API to add tag management functionality to assets, demonstrating how to use both REST and GraphQL APIs together in a Vue application.

## 📚 What You'll Learn
- GraphQL queries and mutations in Vue
- Combining REST and GraphQL APIs
- Tag management UI components
- Real-time tag updates
- GraphQL error handling
- Optimistic UI updates with GraphQL

## 📋 Prerequisites
- Step 1.4.3 completed (Asset Detail View)
- GraphQL API configured (Step 1.3.9)
- Understanding of GraphQL concepts
- tagStore already created

---

## 🚀 Implementation Steps

### Step 1: Create Tag Management Component

**File:** `frontend/src/components/assets/AssetTags.vue`

```vue
<template>
  <div class="asset-tags">
    <div class="tags-header">
      <h3 class="text-lg font-semibold">Tags</h3>
      <el-button size="small" type="primary" @click="showAddDialog = true">
        <el-icon class="mr-1"><Plus /></el-icon>
        Add Tag
      </el-button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-4">
      <el-skeleton :rows="2" animated />
    </div>

    <!-- Error State -->
    <el-alert
      v-else-if="error"
      type="error"
      :title="error"
      show-icon
      class="mb-4"
    />

    <!-- Tags List -->
    <div v-else-if="tags.length > 0" class="tags-list">
      <el-tag
        v-for="tag in tags"
        :key="tag.id"
        closable
        :disable-transitions="false"
        @close="handleRemoveTag(tag.id)"
        class="tag-item"
      >
        <span class="tag-name">{{ tag.tagName }}</span>
        <span class="tag-separator">:</span>
        <span class="tag-value">{{ tag.tagValue }}</span>
      </el-tag>
    </div>

    <!-- Empty State -->
    <el-empty
      v-else
      description="No tags yet"
      :image-size="80"
    >
      <el-button type="primary" size="small" @click="showAddDialog = true">
        Add First Tag
      </el-button>
    </el-empty>

    <!-- Add Tag Dialog -->
    <el-dialog
      v-model="showAddDialog"
      title="Add Tag"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="Tag Name" prop="tagName">
          <el-input
            v-model="formData.tagName"
            placeholder="e.g., department, location, status"
          />
        </el-form-item>

        <el-form-item label="Tag Value" prop="tagValue">
          <el-input
            v-model="formData.tagValue"
            placeholder="e.g., IT, Building A, Active"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="adding" @click="handleAddTag">
          Add Tag
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useTagStore } from '@/stores/tagStore'

// Props
const props = defineProps({
  assetId: {
    type: String,
    required: true
  }
})

// Store
const tagStore = useTagStore()

// State
const showAddDialog = ref(false)
const adding = ref(false)
const formRef = ref(null)

// Form data
const formData = reactive({
  tagName: '',
  tagValue: ''
})

// Validation rules
const rules = {
  tagName: [
    { required: true, message: 'Please enter tag name', trigger: 'blur' },
    { min: 2, max: 50, message: 'Length should be 2 to 50', trigger: 'blur' }
  ],
  tagValue: [
    { required: true, message: 'Please enter tag value', trigger: 'blur' },
    { min: 1, max: 100, message: 'Length should be 1 to 100', trigger: 'blur' }
  ]
}

// Computed
const tags = computed(() => tagStore.getTagsByAsset(props.assetId))
const loading = computed(() => tagStore.loading)
const error = computed(() => tagStore.error)

// Load tags on mount
onMounted(async () => {
  await tagStore.fetchTagsByAsset(props.assetId)
})

// Handle add tag
const handleAddTag = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    adding.value = true
    await tagStore.createTag({
      assetId: props.assetId,
      tagName: formData.tagName,
      tagValue: formData.tagValue
    })

    ElMessage.success('Tag added successfully')
    showAddDialog.value = false
    formRef.value.resetFields()
  } catch (error) {
    if (error !== 'validation') {
      ElMessage.error('Failed to add tag: ' + error.message)
    }
  } finally {
    adding.value = false
  }
}

// Handle remove tag
const handleRemoveTag = async (tagId) => {
  try {
    await tagStore.deleteTag(tagId)
    ElMessage.success('Tag removed successfully')
  } catch (error) {
    ElMessage.error('Failed to remove tag: ' + error.message)
  }
}
</script>

<style scoped>
.asset-tags {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  font-size: 14px;
  padding: 8px 12px;
}

.tag-name {
  font-weight: 600;
  color: #409eff;
}

.tag-separator {
  margin: 0 4px;
  color: #909399;
}

.tag-value {
  color: #606266;
}
</style>
```

---

### Step 2: Update Asset Detail View to Include Tags

**File:** `frontend/src/views/AssetDetailView.vue`

Add the AssetTags component to the detail view. Add this after the Information Section:

```vue
<script setup>
// ... existing imports
import AssetTags from '@/components/assets/AssetTags.vue'
</script>

<template>
  <!-- ... existing code ... -->
  
  <main v-else-if="currentAsset" class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Image Section -->
      <!-- ... existing image section ... -->

      <!-- Information Section -->
      <!-- ... existing information section ... -->
    </div>

    <!-- Tags Section (Full Width) -->
    <div class="mt-8">
      <AssetTags :asset-id="currentAsset.id" />
    </div>
  </main>
</template>
```

---

### Step 3: Update Tag Store with GraphQL Operations

The tagStore should already exist from Step 1.4.1. Let's verify it has all the necessary methods:

**File:** `frontend/src/stores/tagStore.js`

```javascript
import { defineStore } from 'pinia'
import { graphqlService } from '@/services/graphqlService'

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Get tags for a specific asset
     */
    getTagsByAsset: (state) => (assetId) => {
      return state.tags.filter((tag) => tag.assetId === assetId)
    },

    /**
     * Get total tag count
     */
    totalTags: (state) => state.tags.length,
  },

  actions: {
    /**
     * Fetch tags for a specific asset
     */
    async fetchTagsByAsset(assetId) {
      this.loading = true
      this.error = null
      try {
        const tags = await graphqlService.listAssetTags(assetId)
        
        // Replace tags for this asset
        this.tags = [
          ...this.tags.filter((t) => t.assetId !== assetId),
          ...tags,
        ]
      } catch (error) {
        this.error = error.message
        console.error('Error fetching tags:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Create a new tag
     */
    async createTag(tagData) {
      this.loading = true
      this.error = null
      try {
        const tag = await graphqlService.createAssetTag(tagData)
        this.tags.push(tag)
        return tag
      } catch (error) {
        this.error = error.message
        console.error('Error creating tag:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a tag
     */
    async deleteTag(tagId) {
      this.loading = true
      this.error = null
      try {
        await graphqlService.deleteAssetTag(tagId)
        this.tags = this.tags.filter((t) => t.id !== tagId)
      } catch (error) {
        this.error = error.message
        console.error('Error deleting tag:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear all tags
     */
    clearTags() {
      this.tags = []
      this.error = null
    },
  },
})
```

---

### Step 4: Verify GraphQL Service Methods

The graphqlService should already have the tag methods from Step 1.4.1. Let's verify:

**File:** `frontend/src/services/graphqlService.js`

Ensure these methods exist:

```javascript
/**
 * List tags for an asset
 */
async listAssetTags(assetId) {
  const query = `
    query ListAssetTags($assetId: ID!) {
      listAssetTags(assetId: $assetId) {
        items {
          id
          assetId
          tagName
          tagValue
          createdBy
          createdAt
        }
      }
    }
  `

  const result = await this.query(query, { assetId })
  return result.listAssetTags.items
},

/**
 * Create asset tag
 */
async createAssetTag(input) {
  const mutation = `
    mutation CreateAssetTag($input: CreateAssetTagInput!) {
      createAssetTag(input: $input) {
        id
        assetId
        tagName
        tagValue
        createdBy
        createdAt
      }
    }
  `

  const result = await this.mutate(mutation, { input })
  return result.createAssetTag
},

/**
 * Delete asset tag
 */
async deleteAssetTag(id) {
  const mutation = `
    mutation DeleteAssetTag($id: ID!) {
      deleteAssetTag(id: $id) {
        id
      }
    }
  `

  const result = await this.mutate(mutation, { id })
  return result.deleteAssetTag
},
```

---

### Step 5: Add Tags Display to Asset Card (Optional)

**File:** `frontend/src/components/assets/AssetCard.vue`

Add a tags preview to the asset card:

```vue
<template>
  <el-card class="asset-card" shadow="hover" :body-style="{ padding: '0' }">
    <!-- ... existing image and content ... -->

    <!-- Tags Preview (add before actions) -->
    <div v-if="tagCount > 0" class="asset-tags-preview">
      <el-icon><PriceTag /></el-icon>
      <span>{{ tagCount }} {{ tagCount === 1 ? 'tag' : 'tags' }}</span>
    </div>

    <!-- Actions -->
    <!-- ... existing actions ... -->
  </el-card>
</template>

<script setup>
import { PriceTag } from '@element-plus/icons-vue'
import { useTagStore } from '@/stores/tagStore'
import { computed } from 'vue'

// ... existing code ...

const tagStore = useTagStore()
const tagCount = computed(() => tagStore.getTagsByAsset(props.asset.id).length)
</script>

<style scoped>
/* ... existing styles ... */

.asset-tags-preview {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}
</style>
```

---

## ✅ Testing Checklist

Test the following scenarios:

- [ ] Tags section displays on asset detail page
- [ ] Click "Add Tag" opens dialog
- [ ] Can add tag with name and value
- [ ] Tag appears in list immediately after adding
- [ ] Can remove tag by clicking X
- [ ] Tag disappears from list after removal
- [ ] Empty state shows when no tags
- [ ] Loading state displays while fetching
- [ ] Error messages display on failures
- [ ] Form validation works (required fields, length)
- [ ] Multiple tags can be added to same asset
- [ ] Tags persist after page refresh
- [ ] Tag count shows on asset card (optional)

---

## 🎓 Key Concepts

### 1. GraphQL Queries

```javascript
// Fetch data
const query = `
  query ListAssetTags($assetId: ID!) {
    listAssetTags(assetId: $assetId) {
      items {
        id
        tagName
        tagValue
      }
    }
  }
`
```

### 2. GraphQL Mutations

```javascript
// Modify data
const mutation = `
  mutation CreateAssetTag($input: CreateAssetTagInput!) {
    createAssetTag(input: $input) {
      id
      tagName
      tagValue
    }
  }
`
```

### 3. Combining REST and GraphQL

```javascript
// REST for assets
await assetApi.getAsset(id)

// GraphQL for tags
await graphqlService.listAssetTags(id)
```

### 4. Optimistic Updates

```javascript
// Add to local state immediately
this.tags.push(newTag)

// Then sync with server
await graphqlService.createAssetTag(newTag)
```

---

## 🔍 Troubleshooting

### Tags not loading?
- Check GraphQL API is deployed
- Verify `amplify_outputs.json` has GraphQL endpoint
- Check browser console for GraphQL errors
- Ensure user is authenticated

### Tags not persisting?
- Check DynamoDB table exists
- Verify GraphQL schema is synced
- Check CloudWatch logs for Lambda errors

### CORS errors?
- GraphQL API should have CORS enabled by default
- Check Amplify configuration

---

## 📝 Summary

You've successfully implemented:
- ✅ Tag management component with add/remove
- ✅ GraphQL integration for tags
- ✅ Combined REST (assets) and GraphQL (tags) APIs
- ✅ Real-time tag updates
- ✅ Error handling and loading states
- ✅ Empty states and validation

---

## 🎯 What's Next?

In Step 1.4.5, we can implement:
- **Asset Status Tracking** - Track status changes over time
- **Activity Log Display** - Show asset activity history
- **Search and Filter** - Search assets by name, filter by category/tags
- **Bulk Operations** - Select multiple assets for batch operations

Let me know when you're ready to continue! 🚀
