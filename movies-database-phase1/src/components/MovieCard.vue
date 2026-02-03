<!--
  MovieCard Component
  
  Vue Concepts:
  - Dynamic Components: Uses <component :is="..."> to switch between MoviePosterPreviewCard and MovieRatingCard
  - State Management: Manages local state with ref() for showReview boolean
  - Props: Receives movie data from parent (App.vue)
  - Event Handling: Listens to toggleReview event from child components
-->
<script setup>
import { ref } from 'vue'
import MoviePosterPreviewCard from './MoviePosterPreviewCard.vue'
import MovieRatingCard from './MovieRatingCard.vue'

defineProps(['name', 'img_path', 'rating', 'totalRatings', 'individualRatings'])

const showReview = ref(false)

const toggleReview = () => {
  showReview.value = !showReview.value
}
</script>

<template>
  <component
    :is="showReview ? MovieRatingCard : MoviePosterPreviewCard"
    :name="name"
    :img_path="img_path"
    :rating="rating"
    :totalRatings="totalRatings"
    :individualRatings="individualRatings"
    @toggle-review="toggleReview"
  />
</template>
