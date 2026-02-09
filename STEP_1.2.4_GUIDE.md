# Step 1.2.4: Add Route Guards and Session Management

## 🎯 Goal
Implement route guards to protect authenticated routes, check session on app load, and handle automatic redirects.

## 📚 What You'll Learn
- Vue Router navigation guards
- Route meta fields
- Session persistence
- App initialization lifecycle
- Automatic authentication checks
- Redirect logic
- Protected routes

## 📋 Prerequisites
- [ ] Step 1.2.3 completed (Login form created)
- [ ] You're in the `frontend` directory
- [ ] Login/logout is working
- [ ] Auth store is functional

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the frontend directory:

```bash
pwd
```

Expected: `/Users/apple/.../asset-management-app/frontend`

---

### 2. Understanding Route Guards

Route guards are like security checkpoints:
- Check if user is authenticated
- Redirect to login if not
- Allow access if authenticated
- Run before navigation happens

**Types of Guards**:
- `beforeEach`: Runs before every route change
- `beforeEnter`: Runs before entering specific route
- `beforeRouteEnter`: Component-level guard

We'll use `beforeEach` (global guard).

---

### 3. Update Router with Guards
Open `src/router/index.js` and replace with this code:

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SignupView from '@/views/auth/SignupView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false }, // Public route
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
      meta: { requiresAuth: false, guestOnly: true }, // Only for non-authenticated users
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false, guestOnly: true }, // Only for non-authenticated users
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }, // Protected route
    },
    {
      path: '/assets',
      name: 'assets',
      component: () => import('@/views/AssetsView.vue'),
      meta: { requiresAuth: true }, // Protected route
    },
  ],
})

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Always wait for auth check to complete before making routing decisions
  await authStore.checkAuth()

  // Check if route requires authentication
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  
  // Check if route is guest only (login/signup)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  // Check authentication status
  const isAuthenticated = authStore.isAuthenticated

  console.log('Navigation guard:', {
    to: to.path,
    requiresAuth,
    guestOnly,
    isAuthenticated,
  })

  // If route requires auth and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    console.log('Redirecting to login: route requires auth')
    next({
      name: 'login',
      query: { redirect: to.fullPath }, // Save intended destination
    })
    return
  }

  // If route is guest only and user is authenticated
  if (guestOnly && isAuthenticated) {
    console.log('Redirecting to home: user already authenticated')
    next({ name: 'home' })
    return
  }

  // Allow navigation
  next()
})

export default router
```

**Save the file!**

**Key Point**: The guard simply calls `await authStore.checkAuth()` before any routing logic. The auth store handles caching internally using a promise, so multiple calls won't trigger multiple API requests.

---

### 4. Understanding the Auth Check Pattern

**The Problem**:
- Navigation guard runs immediately on page load
- Auth check takes time (async API call)
- Guard might see `isAuthenticated: false` even if session is valid

**The Solution**:
- Guard simply awaits `checkAuth()` before making routing decisions
- `checkAuth()` calls Amplify's `getCurrentUser()`
- Amplify handles session caching internally
- No extra variables or flags needed!

**Why This Works**:
- Amplify caches tokens in localStorage
- `getCurrentUser()` is fast after first call (reads from cache)
- The `await` ensures guard waits for auth check to complete
- Simple, clean, and relies on Amplify's built-in caching

**Code Flow**:
```javascript
// Guard runs
await authStore.checkAuth()
  ↓
getCurrentUser() → Amplify checks localStorage
  ↓
If valid token → Returns user (fast, from cache)
  ↓
If no token → Throws error (also fast)
  ↓
