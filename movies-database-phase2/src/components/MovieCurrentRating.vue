<!--
  MovieCurrentRating Component
  
  Vue Concepts:
  - Props: Receives reactive rating data
  - Demonstrates that this component automatically updates when parent's reactive data changes
  - No local state needed - reactivity flows from parent
-->
<script setup>
defineProps(['rating', 'totalRatings'])
</script>

<template>
  <div class="rating-section">
    <div class="label">Current Rating: <span class="badge reactive">Reactive</span></div>
    <div class="rating">
      <span class="stars">⭐</span>
      <span class="rating-value">{{ rating }}/5</span>
    </div>
    <div class="total-ratings">{{ totalRatings }} ratings</div>
  </div>
</template>

<style scoped>
.rating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.label {
  font-size: 12px;
  font-weight: bold;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: normal;
}

.badge.reactive {
  background: #27ae60;
  color: #fff;
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
</style>
