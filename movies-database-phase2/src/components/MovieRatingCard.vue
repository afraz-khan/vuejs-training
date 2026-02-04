<!--
  MovieRatingCard Component - Phase 2
  
  Vue Concepts:
  - reactive(): Vue's reactivity system with reactive objects
  - Style Bindings: Dynamic styles for rating display
  - Pinia Store: Using store actions to persist ratings
-->
<script setup>
import { reactive } from 'vue'
import { useMovieStore } from '../stores/movieStore'
import MovieOriginalRating from './MovieOriginalRating.vue'
import MovieCurrentRating from './MovieCurrentRating.vue'

const props = defineProps(['name', 'img_path', 'rating', 'totalRatings', 'individualRatings', 'id'])

const emit = defineEmits(['toggleReview', 'toggleWatched'])

const store = useMovieStore()

// Non-reactive plain object
const originalRating = { value: props.rating, totalRatings: props.totalRatings }

// Reactive object
const currentRating = reactive({ 
  value: Number(props.rating), 
  totalRatings: Number(props.totalRatings),
  individualRatings: [...(props.individualRatings || [])]
})

const updateRating = (newRating) => {
  if (isNaN(newRating) || newRating < 1 || newRating > 5) return
  
  currentRating.individualRatings.push(newRating)
  const sum = currentRating.individualRatings.reduce((acc, val) => acc + val, 0)
  currentRating.totalRatings = currentRating.individualRatings.length
  currentRating.value = parseFloat((sum / currentRating.totalRatings).toFixed(1))
  
  // Update store
  store.setUserRating(props.id, newRating)
  console.log('Rating updated:', currentRating)
}
</script>

<template>
  <div class="movie-rating-card">
    <div class="movie-info">
      <h3 class="movie-title">{{ name }}</h3>
      <div class="rating-info">
        <MovieOriginalRating :rating="originalRating.value" :totalRatings="originalRating.totalRatings" />
        <MovieCurrentRating :rating="currentRating.value" :totalRatings="currentRating.totalRatings" />
        <div class="rate-input">
          <label for="rating-input">Rate this movie:</label>
          <input 
            id="rating-input"
            type="number" 
            min="1" 
            max="5" 
            step="0.1"
            @change="updateRating(parseFloat($event.target.value))"
            placeholder="1-5"
          />
        </div>
      </div>
    </div>
    <div class="action-buttons">
      <button @click="emit('toggleReview')" class="toggle-btn">Hide Ratings</button>
      <button @click="emit('toggleWatched')" class="watch-btn">Toggle Watched</button>
    </div>
  </div>
</template>

<style scoped>
.movie-rating-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.movie-info {
  padding: 20px 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.movie-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  text-align: center;
}

.rating-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.rate-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.rate-input label {
  font-size: 13px;
  color: #333;
}

.rate-input input {
  width: 80px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.action-buttons {
  display: flex;
}

.toggle-btn,
.watch-btn {
  flex: 1;
  padding: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.toggle-btn {
  background: #1a1a2e;
  color: #fff;
}

.toggle-btn:hover {
  background: #16213e;
}

.watch-btn {
  background: #42b983;
  color: #fff;
}

.watch-btn:hover {
  background: #359268;
}
</style>
