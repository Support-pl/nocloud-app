<template>
	<div>
		<a-row>
			<a-col :span="6">
				{{$t( 'clientinfo.password' )}}: 
			</a-col>
			<a-col :span="18">
				<password :password="SingleCloud.TEMPLATE.CONTEXT.PASSWORD"/>
			</a-col>
		</a-row>
	</div>
</template>

<script>
import { mapGetters } from 'vuex'
import password from '@/components/password.vue';
export default {
	name: "access-manager",
	components: {
		password
	},
	computed: {
		...mapGetters('cloud', {
			SingleCloud: 'getOpenedCloud',
		}),
	}
}
</script>

<style>

</style>