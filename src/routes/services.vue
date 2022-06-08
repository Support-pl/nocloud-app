<template>
	<div class="services">
		<div class="container">
			<component
				v-for="component in blockSequence"
				:key="component"
				:is="component"
				class="services__block"
			/>
		</div>
	</div>
</template>

<script>
import servicesWrapper from '../components/services/services_wrapper.vue';
import userProducts from '../components/userProducts/userProducts.vue';

export default {
	name: "page-services",
	components: {
		servicesWrapper,
		userProducts,
	},
	data(){
		return {
			blockSequence: [
				'services-wrapper',
				'user-products',
			]
		}
	}
}
</script>

<style>
.services{
	padding-top: 15px;
}

@media screen and (max-width: 768px) {
	.services{
		padding-left: 10px;
		padding-right: 10px;
	}
}

.services__block{
	margin-bottom: 10px;
}
</style>