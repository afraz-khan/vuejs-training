<!--
  AppHeader Component
  
  Vue Concepts:
  - Slots: Uses <slot> to accept content from parent component
  - Component Reusability: Can display different content based on what parent provides
-->
<script setup>
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: #1a1a2e;
  color: #fff;
  padding: 20px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}
</style>
