<template>
  <el-card class="asset-card" shadow="hover" :body-style="{ padding: '0' }">
    <!-- Image -->
    <div class="asset-image-container">
      <el-image
        :src="imageUrl"
        fit="cover"
        class="asset-image"
        :preview-src-list="imageUrl !== placeholderImage ? [imageUrl] : []"
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
import { computed, ref, onMounted } from 'vue'
import { Picture, Calendar } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/dateFormatter'
import { storageService } from '@/services/storageService'

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
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjdmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5MDkzOTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='

// Image URL state
const imageUrl = ref(placeholderImage)

// Get image URL from S3 if imageKey exists
onMounted(async () => {
  if (props.asset.imageKey) {
    try {
      const url = await storageService.getImageUrl(props.asset.imageKey)
      if (url) {
        imageUrl.value = url
      }
    } catch (error) {
      console.error('Error loading image:', error)
    }
  }
})

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