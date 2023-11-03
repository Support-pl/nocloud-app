<template>
  <div class="products">
    <div class="container">
      <user-products :min="false" />
    </div>
  </div>
</template>

<script setup>
import userProducts from '@/components/services/products.vue'
</script>

<script>
export default { name: 'ProductsView' }
</script>

<style>
.products{
  padding-top: 20px;
}
</style>
