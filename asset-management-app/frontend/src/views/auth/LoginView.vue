<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Don't have an account?
          <router-link to="/signup" class="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </router-link>
        </p>
      </div>

      <!-- Login Form Card -->
      <div class="bg-white py-8 px-6 shadow rounded-lg">
        <LoginForm
          :loading="authStore.loading"
          :error="authStore.error"
          @success="handleLogin"
        />
      </div>

      <!-- Additional Info -->
      <div class="text-center text-sm text-gray-600">
        <p>
          By signing in, you agree to our
          <a href="#" class="text-blue-600 hover:text-blue-500">Terms of Service</a>
          and
          <a href="#" class="text-blue-600 hover:text-blue-500">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoginForm from '@/components/auth/LoginForm.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Handle login form submission
const handleLogin = async (formData) => {
  console.log('Login form data:', formData)

  // Call auth store login action
  const result = await authStore.login({
    email: formData.email,
    password: formData.password,
  })

  if (result.success) {
    if (result.isSignedIn) {
      ElMessage.success('Welcome back!')
      // Redirect to assets page
      // Check if there's a redirect query parameter
			const redirectPath = router.currentRoute.value.query.redirect || '/assets'
			router.push(redirectPath)
    } else if (result.nextStep) {
      // Handle additional steps (MFA, password change, etc.)
      console.log('Next step:', result.nextStep)
      ElMessage.warning('Additional authentication step required')
    }
  } else {
    ElMessage.error(result.error || 'Login failed')
  }
}
</script>