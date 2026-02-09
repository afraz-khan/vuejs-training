# Step 1.2.1: Create Auth Store with Pinia

## 🎯 Goal
Create a Pinia store to manage authentication state and actions throughout the application.

## 📚 What You'll Learn
- Pinia store structure and organization
- State management patterns
- Async actions with AWS Amplify Auth
- Error handling in stores
- Getters for computed state

## 📋 Prerequisites
- [ ] Step 1.1.6 completed (Frontend configured)
- [ ] You're in the `frontend` directory
- [ ] Dev server can run without errors
- [ ] Amplify is configured

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the frontend directory:

```bash
pwd
```

Expected: `/Users/apple/.../asset-management-app/frontend`

---

### 2. Create Auth Store File
Create the auth store:

```bash
touch src/stores/authStore.js
```

---

### 3. Add Auth Store Code
Open `src/stores/authStore.js` and add this code:

```javascript
import { defineStore } from 'pinia'
import { signUp, confirmSignUp, signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'

export const useAuthStore = defineStore('auth', {
  // State
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  // Getters (computed properties)
  getters: {
    // Get user's email
    userEmail: (state) => state.user?.signInDetails?.loginId || null,
    
    // Get user's ID
    userId: (state) => state.user?.userId || null,
    
    // Check if user is logged in
    isLoggedIn: (state) => state.isAuthenticated && state.user !== null,
  },

  // Actions (methods)
  actions: {
    // Sign up a new user
    async signup({ email, password, name }) {
      this.loading = true
      this.error = null
      
      try {
        const { isSignUpComplete, userId, nextStep } = await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
              preferred_username: name,
            },
          },
        })

        console.log('Signup result:', { isSignUpComplete, userId, nextStep })
        
        return { 
          success: true, 
          isSignUpComplete, 
          userId, 
          nextStep 
        }
      } catch (error) {
        console.error('Signup error:', error)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Confirm signup with verification code
    async confirmSignup({ email, code }) {
      this.loading = true
      this.error = null
      
      try {
        await confirmSignUp({
          username: email,
          confirmationCode: code,
        })
        
        return { success: true }
      } catch (error) {
        console.error('Confirm signup error:', error)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Sign in existing user
    async login({ email, password }) {
      this.loading = true
      this.error = null
      
      try {
        const { isSignedIn, nextStep } = await signIn({
          username: email,
          password,
        })

        if (isSignedIn) {
          // Get user details after successful login
          await this.fetchCurrentUser()
        }

        return { success: true, isSignedIn, nextStep }
      } catch (error) {
        console.error('Login error:', error)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Sign out current user
    async logout() {
      this.loading = true
      this.error = null
      
      try {
        await signOut()
        
        // Clear state
        this.user = null
        this.isAuthenticated = false
        
        return { success: true }
      } catch (error) {
        console.error('Logout error:', error)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Get current authenticated user
    async fetchCurrentUser() {
      this.loading = true
      this.error = null
      
      try {
        const user = await getCurrentUser()
        this.user = user
        this.isAuthenticated = true
        
        return { success: true, user }
      } catch (error) {
        console.error('Fetch user error:', error)
        this.user = null
        this.isAuthenticated = false
        this.error = error.message
        
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Check authentication status on app load
    async checkAuth() {
      try {
        const user = await getCurrentUser()
        this.user = user
        this.isAuthenticated = true
        return true
      } catch (error) {
        this.user = null
        this.isAuthenticated = false
        return false
      }
    },

    // Get auth tokens
    async getAuthToken() {
      try {
        const session = await fetchAuthSession()
        return session.tokens?.idToken?.toString() || null
      } catch (error) {
        console.error('Get token error:', error)
        return null
      }
    },

    // Clear error
    clearError() {
      this.error = null
    },
  },
})
```

**Save the file!**

---

### 4. Understanding the Store Structure

Let's break down what we created:

**State**:
- `user`: Current user object (null if not logged in)
- `isAuthenticated`: Boolean flag for auth status
- `loading`: Loading state for async operations
- `error`: Error message if something goes wrong

**Getters**:
- `userEmail`: Computed property to get user's email
- `userId`: Computed property to get user's ID
- `isLoggedIn`: Check if user is authenticated

**Actions**:
- `signup()`: Register new user
- `confirmSignup()`: Verify email with code
- `login()`: Sign in existing user
- `logout()`: Sign out current user
- `fetchCurrentUser()`: Get current user details
- `checkAuth()`: Check if user is authenticated
- `getAuthToken()`: Get JWT token for API calls
- `clearError()`: Clear error messages

---

### 5. Test the Store
Let's create a simple test to verify the store works.

Create a test component:

```bash
touch src/components/common/AuthStoreTest.vue
```

Add this code:

```vue
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

    <div class="mt-4">
      <el-button @click="checkAuth" size="small">
        Check Auth Status
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const checkAuth = async () => {
  await authStore.checkAuth()
}
</script>
```

