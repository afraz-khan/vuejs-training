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
    await tagStore.addTag(props.assetId, formData.tagName, formData.tagValue)

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
    await tagStore.removeTag(props.assetId, tagId)
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
