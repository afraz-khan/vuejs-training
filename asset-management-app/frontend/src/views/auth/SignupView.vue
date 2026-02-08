<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </router-link>
        </p>
      </div>

      <!-- Signup Form Card -->
      <div class="bg-white py-8 px-6 shadow rounded-lg">
        <SignupForm
          :loading="authStore.loading"
          :error="authStore.error"
          @success="handleSignup"
        />
      </div>

      <!-- Verification Dialog -->
      <el-dialog
        v-model="showVerificationDialog"
        title="Verify Your Email"
        width="400px"
        :close-on-click-modal="false"
      >
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            We've sent a verification code to <strong>{{ signupEmail }}</strong>
          </p>
          
          <el-input
            v-model="verificationCode"
            placeholder="Enter verification code"
            size="large"
            clearable
          />
        </div>

        <template #footer>
          <el-button @click="showVerificationDialog = false">
            Cancel
          </el-button>
          <el-button
            type="primary"
            :loading="authStore.loading"
            @click="handleVerification"
          >
            Verify
          </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SignupForm from '@/components/auth/SignupForm.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Verification dialog state
const showVerificationDialog = ref(false)
const verificationCode = ref('')
const signupEmail = ref('')

// Handle signup form submission
const handleSignup = async (formData) => {
  console.log('Signup form data:', formData)

  // Call auth store signup action
  const result = await authStore.signup({
    email: formData.email,
    password: formData.password,
    name: formData.name,
  })

  if (result.success) {
    // Check if email verification is required
    if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
      signupEmail.value = formData.email
      showVerificationDialog.value = true
      ElMessage.success('Account created! Please check your email for verification code.')
    } else if (result.isSignUpComplete) {
      ElMessage.success('Account created successfully!')
      router.push('/login')
    }
  } else {
    ElMessage.error(result.error || 'Signup failed')
  }
}

// Handle email verification
const handleVerification = async () => {
  if (!verificationCode.value) {
    ElMessage.warning('Please enter the verification code')
    return
  }

  const result = await authStore.confirmSignup({
    email: signupEmail.value,
    code: verificationCode.value,
  })

  if (result.success) {
    ElMessage.success('Email verified! You can now sign in.')
    showVerificationDialog.value = false
    router.push('/login')
  } else {
    ElMessage.error(result.error || 'Verification failed')
  }
}
</script>