Guard now has correct auth status
```

This is the simplest solution - just let Amplify do its job!

---

### 5. Understanding Route Meta

**Route Meta Fields**:
```javascript
meta: { 
  requiresAuth: true,  // Route needs authentication
  guestOnly: true,     // Route only for guests (not logged in)
}
```

**Examples**:
- Home page: `requiresAuth: false` (public)
- Login page: `guestOnly: true` (redirect if logged in)
- Dashboard: `requiresAuth: true` (protected)

---

### 6. Add Session Check on App Load

**Route Meta Fields**:
```javascript
meta: { 
  requiresAuth: true,  // Route needs authentication
  guestOnly: true,     // Route only for guests (not logged in)
}
```

**Examples**:
- Home page: `requiresAuth: false` (public)
- Login page: `guestOnly: true` (redirect if logged in)
- Dashboard: `requiresAuth: true` (protected)

---

### 5. Add Session Check on App Load
Open `src/App.vue` and update it:

```vue
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
```

**Save the file!**

---

### 6. Understanding App Initialization

**Flow**:
```
App loads
  ↓
Show loading screen
  ↓
Check auth status (checkAuth)
  ↓
If authenticated → Load user data
  ↓
If not authenticated → Clear state
  ↓
Hide loading screen
  ↓
Show app content
```

**Why This Matters**:
- Prevents flash of wrong content
- Restores session on page refresh
- Handles expired tokens
- Provides smooth UX

---

### 7. Create Dashboard View (Protected Route)
Let's create a protected route to test the guards.

Create the dashboard view:

```bash
touch src/views/DashboardView.vue
```

Add this code:

```vue
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Stats Cards -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Assets</h3>
          <p class="text-3xl font-bold text-blue-600">0</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Active Tags</h3>
          <p class="text-3xl font-bold text-green-600">0</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Recent Activity</h3>
          <p class="text-3xl font-bold text-purple-600">0</p>
        </div>
      </div>

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
```

**Save the file!**

---

### 8. Create Assets View (Protected Route)
Create a placeholder assets view:

```bash
touch src/views/AssetsView.vue
```

Add this code:

```vue
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
```

**Save the file!**

---

### 9. Update Login to Redirect to Dashboard
Open `src/views/auth/LoginView.vue` and update the redirect:

```javascript
// Find this line:
router.push('/')

// Replace with:
// Check if there's a redirect query parameter
const redirectPath = router.currentRoute.value.query.redirect || '/dashboard'
router.push(redirectPath)
```

Full updated `handleLogin` function:

```javascript
const handleLogin = async (formData) => {
  console.log('Login form data:', formData)

  const result = await authStore.login({
    email: formData.email,
    password: formData.password,
  })

  if (result.success) {
    if (result.isSignedIn) {
      ElMessage.success('Welcome back!')
      // Redirect to intended destination or dashboard
      const redirectPath = router.currentRoute.value.query.redirect || '/dashboard'
      router.push(redirectPath)
    } else if (result.nextStep) {
      console.log('Next step:', result.nextStep)
      ElMessage.warning('Additional authentication step required')
    }
  } else {
    ElMessage.error(result.error || 'Login failed')
  }
}
```

**Save the file!**

---

### 10. Update Home View with Navigation
Open `src/views/HomeView.vue` and update it:

```vue
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
```

**Save the file!**

---

### 11. Test the Application
Start the dev server (if not running):

```bash
npm run dev
```

Open http://localhost:5173/

---

### 12. Test Route Guards - Not Authenticated
When not logged in:

1. Try to access http://localhost:5173/dashboard
2. You should be redirected to `/login`
3. Check URL: Should have `?redirect=/dashboard`

This proves the route guard is working!

---

### 13. Test Login with Redirect
1. Log in with your credentials
2. After successful login, you should be redirected to `/dashboard`
3. You should see the dashboard with your email

---

### 14. Test Guest-Only Routes
When logged in:

1. Try to access http://localhost:5173/login
2. You should be redirected to `/` (home)
3. Try to access http://localhost:5173/signup
4. You should be redirected to `/` (home)

This proves guest-only routes are working!

---

### 15. Test Session Persistence
1. While logged in, refresh the page (F5)
2. You should see a brief loading screen
3. Then you should still be logged in
4. Dashboard should display correctly

This proves session persistence is working!

---

### 16. Test Navigation Between Protected Routes
1. From dashboard, click "View Assets"
2. Should navigate to `/assets` without redirect
3. From assets, click "Dashboard"
4. Should navigate back to `/dashboard`

Both routes are protected, so no login required!

---

### 17. Test Logout
1. Click "Logout" button
2. Should see success message
3. Should be redirected to `/login`
4. Try accessing `/dashboard` again
5. Should be redirected to `/login`

---

### 18. Check Browser Console
Open DevTools (F12) → Console tab

You should see navigation guard logs:
```
App mounted: checking authentication...
Auth check complete: { isAuthenticated: true, user: {...} }
Navigation guard: { to: '/dashboard', requiresAuth: true, ... }
```

---

### 19. Test All Scenarios

**Scenario 1: Fresh User (Not Logged In)**
- ✅ Can access home page
- ✅ Can access login page
- ✅ Can access signup page
- ❌ Cannot access dashboard (redirected to login)
- ❌ Cannot access assets (redirected to login)

**Scenario 2: Logged In User**
- ✅ Can access home page
- ✅ Can access dashboard
- ✅ Can access assets
- ❌ Cannot access login (redirected to home)
- ❌ Cannot access signup (redirected to home)

**Scenario 3: Page Refresh**
- ✅ Session persists
- ✅ User stays logged in
- ✅ Protected routes still accessible

**Scenario 4: Logout**
- ✅ Session cleared
- ✅ Redirected to login
- ✅ Protected routes no longer accessible

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] Router updated with navigation guards
- [ ] Route meta fields added (requiresAuth, guestOnly)
- [ ] App.vue checks auth on mount
- [ ] Loading screen shows during auth check
- [ ] Dashboard view created
- [ ] Assets view created
- [ ] Login redirects to dashboard
- [ ] Login preserves redirect query parameter
- [ ] Home view shows different buttons based on auth
- [ ] Cannot access protected routes when not logged in
- [ ] Redirected to login when accessing protected routes
- [ ] Cannot access login/signup when logged in
- [ ] Session persists on page refresh
- [ ] Logout clears session and redirects
- [ ] Navigation guard logs appear in console
- [ ] No console errors

---

## 🔍 Understanding What You Built

### Navigation Guard Flow
```
User navigates to route
  ↓
