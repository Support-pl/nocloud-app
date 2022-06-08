<template>
	<div @click="() => hide = false" class="password__container" :class="{ 'dib': !block, 'cp': hide }">
		<span class="password__shower" :class="{ 'disabled': hide }">
			{{pass}}
		</span>
	</div>
</template>

<script>
export default {
	name: "password-shower",
	data: () => ({
		hide: true
	}),
	props: {
		password: String,
		block: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		pass(){
			if(!this.password){
				return 'xxx';
			}
			if(!this.hide){
				return this.password
			}
			let result = '';
			this.password.split('').forEach(() => {
				result += "X"
			});
			return result;
		}
	}
}
</script>

<style scoped>
.password__shower{
	display: inline-block;
	padding: 2px 5px;
	background: rgb(236, 236, 236);
	border-radius: 4px;
	font-family: 'Consolas';
}

.dib{
	display: inline-block;
}

.cp{
	cursor: pointer;
}

.disabled{
	color: gray;
	background: gray;
	pointer-events: none;
	user-select: none;
}
</style>