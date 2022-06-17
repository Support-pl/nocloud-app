<template>
	<div class="create-vm__wrapper">
		<a-row :gutter="[15,15]">
			<!-- 'IaaS' -->
			<a-col :md="12" :xs="24" v-for="type in ['PaaS']" :key="type">
				<a-button
					class="create-vm__btn"
					size="large"
					shape="round"
					icon="plus"
					type="primary"
					@click="createVM(type)"
					block
				>
					{{$t(type+'.createButton') | capitalize}}
				</a-button>
				<div class="create-vm__description cloud__info info">
					<p class="info__content">
						{{$t(type+'.description')}}
					</p>
				</div>
			</a-col>
		</a-row>
	</div>
</template>

<script>
export default {
	name: "create-vm",
	methods: {
		createVM(type){
			let newRouteName;
			type = type || this.$route.query.type;
			console.log(type)
			if(type == 'IaaS'){
				newRouteName = 'newVDC'
			}
			if(type == 'PaaS'){
				newRouteName = 'newPaaS'
			}
			this.$store.dispatch("app/setTabByName", newRouteName);
		},
	},
}
</script>

<style>

.create-vm__wrapper{
	background: #fff;
	border-radius: 10px;
	padding: 10px 10px 15px 10px;
	margin-bottom: 10px;
}

.create-vm__description{
	margin-left: 14px;
	margin-top: 5px;
	padding-right: 12px;
}

.create-vm__description p{
	margin-bottom: 7px;
}

.create-vm__header{
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 5px;
	margin-bottom: 15px;
}

.cloud__info{
	max-width: 800px;
	margin-top: 20px;
	padding: 10px 0 10px 10px;
	border-left: 5px solid var(--main);
}

.info__content{
	font-size: 1rem;
}

</style>