beforeEach guard runs
  ↓
Check route meta (requiresAuth, guestOnly)
  ↓
Check user auth status
  ↓
If protected + not auth → Redirect to login
  ↓
If guest only + auth → Redirect to home
  ↓
Otherwise → Allow navigation
```

### App Initialization Flow
```
App mounts
  ↓
Show loading screen
  ↓
Call authStore.checkAuth()
  ↓
Amplify checks for valid session
  ↓
If valid → Load user data
  ↓
If invalid → Clear state
  ↓
Hide loading screen
  ↓
Router guard runs
  ↓
Navigate to appropriate route
```

### Redirect Flow
```
User tries to access /dashboard (not logged in)
  ↓
Guard catches: requiresAuth = true, isAuth = false
  ↓
Redirect to /login?redirect=/dashboard
  ↓
User logs in
  ↓
Check query.redirect
  ↓
Redirect to /dashboard
```

### Session Persistence
```
User logs in
  ↓
Amplify stores tokens in localStorage
  ↓
User refreshes page
  ↓
App.vue calls checkAuth()
  ↓
Amplify reads tokens from localStorage
  ↓
Validates tokens with Cognito
  ↓
If valid → Restore session
  ↓
User stays logged in
```

---

## 🎓 Key Concepts

### 1. Navigation Guards
```javascript
router.beforeEach((to, from, next) => {
  // to: where user is going
  // from: where user is coming from
  // next: function to allow/redirect navigation
})
```

### 2. Route Meta Fields
```javascript
meta: {
  requiresAuth: true,  // Custom field
  guestOnly: true,     // Custom field
  title: 'Dashboard',  // Can add any fields
}
```

### 3. Checking Route Meta
```javascript
to.matched.some((record) => record.meta.requiresAuth)
```
- `matched`: Array of matched route records
- `some()`: Returns true if any record matches

### 4. Query Parameters
```javascript
// Save redirect destination
next({ name: 'login', query: { redirect: to.fullPath } })

// Read redirect destination
const redirect = router.currentRoute.value.query.redirect
```

### 5. Conditional Rendering
```vue
<div v-if="authStore.isAuthenticated">
  <!-- Show for logged in users -->
