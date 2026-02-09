# Step 1.2.3: Create Login Form Component

## 🎯 Goal
Create a reusable login form component with validation and "Remember Me" functionality using Element Plus.

## 📚 What You'll Learn
- Simpler form structure (fewer fields than signup)
- Checkbox handling with v-model
- Form validation with Element Plus
- Event handling and emits
- Component reusability patterns
- Local storage for "Remember Me"

## 📋 Prerequisites
- [ ] Step 1.2.2 completed (Signup form created)
- [ ] You're in the `frontend` directory
- [ ] Dev server can run without errors
- [ ] Signup flow is working

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the frontend directory:

```bash
pwd
```

Expected: `/Users/apple/.../asset-management-app/frontend`

---

### 2. Create Login Form Component
Create the login form file:

```bash
touch src/components/auth/LoginForm.vue
```

---

### 3. Add Login Form Code
Open `src/components/auth/LoginForm.vue` and add this code:

```vue
<template>
  <div class="login-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      size="large"
      @submit.prevent="handleSubmit"
    >
      <!-- Email Field -->
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="Enter your email"
          :prefix-icon="Message"
          clearable
          autofocus
        />
      </el-form-item>

      <!-- Password Field -->
      <el-form-item label="Password" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="Enter your password"
          :prefix-icon="Lock"
          show-password
          clearable
        />
      </el-form-item>

      <!-- Remember Me & Forgot Password Row -->
      <el-form-item>
        <div class="flex items-center justify-between w-full">
          <el-checkbox v-model="formData.rememberMe">
            Remember me
          </el-checkbox>
          <a href="#" class="text-sm text-blue-600 hover:text-blue-500">
            Forgot password?
          </a>
        </div>
      </el-form-item>

      <!-- Submit Button -->
      <el-form-item>
        <el-button
          type="primary"
          native-type="submit"
          :loading="loading"
          class="w-full"
        >
          {{ loading ? 'Signing In...' : 'Sign In' }}
        </el-button>
      </el-form-item>

      <!-- Error Message -->
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
        class="mb-4"
      />
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Message, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Define emits
const emit = defineEmits(['success', 'error'])

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

// Form reference
const formRef = ref(null)

// Form data
const formData = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

// Validation rules
const rules = {
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' },
  ],
}

// Load remembered email on mount
onMounted(() => {
  const rememberedEmail = localStorage.getItem('rememberedEmail')
  if (rememberedEmail) {
    formData.email = rememberedEmail
    formData.rememberMe = true
  }
})

// Handle form submission
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // Validate form
    await formRef.value.validate()

    // Save or remove email based on "Remember Me"
    if (formData.rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }

    // Emit success event with form data
    emit('success', {
      email: formData.email,
      password: formData.password,
    })
  } catch (error) {
    console.error('Form validation failed:', error)
    ElMessage.error('Please fix the form errors')
  }
}

// Reset form
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// Expose methods to parent component
defineExpose({
  resetForm,
})
</script>

<style scoped>
.login-form {
  width: 100%;
}

.w-full {
  width: 100%;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}
</style>
```

**Save the file!**

---

### 4. Understanding the Component

Let's break down what we created:

**Differences from Signup Form**:
- Only 2 fields (email, password) instead of 4
- Added "Remember Me" checkbox
- Added "Forgot password?" link
- Simpler validation (no password strength check)
- Uses localStorage to remember email

**Remember Me Feature**:
- Saves email to localStorage when checked
- Loads email on component mount
- Removes email when unchecked

**Checkbox Binding**:
```vue
<el-checkbox v-model="formData.rememberMe">
```
- `v-model` works with checkboxes too!
- Returns `true` or `false`

---

### 5. Create Login View
Create the login view file:

```bash
touch src/views/auth/LoginView.vue
```

---

### 6. Add Login View Code
Open `src/views/auth/LoginView.vue` and add:

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Don't have an account?
          <router-link to="/signup" class="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </router-link>
        </p>
      </div>

      <!-- Login Form Card -->
      <div class="bg-white py-8 px-6 shadow rounded-lg">
        <LoginForm
          :loading="authStore.loading"
          :error="authStore.error"
          @success="handleLogin"
        />
      </div>

      <!-- Additional Info -->
      <div class="text-center text-sm text-gray-600">
        <p>
          By signing in, you agree to our
          <a href="#" class="text-blue-600 hover:text-blue-500">Terms of Service</a>
          and
          <a href="#" class="text-blue-600 hover:text-blue-500">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoginForm from '@/components/auth/LoginForm.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Handle login form submission
