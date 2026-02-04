# Phase 2 - Vue.js Concepts Implementation Guide

This phase demonstrates advanced Vue.js concepts applied to the Movies Database app.

## 🎯 Concepts Covered

### 1. Class and Style Bindings

#### Dynamic Classes (`MovieCard.vue`)
```vue
<!-- Object syntax for multiple conditional classes -->
<div :class="{ 
  'movie-card': true,
  'watched': props.watched,
  'unwatched': !props.watched,
  'high-rated': props.rating >= 4.5 
}">
```

**Key Points:**
- `:class` accepts objects where keys are class names and values are booleans
- Multiple classes can be conditionally applied
- Can combine static and dynamic classes

#### Dynamic Styles (`MovieCard.vue`)
```vue
<!-- Inline style binding with computed property -->
<div :style="cardBorderStyle">

const cardBorderStyle = computed(() => ({
  borderColor: props.rating >= 4.5 ? '#ffd700' : 
               props.rating >= 4.0 ? '#42b983' : '#ddd',
  borderWidth: '3px',
  borderStyle: 'solid'
}))
```

**Key Points:**
- `:style` accepts objects with CSS properties in camelCase
- Can use computed properties for complex logic
- Styles are reactive and update automatically

#### Genre Badge Colors (`MoviePosterPreviewCard.vue`)
```vue
<!-- Dynamic class based on genre -->
<div :class="['genre-badge', genreBadgeClass]">

const genreBadgeClass = computed(() => {
  const genreMap = {
    'Action': 'genre-action',
    'Drama': 'genre-drama',
    // ...
  }
  return genreMap[props.genre] || 'genre-default'
})
```

---

### 2. List Rendering (v-for)

#### Rendering Genre Buttons (`MovieFilters.vue`)
```vue
<button
  v-for="genre in store.genres"
  :key="genre"
  @click="store.setGenreFilter(genre)"
  :class="['genre-btn', { active: store.selectedGenre === genre }]"
>
  {{ genre }}
</button>
```

**Key Points:**
- `v-for` iterates over arrays or objects
- `:key` is required for Vue to track elements efficiently
- Can combine with other directives like `:class`

#### Rendering Movie Cards (`App.vue`)
```vue
<MovieCard
  v-for="movie in store.filteredMovies"
  :key="movie.id"
  :id="movie.id"
  :name="movie.title"
  <!-- ... other props -->
/>
```

**Best Practices:**
- Always use unique `:key` (preferably IDs)
- Use computed properties for filtered/sorted lists
- Keep list items as separate components for performance

---

### 3. Conditional Rendering (v-if, v-else)

#### Show/Hide Filters (`MovieFilters.vue`)
```vue
<div v-if="showFilters" class="filters-content">
  <!-- Filter controls -->
</div>
```

#### Empty State (`App.vue`)
```vue
<div v-if="store.filteredMovies.length === 0" class="empty-state">
  <h2>🎭 No movies found</h2>
  <p>Try adjusting your filters</p>
</div>

<div v-else class="movies-grid">
  <!-- Movie cards -->
</div>
```

#### Watched Badge (`MovieCard.vue`)
```vue
<div v-if="watched" class="watched-badge">
  ✓ Watched
</div>
```

**Key Points:**
- `v-if` completely removes/adds elements from DOM
- `v-else` must immediately follow `v-if`
- Use `v-show` for frequent toggles (keeps element in DOM)

---

### 4. Lifecycle Hooks

#### Component Lifecycle (`MovieCard.vue`)
```vue
import { onMounted, onUnmounted } from 'vue'

const mountTime = ref(null)

onMounted(() => {
  mountTime.value = new Date()
  console.log(`MovieCard "${props.name}" mounted`)
})

onUnmounted(() => {
  const unmountTime = new Date()
  const lifespan = unmountTime - mountTime.value
  console.log(`MovieCard unmounted after ${lifespan}ms`)
})
```

#### App Initialization (`App.vue`)
```vue
import { onMounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  console.log('🎬 Movies Database App Mounted!')
  console.log(`Total movies loaded: ${store.movies.length}`)
})

onBeforeUnmount(() => {
  console.log('👋 Movies Database App Unmounting...')
})
```

**Common Lifecycle Hooks:**
- `onMounted()` - After component is added to DOM
- `onBeforeUnmount()` - Before component is removed
- `onUnmounted()` - After component is removed
- `onUpdated()` - After reactive data changes

**Use Cases:**
- Fetch data on mount
- Set up event listeners
- Clean up resources on unmount
- Track component lifecycle for debugging

---

### 5. Composables

Composables are reusable functions that encapsulate reactive logic.

