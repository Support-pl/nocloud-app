<template>
  <div class="products">
    <div class="container">
      <user-products :min="false" />
    </div>
  </div>
</template>

<script>
import userProducts from '@/widgets/userProducts/userProducts.vue'
export default {
  name: 'PageProducts',
  components: {
    userProducts
  }
}
</script>

<style>
.products{
  padding-top: 20px;
}
</style>