const handleLogin = async (formData) => {
  console.log('Login form data:', formData)

  // Call auth store login action
  const result = await authStore.login({
    email: formData.email,
    password: formData.password,
  })

  if (result.success) {
    if (result.isSignedIn) {
      ElMessage.success('Welcome back!')
      // Redirect to home or dashboard
      router.push('/')
    } else if (result.nextStep) {
      // Handle additional steps (MFA, password change, etc.)
      console.log('Next step:', result.nextStep)
      ElMessage.warning('Additional authentication step required')
    }
  } else {
    ElMessage.error(result.error || 'Login failed')
  }
}
</script>
```

**Save the file!**

---

### 7. Add Login Route
Open `src/router/index.js` and add the login route:

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SignupView from '@/views/auth/SignupView.vue'
import LoginView from '@/views/auth/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})

export default router
```

**Save the file!**

---

### 8. Update Home View Navigation
The home view already has the "Sign In" button from the previous step, so it should work automatically!

---

### 9. Test the Login Form
Start the dev server (if not running):

```bash
npm run dev
```

Open http://localhost:5173/

---

### 10. Navigate to Login Page
Click the "Sign In" button on the home page.

You should see:
- ✅ Login form with 2 fields (Email, Password)
- ✅ "Remember me" checkbox
- ✅ "Forgot password?" link
- ✅ "Sign In" button
- ✅ Link to "Sign up" at the top

---

### 11. Test Form Validation
Try submitting the form without filling any fields:

1. Click "Sign In" button
2. You should see red error messages under each field

Try entering invalid data:
- **Email**: Enter "test" (invalid email) → Error: "Please enter a valid email"
- **Password**: Enter "short" → Error: "Password must be at least 8 characters"

---

### 12. Test Remember Me Feature
Fill in the form:
- **Email**: `test@example.com`
- **Password**: `TestPass123`
- **Check** "Remember me"

Click "Sign In"

---

### 13. Test Login with Existing User
If you created a user in Step 1.2.2, use those credentials:

1. Enter the email you signed up with
2. Enter the password
3. Click "Sign In"

You should see:
- Button changes to "Signing In..." with loading spinner
- Success message: "Welcome back!"
- Redirected to home page

---

### 14. Verify Remember Me Works
After logging in:

1. Navigate back to login page
2. The email field should be pre-filled
3. "Remember me" checkbox should be checked

This proves localStorage is working!

---

### 15. Test Without Remember Me
1. Uncheck "Remember me"
2. Log in
3. Navigate back to login page
4. Email field should be empty

---

### 16. Check Browser Console
Open DevTools (F12) → Console tab

You should see:
- "Login form data: { email, password }"
- "Login result: { ... }"
- No errors

---

### 17. Check localStorage
Open DevTools (F12) → Application tab → Local Storage

If "Remember me" was checked, you should see:
- Key: `rememberedEmail`
- Value: Your email address

---

### 18. Test Navigation Between Login/Signup
Test the links:

1. From login page → Click "Sign up" → Should go to signup
2. From signup page → Click "Sign in" → Should go to login

Both should work smoothly!

---

### 19. Update Auth Store Test (Optional)
Let's update the AuthStoreTest component to show login status.

Open `src/components/common/AuthStoreTest.vue` and update:

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
```

**Save the file!**

---

### 20. Test Logout
After logging in:

1. Go to home page
2. Look at the AuthStoreTest component
3. You should see:
   - "Is Authenticated: true"
   - "Is Logged In: true"
   - Your email and user ID
   - A "Logout" button

4. Click "Logout"
5. You should be redirected to login page

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `src/components/auth/LoginForm.vue` created
- [ ] Form has 2 fields (email, password)
- [ ] "Remember me" checkbox works
- [ ] "Forgot password?" link displays
- [ ] Form validation works
- [ ] `src/views/auth/LoginView.vue` created
- [ ] Login route added to router
- [ ] Can navigate to login page
- [ ] Can log in with existing user
- [ ] Success message displays on login
- [ ] Redirected to home after login
- [ ] Remember me saves email to localStorage
- [ ] Remember me loads email on page load
- [ ] Can navigate between login/signup
- [ ] AuthStoreTest shows logged-in state
- [ ] Logout button works
- [ ] No console errors

---

## 🔍 Understanding What You Built

### Component Comparison
```
SignupForm:
- 4 fields (name, email, password, confirm)
- Complex validation (password strength)
- Email verification flow