</div>
<div v-else>
  <!-- Show for guests -->
</div>
```

### 6. App Lifecycle
- `onMounted`: Runs after component is mounted
- Perfect for initialization tasks
- Async operations supported

---

## 🐛 Troubleshooting

### Issue: Redirected to login on page refresh (even when logged in)
**Solution**: 
- Make sure the guard calls `await authStore.checkAuth()` before checking auth status
- Verify `checkAuth()` stores and returns the promise correctly
- Check that `logout()` resets `authCheckPromise = null`
- The promise pattern ensures the guard waits for auth check to complete

### Issue: Multiple API calls to check auth
**Solution**: 
- The promise caching should prevent this
- Verify `checkAuth()` returns existing promise if it exists
- Check console logs - should only see one "Fetch user" call per session

### Issue: Infinite redirect loop
**Solution**: 
- Check that login/signup have `guestOnly: true`
- Check that home page has `requiresAuth: false`
- Verify guard logic doesn't always redirect

### Issue: Loading screen never disappears
**Solution**: 
- Check that `isCheckingAuth` is set to false in finally block
- Verify checkAuth() completes (check console)
- Check for JavaScript errors

### Issue: Session not persisting on refresh
**Solution**: 
- Verify Amplify is configured correctly
- Check that checkAuth() is called in App.vue
- Check browser localStorage for Amplify tokens
- Verify tokens haven't expired

### Issue: Protected routes accessible without login
**Solution**: 
- Check that route has `meta: { requiresAuth: true }`
- Verify navigation guard is running (check console logs)
- Check that authStore.isAuthenticated is correct

### Issue: Can't access login when logged out
**Solution**: 
- Check that login route has `guestOnly: true` (not `requiresAuth: true`)
- Verify guard logic for guest-only routes

### Issue: Redirect query parameter not working
**Solution**: 
- Check that guard saves redirect: `query: { redirect: to.fullPath }`
- Verify login reads redirect: `router.currentRoute.value.query.redirect`
- Check that redirect path is valid

---

## 📝 Notes

- Navigation guards run before every route change
- Guards can be async (use await)
- `next()` must be called exactly once
- Route meta can have any custom fields
- Session tokens stored in localStorage by Amplify
- Tokens expire after 1 hour (default)
- Refresh tokens valid for 30 days (default)
- Loading screen prevents flash of wrong content

---

## 🎯 What's Next?

Phase 1.2 (Authentication UI) is now complete! 🎉

In the next phase (1.3), we'll:
- Design RDS database schema
- Create Lambda functions for asset CRUD
- Set up API Gateway
- Connect backend to RDS
- Deploy backend infrastructure

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.2.4! 🎉

**You now have:**
- ✅ Route guards protecting authenticated routes
- ✅ Guest-only routes for login/signup
- ✅ Session persistence on page refresh
- ✅ Automatic redirect to login for protected routes
- ✅ Redirect back to intended destination after login
- ✅ Loading screen during auth check
- ✅ Complete authentication system!

---

## 📸 Expected Final State

Your project structure should look like:
```
frontend/src/
├── views/
│   ├── auth/
│   │   ├── SignupView.vue
│   │   └── LoginView.vue
│   ├── HomeView.vue           # ← UPDATED! Conditional nav
│   ├── DashboardView.vue      # ← NEW! Protected route
│   └── AssetsView.vue         # ← NEW! Protected route
├── router/
│   └── index.js               # ← UPDATED! Guards + meta
├── App.vue                    # ← UPDATED! Auth check on mount
└── stores/
    └── authStore.js
```

---

## 🎊 Phase 1.2 Complete!

**Checkpoint**: Users can signup, login, logout! ✅

You've completed the entire Authentication UI phase:
- ✅ Step 1.2.1: Auth Store
- ✅ Step 1.2.2: Signup Form
- ✅ Step 1.2.3: Login Form
- ✅ Step 1.2.4: Route Guards & Session Management

**Ready for Phase 1.3?** (RDS + Lambda + API Gateway)

Let me know when you've completed this step and all tests pass! 🚀
