<template>
	<div class="products">
		<div class="container">
			<user-products :min="false"/>
		</div>
	</div>
</template>

<script>
import userProducts from '../components/userProducts/userProducts.vue';
export default {
	name: 'page-products',
	components: {
		userProducts,
	}
}
</script>

<style>
.products{
	padding-top: 20px;
}
</style>