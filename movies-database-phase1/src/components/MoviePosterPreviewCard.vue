<!--
  MoviePosterPreviewCard Component
  
  Vue Concepts:
  - Props: Receives name and img_path from parent
  - Custom Events: Emits toggleReview event when button is clicked
  - Template Syntax: Uses {{ }} for text interpolation and : for attribute binding
-->
<script setup>
defineProps(['name', 'img_path'])

const emit = defineEmits(['toggleReview'])
</script>

<template>
  <div class="movie-poster-preview-card">
    <img :src="img_path" :alt="name" class="movie-poster" />
    <h3 class="movie-title">{{ name }}</h3>
    <button @click="emit('toggleReview')" class="toggle-btn">Show Ratings</button>
  </div>
</template>

<style scoped>
.movie-poster-preview-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  cursor: pointer;
}

.movie-poster-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.movie-poster {
  width: 100%;
  height: auto;
  display: block;
}

.movie-title {
  padding: 12px 12px 8px;
  margin: 0;
  font-size: 16px;
  color: #333;
  text-align: center;
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
