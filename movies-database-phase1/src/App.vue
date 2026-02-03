<!--
  App Component
  
  Vue Concepts:
  - Component Composition: Imports and uses multiple child components
  - v-for Directive: Renders list of MovieCard components from movies array
  - Props Passing: Passes movie data down to child components
  - Slots: Provides content to AppHeader's slot
  - ref(): Uses ref() to create reactive movies array
-->
<script setup>
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import MovieCard from './components/MovieCard.vue'
import moviesData from './data/movies.json'

const movies = ref(moviesData.movies)
</script>

<template>
  <div class="app">
    <AppHeader>
      <h1>Mrbt Movies Database</h1>
    </AppHeader>
    
    <main class="main-content">
      <div class="movies-grid">
        <MovieCard
          v-for="movie in movies"
          :key="movie.id"
          :name="movie.title"
          :img_path="movie.poster"
          :rating="movie.rating"
          :totalRatings="movie.totalRatings"
          :individualRatings="movie.individualRatings || []"
        />
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
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  width: 100%;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}
</style>
