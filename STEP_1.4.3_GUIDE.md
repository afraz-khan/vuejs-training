# Step 1.4.3: Asset Detail View & Edit Functionality

## 🎯 Goal
Build the asset detail view page and edit functionality, allowing users to view full asset information and update existing assets.

## 📚 What You'll Learn
- Vue Router dynamic routes
- Asset detail page layout
- Edit dialog component
- Image update functionality
- Form pre-population
- Optimistic UI updates

## 📋 Prerequisites
- Step 1.4.2 completed (Asset Management UI)
- Assets can be created and listed
- Understanding of Vue Router params

---

## 🚀 Implementation Steps

### Step 1: Create Asset Detail View

**File:** `frontend/src/views/AssetDetailView.vue`

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <el-button @click="$router.back()" circle>
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <h1 class="text-3xl font-bold text-gray-900">Asset Details</h1>
          </div>
          <div class="flex items-center gap-4">
            <el-button type="primary" @click="showEditDialog = true">
              <el-icon class="mr-2"><Edit /></el-icon>
              Edit Asset
            </el-button>
            <el-button type="danger" @click="handleDelete">
              <el-icon class="mr-2"><Delete /></el-icon>
              Delete
            </el-button>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <el-alert
        title="Error Loading Asset"
        type="error"
        :description="error"
        show-icon
      />
    </div>

    <!-- Asset Details -->
    <main v-else-if="currentAsset" class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Image Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Asset Image</h2>
          <el-image
            :src="imageUrl"
            fit="contain"
            class="w-full h-96 rounded-lg"
            :preview-src-list="imageUrl !== placeholderImage ? [imageUrl] : []"
          >
            <template #error>
              <div class="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <el-icon size="64" color="#909399"><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>

        <!-- Information Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Information</h2>
          
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-500">Name</label>
              <p class="text-lg text-gray-900">{{ currentAsset.name }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-500">Category</label>
              <div class="mt-1">
                <el-tag>{{ currentAsset.category }}</el-tag>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-500">Description</label>
              <p class="text-gray-900">{{ currentAsset.description || 'No description' }}</p>
            </div>

            <el-divider />

            <div>
              <label class="text-sm font-medium text-gray-500">Asset ID</label>
              <p class="text-sm text-gray-600 font-mono">{{ currentAsset.id }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-500">Created</label>
              <p class="text-sm text-gray-600">{{ formatDate(currentAsset.createdAt) }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-500">Last Updated</label>
              <p class="text-sm text-gray-600">{{ formatDate(currentAsset.updatedAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Dialog -->
    <EditAssetDialog
      v-if="currentAsset"
      v-model:visible="showEditDialog"
      :asset="currentAsset"
      :loading="updating"
      @submit="handleUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Delete, Picture } from '@element-plus/icons-vue'
import { useAssets } from '@/composables/useAssets'
import { formatDate } from '@/utils/dateFormatter'
import { storageService } from '@/services/storageService'
import EditAssetDialog from '@/components/assets/EditAssetDialog.vue'

const route = useRoute()
const router = useRouter()

const {
  currentAsset,
  loading,
  error,
  fetchAssetById,
  updateAsset,
  deleteAsset
} = useAssets()

const showEditDialog = ref(false)
const updating = ref(false)
const imageUrl = ref('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjdmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5MDkzOTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=')
const placeholderImage = imageUrl.value

// Load asset on mount
onMounted(async () => {
  const assetId = route.params.id
  if (assetId) {
    await fetchAssetById(assetId)
    
    // Load image if available
    if (currentAsset.value?.imageKey) {
      try {
        const url = await storageService.getImageUrl(currentAsset.value.imageKey)
        if (url) {
          imageUrl.value = url
        }
      } catch (err) {
        console.error('Error loading image:', err)
      }
    }
  }
})

// Handle update
const handleUpdate = async (assetData) => {
  updating.value = true
  try {
    await updateAsset(route.params.id, assetData, assetData.imageFile)
    ElMessage.success('Asset updated successfully')
    showEditDialog.value = false
    
    // Reload image if updated
    if (assetData.imageFile && currentAsset.value?.imageKey) {
      const url = await storageService.getImageUrl(currentAsset.value.imageKey)
      if (url) {
        imageUrl.value = url
      }
    }
  } catch (err) {
    ElMessage.error('Failed to update asset: ' + err.message)
  } finally {
    updating.value = false
  }
}

// Handle delete
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this asset? This action cannot be undone.',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await deleteAsset(route.params.id)
    ElMessage.success('Asset deleted successfully')
    router.push('/assets')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('Failed to delete asset: ' + err.message)
    }
  }
}
</script>
```

---

### Step 2: Create Edit Asset Dialog Component

**File:** `frontend/src/components/assets/EditAssetDialog.vue`

```vue
<template>
  <el-dialog
    v-model="dialogVisible"
    title="Edit Asset"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      label-position="top"
    >
      <el-form-item label="Asset Name" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="Enter asset name"
          clearable
        />
      </el-form-item>

      <el-form-item label="Category" prop="category">
        <el-select
          v-model="formData.category"
          placeholder="Select category"
          style="width: 100%"
        >
          <el-option label="Image" value="image" />
          <el-option label="Document" value="document" />
          <el-option label="Video" value="video" />
          <el-option label="Other" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="Enter asset description"
        />
      </el-form-item>

      <el-form-item label="Update Image">
        <el-upload
          class="image-uploader"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleImageChange"
          accept="image/*"
        >
          <img v-if="imagePreview" :src="imagePreview" class="image-preview" alt="Preview" />
          <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div v-if="imageFile" class="image-info">
          <span>{{ imageFile.name }}</span>
          <el-button size="small" text @click="clearImage">Remove</el-button>
        </div>
        <div v-else class="text-sm text-gray-500 mt-2">
          Leave empty to keep current image
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Cancel</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        Update Asset
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  asset: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible', 'submit'])

// Local visibility state
const dialogVisible = ref(props.visible)

// Watch for prop changes
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    // Pre-populate form with asset data
    formData.name = props.asset.name
    formData.category = props.asset.category
    formData.description = props.asset.description || ''
  }
})