**Save the file!**

---

### 6. Add Test Component to Home View
Open `src/views/HomeView.vue` and update it:

```vue
<template>
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Asset Management System</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AmplifyTest />
      <AuthStoreTest />
    </div>
    
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
import AuthStoreTest from '@/components/common/AuthStoreTest.vue'
</script>
```

**Save the file!**

---

### 7. Test the Store in Browser
Start the dev server (if not running):

```bash
npm run dev
```

Open http://localhost:5173/

You should see:
- AmplifyTest component (from before)
- AuthStoreTest component (new!)
- Both showing their status

---

### 8. Test Check Auth Button
Click the "Check Auth Status" button.

You should see:
- "Is Authenticated: false" (since you're not logged in yet)
- "Is Logged In: false"
- "User: No user"

This is correct! We haven't logged in yet.

---

### 9. Check Browser Console
Open DevTools (F12) → Console tab

You should see:
- "Fetch user error: ..." (this is expected - no user logged in)
- No other errors

---

### 10. Verify Store is Working
The store is working correctly if:
- ✅ No JavaScript errors
- ✅ AuthStoreTest component displays
- ✅ Shows "Is Authenticated: false"
- ✅ Check Auth button works

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `src/stores/authStore.js` created
- [ ] Store has all state properties (user, isAuthenticated, loading, error)
- [ ] Store has all getters (userEmail, userId, isLoggedIn)
- [ ] Store has all actions (signup, login, logout, etc.)
- [ ] `AuthStoreTest.vue` component created
- [ ] Test component added to HomeView
- [ ] Dev server runs without errors
- [ ] AuthStoreTest displays on home page
- [ ] "Check Auth Status" button works
- [ ] No console errors (except expected "no user" error)

---

## 🔍 Understanding What You Built

### Pinia Store Pattern
```
State (data)
  ↓
Getters (computed)
  ↓
Actions (methods)
  ↓
Components use store
```

### Why Use a Store?
1. **Centralized State**: One source of truth for auth
2. **Reusable**: Any component can access auth state
3. **Reactive**: UI updates automatically when state changes
4. **Organized**: All auth logic in one place

### State Management Flow
```
Component calls action
  ↓
Action updates state
  ↓
Getters compute derived values
  ↓
Component UI updates automatically
```

### Amplify Auth Methods
- `signUp()`: Create new user account
- `signIn()`: Authenticate existing user
- `signOut()`: End user session
- `getCurrentUser()`: Get current user info
- `fetchAuthSession()`: Get auth tokens

---

## 🎓 Key Concepts

### 1. Pinia Store
- Modern state management for Vue 3
- Simpler than Vuex
- TypeScript support
- DevTools integration

### 2. Async Actions
- Use `async/await` for API calls
- Handle loading states
- Catch and display errors
- Return success/failure

### 3. Getters
- Computed properties for store
- Automatically update when state changes
- Can be used like regular properties

### 4. Error Handling
- Try/catch blocks
- Store errors in state
- Display to user
- Clear errors when needed

### 5. AWS Amplify Auth
- Handles Cognito integration
- Manages tokens automatically
- Provides simple API
- Secure by default

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'pinia'"
**Solution**: 
```bash
npm install pinia
```

### Issue: "Cannot find module 'aws-amplify/auth'"
**Solution**: 
```bash
npm install aws-amplify
```

### Issue: Store not reactive
**Solution**: 
- Make sure you're using `useAuthStore()` in components
- Don't destructure store properties (use `authStore.user`, not `const { user } = authStore`)

### Issue: "getCurrentUser" error in console
**Solution**: This is expected when no user is logged in. It's not a problem!

### Issue: TypeScript errors
**Solution**: We're using JavaScript, so ignore TypeScript warnings

---

## 📝 Notes

- The store is created but not used for login yet (next steps)
- Error messages are expected when checking auth without login
- Store is reactive - UI updates automatically
- All auth logic is centralized in one place
- Actions return success/failure for easy handling

---

## 🎯 What's Next?

In the next step (1.2.2), we'll:
- Create the Signup Form component
- Use Element Plus form components
- Implement form validation
- Connect form to auth store

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.2.1! 🎉

**You now have:**
- ✅ Auth store created with Pinia
- ✅ All authentication actions defined
- ✅ State management in place
- ✅ Ready to build login/signup UI!

---

## 📸 Expected Final State

Your project structure should look like:
```
frontend/src/
├── stores/
│   ├── authStore.js        # ← NEW! Auth state management
│   └── (other stores)
├── components/
│   └── common/
│       ├── AmplifyTest.vue
│       └── AuthStoreTest.vue  # ← NEW! Store test
├── views/
│   └── HomeView.vue        # ← UPDATED! Shows both tests
└── ...
```

---

**Ready for Step 1.2.2?** Let me know when you've completed this step and can see the AuthStoreTest component! 🚀
