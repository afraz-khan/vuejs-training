# Step 1.4.2: Build Asset Management UI - List and Create

## Overview
In this step, you'll build the core asset management UI components to display, create, and manage assets. This connects the frontend to your REST API (RDS) and GraphQL API (DynamoDB).

**What you'll build:**
- Asset list component with grid/card layout
- Asset card component (reusable)
- Create asset form with image upload
- Integration with assetStore and storageService
- Loading states and error handling

**Why this step?**
- Demonstrates Vue 3 component composition
- Shows parent-child communication (props & emits)
- Integrates with both backend APIs
- Implements real-world CRUD operations

---

## Prerequisites

- Completed Step 1.4.1 (Services and stores created)
- Auth is working (can login/logout)
- API Gateway and Lambda functions deployed
- DynamoDB tables created

---

## Architecture

```
AssetsView.vue (Container)
    │
    ├─> AssetList.vue (List Container)
    │       │
    │       └─> AssetCard.vue (Individual Card)
    │               ├─ Props: asset data
    │               └─ Emits: view, edit, delete events
    │
    └─> CreateAssetDialog.vue (Form Dialog)
            ├─ Image upload to S3
            ├─ Form validation
            └─ Create via assetStore
```

---

## Step 1: Create Asset Card Component

The asset card is a reusable component that displays individual asset information.

Create `frontend/src/components/assets/AssetCard.vue`:

```vue
<template>
  <el-card class="asset-card" shadow="hover" :body-style="{ padding: '0' }">
    <!-- Image -->
    <div class="asset-image-container">
      <el-image
        :src="asset.imageUrl || placeholderImage"
        fit="cover"
        class="asset-image"
        :preview-src-list="asset.imageUrl ? [asset.imageUrl] : []"
      >
        <template #error>
          <div class="image-slot">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
    </div>

    <!-- Content -->
    <div class="asset-content">
      <h3 class="asset-name">{{ asset.name }}</h3>
      <p class="asset-category">
        <el-tag size="small">{{ asset.category }}</el-tag>
      </p>
      <p class="asset-description">{{ truncatedDescription }}</p>
      
      <div class="asset-meta">
        <span class="meta-item">
          <el-icon><Calendar /></el-icon>
          {{ formatDate(asset.createdAt) }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="asset-actions">
      <el-button size="small" @click="$emit('view', asset.id)">
        View
      </el-button>
      <el-button size="small" @click="$emit('edit', asset.id)">
        Edit
      </el-button>
      <el-button size="small" type="danger" @click="$emit('delete', asset.id)">
        Delete
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Picture, Calendar } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/dateFormatter'

// Props
const props = defineProps({
  asset: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['view', 'edit', 'delete'])

// Placeholder image
const placeholderImage = 'https://via.placeholder.com/300x200?text=No+Image'

// Truncate description
const truncatedDescription = computed(() => {
  if (!props.asset.description) return 'No description'
  return props.asset.description.length > 100
    ? props.asset.description.substring(0, 100) + '...'
    : props.asset.description
})
</script>

<style scoped>
.asset-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.asset-card:hover {
  transform: translateY(-4px);
}

.asset-image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f7fa;
}

.asset-image {
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 48px;
}

.asset-content {
  padding: 16px;
  flex: 1;
}

.asset-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.asset-category {
  margin: 0 0 12px 0;
}

.asset-description {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.asset-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.asset-actions {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
}
</style>
```

**What this component does:**
- Displays asset image with fallback
- Shows asset name, category, description
- Truncates long descriptions
- Emits events for view/edit/delete actions
- Responsive hover effects

---

## Step 2: Create Asset List Component

The asset list component displays all assets in a responsive grid.

Create `frontend/src/components/assets/AssetList.vue`:

