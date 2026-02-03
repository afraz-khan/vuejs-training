# Movies Database - Phase 1

A Vue.js application demonstrating fundamental Vue concepts through a movie rating system.

## Features

- Display movie cards with posters and titles
- Toggle between basic view and rating view for each movie
- Live rating system with reactive updates
- Comparison between original and current ratings

## Vue Concepts Demonstrated

### 1. Single-File Components (SFC)
All components use the SFC design pattern with `<script setup>`, `<template>`, and `<style scoped>` sections.

**Components:**
- `MovieCard.vue` - Parent component managing toggle state
- `MoviePosterPreviewCard.vue` - Basic movie display
- `MovieRatingCard.vue` - Rating display with live updates
- `MovieOriginalRating.vue` - Non-reactive rating display
- `MovieCurrentRating.vue` - Reactive rating display
- `AppHeader.vue` - Header with slot
- `AppFooter.vue` - Footer component

### 2. Props
Components receive data from parent components using props.

**Example:** `MovieCard` receives `name`, `img_path`, `rating`, `totalRatings`, and `individualRatings` from `App.vue`

### 3. Custom Events (Emits)
Child components emit events to communicate with parent components.

**Example:** `MoviePosterPreviewCard` and `MovieRatingCard` emit `toggleReview` event to `MovieCard`

### 4. Dynamic Components
Using `<component :is="...">` to switch between components based on state.

**Example:** `MovieCard` switches between `MoviePosterPreviewCard` and `MovieRatingCard` based on `showReview` boolean

### 5. Slots
Components can accept content from parent components using slots.

**Example:** `AppHeader` uses a slot to receive the title content from `App.vue`

### 6. Reactivity with reactive()
Using `reactive()` to create reactive objects that automatically update the UI when changed.

**Example:** `MovieRatingCard` uses `reactive()` for `currentRating` to demonstrate live rating updates, while `originalRating` remains a plain object (non-reactive)

### 7. v-for Directive
Rendering lists of items using `v-for`.

**Example:** `App.vue` renders multiple `MovieCard` components from the movies array

### 8. Event Handling
Using `@click` and `@change` to handle user interactions.

**Example:** Button clicks to toggle views and input changes to update ratings

## Project Structure

```
src/
├── components/
│   ├── AppHeader.vue              # Slot usage
│   ├── AppFooter.vue              # Basic component
│   ├── MovieCard.vue              # Dynamic components, state management
│   ├── MoviePosterPreviewCard.vue # Props, emits
│   ├── MovieRatingCard.vue        # reactive(), props, emits
│   ├── MovieOriginalRating.vue    # Non-reactive data display
│   └── MovieCurrentRating.vue     # Reactive data display
├── data/
│   └── movies.json                # Movie data with individual ratings
├── App.vue                        # Main app component
└── main.js                        # App entry point
```

## Running the Project

```bash
npm install
npm run dev
```

## Key Learning Points

1. **Reactivity Fundamentals**: Compare how `reactive()` objects update the UI automatically vs plain objects
2. **Component Communication**: Props down, events up pattern
3. **Component Composition**: Building complex UIs from smaller, reusable components
4. **Dynamic Behavior**: Switching components and updating data based on user interaction
