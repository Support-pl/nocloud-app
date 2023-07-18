<template>
  <div class="module">
    <a-row :gutter="[10, 10]">
      <a-col
        :md="24"
        :xs="24"
        :sm="24"
      >
        <a-button
          size="large"
          type="primary"
          @click="moduleEnter"
        >
          {{ $t('enter') | capitalize }}
        </a-button>
      </a-col>
    </a-row>
  </div>
</template>

<script>
export default {
  name: 'IaasDraw',
  methods: {
    moduleEnter () {
      this.$router.push({ name: 'cloud', query: { type: 'IaaS' } })
    }
  }
}
</script>

<style>

</style>
