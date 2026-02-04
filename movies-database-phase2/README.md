# Movies Database - Phase 2

## 🎯 Overview

Phase 2 extends the Movies Database app with advanced Vue.js concepts:

- ✅ **Class & Style Bindings** - Dynamic styling based on movie properties
- ✅ **List Rendering** - Genre filters, sort options, movie grids
- ✅ **Conditional Rendering** - Show/hide filters, empty states, badges
- ✅ **Lifecycle Hooks** - Component mount/unmount tracking
- ✅ **Composables** - Reusable logic for filters and statistics
- ✅ **Pinia State Management** - Centralized app state

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 📖 Documentation

See [PHASE2-CONCEPTS.md](./PHASE2-CONCEPTS.md) for detailed explanations and code examples.

## 🎨 New Features

### Filters & Sorting
- Filter by genre (All, Action, Drama, Crime, etc.)
- Sort by rating, year, or title
- Show watched movies only
- Real-time statistics

### Visual Enhancements
- Color-coded genre badges
- Dynamic border colors based on ratings
- Watched/unwatched indicators
- High-rated movie highlights

### State Management
- Centralized movie data with Pinia
- Persistent filter selections
- Computed statistics
- Reactive updates across components

## 📁 Project Structure

```
src/
├── stores/
│   └── movieStore.js          # Pinia store (state, getters, actions)
├── composables/
│   ├── useMovieFilters.js     # Filter logic composable
│   └── useMovieStats.js       # Statistics composable
├── components/
│   ├── MovieFilters.vue       # Filter controls (list rendering)
│   ├── MovieCard.vue          # Movie card (lifecycle, bindings)
│   ├── MoviePosterPreviewCard.vue  # Poster view (class bindings)
│   └── MovieRatingCard.vue    # Rating view (reactive state)
└── App.vue                    # Main app (conditional rendering)
```

## 🎓 Learning Guide

### 1. Class & Style Bindings
**File:** `src/components/MovieCard.vue`

```vue
<!-- Dynamic classes -->
:class="{ 'watched': props.watched, 'high-rated': props.rating >= 4.5 }"

<!-- Dynamic styles -->
:style="{ borderColor: rating >= 4.5 ? 'gold' : 'green' }"
```

### 2. List Rendering
**File:** `src/components/MovieFilters.vue`

```vue
<button v-for="genre in store.genres" :key="genre">
  {{ genre }}
</button>
```

### 3. Conditional Rendering
**File:** `src/App.vue`

```vue
<div v-if="store.filteredMovies.length === 0">No movies</div>
<div v-else>{{ store.filteredMovies.length }} movies</div>
```

### 4. Lifecycle Hooks
**File:** `src/components/MovieCard.vue`

```javascript
onMounted(() => console.log('Component mounted'))
onUnmounted(() => console.log('Component unmounted'))
```

### 5. Composables
**File:** `src/composables/useMovieStats.js`

```javascript
export function useMovieStats(movies) {
  const totalMovies = computed(() => movies.value.length)
  return { totalMovies }
}
```

### 6. Pinia Store
**File:** `src/stores/movieStore.js`

```javascript
export const useMovieStore = defineStore('movies', () => {
  const movies = ref([])
  const filteredMovies = computed(() => /* filter logic */)
  function toggleWatched(id) { /* action */ }
  return { movies, filteredMovies, toggleWatched }
})
```

## 🔍 What to Explore

1. **Open browser console** - See lifecycle hook logs
2. **Click genre filters** - Watch Pinia state update
3. **Toggle watched status** - See class bindings change
4. **Filter to empty state** - See conditional rendering
5. **Check different ratings** - See dynamic border colors

## 💡 Try These Experiments

- [ ] Add a new genre filter
- [ ] Create a "favorites" feature
- [ ] Add a search bar using composables
- [ ] Implement dark mode with class bindings
- [ ] Add animation transitions
- [ ] Create a rating histogram

## 📚 Resources

- [Vue Class & Style Bindings](https://vuejs.org/guide/essentials/class-and-style.html)
- [Vue List Rendering](https://vuejs.org/guide/essentials/list.html)
- [Vue Conditional Rendering](https://vuejs.org/guide/essentials/conditional.html)
- [Vue Lifecycle Hooks](https://vuejs.org/guide/essentials/lifecycle.html)
- [Vue Composables](https://vuejs.org/guide/reusability/composables.html)
- [Pinia Documentation](https://pinia.vuejs.org/)

## 🎯 Concept Checklist

- ✅ Dynamic class binding with objects
- ✅ Dynamic style binding with computed properties
- ✅ v-for with proper :key usage
- ✅ v-if / v-else conditional rendering
- ✅ onMounted and onUnmounted hooks
- ✅ Custom composables for reusable logic
- ✅ Pinia store with state, getters, and actions
- ✅ Computed properties for derived state
- ✅ Reactive state updates across components

---

**Phase 1** → Basic components, props, events, slots  
**Phase 2** → Advanced reactivity, state management, composables ✨  
**Phase 3** → Coming soon (Router, API integration, etc.)
