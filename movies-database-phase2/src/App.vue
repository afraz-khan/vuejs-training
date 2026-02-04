<!--
  App Component - Phase 2
  
  Vue Concepts Demonstrated:
  - Pinia Store: Using store state and getters
  - Lifecycle Hooks: onMounted for initialization
  - Conditional Rendering: v-if for empty state
  - List Rendering: v-for for movies
  - Composables: Using custom composable for stats
-->
<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useMovieStore } from './stores/movieStore'
import { useMovieStats } from './composables/useMovieStats'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import MovieCard from './components/MovieCard.vue'
import MovieFilters from './components/MovieFilters.vue'

const store = useMovieStore()

// COMPOSABLE: Using custom composable for statistics
const { totalMovies, watchedCount, genreDistribution } = useMovieStats(store.filteredMovies)

// LIFECYCLE HOOK: onMounted
onMounted(() => {
  console.log('🎬 Movies Database App Mounted!')
  console.log(`Total movies loaded: ${store.movies.length}`)
  console.log('Genre distribution:', genreDistribution.value)
})

// LIFECYCLE HOOK: onBeforeUnmount
onBeforeUnmount(() => {
  console.log('👋 Movies Database App Unmounting...')
  console.log(`Final stats - Total: ${totalMovies.value}, Watched: ${watchedCount.value}`)
})
</script>

<template>
  <div class="app">
    <AppHeader>
      <h1>🎬 Mrbt Movies Database - Phase 2</h1>
      <p class="subtitle">Exploring Vue Concepts: Class/Style Bindings, Lists, Conditionals, Lifecycle, Composables & Pinia</p>
    </AppHeader>
    
    <main class="main-content">
      <!-- Filters Component -->
      <MovieFilters />

      <!-- CONDITIONAL RENDERING: Show message when no movies match filters -->
      <div v-if="store.filteredMovies.length === 0" class="empty-state">
        <h2>🎭 No movies found</h2>
        <p>Try adjusting your filters</p>
      </div>

      <!-- LIST RENDERING: Render filtered movies -->
      <div v-else class="movies-grid">
        <MovieCard
          v-for="movie in store.filteredMovies"
          :key="movie.id"
          :id="movie.id"
          :name="movie.title"
          :img_path="movie.poster"
          :rating="movie.rating"
          :totalRatings="movie.totalRatings"
          :individualRatings="movie.individualRatings || []"
          :watched="movie.watched"
          :genre="movie.genre"
          :year="movie.year"
        />
      </div>

      <!-- Results Summary -->
      <div class="results-summary">
        Showing {{ store.filteredMovies.length }} of {{ store.movies.length }} movies
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.subtitle {
  margin: 10px 0 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
  font-weight: normal;
}

.main-content {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  width: 100%;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  margin: 40px 0;
}

.empty-state h2 {
  margin: 0 0 10px 0;
  color: #666;
}

.empty-state p {
  margin: 0;
  color: #999;
}

.results-summary {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 0.95rem;
  background: white;
  border-radius: 8px;
}
</style>
