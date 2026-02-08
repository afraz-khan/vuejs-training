<template>
  <div class="login-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      size="large"
      @submit.prevent="handleSubmit"
    >
      <!-- Email Field -->
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="Enter your email"
          :prefix-icon="Message"
          clearable
          autofocus
        />
      </el-form-item>

      <!-- Password Field -->
      <el-form-item label="Password" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="Enter your password"
          :prefix-icon="Lock"
          show-password
          clearable
        />
      </el-form-item>

      <!-- Remember Me & Forgot Password Row -->
      <el-form-item>
        <div class="flex items-center justify-between w-full">
          <el-checkbox v-model="formData.rememberMe">
            Remember me
          </el-checkbox>
          <a href="#" class="text-sm text-blue-600 hover:text-blue-500">
            Forgot password?
          </a>
        </div>
      </el-form-item>

      <!-- Submit Button -->
      <el-form-item>
        <el-button
          type="primary"
          native-type="submit"
          :loading="loading"
          class="w-full"
        >
          {{ loading ? 'Signing In...' : 'Sign In' }}
        </el-button>
      </el-form-item>

      <!-- Error Message -->
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
        class="mb-4"
      />
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Message, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Define emits
const emit = defineEmits(['success', 'error'])

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

// Form reference
const formRef = ref(null)

// Form data
const formData = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

// Validation rules
const rules = {
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' },
  ],
}

// Load remembered email on mount
onMounted(() => {
  const rememberedEmail = localStorage.getItem('rememberedEmail')
  if (rememberedEmail) {
    formData.email = rememberedEmail
    formData.rememberMe = true
  }
})

// Handle form submission
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // Validate form
    await formRef.value.validate()

    // Save or remove email based on "Remember Me"
    if (formData.rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }

    // Emit success event with form data
    emit('success', {
      email: formData.email,
      password: formData.password,
    })
  } catch (error) {
    console.error('Form validation failed:', error)
    ElMessage.error('Please fix the form errors')
  }
}

// Reset form
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// Expose methods to parent component
defineExpose({
  resetForm,
})
</script>

<style scoped>
.login-form {
  width: 100%;
}

.w-full {
  width: 100%;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}
</style>