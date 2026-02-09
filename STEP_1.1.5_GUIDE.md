# Step 1.1.5: Create Vue 3 Frontend Project

## 🎯 Goal
Create a Vue 3 frontend application that will connect to your Amplify backend.

## 📚 What You'll Learn
- How to create a Vue 3 project with Vite
- Understanding Vue project structure
- What dependencies to install
- How to configure Vue Router and Pinia
- Project organization best practices

## 📋 Prerequisites
- [ ] Step 1.1.4 completed (Backend deployed to sandbox)
- [ ] Sandbox still running in a terminal
- [ ] You're in the `asset-management-app` directory
- [ ] `amplify_outputs.json` file exists

## 🚀 Step-by-Step Instructions

### 1. Verify Your Location
Make sure you're in the right directory:

```bash
pwd
```

Expected: `/Users/apple/.../vuejs-training/asset-management-app`

---

### 2. Check Current Project Structure
Let's see what we have:

```bash
ls -la
```

You should see:
```
asset-management-app/
├── amplify/              # Backend configuration
├── node_modules/         # Backend dependencies
├── amplify_outputs.json  # Backend resource info
├── package.json          # Backend package file
└── ...
```

---

### 3. Create Vue 3 Project
Now let's create the frontend. Run this command:

```bash
npm create vue@latest frontend
```

**Important**: We're creating the frontend in a `frontend` subfolder to keep backend and frontend separate.

---

### 4. Answer the Vue CLI Prompts
The CLI will ask several questions. Here's what to answer:

**Question 1**: "Add TypeScript?"
```
Answer: No (press Enter)
```
We'll keep it simple with JavaScript for now.

**Question 2**: "Add JSX Support?"
```
Answer: No (press Enter)
```
We'll use Vue templates, not JSX.

**Question 3**: "Add Vue Router for Single Page Application development?"
```
Answer: Yes (type 'y' and press Enter)
```
✅ We need routing for navigation!

**Question 4**: "Add Pinia for state management?"
```
Answer: Yes (type 'y' and press Enter)
```
✅ We need Pinia for managing app state!

**Question 5**: "Add Vitest for Unit Testing?"
```
Answer: No (press Enter)
```
We'll skip testing for now.

**Question 6**: "Add an End-to-End Testing Solution?"
```
Answer: No (press Enter)
```
We'll skip E2E testing for now.

**Question 7**: "Add ESLint for code quality?"
```
Answer: Yes (type 'y' and press Enter)
```
✅ ESLint helps catch errors!

**Question 8**: "Add Prettier for code formatting?"
```
Answer: Yes (type 'y' and press Enter)
```
✅ Prettier keeps code clean!

---

### 5. Wait for Project Creation
You'll see:
```
Scaffolding project in ./frontend...
Done. Now run:

  cd frontend
  npm install
  npm run dev
```

⏱️ This takes about 30 seconds.

---

### 6. Navigate to Frontend Directory
Move into the new frontend folder:

```bash
cd frontend
```

---

### 7. Explore the Project Structure
Let's see what Vue created:

```bash
ls -la
```

You should see:
```
frontend/
├── public/           # Static assets
├── src/              # Source code
│   ├── assets/       # Images, styles
│   ├── components/   # Vue components
│   ├── router/       # Vue Router config
│   ├── stores/       # Pinia stores
│   ├── views/        # Page components
│   ├── App.vue       # Root component
│   └── main.js       # Entry point
├── index.html        # HTML template
├── package.json      # Dependencies
├── vite.config.js    # Vite configuration
└── ...
```

---

### 8. Install Dependencies
Install all the packages:

```bash
npm install
```

⏱️ This takes 1-2 minutes.

---

### 9. Test the Vue App
Let's make sure it works:

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

### 10. Open in Browser
Open your browser and go to: http://localhost:5173/

You should see the Vue welcome page! 🎉

---

### 11. Stop the Dev Server
Press `Ctrl+C` in the terminal to stop the server.

We'll start it again after installing more dependencies.

---

### 12. Install Amplify Libraries
Now let's install AWS Amplify for connecting to our backend:

```bash
npm install aws-amplify
```

This installs:
- Amplify client libraries
- Authentication helpers
- Storage helpers
- API helpers

---

### 13. Install Element Plus (UI Library)
Install Element Plus for beautiful UI components:

```bash
npm install element-plus
```

Element Plus provides:
- Buttons, forms, dialogs
- Tables, cards, layouts
- Icons and more
- Professional-looking UI

---

### 14. Install Element Plus Icons
Install the icon library:

```bash
npm install @element-plus/icons-vue
```

---

### 15. Install Tailwind CSS
Install Tailwind for utility-first styling:

```bash
npm install -D tailwindcss@3 postcss autoprefixer
```

**Note**: We're using Tailwind v3 (stable version) which is well-tested and reliable.

---

### 16. Initialize Tailwind
Generate Tailwind configuration files:

```bash
npx tailwindcss init -p
```

This creates:
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration

**If you get an error "could not determine executable to run":**

Try this instead:
```bash
# Use the latest version explicitly
npx tailwindcss@latest init -p
```

**Or create the files manually:**

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `postcss.config.js`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

---

### 17. Install Axios
Install Axios for making HTTP requests to our REST API:

```bash
npm install axios
```

We'll use this to call our Lambda functions via API Gateway.

---

### 18. Verify All Dependencies Installed
Check your package.json:

```bash
cat package.json
```

