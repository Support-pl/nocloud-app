<template>
  <div class="btn">
    <a-button
      block
      @click.stop="moduleEnter"
    >
      {{ $t('enter') | capitalize }}
    </a-button>
  </div>
</template>

<script>
export default {
  name: 'LilbtnIaas',
  props: ['service'],
  methods: {
    moduleEnter () {
      this.$router.push({ name: 'cloud', query: { type: 'IaaS' } })
    }
  }
}
</script>

<style scoped>
.btn{
  margin-right: 20px;
}

.btn button{
  height: 100%;
}
</style>
