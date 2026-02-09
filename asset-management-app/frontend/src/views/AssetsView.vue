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