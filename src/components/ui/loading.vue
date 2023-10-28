<template>
  <div class="loading" :class="{'ha': ha}" :style="{'color': color}">
    <a-icon type="loading" />
  </div>
</template>

<script>
import config from '@/appconfig.js'

export default {
  name: 'Loading',
  props: {
    color: {
      type: String,
      default: () => config.colors.main
    },
    ha: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.loading {
	height: 100%;
	display: grid;
	place-items: center;
	font-size: 3rem;
}

.ha{
	height: auto;
}
</style>