```vue
<template>
  <div class="asset-list">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <el-alert
        title="Error Loading Assets"
        type="error"
        :description="error"
        show-icon
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="assets.length === 0" class="empty-container">
      <el-empty description="No assets found">
        <el-button type="primary" @click="$emit('create')">
          Create Your First Asset
        </el-button>
      </el-empty>
    </div>

    <!-- Asset Grid -->
    <div v-else class="asset-grid">
      <AssetCard
        v-for="asset in assets"
        :key="asset.id"
        :asset="asset"
        @view="$emit('view', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import AssetCard from './AssetCard.vue'

// Props
defineProps({
  assets: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
})

// Emits
defineEmits(['view', 'edit', 'delete', 'create'])
</script>

<style scoped>
.asset-list {
  width: 100%;
}

.loading-container,
.error-container,
.empty-container {
  padding: 40px 20px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .asset-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

**What this component does:**
- Handles loading, error, and empty states
- Displays assets in responsive grid
- Forwards events from AssetCard to parent
- Clean, minimal styling

---

## Step 3: Create Asset Form Dialog

The create asset dialog handles form input and image upload.

Create `frontend/src/components/assets/CreateAssetDialog.vue`:

```vue
<template>
  <el-dialog
    v-model="dialogVisible"
    title="Create New Asset"
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
          <el-option label="Electronics" value="Electronics" />
          <el-option label="Furniture" value="Furniture" />
          <el-option label="Vehicles" value="Vehicles" />
          <el-option label="Equipment" value="Equipment" />
          <el-option label="Other" value="Other" />
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

      <el-form-item label="Image">
        <el-upload
          class="image-uploader"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleImageChange"
          accept="image/*"
        >
          <img v-if="imagePreview" :src="imagePreview" class="image-preview" />
          <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div v-if="imageFile" class="image-info">
          <span>{{ imageFile.name }}</span>
          <el-button size="small" text @click="clearImage">Remove</el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Cancel</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        Create Asset
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

**What this component does:**
- Form with validation (name, category, description)
- Image upload with preview
- Two-way binding with v-model for dialog visibility
- Emits submit event with form data and image file
- Resets form on close

---

## Step 4: Update AssetsView to Use Components

Now update the AssetsView to integrate all the components.

Update `frontend/src/views/AssetsView.vue`:

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-gray-900">My Assets</h1>
          <div class="flex items-center gap-4">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon class="mr-2"><Plus /></el-icon>
              Create Asset
            </el-button>
            <el-button @click="$router.push('/dashboard')">
              Dashboard
            </el-button>
            <el-button @click="handleLogout" size="small" type="danger">
              Logout
            </el-button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <AssetList
        :assets="assets"
        :loading="loading"
        :error="error"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
        @create="showCreateDialog = true"
      />
    </main>

    <!-- Create Asset Dialog -->
    <CreateAssetDialog
      v-model:visible="showCreateDialog"
      :loading="creating"
      @submit="handleCreate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { useAssets } from '@/composables/useAssets'
import AssetList from '@/components/assets/AssetList.vue'
import CreateAssetDialog from '@/components/assets/CreateAssetDialog.vue'

const router = useRouter()
const authStore = useAuthStore()

// Use assets composable
const {
  assets,
  loading,
  error,
  fetchAssets,
  createAsset,
  deleteAsset
} = useAssets()

// Local state
const showCreateDialog = ref(false)
const creating = ref(false)

// Fetch assets on mount
onMounted(async () => {
  await fetchAssets()
})

// Handle create asset
const handleCreate = async (assetData) => {
  creating.value = true
  try {
    await createAsset(assetData, assetData.imageFile)
    ElMessage.success('Asset created successfully')
    showCreateDialog.value = false
    // Refresh list
    await fetchAssets()
  } catch (err) {
    ElMessage.error('Failed to create asset: ' + err.message)
  } finally {
    creating.value = false
  }
}

// Handle view asset
const handleView = (assetId) => {
  router.push(`/assets/${assetId}`)
}

// Handle edit asset
const handleEdit = (assetId) => {
  router.push(`/assets/${assetId}/edit`)
}

// Handle delete asset
const handleDelete = async (assetId) => {
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

    await deleteAsset(assetId)
    ElMessage.success('Asset deleted successfully')
    // Refresh list
    await fetchAssets()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('Failed to delete asset: ' + err.message)
    }
  }
}

