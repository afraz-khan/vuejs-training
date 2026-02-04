/**
 * Movie Filters Composable
 *
 * Concepts Demonstrated:
 * - Composable function for reusable logic
 * - Encapsulation of filtering logic
 * - Returns reactive state and methods
 */

import { ref, computed } from "vue";

export function useMovieFilters(movies) {
  const searchQuery = ref("");
  const minRating = ref(0);

  const filteredBySearch = computed(() => {
    if (!searchQuery.value) return movies.value;

    const query = searchQuery.value.toLowerCase();
    return movies.value.filter(
      (movie) =>
        movie.title.toLowerCase().includes(query) ||
        movie.director.toLowerCase().includes(query) ||
        movie.genre.toLowerCase().includes(query),
    );
  });

  const filteredByRating = computed(() => {
    return filteredBySearch.value.filter((movie) => movie.rating >= minRating.value);
  });

  function resetFilters() {
    searchQuery.value = "";
    minRating.value = 0;
  }

  return {
    searchQuery,
    minRating,
    filteredBySearch,
    filteredByRating,
    resetFilters,
  };
}
