<template>
  <div class="p-4 bg-blue-50 rounded-lg">
    <h3 class="text-lg font-bold mb-2">Amplify Connection Test</h3>
    <div v-if="isConfigured" class="text-green-600">
      ✅ Amplify is configured correctly!
    </div>
    <div v-else class="text-red-600">
      ❌ Amplify configuration error
    </div>
    <div class="mt-2 text-sm text-gray-600">
      <p>Region: {{ region }}</p>
      <p>User Pool ID: {{ userPoolId }}</p>
      <p>Debug: {{ debugInfo }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Amplify } from 'aws-amplify'

const isConfigured = ref(false)
const region = ref('')
const userPoolId = ref('')
const debugInfo = ref('')

onMounted(() => {
  try {
    const config = Amplify.getConfig()
    console.log('Amplify config:', config)
    
    if (config && config.Auth) {
      isConfigured.value = true
      region.value = config.Auth.Cognito?.userPoolId?.split('_')[0] || 'Unknown'
      userPoolId.value = config.Auth.Cognito?.userPoolId || 'Not found'
      debugInfo.value = 'Config loaded successfully'
    } else {
      debugInfo.value = 'Config exists but Auth not found'
    }
  } catch (error) {
    console.error('Amplify config error:', error)
    isConfigured.value = false
    debugInfo.value = error.message
  }
})
</script>