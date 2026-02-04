/**
 * Movie Store - Pinia State Management
 *
 * Concepts Demonstrated:
 * - Pinia store with state, getters, and actions
 * - Centralized state management
 * - Computed properties via getters
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import moviesData from "../data/movies.json";

export const useMovieStore = defineStore("movies", () => {
  // STATE
  const movies = ref(moviesData.movies);
  const selectedGenre = ref("All");
  const showWatchedOnly = ref(false);
  const sortBy = ref("rating"); // 'rating', 'year', 'title'

  // GETTERS (computed properties)
  const filteredMovies = computed(() => {
    let result = movies.value;

    // Filter by genre
    if (selectedGenre.value !== "All") {
      result = result.filter((movie) => movie.genre === selectedGenre.value);
    }

    // Filter by watched status
    if (showWatchedOnly.value) {
      result = result.filter((movie) => movie.watched);
    }

    // Sort movies
    return result.sort((a, b) => {
      if (sortBy.value === "rating") return b.rating - a.rating;
      if (sortBy.value === "year") return b.year - a.year;
      if (sortBy.value === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  });

  const genres = computed(() => moviesData.genres);

  const statistics = computed(() => ({
    total: movies.value.length,
    watched: movies.value.filter((m) => m.watched).length,
    unwatched: movies.value.filter((m) => !m.watched).length,
    averageRating: (
      movies.value.reduce((sum, m) => sum + m.rating, 0) / movies.value.length
    ).toFixed(1),
  }));

  // ACTIONS
  function toggleWatched(movieId) {
    const movie = movies.value.find((m) => m.id === movieId);
    if (movie) {
      movie.watched = !movie.watched;
    }
  }

  function setUserRating(movieId, rating) {
    const movie = movies.value.find((m) => m.id === movieId);
    if (movie) {
      movie.userRating = rating;
    }
  }

  function setGenreFilter(genre) {
    selectedGenre.value = genre;
  }

  function toggleWatchedFilter() {
    showWatchedOnly.value = !showWatchedOnly.value;
  }

  function setSortBy(sort) {
    sortBy.value = sort;
  }

  return {
    // State
    movies,
    selectedGenre,
    showWatchedOnly,
    sortBy,
    // Getters
    filteredMovies,
    genres,
    statistics,
    // Actions
    toggleWatched,
    setUserRating,
    setGenreFilter,
    toggleWatchedFilter,
    setSortBy,
  };
});
