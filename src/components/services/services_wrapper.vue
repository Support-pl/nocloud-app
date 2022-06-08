<template>
	<div class="services__wrapper">
		<template
			v-for="service in avaliableServices"
		>
			<service-item
				v-if="!service.needLogin || isLogged"
				:key="service.title"
				:service="service"
			/>
		</template>
	</div>
</template>

<script>
import serviceItem from './service_min.vue';
export default {
	name: "services-wrapper",
	components: {
		serviceItem,
	},
	data(){
		return {
			services: [
				{
					title: 'Servers',
					translatable: true,
					icon: 'database',
					onclick: {
						function: this.routeTo,
						paramsArr: [{name: 'cloud'}],
					}
				},
				// {
				// 	title: 'Cloud',
				// 	translatable: true,
				// 	icon: 'cloud-server',
				// 	onclick: {
				// 		function: this.routeTo,
				// 		paramsArr: [{name: 'cloud', query: {type: 'IaaS'}}],
				// 	}
				// },
				{
					title: 'SSL',
					icon: 'lock',
					onclick: {
						// function: this.openNotification,
						// paramsArr: [{name: 'services'}],
						function: this.routeTo,
						paramsArr: [{name: 'products', query: {type: 'SSL'}}],
					}
				},
				{
					title: 'Virtual',
					translatable: true,
					icon: 'solution',
					onclick: {
						function: this.routeTo,
						paramsArr: [{name: 'products', query: {type: 'virtual'}}],
					}
				},
			],
		}
	},
	methods: {
		routeTo(param){
			this.$router.push(param);
		},
		openNotification() {
      this.$notification['info']({
				key: 'coming soon',
        message: 'Coming soon',
        // description:
        //   'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
        onClick: () => {
          // console.log('Notification Clicked!');
        },
      });
    },
	},
	computed: {
		user(){
			return this.$store.getters.getUser;
		},
		isLogged(){
			return this.$store.getters.isLogged;
		},
		avaliableServices(){
			const settings = this.$store.getters['getDomainInfo'];
			const disabled = settings?.disabled ?? [];
			return this.services.filter(el => !disabled.includes(el.title)) 
		}
	}
}
</script>

<style>
.services__wrapper{
	/* background-color: red; */
	display: grid;
	grid-gap: 5px;
	grid-template-columns: repeat(3, 1fr);
}
</style>