// Watch for local changes
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// Form ref
const formRef = ref(null)

// Form data
const formData = reactive({
  name: '',
  category: '',
  description: ''
})

// Image handling
const imageFile = ref(null)
const imagePreview = ref(null)

// Form validation rules
const rules = {
  name: [
    { required: true, message: 'Please enter asset name', trigger: 'blur' },
    { min: 3, max: 100, message: 'Length should be 3 to 100', trigger: 'blur' }
  ],
  category: [
    { required: true, message: 'Please select a category', trigger: 'change' }
  ],
  description: [
    { max: 500, message: 'Description too long', trigger: 'blur' }
  ]
}

// Handle image change
const handleImageChange = (file) => {
  imageFile.value = file.raw
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// Clear image
const clearImage = () => {
  imageFile.value = null
  imagePreview.value = null
}

// Handle form submit
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    // Emit submit event with form data and image
    emit('submit', {
      ...formData,
      imageFile: imageFile.value
    })
  } catch (error) {
    ElMessage.error('Please fix form errors')
  }
}

// Handle dialog close
const handleClose = () => {
  // Reset form
  formRef.value?.resetFields()
  clearImage()
  dialogVisible.value = false
}
</script>

<style scoped>
.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 178px;
  height: 178px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader:hover {
  border-color: #409eff;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-info {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #606266;
}
</style>
```

---

### Step 3: Add Route for Asset Detail View

**File:** `frontend/src/router/index.js`

Add the new route:

```javascript
{
  path: '/assets/:id',
  name: 'AssetDetail',
  component: () => import('@/views/AssetDetailView.vue'),
  meta: { requiresAuth: true }
},
```

---

### Step 4: Update AssetCard to Navigate to Detail View

**File:** `frontend/src/components/assets/AssetCard.vue`

Update the View button click handler:

```vue
<el-button size="small" @click="$emit('view', asset.id)">
  View
</el-button>
```

---

### Step 5: Update AssetsView to Handle Navigation

**File:** `frontend/src/views/AssetsView.vue`

The `handleView` method should already navigate correctly:

```javascript
// Handle view asset
const handleView = (assetId) => {
  router.push(`/assets/${assetId}`)
}
```

---

## ✅ Testing Checklist

Test the following scenarios:

- [ ] Click "View" on an asset card navigates to detail page
- [ ] Asset details display correctly (name, category, description, dates)
- [ ] Asset image displays or shows placeholder
- [ ] Click "Edit Asset" opens edit dialog
- [ ] Edit dialog pre-populates with current asset data
- [ ] Can update asset name, category, and description
- [ ] Can update asset image
- [ ] Can leave image empty to keep current image
- [ ] Form validation works on edit
- [ ] Success message shows after update
- [ ] Asset details refresh after update
- [ ] Image updates after changing
- [ ] Click "Delete" shows confirmation dialog
- [ ] Confirming delete removes asset and navigates to list
- [ ] Back button returns to assets list
- [ ] Loading states display correctly
- [ ] Error states display correctly

---

## 🎓 Key Concepts

### 1. Dynamic Routes

```javascript
// Route with parameter
{
  path: '/assets/:id',
  component: AssetDetailView
}

// Access parameter
const route = useRoute()
const assetId = route.params.id
```

### 2. Form Pre-population

```javascript
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // Pre-fill form when dialog opens
    formData.name = props.asset.name
    formData.category = props.asset.category
  }
})
```

### 3. Optimistic Updates

```javascript
// Update locally first
await updateAsset(id, data)

// Then refresh if needed
await fetchAssetById(id)
```

---

## 📝 Summary

You've successfully implemented:
- ✅ Asset detail view page
- ✅ Edit asset dialog with pre-population
- ✅ Image update functionality
- ✅ Delete confirmation
- ✅ Navigation between list and detail views
- ✅ Loading and error states

---

## 🎯 What's Next?

In Step 1.4.4, we can implement:
- Asset tags management (GraphQL integration)
- Asset status tracking
- Activity log display
- Search and filter functionality

Let me know when you're ready to continue! 🚀