You should see these dependencies:
```json
{
  "dependencies": {
    "vue": "^3.x.x",
    "vue-router": "^4.x.x",
    "pinia": "^2.x.x",
    "aws-amplify": "^6.x.x",
    "element-plus": "^2.x.x",
    "@element-plus/icons-vue": "^2.x.x",
    "axios": "^0.x.x"
  },
  "devDependencies": {
    "tailwindcss": "^3.x.x",
    "postcss": "^8.x.x",
    "autoprefixer": "^10.x.x",
    ...
  }
}
```

---

### 19. Check Project Structure
Let's see the complete structure now:

```bash
cd ..
pwd
ls -la
```

You should see:
```
asset-management-app/
├── amplify/              # Backend configuration
├── frontend/             # Vue 3 frontend (NEW!)
├── node_modules/         # Backend dependencies
├── amplify_outputs.json  # Backend config
├── package.json          # Backend packages
└── ...
```

---

## ✅ Verification Checklist

Before moving to the next step, verify:

- [ ] `frontend` folder created
- [ ] Vue 3 project initialized with Vite
- [ ] Vue Router installed (answered Yes)
- [ ] Pinia installed (answered Yes)
- [ ] ESLint installed (answered Yes)
- [ ] All dependencies installed successfully
- [ ] `aws-amplify` package installed
- [ ] `element-plus` package installed
- [ ] `tailwindcss` package installed
- [ ] `axios` package installed
- [ ] Dev server ran successfully (http://localhost:5173/)
- [ ] No error messages during installation

---

## 🔍 Understanding What You Built

### Project Structure Explained

**frontend/src/**
- `main.js` - Application entry point, initializes Vue
- `App.vue` - Root component, wraps entire app
- `router/index.js` - Route definitions (pages)
- `stores/` - Pinia stores for state management
- `views/` - Page-level components
- `components/` - Reusable components
- `assets/` - Images, styles, static files

**Configuration Files**
- `vite.config.js` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `package.json` - Dependencies and scripts
- `.eslintrc.cjs` - ESLint rules

### Dependencies Explained

**Vue 3 Core:**
- `vue` - The Vue framework itself
- `vue-router` - Client-side routing
- `pinia` - State management

**AWS Integration:**
- `aws-amplify` - Connect to Amplify backend
  - Authentication (Cognito)
  - Storage (S3)
  - API (AppSync GraphQL)

**UI Libraries:**
- `element-plus` - Pre-built UI components
- `@element-plus/icons-vue` - Icon library
- `tailwindcss` - Utility-first CSS framework

**HTTP Client:**
- `axios` - Make REST API calls to Lambda functions

**Development Tools:**
- `vite` - Fast build tool and dev server
- `eslint` - Code quality checker
- `prettier` - Code formatter

---

## 🎓 Key Concepts

### 1. Vite
- Modern build tool
- Extremely fast hot reload
- Optimized production builds
- Better than webpack for Vue 3

### 2. Vue Router
- Client-side routing
- Navigate between pages without reload
- Route guards for authentication
- Dynamic routes

### 3. Pinia
- Official state management for Vue 3
- Simpler than Vuex
- TypeScript support
- DevTools integration

### 4. Element Plus
- Enterprise-grade UI components
- Consistent design
- Accessibility built-in
- Customizable themes

### 5. Tailwind CSS
- Utility-first CSS
- No custom CSS needed
- Responsive by default
- Small production bundle

---

## 🐛 Troubleshooting

### Issue: "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org/

### Issue: "Port 5173 already in use"
**Solution**: 
- Kill the process using that port
- Or use a different port: `npm run dev -- --port 3000`

### Issue: "Cannot find module 'vue'"
**Solution**: 
```bash
cd frontend
npm install
```

### Issue: ESLint errors on first run
**Solution**: This is normal. We'll configure ESLint in the next step.

### Issue: "Permission denied"
**Solution**: Don't use `sudo`. Fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Issue: Installation hangs
**Solution**: 
- Check internet connection
- Clear npm cache: `npm cache clean --force`
- Try again

---

## 📝 Notes

- Frontend is in a subfolder to keep it separate from backend
- We're using JavaScript (not TypeScript) to keep it simple
- Vite is much faster than webpack
- Element Plus provides professional UI out of the box
- Tailwind CSS works alongside Element Plus
- All dependencies are the latest stable versions

---

## 🎯 What's Next?

In the next step (1.1.6), we'll:
- Configure Tailwind CSS
- Set up Amplify in the frontend
- Create the basic app structure
- Connect frontend to backend

---

## ✨ Success!

If all verification items are checked, you've successfully completed Step 1.1.5! 🎉

**You now have:**
- ✅ Vue 3 project created
- ✅ Vue Router configured
- ✅ Pinia installed
- ✅ All dependencies installed
- ✅ Dev server working
- ✅ Ready to build the UI!

---

## 📸 Expected Final State

Your directory structure should look like:
```
asset-management-app/
├── amplify/
│   ├── auth/
│   ├── storage/
│   ├── data/
│   └── backend.ts
├── frontend/                    # ← NEW! Vue 3 app
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── router/
│   │   ├── stores/
│   │   ├── views/
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js      # ← NEW!
│   └── postcss.config.js       # ← NEW!
├── node_modules/
├── amplify_outputs.json
└── package.json
```

---

## 🔗 Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Element Plus Documentation](https://element-plus.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

## 💡 Pro Tips

1. **Keep backend and frontend separate** - Easier to manage
2. **Use Vite dev server** - Super fast hot reload
3. **Learn Element Plus components** - Saves tons of time
4. **Use Tailwind utilities** - Faster than writing CSS
5. **Organize components well** - Makes scaling easier
6. **Use Vue DevTools** - Great for debugging
7. **Follow Vue style guide** - Consistent code

---

**Ready for Step 1.1.6?** Let me know when you've completed this step and all dependencies are installed! 🚀

We're making great progress - you now have both backend and frontend set up! 🎊