LoginForm:
- 2 fields (email, password)
- Simple validation
- Remember me feature
- Simpler and faster
```

### Remember Me Flow
```
User checks "Remember me"
  ↓
Email saved to localStorage
  ↓
User returns to login page
  ↓
Email loaded from localStorage
  ↓
Form pre-filled
```

### Login Flow
```
User submits form
  ↓
Form validates
  ↓
Component emits 'success'
  ↓
View calls authStore.login()
  ↓
Auth store calls Amplify
  ↓
Amplify calls Cognito
  ↓
User authenticated
  ↓
Redirect to home
```

### localStorage API
```javascript
// Save
localStorage.setItem('key', 'value')

// Load
const value = localStorage.getItem('key')

// Remove
localStorage.removeItem('key')

// Clear all
localStorage.clear()
```

---

## 🎓 Key Concepts

### 1. Checkbox with v-model
```vue
<el-checkbox v-model="formData.rememberMe">
```
- Works just like input fields
- Returns boolean (true/false)
- Can be used in conditions

### 2. localStorage
- Browser storage API
- Persists across sessions
- Stores strings only
- 5-10MB limit per domain
- Synchronous API

### 3. onMounted Lifecycle Hook
```javascript
onMounted(() => {
  // Runs after component is mounted
  // Good for loading data
})
```

### 4. Simpler Validation
- Login forms typically have simpler validation
- No password strength check (already validated on signup)
- Just check required and format

### 5. Component Reusability
- LoginForm can be used anywhere
- Emits events instead of direct store calls
- Props for loading/error states
- Exposed methods for parent control

### 6. Navigation Between Views
```vue
<router-link to="/signup">Sign up</router-link>
```
- Declarative navigation
- No page reload
- Browser history support

---

## 🐛 Troubleshooting

### Issue: Remember me not working
**Solution**: 
- Check browser console for localStorage errors
- Make sure localStorage is enabled (not in private mode)
- Check DevTools → Application → Local Storage

### Issue: Email not pre-filled
**Solution**: 
- Check that `onMounted` is called
- Verify localStorage has the email
- Check that `formData.email` is reactive

### Issue: Login fails with correct credentials
**Solution**: 
- Verify user was confirmed (check email verification)
- Check Cognito console for user status
- Try resetting password
- Check browser console for detailed error

### Issue: Redirect not working after login
**Solution**: 
- Check that `router.push('/')` is called
- Verify home route exists in router
- Check browser console for navigation errors

### Issue: Logout button not showing
**Solution**: 
- Check that `authStore.isLoggedIn` is true
- Verify user is actually logged in
- Check that AuthStoreTest component is updated

### Issue: "Forgot password?" link does nothing
**Solution**: 
- This is expected! We'll implement password reset later
- For now, it's just a placeholder link

---

## 📝 Notes

- Login form is simpler than signup (by design)
- Remember me uses localStorage (not secure for sensitive data)
- Password is never stored, only email
- Forgot password will be implemented in a later step
- Login redirects to home page (we'll add dashboard later)
- Auth state is managed by Pinia store
- Logout clears auth state and redirects to login

---

## 🎯 What's Next?

In the next step (1.2.4), we'll:
- Add route guards to protect authenticated routes
- Implement auto-redirect for logged-in users
- Check auth status on app load
- Handle session persistence
- Add loading states during auth check

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.2.3! 🎉

**You now have:**
- ✅ Reusable login form component
- ✅ Remember me functionality
- ✅ Form validation
- ✅ Login view with navigation
- ✅ Working login flow
- ✅ Logout functionality
- ✅ localStorage integration
- ✅ Complete authentication UI!

---

## 📸 Expected Final State

Your project structure should look like:
```
frontend/src/
├── components/
│   ├── auth/
│   │   ├── SignupForm.vue       # ← From Step 1.2.2
│   │   └── LoginForm.vue        # ← NEW! Login form
│   └── common/
│       └── AuthStoreTest.vue    # ← UPDATED! Added logout
├── views/
│   ├── auth/
│   │   ├── SignupView.vue       # ← From Step 1.2.2
│   │   └── LoginView.vue        # ← NEW! Login page
│   └── HomeView.vue
├── router/
│   └── index.js                 # ← UPDATED! Added login route
└── stores/
    └── authStore.js             # ← USED! For login/logout
```

---

**Ready for Step 1.2.4?** Let me know when you've completed this step and successfully logged in! 🚀
