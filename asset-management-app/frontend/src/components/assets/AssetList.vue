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
const props = defineProps({
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

// Debug: log assets when they change
import { watch } from 'vue'
watch(() => props.assets, (newAssets) => {
  console.log('AssetList received assets:', newAssets)
  console.log('Number of assets:', newAssets.length)
}, { immediate: true })
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