<template>
  <div class="src-page">
    <generator />
  </div>
</template>

<script>
import loading from '@/widgets/loading/loading.vue'
import generator from '@/widgets/services/ssl/generator.vue'
export default {
  name: 'Certificate',
  components: {
    generator,
    loading
  }
}
</script>
