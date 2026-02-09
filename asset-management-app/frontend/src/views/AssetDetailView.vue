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

      <!-- Tags Section (Full Width) -->
      <div class="mt-8">
        <AssetTags :asset-id="currentAsset.id" />
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
import AssetTags from '@/components/assets/AssetTags.vue'

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