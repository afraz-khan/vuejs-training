# Phase 2 - Feature Plan

## Vue Concepts to Implement

### 1. Class and Style Bindings
**Feature: Movie Card States**
- Add visual states to movie cards (watched/unwatched, favorite, selected)
- Dynamic styling based on rating (high rating = gold border, low = gray)
- Hover effects with dynamic classes
- Genre-based color coding

**Implementation:**
```vue
<!-- Example -->
<div 
  :class="{ 
    'watched': movie.watched, 
    'favorite': movie.isFavorite,
    'high-rating': movie.rating >= 4.5 
  }"
  :style="{ borderColor: getGenreColor(movie.genre) }"
>
```

### 2. List Rendering (v-for)
**Feature: Genre Filter & Search**
- Filter movies by genre using v-for on genres array
- Display filtered movie list
- Show "No movies found" when filter returns empty
- Add search functionality to filter by title

**Implementation:**
```vue
<button 
  v-for="genre in genres" 
  :key="genre"
  @click="filterByGenre(genre)"
>
  {{ genre }}
</button>

<MovieCard 
  v-for="movie in filteredMovies" 
  :key="movie.id"
  ...
/>
```

### 3. Conditional Rendering (v-if, v-else, v-show)
**Feature: View Modes & Empty States**
- Toggle between grid view and list view (v-if/v-else)
- Show loading spinner while "fetching" data (v-if)
- Display "No movies found" message (v-if with empty array)
- Show/hide filter panel (v-show for performance)
- Conditional display of "Mark as Watched" button

**Implementation:**
```vue
<div v-if="loading">Loading...</div>
<div v-else-if="filteredMovies.length === 0">No movies found</div>
<div v-else>
  <div v-if="viewMode === 'grid'" class="grid">...</div>
  <div v-else class="list">...</div>
</div>

<div v-show="showFilters" class="filter-panel">...</div>
```

### 4. Lifecycle Hooks
**Feature: Data Loading & Analytics**
- `onMounted`: Simulate API call to load movies, log component mount
- `onUpdated`: Track when movie list changes
- `onBeforeUnmount`: Cleanup (save user preferences to localStorage)
- `watch`: Watch for filter changes and log analytics

**Implementation:**
```vue
<script setup>
import { onMounted, onUpdated, onBeforeUnmount } from 'vue'

onMounted(() => {
  console.log('App mounted - loading movies')
  loadMoviesFromAPI()
  loadUserPreferences()
})

onUpdated(() => {
  console.log('Movies list updated')
})

onBeforeUnmount(() => {
  console.log('Saving preferences before unmount')
  saveUserPreferences()
})
</script>
```

### 5. Composables
**Feature: Reusable Logic**
- `useMovieFilter`: Filter and search logic
- `useLocalStorage`: Save/load user preferences
- `useFavorites`: Manage favorite movies
- `useMovieStats`: Calculate statistics (avg rating, total watched, etc.)

**Implementation:**
```javascript
// composables/useMovieFilter.js
export function useMovieFilter(movies) {
  const selectedGenre = ref('All')
  const searchQuery = ref('')
  
  const filteredMovies = computed(() => {
    return movies.value.filter(movie => {
      const matchesGenre = selectedGenre.value === 'All' || movie.genre === selectedGenre.value
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      return matchesGenre && matchesSearch
    })
  })
  
  return { selectedGenre, searchQuery, filteredMovies }
}
```

### 6. State Management with Pinia
**Feature: Global Movie Store**
- Centralized movie state management
- Actions: addMovie, updateMovie, toggleWatched, toggleFavorite
- Getters: watchedMovies, favoriteMovies, moviesByGenre, averageRating
- Persist state to localStorage

**Implementation:**
```javascript
// stores/movieStore.js
import { defineStore } from 'pinia'

export const useMovieStore = defineStore('movies', {
  state: () => ({
    movies: [],
    favorites: [],
    selectedGenre: 'All',
    viewMode: 'grid'
  }),
  
  getters: {
    watchedMovies: (state) => state.movies.filter(m => m.watched),
    favoriteMovies: (state) => state.movies.filter(m => state.favorites.includes(m.id)),
    filteredMovies: (state) => {
      if (state.selectedGenre === 'All') return state.movies
      return state.movies.filter(m => m.genre === state.selectedGenre)
    }
  },
  
  actions: {
    toggleWatched(movieId) {
      const movie = this.movies.find(m => m.id === movieId)
      if (movie) movie.watched = !movie.watched
    },
    toggleFavorite(movieId) {
      const index = this.favorites.indexOf(movieId)
      if (index > -1) {
        this.favorites.splice(index, 1)
      } else {
        this.favorites.push(movieId)
      }
    }
  }
})
```

## Suggested Implementation Order

1. **Start Simple**: Add class bindings for watched/unwatched states
2. **Add Filtering**: Implement genre filter with v-for
3. **Conditional UI**: Add empty states and view mode toggle
4. **Lifecycle**: Add loading simulation and logging
5. **Extract Logic**: Create composables for filter logic
6. **Pinia Store**: Move state to Pinia for global management

## Component Structure for Phase 2

```
src/
├── components/
│   ├── MovieCard.vue              (add class bindings)
│   ├── MovieList.vue              (new - handles v-for)
│   ├── GenreFilter.vue            (new - genre buttons)
│   ├── SearchBar.vue              (new - search input)
│   ├── ViewModeToggle.vue         (new - grid/list toggle)
│   ├── LoadingSpinner.vue         (new - v-if loading)
│   └── EmptyState.vue             (new - v-if no results)
├── composables/
│   ├── useMovieFilter.js          (filter logic)
│   ├── useLocalStorage.js         (persistence)
│   └── useMovieStats.js           (statistics)
├── stores/
│   └── movieStore.js              (Pinia store)
└── App.vue                        (lifecycle hooks, orchestration)
```

## Key Learning Outcomes

- **Class/Style Bindings**: Dynamic styling based on state
- **v-for**: Rendering lists efficiently with keys
- **v-if/v-show**: Conditional rendering and performance
- **Lifecycle**: Understanding component lifecycle
- **Composables**: Reusable composition functions
- **Pinia**: Centralized state management pattern
