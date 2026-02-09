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