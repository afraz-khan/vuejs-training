<!--
  MovieCard Component - Phase 2
  
  Vue Concepts Demonstrated:
  - Style Bindings: Dynamic inline styles based on rating
  - Class Bindings: Conditional classes for watched status
  - Lifecycle Hooks: onMounted, onUnmounted
  - Pinia Store: Using store actions
-->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMovieStore } from '../stores/movieStore'
import MoviePosterPreviewCard from './MoviePosterPreviewCard.vue'
import MovieRatingCard from './MovieRatingCard.vue'

const props = defineProps([
  'id',
  'name',
  'img_path',
  'rating',
  'totalRatings',
  'individualRatings',
  'watched',
  'genre',
  'year'
])

const store = useMovieStore()
const showReview = ref(false)
const mountTime = ref(null)

// LIFECYCLE HOOK: onMounted
onMounted(() => {
  mountTime.value = new Date()
  console.log(`MovieCard "${props.name}" mounted at ${mountTime.value.toLocaleTimeString()}`)
})

// LIFECYCLE HOOK: onUnmounted
onUnmounted(() => {
  const unmountTime = new Date()
  const lifespan = unmountTime - mountTime.value
  console.log(`MovieCard "${props.name}" unmounted after ${lifespan}ms`)
})

const toggleReview = () => {
  showReview.value = !showReview.value
}

const toggleWatched = () => {
  store.toggleWatched(props.id)
}

// STYLE BINDING: Dynamic border color based on rating
const cardBorderStyle = computed(() => ({
  borderColor: props.rating >= 4.5 ? '#ffd700' : 
               props.rating >= 4.0 ? '#42b983' : 
               '#ddd',
  borderWidth: '3px',
  borderStyle: 'solid'
}))

// CLASS BINDING: Dynamic classes
const cardClasses = computed(() => ({
  'movie-card': true,
  'watched': props.watched,
  'unwatched': !props.watched,
  'high-rated': props.rating >= 4.5
}))
</script>

<template>
  <div :class="cardClasses" :style="cardBorderStyle">
    <!-- CONDITIONAL RENDERING: Show watched badge -->
    <div v-if="watched" class="watched-badge">
      ✓ Watched
    </div>

    <component
      :is="showReview ? MovieRatingCard : MoviePosterPreviewCard"
      :name="name"
      :img_path="img_path"
      :rating="rating"
      :totalRatings="totalRatings"
      :individualRatings="individualRatings"
      :watched="watched"
      :genre="genre"
      :year="year"
      @toggle-review="toggleReview"
      @toggle-watched="toggleWatched"
    />
  </div>
</template>

<style scoped>
/* CLASS BINDING: Different styles for watched/unwatched */
.movie-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.movie-card.watched {
  opacity: 0.9;
}

.movie-card.unwatched {
  opacity: 1;
}

.movie-card.high-rated {
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.watched-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #42b983;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>
