<template>
  <div id="app">
    <!-- Loading Screen -->
    <div v-if="isCheckingAuth" class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <el-icon :size="40">
          <Loading />
        </el-icon>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>

    <!-- App Content -->
    <div v-else>
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const isCheckingAuth = ref(true)

// Check authentication status on app load
onMounted(async () => {
  console.log('App mounted: checking authentication...')
  
  try {
    await authStore.checkAuth()
    console.log('Auth check complete:', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
    })
  } catch (error) {
    console.error('Auth check failed:', error)
  } finally {
    isCheckingAuth.value = false
  }
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>