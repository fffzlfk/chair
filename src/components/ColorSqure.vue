<script setup>
defineProps({
  style: Object,
});
</script>

<template>
  <div class="tray__swatch" :style="style" />
</template>

<style scoped>
.tray__swatch {
  transition: 0.1s ease-in;
  height: 50px;
  min-width: 50px;
  flex: 1;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
  background-size: cover;
  background-position: center;
}

.tray__swatch:nth-child(5n + 5) {
  margin-right: 20px;
}
</style>
