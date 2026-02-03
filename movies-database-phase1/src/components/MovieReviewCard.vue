<script setup>
defineProps(['name', 'img_path', 'rating', 'totalRatings'])
const testAttributeNameAsArgument = 'src';

const emit = defineEmits(['toggleReview'])
</script>

<template>
  <div class="movie-review-card">
    <img :[testAttributeNameAsArgument]="img_path" :alt="name" class="movie-poster" />
    <div class="movie-info">
      <h3 class="movie-title">{{ name }}</h3>
      <div class="rating-info">
        <div class="rating">
          <span class="stars">⭐</span>
          <span class="rating-value">{{ rating }}/5</span>
        </div>
        <div class="total-ratings">{{ totalRatings }} ratings</div>
      </div>
    </div>
    <button @click="emit('toggleReview')" class="toggle-btn">Hide Ratings</button>
  </div>
</template>

<style scoped>
.movie-review-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  cursor: pointer;
}

.movie-review-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.movie-poster {
  width: 100%;
  height: auto;
  display: block;
}

.movie-info {
  padding: 12px 12px 8px;
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
  gap: 4px;
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
