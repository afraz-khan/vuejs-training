# Step 1.2.2: Create Signup Form Component

## 🎯 Goal
Create a reusable signup form component with validation using Element Plus and connect it to the auth store.

## 📚 What You'll Learn
- Vue 3 Composition API with `<script setup>`
- Two-way data binding with `v-model`
- Form handling with Element Plus
- Form validation rules
- Event handling and emits
- Reactive state with `ref` and `reactive`
- Component communication (emits)

## 📋 Prerequisites
- [ ] Step 1.2.1 completed (Auth store created)
- [ ] You're in the `frontend` directory
- [ ] Dev server can run without errors
- [ ] Auth store is working

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the frontend directory:

```bash
pwd
```

Expected: `/Users/apple/.../asset-management-app/frontend`

---

### 2. Create Auth Components Folder
The folder should already exist from Step 1.1.6, but let's verify:

```bash
ls -la src/components/auth
```

If it doesn't exist, create it:

```bash
mkdir -p src/components/auth
```

---

### 3. Create Signup Form Component
Create the signup form file:

```bash
touch src/components/auth/SignupForm.vue
```

---

### 4. Add Signup Form Code
Open `src/components/auth/SignupForm.vue` and add this code:

```vue
<template>
  <div class="signup-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      size="large"
      @submit.prevent="handleSubmit"
    >
      <!-- Name Field -->
      <el-form-item label="Name" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="Enter your name"
          :prefix-icon="User"
          clearable
        />
      </el-form-item>

      <!-- Email Field -->
      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="Enter your email"
          :prefix-icon="Message"
          clearable
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

      <!-- Confirm Password Field -->
      <el-form-item label="Confirm Password" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="Confirm your password"
          :prefix-icon="Lock"
          show-password
          clearable
        />
      </el-form-item>

      <!-- Submit Button -->
      <el-form-item>
        <el-button
          type="primary"
          native-type="submit"
          :loading="loading"
          class="w-full"
        >
          {{ loading ? 'Creating Account...' : 'Sign Up' }}
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
import { ref, reactive } from 'vue'
import { User, Message, Lock } from '@element-plus/icons-vue'
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
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// Custom validator for password confirmation
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Please confirm your password'))
  } else if (value !== formData.password) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
}

// Custom validator for password strength
const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Please enter a password'))
  } else if (value.length < 8) {
    callback(new Error('Password must be at least 8 characters'))
  } else if (!/[A-Z]/.test(value)) {
    callback(new Error('Password must contain at least one uppercase letter'))
  } else if (!/[a-z]/.test(value)) {
    callback(new Error('Password must contain at least one lowercase letter'))
  } else if (!/[0-9]/.test(value)) {
    callback(new Error('Password must contain at least one number'))
  } else {
    callback()
  }
}

// Validation rules
const rules = {
  name: [
    { required: true, message: 'Please enter your name', trigger: 'blur' },
    { min: 2, max: 50, message: 'Name must be between 2 and 50 characters', trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please enter a password', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// Handle form submission
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // Validate form
    await formRef.value.validate()

    // Emit success event with form data
    emit('success', {
      name: formData.name,
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
.signup-form {
  width: 100%;
}

.w-full {
  width: 100%;
}
</style>
```

**Save the file!**

---

### 5. Understanding the Component

Let's break down what we created:

**Template Section**:
- `<el-form>`: Element Plus form container
- `ref="formRef"`: Reference to access form methods
- `:model="formData"`: Binds form to data object
- `:rules="rules"`: Validation rules
- `@submit.prevent`: Prevents default form submission

**Form Fields**:
- `v-model`: Two-way data binding
- `:prefix-icon`: Icon on the left side
- `show-password`: Toggle password visibility
- `clearable`: Shows clear button

**Script Section**:
- `ref()`: Creates reactive reference
- `reactive()`: Creates reactive object
- `defineEmits()`: Declares events component can emit
- `defineProps()`: Declares props component accepts
- `defineExpose()`: Exposes methods to parent

**Validation**:
- Built-in rules (required, email, min, max)
- Custom validators (password strength, confirm password)
- Real-time validation on blur

---

### 6. Create Signup View
Now let's create a view to use this form.

Create the auth views folder:

```bash
mkdir -p src/views/auth
```

Create the signup view file:

```bash
touch src/views/auth/SignupView.vue
```

---

