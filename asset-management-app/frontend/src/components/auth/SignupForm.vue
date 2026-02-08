<template>
  <div class="signup-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      size="large"
      @submit.prevent="handleSubmit"
    >
      <!-- Name Field -->
      <el-form-item label="Name" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="Enter your name"
          :prefix-icon="User"
          clearable
        />
      </el-form-item>

      <!-- Email Field -->
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="Enter your email"
          :prefix-icon="Message"
          clearable
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

      <!-- Confirm Password Field -->
      <el-form-item label="Confirm Password" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="Confirm your password"
          :prefix-icon="Lock"
          show-password
          clearable
        />
      </el-form-item>

      <!-- Submit Button -->
      <el-form-item>
        <el-button
          type="primary"
          native-type="submit"
          :loading="loading"
          class="w-full"
        >
          {{ loading ? 'Creating Account...' : 'Sign Up' }}
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
import { ref, reactive } from 'vue'
import { User, Message, Lock } from '@element-plus/icons-vue'
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
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// Custom validator for password confirmation
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Please confirm your password'))
  } else if (value !== formData.password) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
}

// Custom validator for password strength
const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Please enter a password'))
  } else if (value.length < 8) {
    callback(new Error('Password must be at least 8 characters'))
  } else if (!/[A-Z]/.test(value)) {
    callback(new Error('Password must contain at least one uppercase letter'))
  } else if (!/[a-z]/.test(value)) {
    callback(new Error('Password must contain at least one lowercase letter'))
  } else if (!/[0-9]/.test(value)) {
    callback(new Error('Password must contain at least one number'))
  } else {
    callback()
  }
}

// Validation rules
const rules = {
  name: [
    { required: true, message: 'Please enter your name', trigger: 'blur' },
    { min: 2, max: 50, message: 'Name must be between 2 and 50 characters', trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please enter a password', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// Handle form submission
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // Validate form
    await formRef.value.validate()

    // Emit success event with form data
    emit('success', {
      name: formData.name,
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
.signup-form {
  width: 100%;
}

.w-full {
  width: 100%;
}
</style>