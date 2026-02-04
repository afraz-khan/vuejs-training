<!--
  MoviePosterPreviewCard Component - Phase 2
  
  Vue Concepts Demonstrated:
  - Class Bindings: Dynamic genre badge colors
  - Event Emitting: Custom events for parent communication
-->
<script setup>
import { computed } from 'vue'

const props = defineProps([
  'name',
  'img_path',
  'rating',
  'watched',
  'genre',
  'year'
])

const emit = defineEmits(['toggleReview', 'toggleWatched'])

// CLASS BINDING: Genre-specific colors
const genreBadgeClass = computed(() => {
  const genreMap = {
    'Action': 'genre-action',
    'Drama': 'genre-drama',
    'Crime': 'genre-crime',
    'Sci-Fi': 'genre-scifi',
    'Thriller': 'genre-thriller',
    'Animation': 'genre-animation',
    'Mystery': 'genre-mystery'
  }
  return genreMap[props.genre] || 'genre-default'
})
</script>

<template>
  <div class="poster-card">
    <div class="poster-image-container">
      <img :src="img_path" :alt="name" class="poster-image" />
      
      <!-- Genre Badge with dynamic class -->
      <div :class="['genre-badge', genreBadgeClass]">
        {{ genre }}
      </div>
    </div>

    <div class="poster-info">
      <h3 class="movie-title">{{ name }}</h3>
      <div class="movie-meta">
        <span class="year">{{ year }}</span>
        <span class="rating">⭐ {{ rating }}</span>
      </div>

      <div class="action-buttons">
        <button @click="emit('toggleReview')" class="btn-primary">
          View Details
        </button>
        <button 
          @click="emit('toggleWatched')" 
          :class="['btn-secondary', { watched: watched }]"
        >
          {{ watched ? '✓ Watched' : '+ Watch' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poster-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.poster-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2/3;
  overflow: hidden;
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* CLASS BINDING: Genre-specific badge colors */
.genre-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
}

.genre-action { background: #e74c3c; }
.genre-drama { background: #3498db; }
.genre-crime { background: #34495e; }
.genre-scifi { background: #9b59b6; }
.genre-thriller { background: #e67e22; }
.genre-animation { background: #f39c12; }
.genre-mystery { background: #16a085; }
.genre-default { background: #95a5a6; }

.poster-info {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.movie-title {
  margin: 0 0 10px 0;
  font-size: 1rem;
  line-height: 1.3;
  min-height: 2.6em;
}

.movie-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #666;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover {
  background: #359268;
}

.btn-secondary {
  background: white;
  color: #333;
  border: 2px solid #ddd;
}

.btn-secondary:hover {
  border-color: #42b983;
  color: #42b983;
}

.btn-secondary.watched {
  background: #42b983;
  color: white;
  border-color: #42b983;
}
</style>