### 7. Add Signup View Code
Open `src/views/auth/SignupView.vue` and add:

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </router-link>
        </p>
      </div>

      <!-- Signup Form Card -->
      <div class="bg-white py-8 px-6 shadow rounded-lg">
        <SignupForm
          :loading="authStore.loading"
          :error="authStore.error"
          @success="handleSignup"
        />
      </div>

      <!-- Verification Dialog -->
      <el-dialog
        v-model="showVerificationDialog"
        title="Verify Your Email"
        width="400px"
        :close-on-click-modal="false"
      >
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            We've sent a verification code to <strong>{{ signupEmail }}</strong>
          </p>
          
          <el-input
            v-model="verificationCode"
            placeholder="Enter verification code"
            size="large"
            clearable
          />
        </div>

        <template #footer>
          <el-button @click="showVerificationDialog = false">
            Cancel
          </el-button>
          <el-button
            type="primary"
            :loading="authStore.loading"
            @click="handleVerification"
          >
            Verify
          </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SignupForm from '@/components/auth/SignupForm.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Verification dialog state
const showVerificationDialog = ref(false)
const verificationCode = ref('')
const signupEmail = ref('')

// Handle signup form submission
const handleSignup = async (formData) => {
  console.log('Signup form data:', formData)

  // Call auth store signup action
  const result = await authStore.signup({
    email: formData.email,
    password: formData.password,
    name: formData.name,
  })

  if (result.success) {
    // Check if email verification is required
    if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
      signupEmail.value = formData.email
      showVerificationDialog.value = true
      ElMessage.success('Account created! Please check your email for verification code.')
    } else if (result.isSignUpComplete) {
      ElMessage.success('Account created successfully!')
      router.push('/login')
    }
  } else {
    ElMessage.error(result.error || 'Signup failed')
  }
}

// Handle email verification
const handleVerification = async () => {
  if (!verificationCode.value) {
    ElMessage.warning('Please enter the verification code')
    return
  }

  const result = await authStore.confirmSignup({
    email: signupEmail.value,
    code: verificationCode.value,
  })

  if (result.success) {
    ElMessage.success('Email verified! You can now sign in.')
    showVerificationDialog.value = false
    router.push('/login')
  } else {
    ElMessage.error(result.error || 'Verification failed')
  }
}
</script>
```

**Save the file!**

---

### 8. Add Signup Route
Open `src/router/index.js` and add the signup route:

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import SignupView from '@/views/auth/SignupView.vue'

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
  ],
})

export default router
```

**Save the file!**

---

### 9. Add Navigation to Signup
Let's add a link to the signup page from the home view.

Open `src/views/HomeView.vue` and update it:

```vue
<template>
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Asset Management System</h1>
    
    <!-- Navigation Card -->
    <div class="mb-6 p-6 bg-white rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
      <div class="flex gap-4">
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

### 10. Test the Signup Form
Start the dev server (if not running):

```bash
npm run dev
```

Open http://localhost:5173/

---

### 11. Navigate to Signup Page
Click the "Sign Up" button on the home page.

You should see:
- ✅ Signup form with 4 fields (Name, Email, Password, Confirm Password)
- ✅ Icons on the left of each field
- ✅ "Sign Up" button at the bottom
- ✅ Link to "Sign in" at the top

---

### 12. Test Form Validation
Try submitting the form without filling any fields:

1. Click "Sign Up" button
2. You should see red error messages under each field

Try entering invalid data:
- **Name**: Enter "A" (too short) → Error: "Name must be between 2 and 50 characters"
- **Email**: Enter "test" (invalid email) → Error: "Please enter a valid email"
- **Password**: Enter "weak" → Error: "Password must be at least 8 characters"
- **Confirm Password**: Enter different password → Error: "Passwords do not match"

---

### 13. Test Password Validation
Try different passwords to see validation:

- `password` → Error: "Password must contain at least one uppercase letter"
- `Password` → Error: "Password must contain at least one number"
- `Password1` → ✅ Valid!

---

### 14. Test Successful Signup
Fill in the form with valid data:

- **Name**: `Test User`
- **Email**: `test@example.com` (use a real email you can access)
- **Password**: `TestPass123`
- **Confirm Password**: `TestPass123`

Click "Sign Up"

---

### 15. Verify Signup Flow
After clicking "Sign Up", you should see:

1. Button changes to "Creating Account..." with loading spinner
2. A success message appears
3. A verification dialog pops up asking for the code
4. Check your email for the verification code

---

### 16. Test Email Verification
1. Check your email for the verification code (6-digit number)
2. Enter the code in the dialog
3. Click "Verify"
4. You should see "Email verified! You can now sign in."
5. You'll be redirected to the login page (we'll create this next)

---

### 17. Check Browser Console
Open DevTools (F12) → Console tab

You should see:
- "Signup form data: { name, email, password }"
- "Signup result: { ... }"
- No errors

---

### 18. Test Form Reset
Try the following:
1. Fill in the form
2. Navigate away (click browser back)
3. Navigate back to signup
4. Form should be empty (reset)

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `src/components/auth/SignupForm.vue` created
- [ ] Form has all 4 fields (name, email, password, confirm password)
- [ ] Form validation works for all fields
- [ ] Password strength validation works
- [ ] Confirm password validation works
- [ ] `src/views/auth/SignupView.vue` created
- [ ] Signup route added to router
- [ ] Navigation buttons added to home page
- [ ] Can navigate to signup page
- [ ] Form submission works
- [ ] Loading state shows during signup
- [ ] Verification dialog appears after signup
- [ ] Can verify email with code
- [ ] Success/error messages display correctly
- [ ] No console errors

---

## 🔍 Understanding What You Built

### Component Architecture
```
SignupView (Parent)
  ↓
