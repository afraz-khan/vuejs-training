# Step 1.4.5: Search, Filter, and Pagination

## 🎯 Goal
Implement advanced search, filtering, and pagination features to help users find and manage assets efficiently.

## 📚 What You'll Learn
- Search functionality with debouncing
- Multi-criteria filtering
- Pagination with page size options
- URL query parameters for shareable filters
- Composable patterns for reusable logic
- Performance optimization techniques

## 📋 Prerequisites
- Step 1.4.4 completed (Asset Tags Management)
- Understanding of Vue composables
- Familiarity with URL query parameters

---

## 🚀 Implementation Steps

### Step 1: Create Search and Filter Composable

**File:** `frontend/src/composables/useAssetFilters.js`

```javascript
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useAssetFilters() {
  const route = useRoute()
  const router = useRouter()

  // Filter state
  const searchQuery = ref(route.query.search || '')
  const selectedCategory = ref(route.query.category || '')
  const currentPage = ref(parseInt(route.query.page) || 1)
  const pageSize = ref(parseInt(route.query.pageSize) || 12)

  // Debounced search
  let searchTimeout = null
  const debouncedSearch = ref(searchQuery.value)

  watch(searchQuery, (newValue) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      debouncedSearch.value = newValue
      currentPage.value = 1 // Reset to first page on search
    }, 300)
  })

  // Update URL when filters change
  watch(
    [debouncedSearch, selectedCategory, currentPage, pageSize],
    ([search, category, page, size]) => {
      const query = {}
      if (search) query.search = search
      if (category) query.category = category
      if (page > 1) query.page = page
      if (size !== 12) query.pageSize = size

      router.replace({ query })
    }
  )

  // Filter function
  const filterAssets = (assets) => {
    let filtered = [...assets]

    // Search filter
    if (debouncedSearch.value) {
      const search = debouncedSearch.value.toLowerCase()
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(search) ||
          asset.description?.toLowerCase().includes(search)
      )
    }

    // Category filter
    if (selectedCategory.value) {
      filtered = filtered.filter(
        (asset) => asset.category === selectedCategory.value
      )
    }

    return filtered
  }

  // Pagination
  const paginateAssets = (assets) => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return assets.slice(start, end)
  }

  // Reset filters
  const resetFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = ''
    currentPage.value = 1
    pageSize.value = 12
  }

  // Computed
  const hasActiveFilters = computed(() => {
    return searchQuery.value || selectedCategory.value
  })

  return {
    // State
    searchQuery,
    selectedCategory,
    currentPage,
    pageSize,
    debouncedSearch,
    hasActiveFilters,

    // Methods
    filterAssets,
    paginateAssets,
    resetFilters,
  }
}
```

---

### Step 2: Update Assets View with Search and Filters

**File:** `frontend/src/views/AssetsView.vue`

Update the template to include search and filter controls:

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-gray-900">Asset Management</h1>
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
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
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
```

---

### Step 3: Add Advanced Search Features (Optional)

**File:** `frontend/src/composables/useAdvancedSearch.js`

```javascript
import { ref, computed } from 'vue'

export function useAdvancedSearch() {
  const searchFields = ref({
    name: true,
    description: true,
    tags: false,
  })

  const searchMode = ref('contains') // 'contains', 'startsWith', 'exact'

  const advancedSearch = (assets, query, tagStore) => {
    if (!query) return assets

    const search = query.toLowerCase()

    return assets.filter((asset) => {
      // Name search
      if (searchFields.value.name) {
        const name = asset.name.toLowerCase()
        if (matchesMode(name, search, searchMode.value)) return true
      }

      // Description search
      if (searchFields.value.description && asset.description) {
        const desc = asset.description.toLowerCase()
        if (matchesMode(desc, search, searchMode.value)) return true
      }

      // Tag search
      if (searchFields.value.tags && tagStore) {
        const tags = tagStore.getTagsByAsset(asset.id)
        const tagMatch = tags.some(
          (tag) =>
            tag.tagName.toLowerCase().includes(search) ||
            tag.tagValue.toLowerCase().includes(search)
        )
        if (tagMatch) return true
      }

      return false
    })
  }

  const matchesMode = (text, search, mode) => {
    switch (mode) {
      case 'startsWith':
        return text.startsWith(search)
      case 'exact':
        return text === search
      case 'contains':
      default:
        return text.includes(search)
    }
  }

  return {
    searchFields,
    searchMode,
    advancedSearch,
  }
}
```

---

### Step 4: Add Sort Functionality

**File:** `frontend/src/composables/useAssetSort.js`

```javascript
import { ref } from 'vue'

