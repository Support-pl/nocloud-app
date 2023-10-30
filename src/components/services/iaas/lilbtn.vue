<template>
  <div class="btn">
    <a-button block size="small" @click.stop="moduleEnter">
      {{ capitalize($t('enter')) }}
    </a-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function moduleEnter () {
  router.push({ name: 'cloud', query: { type: 'IaaS' } })
}
</script>

<script>
export default { name: 'IaasButton' }</script>

<style scoped>
.btn {
  margin-right: 20px;
}

.btn button {
  height: 100%;
}
</style>