SignupForm (Child)
  ↓
Element Plus Components
```

### Data Flow
```
User fills form
  ↓
Form validates
  ↓
Component emits 'success' event
  ↓
Parent calls auth store
  ↓
Auth store calls Amplify
  ↓
Amplify calls Cognito
  ↓
User receives verification email
```

### Two-Way Data Binding (v-model)
```vue
<el-input v-model="formData.email" />
```
- User types → `formData.email` updates
- `formData.email` changes → Input updates

### Form Validation Flow
```
User blurs field
  ↓
Validation rule runs
  ↓
If invalid → Show error
  ↓
If valid → Clear error
```

### Component Communication
```
Child Component (SignupForm)
  emit('success', data)
    ↓
Parent Component (SignupView)
  @success="handleSignup"
    ↓
Auth Store
  signup(data)
```

---

## 🎓 Key Concepts

### 1. Composition API
- `ref()`: Single reactive value
- `reactive()`: Reactive object
- `computed()`: Computed property (not used here, but good to know)

### 2. v-model
- Two-way data binding
- Syncs input value with data
- Updates automatically

### 3. Form Validation
- Built-in rules (required, email, min, max)
- Custom validators (functions)
- Trigger on blur or change
- Async validation support

### 4. Element Plus Forms
- `<el-form>`: Form container
- `<el-form-item>`: Form field wrapper
- `<el-input>`: Input component
- `<el-button>`: Button component

### 5. Component Events
- `defineEmits()`: Declare events
- `emit('eventName', data)`: Emit event
- `@eventName="handler"`: Listen to event

### 6. Props
- `defineProps()`: Declare props
- Pass data from parent to child
- One-way data flow

### 7. Expose
- `defineExpose()`: Expose methods to parent
- Parent can call child methods
- Useful for form reset, validation, etc.

---

## 🐛 Troubleshooting

### Issue: Form validation not working
**Solution**: 
- Check that `:rules="rules"` is set on `<el-form>`
- Check that `prop="fieldName"` matches the rules object key
- Make sure `formRef` is properly set

### Issue: Icons not showing
**Solution**: 
```bash
npm install @element-plus/icons-vue
```

### Issue: "Cannot read property 'validate' of null"
**Solution**: 
- Make sure `ref="formRef"` is set on `<el-form>`
- Check that `formRef` is defined with `ref(null)`

### Issue: Verification dialog doesn't appear
**Solution**: 
- Check browser console for errors
- Verify Cognito is configured to require email verification
- Check that `nextStep.signUpStep === 'CONFIRM_SIGN_UP'`

### Issue: Email not received
**Solution**: 
- Check spam folder
- Verify email in Cognito console
- Use a real email address (not temporary)
- Check AWS SES sandbox limits

### Issue: Password validation too strict
**Solution**: 
- This matches Cognito's default password policy
- You can adjust the `validatePassword` function if needed
- Or update Cognito password policy in `amplify/auth/resource.ts`

---

## 📝 Notes

- Form validation happens on blur (when field loses focus)
- Password must meet Cognito requirements (8+ chars, uppercase, lowercase, number)
- Verification code is sent to email (check spam folder)
- Form emits events instead of directly calling store (better separation)
- Component is reusable and can be used in different views

---

## 🎯 What's Next?

In the next step (1.2.3), we'll:
- Create the Login Form component
- Similar structure to signup form
- Simpler validation (just email and password)
- Add "Remember me" checkbox
- Connect to auth store login action

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.2.2! 🎉

**You now have:**
- ✅ Reusable signup form component
- ✅ Form validation with Element Plus
- ✅ Password strength validation
- ✅ Email verification flow
- ✅ Component communication with emits
- ✅ Integration with auth store
- ✅ Beautiful UI with Tailwind CSS!

---

## 📸 Expected Final State

Your project structure should look like:
```
frontend/src/
├── components/
│   └── auth/
│       └── SignupForm.vue        # ← NEW! Reusable signup form
├── views/
│   ├── auth/
│   │   └── SignupView.vue        # ← NEW! Signup page
│   └── HomeView.vue              # ← UPDATED! Added navigation
├── router/
│   └── index.js                  # ← UPDATED! Added signup route
└── stores/
    └── authStore.js              # ← USED! For signup
```

---

**Ready for Step 1.2.3?** Let me know when you've completed this step and successfully signed up a test user! 🚀
