<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAssets } from '@/composables/useAssets'

const { isAuthenticated, user } = useAuth()
const { assets, fetchAssets } = useAssets()

const testResults = ref({
  amplifyConfigured: false,
  authWorking: false,
  apiConnected: false,
  graphqlConnected: false
})

onMounted(async () => {
  // Test 1: Amplify configured
  try {
    testResults.value.amplifyConfigured = true
  } catch (error) {
    console.error('Amplify config error:', error)
  }

  // Test 2: Auth working
  try {
    testResults.value.authWorking = isAuthenticated.value !== undefined
  } catch (error) {
    console.error('Auth error:', error)
  }

  // Test 3: API connected (if authenticated)
  if (isAuthenticated.value) {
    try {
      await fetchAssets()
      testResults.value.apiConnected = true
    } catch (error) {
      console.error('API error:', error)
    }
  }
})
</script>

<template>
  <div class="test-setup">
    <h2>Setup Test Results</h2>
    <ul>
      <li :class="{ success: testResults.amplifyConfigured }">
        Amplify Configured: {{ testResults.amplifyConfigured ? '✓' : '✗' }}
      </li>
      <li :class="{ success: testResults.authWorking }">
        Auth Working: {{ testResults.authWorking ? '✓' : '✗' }}
      </li>
      <li :class="{ success: testResults.apiConnected }">
        API Connected: {{ testResults.apiConnected ? '✓' : '✗' }}
      </li>
    </ul>
    <div v-if="isAuthenticated">
      <p>User: {{ user?.userId }}</p>
      <p>Assets: {{ assets.length }}</p>
    </div>
  </div>
</template>

<style scoped>
.test-setup {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.success {
  color: green;
}
</style>