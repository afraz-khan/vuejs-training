<template>
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Asset Management System</h1>
    
    <!-- Navigation Card -->
    <div class="mb-6 p-6 bg-white rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
      
      <!-- Show different buttons based on auth status -->
      <div v-if="authStore.isAuthenticated" class="flex gap-4">
        <el-button type="primary" @click="$router.push('/dashboard')">
          Go to Dashboard
        </el-button>
        <el-button @click="$router.push('/assets')">
          View Assets
        </el-button>
        <el-button type="danger" @click="handleLogout">
          Logout
        </el-button>
      </div>
      
      <div v-else class="flex gap-4">
        <el-button type="primary" @click="$router.push('/signup')">
          Sign Up
        </el-button>
        <el-button @click="$router.push('/login')">
          Sign In
        </el-button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AmplifyTest />
      <AuthStoreTest />
    </div>
    
    <div class="mt-8 p-6 bg-white rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Welcome!</h2>
      <p class="text-gray-600">
        Your frontend is connected to AWS Amplify backend.
      </p>
      <p v-if="authStore.isAuthenticated" class="mt-2 text-green-600">
        ✅ You are logged in as {{ authStore.userEmail }}
      </p>
      <p v-else class="mt-2 text-gray-600">
        Please sign in to access protected features.
      </p>
    </div>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AmplifyTest from '@/components/common/AmplifyTest.vue'
import AuthStoreTest from '@/components/common/AuthStoreTest.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  const result = await authStore.logout()
  if (result.success) {
    ElMessage.success('Logged out successfully')
  }
}
</script>