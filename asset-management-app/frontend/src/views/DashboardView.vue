<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">
              Welcome, {{ authStore.userEmail }}
            </span>
            <el-button @click="handleLogout" size="small" type="danger">
              Logout
            </el-button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Quick Actions -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
        <div class="flex gap-4">
          <el-button type="primary" @click="$router.push('/assets')">
            View Assets
          </el-button>
          <el-button @click="$router.push('/assets/create')">
            Create Asset
          </el-button>
        </div>
      </div>

      <!-- User Info -->
      <div class="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">User Information</h2>
        <div class="space-y-2 text-sm">
          <p><strong>User ID:</strong> {{ authStore.userId }}</p>
          <p><strong>Email:</strong> {{ authStore.userEmail }}</p>
          <p><strong>Authenticated:</strong> {{ authStore.isAuthenticated ? 'Yes' : 'No' }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  const result = await authStore.logout()
  if (result.success) {
    ElMessage.success('Logged out successfully')
    router.push('/login')
  } else {
    ElMessage.error('Logout failed')
  }
}
</script>