# Step 1.1.6: Configure Frontend and Connect to Backend

## 🎯 Goal
Configure Tailwind CSS, set up Amplify in the frontend, and connect to your deployed backend.

## 📚 What You'll Learn
- How to configure Tailwind CSS in Vue 3
- How to set up Amplify in the frontend
- How to connect frontend to backend
- How to configure Element Plus
- Project structure organization

## 📋 Prerequisites
- [ ] Step 1.1.5 completed (Vue 3 project created)
- [ ] You're in the `frontend` directory
- [ ] All dependencies installed
- [ ] Tailwind config files created

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the frontend directory:

```bash
pwd
```

Expected: `/Users/apple/.../asset-management-app/frontend`

---

### 2. Configure Tailwind CSS in main.css
Open `src/assets/main.css` and replace its contents with:

```css
/* Tailwind base styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
body {
  margin: 0;
}
```

**Save the file!**

---

### 3. Copy amplify_outputs.json to Frontend
We need to copy the backend configuration to the frontend:

```bash
# Go back to parent directory
cd ..

# Copy amplify_outputs.json to frontend
cp amplify_outputs.json frontend/

# Go back to frontend
cd frontend

# Verify it was copied
ls -la amplify_outputs.json
```

You should see the file!

---

### 4. Create Amplify Configuration File
Create a new file for Amplify setup:

```bash
touch src/amplifyConfig.js
```

---

### 5. Add Amplify Configuration Code
Open `src/amplifyConfig.js` and add:

```javascript
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

// Configure Amplify with backend resources
Amplify.configure(outputs);

export default Amplify;
```

**Save the file!**

---

### 6. Update main.js to Initialize Amplify
Open `src/main.js` and replace its contents with:

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './assets/main.css'

// Import Amplify configuration
import './amplifyConfig'

const app = createApp(App)

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
```

**Save the file!**

---

### 7. Create Environment Variables File
Create `.env` file in the frontend root:

```bash
touch .env
```

Add this content:

```env
# API Gateway URL (we'll add this later when we create Lambda functions)
VITE_API_URL=

# App configuration
VITE_APP_NAME=Asset Management
```

**Save the file!**

---

### 8. Update .gitignore
Make sure sensitive files aren't committed:

```bash
# Check if .gitignore exists
cat .gitignore
```

Add these lines if not already present:

```
# Amplify
amplify_outputs.json

# Environment variables
.env
.env.local
```

---

### 9. Create Basic Folder Structure
Let's organize our components:

```bash
# Create component folders
mkdir -p src/components/layout
mkdir -p src/components/auth
mkdir -p src/components/assets
mkdir -p src/components/common

# Create composables folder
mkdir -p src/composables

# Create services folder
mkdir -p src/services
```

---

### 10. Verify Folder Structure
Check the structure:

```bash
ls -la src/
```

You should see:
```
src/
├── assets/
├── components/
│   ├── layout/
│   ├── auth/
│   ├── assets/
│   └── common/
├── composables/
├── router/
├── services/
├── stores/
├── views/
├── App.vue
├── main.js
└── amplifyConfig.js
```

---

### 11. Test the Configuration
Start the dev server:

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### 12. Open in Browser
Open http://localhost:5173/

The app should load without errors!

---

### 13. Check Browser Console
Open browser DevTools (F12) and check the Console tab.

You should see NO errors related to Amplify or configuration.

If you see Amplify configured successfully, great! If not, that's okay - we'll test it properly in the next steps.

---

### 14. Stop the Dev Server
Press `Ctrl+C` to stop the server.

---

### 15. Create a Simple Test Component
Let's verify Amplify is working. Create a test file:

```bash
touch src/components/common/AmplifyTest.vue
```

Add this content:

```vue
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Amplify } from 'aws-amplify'

const isConfigured = ref(false)
const region = ref('')
const userPoolId = ref('')

onMounted(() => {
  try {
    const config = Amplify.getConfig()
    isConfigured.value = true
    region.value = config.Auth?.Cognito?.userPoolClientId ? 'Configured' : 'Not configured'
    userPoolId.value = config.Auth?.Cognito?.userPoolId || 'Not found'
  } catch (error) {
    console.error('Amplify config error:', error)
    isConfigured.value = false
  }
})
</script>
```

**Save the file!**

---

### 15. Add Test Component to Home View
Open `src/views/HomeView.vue` and replace its contents with:

```vue
<template>
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Asset Management System</h1>
    
    <AmplifyTest />
    
    <div class="mt-8 p-6 bg-white rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Welcome!</h2>
      <p class="text-gray-600">
        Your frontend is connected to AWS Amplify backend.
      </p>
    </div>
  </main>
</template>

<script setup>
import AmplifyTest from '@/components/common/AmplifyTest.vue'
</script>
```

**Save the file!**

---

### 16. Update App.vue to Use Router
Open `src/App.vue` and replace its contents with:

```vue
<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
```

**Save the file!**

---

### 17. Configure Router with Home Route
Open `src/router/index.js` and replace its contents with:

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    }
  ],
})

export default router
```

**Save the file!**

---

### 18. Test the Connection
Start the dev server (if not already running):

```bash
npm run dev
```

Open http://localhost:5173/

You should see:
- ✅ "Amplify is configured correctly!"
- Region and User Pool ID displayed
- "Asset Management System" heading
- Welcome message

---

### 19. Verify Tailwind CSS Works
The page should have:
- Gray background
- Styled components
- Proper spacing and colors