// Handle logout
const handleLogout = async () => {
  const result = await authStore.logout()
  if (result.success) {
    ElMessage.success('Logged out successfully')
    router.push('/login')
  } else {
    ElMessage.error('Logout failed')
  }
}
</script>
```

**What changed:**
- Imported AssetList and CreateAssetDialog components
- Used useAssets composable for data management
- Added create dialog with v-model binding
- Implemented all event handlers (view, edit, delete, create)
- Added confirmation dialog for delete
- Automatic list refresh after create/delete

---

## Step 5: Test the Asset Management UI

### 5.1: Start the Dev Server

```bash
npm run dev
```

### 5.2: Test the Flow

1. **Login** at `http://localhost:5173/login`
2. **Navigate to Assets** at `http://localhost:5173/assets`
3. **Create an Asset**:
   - Click "Create Asset" button
   - Fill in the form
   - Upload an image (optional)
   - Click "Create Asset"
4. **View the Asset List**:
   - Should see your new asset in the grid
   - Image should display (or placeholder if no image)
5. **Test Actions**:
   - Click "View" (will navigate to detail page - we'll build this next)
   - Click "Edit" (will navigate to edit page - we'll build this next)
   - Click "Delete" and confirm

### 5.3: Expected Behavior

**On Create:**
- Dialog opens with empty form
- Form validation works
- Image preview shows when selected
- Success message appears
- Dialog closes
- List refreshes with new asset

**On Delete:**
- Confirmation dialog appears
- Asset is removed from list
- Success message appears

**Loading States:**
- Skeleton loader shows while fetching
- Button shows loading spinner during create

**Error Handling:**
- Error alert shows if fetch fails
- Error message shows if create/delete fails

---

## Troubleshooting

### Issue: "Cannot read property 'imageUrl' of undefined"

**Solution:** Make sure the asset object has all required fields. Check the API response.

### Issue: Image upload fails

**Solution:**
- Check S3 bucket permissions in `amplify/storage/resource.ts`
- Verify storageService is using correct `path` (not `key`)
- Check browser console for detailed error

### Issue: Assets not loading

**Solution:**
- Check API Gateway URL in `.env`
- Verify Lambda functions are deployed
- Check browser network tab for API errors
- Ensure you're authenticated (check authStore)

### Issue: "PATCH method not allowed"

**Solution:** Make sure you changed `client.put()` to `client.patch()` in `apiService.js`

---

## Verification Checklist

Before moving to the next step, verify:

- [ ] AssetCard component created
- [ ] AssetList component created
- [ ] CreateAssetDialog component created
- [ ] AssetsView updated with components
- [ ] Can create new assets
- [ ] Assets display in grid
- [ ] Can delete assets with confirmation
- [ ] Image upload works (or shows placeholder)
- [ ] Loading states work
- [ ] Error handling works
- [ ] Responsive layout works on mobile

---

## What's Next?

In **Step 1.4.3**, you'll:
- Create asset detail view
- Display tags, status, and activity logs
- Add tag management UI
- Add status update UI
- Show activity timeline

---

## Key Takeaways

✅ **Component Composition** - Breaking UI into reusable pieces
✅ **Props & Emits** - Parent-child communication
✅ **Form Handling** - Validation and submission
✅ **Image Upload** - S3 integration with preview
✅ **State Management** - Using composables and stores
✅ **Error Handling** - User-friendly error messages
✅ **Loading States** - Better UX during async operations

---

## Vue 3 Concepts Demonstrated

| Concept | Where Used | Example |
|---------|------------|---------|
| Props | AssetCard | `defineProps({ asset: Object })` |
| Emits | AssetCard | `defineEmits(['view', 'edit', 'delete'])` |
| v-model | CreateAssetDialog | `v-model="dialogVisible"` |
| Computed | AssetCard | `truncatedDescription` |
| Lifecycle | AssetsView | `onMounted(() => fetchAssets())` |
| Composables | AssetsView | `useAssets()` |
| Conditional Rendering | AssetList | `v-if`, `v-else-if`, `v-else` |
| List Rendering | AssetList | `v-for="asset in assets"` |
| Event Handling | All components | `@click`, `@submit` |
| Refs | CreateAssetDialog | `ref(null)` for form reference |

