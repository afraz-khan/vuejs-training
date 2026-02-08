<template>
  <div class="p-4 bg-gray-50 rounded-lg">
    <h3 class="text-lg font-bold mb-4">Auth Store Test</h3>
    
    <div class="space-y-2 text-sm">
      <p><strong>Is Authenticated:</strong> {{ authStore.isAuthenticated }}</p>
      <p><strong>Is Logged In:</strong> {{ authStore.isLoggedIn }}</p>
      <p><strong>Loading:</strong> {{ authStore.loading }}</p>
      <p><strong>User:</strong> {{ authStore.user ? 'User object exists' : 'No user' }}</p>
      <p><strong>User Email:</strong> {{ authStore.userEmail || 'N/A' }}</p>
      <p><strong>User ID:</strong> {{ authStore.userId || 'N/A' }}</p>
      <p v-if="authStore.error" class="text-red-600">
        <strong>Error:</strong> {{ authStore.error }}
      </p>
    </div>

    <div class="mt-4 flex gap-2">
      <el-button @click="checkAuth" size="small">
        Check Auth
      </el-button>
      <el-button 
        v-if="authStore.isLoggedIn" 
        @click="handleLogout" 
        size="small"
        type="danger"
      >
        Logout
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const checkAuth = async () => {
  await authStore.checkAuth()
}

const handleLogout = async () => {
  const result = await authStore.logout()
  if (result.success) {
    ElMessage.success('Logged out successfully')
    router.push('/login')
  }
}
</script>