If you see styled content, Tailwind is working! 🎉

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] Tailwind CSS configured in main.css
- [ ] `amplify_outputs.json` copied to frontend
- [ ] `amplifyConfig.js` created and configured
- [ ] `main.js` updated with Amplify import
- [ ] Element Plus imported and configured
- [ ] All icons registered
- [ ] Folder structure created (layout, auth, assets, common)
- [ ] `.env` file created
- [ ] `.gitignore` updated
- [ ] `App.vue` updated with RouterView
- [ ] `router/index.js` configured with home route
- [ ] `HomeView.vue` updated with AmplifyTest component
- [ ] Dev server runs without errors
- [ ] AmplifyTest component shows ✅ configured
- [ ] User Pool ID displayed
- [ ] Tailwind styles are applied
- [ ] No console errors in browser

---

## 🔍 Understanding What You Built

### Amplify Configuration Flow
```
1. amplify_outputs.json (backend config)
   ↓
2. amplifyConfig.js (import and configure)
   ↓
3. main.js (initialize on app startup)
   ↓
4. Components can now use Amplify services
```

### What Gets Configured
- **Auth**: Cognito User Pool connection
- **Storage**: S3 bucket access
- **API**: AppSync GraphQL endpoint
- **Region**: AWS region for all services

### Tailwind Integration
- Directives in main.css
- Vite processes Tailwind
- PostCSS transforms utilities
- Optimized for production

### Element Plus Setup
- Global registration
- All components available
- Icons registered individually
- Theme can be customized

---

## 🎓 Key Concepts

### 1. Amplify.configure()
- Connects frontend to backend
- Uses amplify_outputs.json
- Must be called before using Amplify services
- Only needs to be called once

### 2. Environment Variables
- Prefix with `VITE_` to expose to frontend
- Stored in `.env` file
- Never commit sensitive data
- Different values for dev/prod

### 3. Component Organization
- `layout/` - Headers, footers, layouts
- `auth/` - Login, signup components
- `assets/` - Asset-related components
- `common/` - Reusable utilities

### 4. Services Folder
- API calls
- Business logic
- Reusable functions
- Separate from components

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'aws-amplify'"
**Solution**: 
```bash
npm install aws-amplify
```

### Issue: Tailwind styles not applied
**Solution**: 
- Check main.css has @tailwind directives
- Verify main.css is imported in main.js
- Restart dev server

### Issue: Element Plus components not working
**Solution**: 
- Check Element Plus is imported in main.js
- Verify 'element-plus/dist/index.css' is imported
- Check component names are correct

### Issue: "amplify_outputs.json not found"
**Solution**: 
```bash
# From frontend directory
cp ../amplify_outputs.json .
```

### Issue: Console errors about Amplify config
**Solution**: 
- Check amplify_outputs.json is valid JSON
- Verify amplifyConfig.js imports it correctly
- Check main.js imports amplifyConfig.js

### Issue: Icons not showing
**Solution**: 
- Verify icons are registered in main.js
- Check icon names match Element Plus docs
- Import statement should be correct

---

## 📝 Notes

- `amplify_outputs.json` is auto-generated by backend
- Don't edit `amplify_outputs.json` manually
- Amplify must be configured before using auth/storage
- Tailwind and Element Plus work together
- Environment variables must start with `VITE_`

---

## 🎯 What's Next?

In the next step (1.1.7), we'll:
- Create authentication components (Login, Signup)
- Build auth store with Pinia
- Implement login/logout functionality
- Add route guards for protected pages

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.1.6! 🎉

**You now have:**
- ✅ Tailwind CSS configured and working
- ✅ Amplify connected to backend
- ✅ Element Plus UI library ready
- ✅ Project structure organized
- ✅ Frontend ready for development!

---

## 📸 Expected Final State

Your frontend structure should look like:
```
frontend/
├── src/
│   ├── assets/
│   │   └── main.css           # ← UPDATED with Tailwind
│   ├── components/
│   │   ├── layout/            # ← NEW
│   │   ├── auth/              # ← NEW
│   │   ├── assets/            # ← NEW
│   │   └── common/            # ← NEW
│   │       └── AmplifyTest.vue # ← NEW
│   ├── composables/           # ← NEW
│   ├── services/              # ← NEW
│   ├── stores/
│   ├── views/
│   │   └── HomeView.vue       # ← UPDATED
│   ├── App.vue
│   ├── main.js                # ← UPDATED
│   └── amplifyConfig.js       # ← NEW
├── amplify_outputs.json       # ← NEW (copied)
├── .env                       # ← NEW
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🔗 Additional Resources

- [Amplify JavaScript Documentation](https://docs.amplify.aws/javascript/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Tailwind CSS with Vue](https://tailwindcss.com/docs/guides/vite#vue)
- [Element Plus Documentation](https://element-plus.org/)

---

## 💡 Pro Tips

1. **Always configure Amplify first** - Before using any AWS services
2. **Use environment variables** - For configuration that changes
3. **Organize components early** - Easier to maintain
4. **Test configuration** - Before building features
5. **Check browser console** - Catch errors early
6. **Use Vue DevTools** - Great for debugging
7. **Keep amplify_outputs.json in sync** - Copy after backend changes

---

**Ready for Step 1.1.7?** Let me know when you've completed this step and can see the Amplify test component working! 🚀

This is a major milestone - your frontend is now connected to AWS! 🎊
