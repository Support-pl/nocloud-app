<template>
  <div class="loading" :class="{'ha': ha}" :style="{'color': color}">
		<a-icon type="loading" />
  </div>
</template>

<script>
export default {
	name: 'loading',
	props: {
		color: {
			type: String,
			default: function() {
				return this.$config.colors.main
			}
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