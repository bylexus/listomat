<template>
  <div class="blank-shell">
    <UiToasts />
    <slot />
  </div>
</template>

<style scoped>
.blank-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}
</style>