#### Movie Filters Composable (`useMovieFilters.js`)
```javascript
export function useMovieFilters(movies) {
  const searchQuery = ref('')
  const minRating = ref(0)

  const filteredBySearch = computed(() => {
    if (!searchQuery.value) return movies.value
    const query = searchQuery.value.toLowerCase()
    return movies.value.filter(movie => 
      movie.title.toLowerCase().includes(query)
    )
  })

  function resetFilters() {
    searchQuery.value = ''
    minRating.value = 0
  }

  return {
    searchQuery,
    minRating,
    filteredBySearch,
    resetFilters
  }
}
```

#### Movie Statistics Composable (`useMovieStats.js`)
```javascript
export function useMovieStats(movies) {
  const totalMovies = computed(() => movies.value.length)
  
  const watchedCount = computed(() => 
    movies.value.filter(m => m.watched).length
  )
  
  const averageRating = computed(() => {
    const sum = movies.value.reduce((acc, m) => acc + m.rating, 0)
    return (sum / movies.value.length).toFixed(1)
  })

  return {
    totalMovies,
    watchedCount,
    averageRating
  }
}
```

#### Using Composables (`App.vue`)
```vue
import { useMovieStats } from './composables/useMovieStats'

const { totalMovies, watchedCount } = useMovieStats(store.filteredMovies)
```

**Benefits:**
- Reusable logic across components
- Better code organization
- Easier testing
- Composition over inheritance

---

### 6. State Management with Pinia

Pinia is Vue's official state management library.

#### Store Setup (`stores/movieStore.js`)
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMovieStore = defineStore('movies', () => {
  // STATE - reactive data
  const movies = ref(moviesData.movies)
  const selectedGenre = ref('All')
  const showWatchedOnly = ref(false)

  // GETTERS - computed properties
  const filteredMovies = computed(() => {
    let result = movies.value
    
    if (selectedGenre.value !== 'All') {
      result = result.filter(m => m.genre === selectedGenre.value)
    }
    
    if (showWatchedOnly.value) {
      result = result.filter(m => m.watched)
    }
    
    return result
  })

  const statistics = computed(() => ({
    total: movies.value.length,
    watched: movies.value.filter(m => m.watched).length,
    averageRating: (movies.value.reduce((sum, m) => sum + m.rating, 0) / movies.value.length).toFixed(1)
  }))

  // ACTIONS - methods to modify state
  function toggleWatched(movieId) {
    const movie = movies.value.find(m => m.id === movieId)
    if (movie) {
      movie.watched = !movie.watched
    }
  }

  function setGenreFilter(genre) {
    selectedGenre.value = genre
  }

  return {
    // State
    movies,
    selectedGenre,
    showWatchedOnly,
    // Getters
    filteredMovies,
    statistics,
    // Actions
    toggleWatched,
    setGenreFilter
  }
})
```

#### Pinia Setup (`main.js`)
```javascript
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

#### Using Store in Components
```vue
<script setup>
import { useMovieStore } from '../stores/movieStore'

const store = useMovieStore()

// Access state
console.log(store.movies)

// Access getters
console.log(store.filteredMovies)

// Call actions
store.toggleWatched(movieId)
store.setGenreFilter('Action')
</script>

<template>
  <!-- Use store data in template -->
  <div>{{ store.statistics.total }} movies</div>
  <button @click="store.setGenreFilter('Drama')">Drama</button>
</template>
```

**Pinia Benefits:**
- Centralized state management
- Type-safe with TypeScript
- DevTools integration
- Simple API (no mutations needed)
- Modular stores

---

## 🚀 Running Phase 2

```bash
cd vuejs-training/movies-database-phase2
npm install
npm run dev
```

## 🎓 Learning Path

1. **Start with Class/Style Bindings** - Open `MovieCard.vue` and see dynamic styling
2. **Explore List Rendering** - Check `MovieFilters.vue` for genre buttons
3. **Test Conditional Rendering** - Filter movies to see empty state
4. **Watch Lifecycle Hooks** - Open browser console and interact with movies
5. **Understand Composables** - Review `useMovieStats.js` for reusable logic
6. **Master Pinia** - Explore `movieStore.js` and see centralized state

## 🔍 Key Files to Study

- `src/stores/movieStore.js` - Pinia store with state, getters, actions
- `src/composables/useMovieStats.js` - Reusable statistics logic
- `src/components/MovieFilters.vue` - List rendering & class bindings
- `src/components/MovieCard.vue` - Lifecycle hooks & style bindings
- `src/App.vue` - Conditional rendering & composables usage

## 💡 Experiment Ideas

1. Add a search filter using composables
2. Create a new sort option (by duration)
3. Add a "favorites" feature with Pinia
4. Implement a dark mode toggle with class bindings
5. Add transition effects for conditional rendering
6. Create a composable for local storage persistence

## 📚 Next Steps

- Explore Vue Router for multi-page navigation
- Learn about Watchers for reactive side effects
- Study Provide/Inject for dependency injection
- Dive into Teleport for portal-like behavior
- Master Suspense for async components
