<template>
	<div class="user-services">
		<div class="container">
			<div class="products_wrapper">
				<div class="products__header">
					<div class="products__title">
						{{componentName}}
					</div>
					<div class="products__control">
						<a-button shape="round" icon="plus">{{ $t('singleInvoice') }}</a-button>
					</div>

				</div>
				<div class="products__wrapper" :class="{ 'products__wrapper--loading': getProductsLoading }">
					<template v-if="!getProductsLoading">
						<component v-for="prod in serviceProducts" :key="prod.id" :is="componentName" :data="prod"></component>
					</template>
					<loading v-else/>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import loading from '../loading/loading.vue'

export default {
	name: 'user-services',
	components: {
		loading,
		SSL: () => import('./ssl/index')
	},
	computed: {
		componentName(){
			return this.$route.meta.componentName;
		},
		serviceProducts(){
			const prods = this.$store.getters['products/getProducts'];
			return prods.filter( element => element.groupname == this.$route.meta.productsGroupName);
		},
    getProductsLoading(){
		  return this.$store.getters['products/getProductsLoading'];
    }
	},
	mounted(){
		this.$store.dispatch('products/autoFetch');
	}
}
</script>

<style scoped>
.user-services{
	padding-top: 20px;
}

.products_wrapper{
	background: #fff;
	border-radius: 10px;
	padding: 10px 10px 15px 10px;
}

.products__header{
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 5px;
	margin-bottom: 15px;
}

.products__wrapper--loading{
	display: flex;
	justify-content: center;
	align-items: center;
}

.products__title{
	font-size: 18px
}
</style>