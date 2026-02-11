<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <el-button @click="$router.push('/')" circle>
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <h1 class="text-3xl font-bold text-gray-900">Asset Management</h1>
          </div>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon class="mr-2"><Plus /></el-icon>
            Create Asset
          </el-button>
        </div>
      </div>
    </header>

    <!-- Search and Filters -->
    <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search -->
          <el-input
            v-model="searchQuery"
            placeholder="Search assets..."
            clearable
            :prefix-icon="Search"
          />

          <!-- Category Filter -->
          <el-select
            v-model="selectedCategory"
            placeholder="All Categories"
            clearable
          >
            <el-option label="All Categories" value="" />
            <el-option label="Image" value="image" />
            <el-option label="Document" value="document" />
            <el-option label="Video" value="video" />
            <el-option label="Other" value="other" />
          </el-select>

          <!-- Actions -->
          <div class="flex gap-2">
            <el-button
              v-if="hasActiveFilters"
              @click="resetFilters"
              class="flex-1"
            >
              Clear Filters
            </el-button>
            <el-button @click="handleRefresh" :loading="loading" class="flex-1">
              <el-icon class="mr-1"><Refresh /></el-icon>
              Refresh
            </el-button>
          </div>
        </div>

        <!-- Results Summary -->
        <div class="mt-4 text-sm text-gray-600">
          Showing {{ paginatedAssets.length }} of {{ filteredAssets.length }} assets
          <span v-if="hasActiveFilters">(filtered from {{ totalAssets }} total)</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <el-skeleton v-for="i in 6" :key="i" :rows="4" animated />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <el-alert
        title="Error Loading Assets"
        type="error"
        :description="error"
        show-icon
      />
    </div>

    <!-- Assets List -->
    <main v-else class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <AssetList
        :assets="paginatedAssets"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
        @create="showCreateDialog = true"
      />

      <!-- Empty State -->
      <el-empty
        v-if="paginatedAssets.length === 0"
        :description="hasActiveFilters ? 'No assets match your filters' : 'No assets yet'"
        :image-size="200"
      >
        <el-button v-if="!hasActiveFilters" type="primary" @click="showCreateDialog = true">
          Create Your First Asset
        </el-button>
        <el-button v-else @click="resetFilters">
          Clear Filters
        </el-button>
      </el-empty>

      <!-- Pagination -->
      <div v-if="filteredAssets.length > 0" class="mt-8 flex justify-center">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :total="filteredAssets.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </main>

    <!-- Create Dialog -->
    <CreateAssetDialog
      v-model:visible="showCreateDialog"
      :loading="creating"
      @submit="handleCreate"
    />

    <!-- Edit Dialog -->
    <EditAssetDialog
      v-if="editingAsset"
      v-model:visible="showEditDialog"
      :asset="editingAsset"
      :loading="updating"
      @submit="handleUpdate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, ArrowLeft } from '@element-plus/icons-vue'
import { useAssets } from '@/composables/useAssets'
import { useAssetFilters } from '@/composables/useAssetFilters'
import AssetList from '@/components/assets/AssetList.vue'
import CreateAssetDialog from '@/components/assets/CreateAssetDialog.vue'
import EditAssetDialog from '@/components/assets/EditAssetDialog.vue'

const router = useRouter()

// Assets composable
const {
  assets,
  loading,
  error,
  fetchAssets,
  createAsset,
  updateAsset,
  deleteAsset
} = useAssets()

// Filters composable
const {
  searchQuery,
  selectedCategory,
  currentPage,
  pageSize,
  hasActiveFilters,
  filterAssets,
  paginateAssets,
  resetFilters
} = useAssetFilters()

// Dialogs
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const editingAsset = ref(null)
const creating = ref(false)
const updating = ref(false)

// Computed
const totalAssets = computed(() => assets.value.length)
const filteredAssets = computed(() => filterAssets(assets.value))
const paginatedAssets = computed(() => paginateAssets(filteredAssets.value))

// Load assets on mount
onMounted(async () => {
  await fetchAssets()
})

// Handlers
const handleRefresh = async () => {
  await fetchAssets()
  ElMessage.success('Assets refreshed')
}

const handleView = (asset) => {
  router.push(`/assets/${asset.id}`)
}

const handleEdit = (asset) => {
  editingAsset.value = asset
  showEditDialog.value = true
}

const handleCreate = async (assetData) => {
  creating.value = true
  try {
    await createAsset(assetData, assetData.imageFile)
    ElMessage.success('Asset created successfully')
    showCreateDialog.value = false
  } catch (err) {
    ElMessage.error('Failed to create asset: ' + err.message)
  } finally {
    creating.value = false
  }
}

const handleUpdate = async (assetData) => {
  updating.value = true
  try {
    await updateAsset(editingAsset.value.id, assetData, assetData.imageFile)
    ElMessage.success('Asset updated successfully')
    showEditDialog.value = false
    editingAsset.value = null
  } catch (err) {
    ElMessage.error('Failed to update asset: ' + err.message)
  } finally {
    updating.value = false
  }
}

const handleDelete = async (asset) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${asset.name}"? This action cannot be undone.`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await deleteAsset(asset.id)
    ElMessage.success('Asset deleted successfully')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('Failed to delete asset: ' + err.message)
    }
  }
}
</script>