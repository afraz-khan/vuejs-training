/**
 * Movie Statistics Composable
 *
 * Concepts Demonstrated:
 * - Composable for computed statistics
 * - Reusable business logic
 */

import { computed } from "vue";

export function useMovieStats(movies) {
  const totalMovies = computed(() => movies.value.length);

  const watchedCount = computed(() => movies.value.filter((m) => m.watched).length);

  const unwatchedCount = computed(() => movies.value.filter((m) => !m.watched).length);

  const averageRating = computed(() => {
    if (movies.value.length === 0) return 0;
    const sum = movies.value.reduce((acc, m) => acc + m.rating, 0);
    return (sum / movies.value.length).toFixed(1);
  });

  const genreDistribution = computed(() => {
    const distribution = {};
    movies.value.forEach((movie) => {
      distribution[movie.genre] = (distribution[movie.genre] || 0) + 1;
    });
    return distribution;
  });

  return {
    totalMovies,
    watchedCount,
    unwatchedCount,
    averageRating,
    genreDistribution,
  };
}
