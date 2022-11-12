<script setup>
defineProps({
  dataOption: String,
  imgUrl: String,
});
</script>

<template>
  <div class="option" :dataOption="dataOption">
    <img :src="imgUrl" />
  </div>
</template>

<style scoped>
.option {
  background-size: cover;
  background-position: 50%;
  background-color: white;
  margin-bottom: 3px;
  padding: 10px;
  height: 55px;
  width: 55px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.option:hover {
  border-left: 5px solid white;
  width: 58px;
}

.option.--is-active {
  border-right: 3px solid red;
  width: 58px;
  cursor: default;
}

.option.--is-active:hover {
  border-left: none;
}

.option img {
  height: 100%;
  width: auto;
  pointer-events: none;
}
</style>
