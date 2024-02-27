<template>
  <div class="none">
    <div class="smile">
      :(
    </div>
    {{ $t(text) }}
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: 'It’s empty...' }
})
</script>

<script>
export default { name: 'EmptyPlaceholder' }
</script>

<style scoped>
.none {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  padding: 10px 25px;
  font-size: 32px;
  text-align: center;
}

.smile {
  width: 100px;
  height: 100px;
  font-size: 64px;
  transform: rotate(90deg);
}

</style>
