<!--
  MovieFilters Component
  
  Vue Concepts Demonstrated:
  - List Rendering: v-for for genre buttons
  - Class Bindings: Dynamic classes based on selected state
  - Conditional Rendering: v-if for showing/hiding filter panel
  - Event Handling: @click events
  - Pinia Store: Using store state and actions
-->
<script setup>
import { ref } from 'vue'
import { useMovieStore } from '../stores/movieStore'

const store = useMovieStore()
const showFilters = ref(true)

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}
</script>

<template>
  <div class="filters-container">
    <div class="filters-header">
      <h2>Filters</h2>
      <button @click="toggleFilters" class="toggle-btn">
        {{ showFilters ? '▼' : '▶' }}
      </button>
    </div>

    <!-- CONDITIONAL RENDERING: Show filters only when showFilters is true -->
    <div v-if="showFilters" class="filters-content">
      
      <!-- LIST RENDERING: Render genre buttons -->
      <div class="filter-section">
        <h3>Genre</h3>
        <div class="genre-buttons">
          <button
            v-for="genre in store.genres"
            :key="genre"
            @click="store.setGenreFilter(genre)"
            :class="['genre-btn', { active: store.selectedGenre === genre }]"
          >
            {{ genre }}
          </button>
        </div>
      </div>

      <!-- Sort Options -->
      <div class="filter-section">
        <h3>Sort By</h3>
        <div class="sort-buttons">
          <button
            @click="store.setSortBy('rating')"
            :class="{ active: store.sortBy === 'rating' }"
            class="sort-btn"
          >
            Rating
          </button>
          <button
            @click="store.setSortBy('year')"
            :class="{ active: store.sortBy === 'year' }"
            class="sort-btn"
          >
            Year
          </button>
          <button
            @click="store.setSortBy('title')"
            :class="{ active: store.sortBy === 'title' }"
            class="sort-btn"
          >
            Title
          </button>
        </div>
      </div>

      <!-- Watched Filter -->
      <div class="filter-section">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="store.showWatchedOnly"
            @change="store.toggleWatchedFilter"
          />
          Show Watched Only
        </label>
      </div>

      <!-- Statistics Display -->
      <div class="filter-section stats">
        <h3>Statistics</h3>
        <div class="stat-item">
          <span>Total Movies:</span>
          <strong>{{ store.statistics.total }}</strong>
        </div>
        <div class="stat-item">
          <span>Watched:</span>
          <strong>{{ store.statistics.watched }}</strong>
        </div>
        <div class="stat-item">
          <span>Unwatched:</span>
          <strong>{{ store.statistics.unwatched }}</strong>
        </div>
        <div class="stat-item">
          <span>Avg Rating:</span>
          <strong>{{ store.statistics.averageRating }} ⭐</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filters-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px 10px;
}

.filters-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-section h3 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #666;
}

.genre-buttons,
.sort-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* CLASS BINDING: Active state styling */
.genre-btn,
.sort-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.genre-btn:hover,
.sort-btn:hover {
  border-color: #42b983;
  transform: translateY(-2px);
}

.genre-btn.active,
.sort-btn.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.stats {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 0.95rem;
}

.stat-item span {
  color: #666;
}

.stat-item strong {
  color: #333;
}
</style>
