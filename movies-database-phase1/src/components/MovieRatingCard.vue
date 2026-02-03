<!--
  MovieRatingCard Component
  
  Vue Concepts:
  - reactive(): Demonstrates Vue's reactivity system with reactive objects
  - Reactivity Comparison: Shows difference between reactive (currentRating) and non-reactive (originalRating) data
  - Props: Receives movie data including individualRatings array
  - Custom Events: Emits toggleReview event to parent
  - Event Handling: Handles input change to update ratings
  - Array Manipulation: Pushes new ratings to reactive array and recalculates average
-->
<script setup>
import { reactive } from 'vue'
import MovieOriginalRating from './MovieOriginalRating.vue'
import MovieCurrentRating from './MovieCurrentRating.vue'

const props = defineProps(['name', 'img_path', 'rating', 'totalRatings', 'individualRatings'])

const emit = defineEmits(['toggleReview'])

// Non-reactive plain object - won't trigger UI updates if changed
const originalRating = { value: props.rating, totalRatings: props.totalRatings }

// Reactive object - automatically updates UI when properties change
const currentRating = reactive({ 
  value: Number(props.rating), 
  totalRatings: Number(props.totalRatings),
  individualRatings: [...(props.individualRatings || [])]
})

const updateRating = (newRating) => {
  if (isNaN(newRating) || newRating < 1 || newRating > 5) return
  
  // Modifying reactive object triggers UI update
  currentRating.individualRatings.push(newRating)
  const sum = currentRating.individualRatings.reduce((acc, val) => acc + val, 0)
  currentRating.totalRatings = currentRating.individualRatings.length
  currentRating.value = parseFloat((sum / currentRating.totalRatings).toFixed(1))
	console.log(currentRating)
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
          <label>Rate this movie:</label>
          <input 
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
    <button @click="emit('toggleReview')" class="toggle-btn">Hide Ratings</button>
  </div>
</template>

<style scoped>
.movie-rating-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.movie-rating-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
  color: #f39c12;
}

.stars {
  font-size: 18px;
}

.rating-value {
  color: #333;
  font-size: 14px;
}

.total-ratings {
  font-size: 12px;
  color: #666;
}

.toggle-btn {
  width: 100%;
  padding: 10px;
  background: #1a1a2e;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #16213e;
}
</style>
