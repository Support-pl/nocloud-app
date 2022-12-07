<template>
	<div>
		<a-row>
			<a-col :span="6">
				{{$t( 'clientinfo.password' )}}: 
			</a-col>
			<a-col :span="18">
				<password :password="VM.state.meta.password"/>
			</a-col>
		</a-row>
	</div>
</template>

<script>
import password from '@/components/password.vue';

export default {
	name: "access-manager",
	components: { password },
  props: { VM: { type: Object, required: true } }
}
</script>
