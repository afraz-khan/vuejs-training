<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-gray-900">My Assets</h1>
          <div class="flex items-center gap-4">
            <el-button @click="$router.push('/dashboard')">
              Dashboard
            </el-button>
            <el-button @click="handleLogout" size="small" type="danger">
              Logout
            </el-button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="bg-white p-8 rounded-lg shadow text-center">
        <el-icon :size="64" class="text-gray-400 mb-4">
          <Document />
        </el-icon>
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">No Assets Yet</h2>
        <p class="text-gray-600 mb-6">
          This is a protected route. You can only see this because you're logged in!
        </p>
        <el-button type="primary" size="large">
          Create Your First Asset
        </el-button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
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