export function useAssetSort() {
  const sortBy = ref('createdAt')
  const sortOrder = ref('desc') // 'asc' or 'desc'

  const sortAssets = (assets) => {
    const sorted = [...assets]

    sorted.sort((a, b) => {
      let aVal = a[sortBy.value]
      let bVal = b[sortBy.value]

      // Handle dates
      if (sortBy.value === 'createdAt' || sortBy.value === 'updatedAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      // Handle strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      // Compare
      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }

  const toggleSort = (field) => {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'desc'
    }
  }

  return {
    sortBy,
    sortOrder,
    sortAssets,
    toggleSort,
  }
}
```

---

## ✅ Testing Checklist

Test the following scenarios:

- [ ] Search updates results as you type (with debounce)
- [ ] Category filter works correctly
- [ ] Combining search and category filter works
- [ ] Pagination shows correct number of items
- [ ] Page size selector works (12, 24, 48, 96)
- [ ] URL updates with filter parameters
- [ ] Sharing URL with filters loads correct view
- [ ] Clear filters button resets all filters
- [ ] Results summary shows correct counts
- [ ] Empty state shows when no results
- [ ] Refresh button reloads assets
- [ ] Filters persist across page navigation
- [ ] Performance is good with many assets

---

## 🎓 Key Concepts

### 1. Debouncing

```javascript
let timeout = null
watch(searchQuery, (newValue) => {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    // Execute search after 300ms of no typing
    debouncedSearch.value = newValue
  }, 300)
})
```

### 2. URL Query Parameters

```javascript
// Read from URL
const searchQuery = ref(route.query.search || '')

// Update URL
router.replace({ query: { search: 'laptop' } })
```

### 3. Composable Pattern

```javascript
// Reusable logic
export function useAssetFilters() {
  const searchQuery = ref('')
  const filterAssets = (assets) => { /* ... */ }
  return { searchQuery, filterAssets }
}

// Use in component
const { searchQuery, filterAssets } = useAssetFilters()
```

### 4. Computed Chaining

```javascript
const filteredAssets = computed(() => filterAssets(assets.value))
const sortedAssets = computed(() => sortAssets(filteredAssets.value))
const paginatedAssets = computed(() => paginateAssets(sortedAssets.value))
```

---

## 🔍 Troubleshooting

### Search is slow?
- Check debounce is working (300ms delay)
- Consider server-side search for large datasets
- Use virtual scrolling for many results

### Filters not persisting?
- Verify URL query parameters are updating
- Check router.replace() is being called
- Ensure route.query is being read on mount

### Pagination not working?
- Verify total count is correct
- Check page size calculations
- Ensure currentPage resets on filter change

---

## 📝 Summary

You've successfully implemented:
- ✅ Search with debouncing
- ✅ Category filtering
- ✅ Pagination with page size options
- ✅ URL query parameters for shareable filters
- ✅ Reusable composables
- ✅ Results summary and empty states

---

## 🎯 What's Next?

In Step 1.4.6, we can implement:
- **Bulk Operations** - Select multiple assets for batch delete/update
- **Export/Import** - Export assets to CSV, import from file
- **Asset History** - View change history and audit logs
- **Advanced Analytics** - Dashboard with charts and statistics

Let me know when you're ready to continue! 🚀
