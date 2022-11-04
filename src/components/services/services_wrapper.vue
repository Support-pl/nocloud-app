<template>
	<div class="services__wrapper" :style="{
    gridTemplateColumns: `repeat(${avaliableServices.length}, 1fr)`
  }">
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
	components: { serviceItem },
	data(){
		return {
			services: [
				{
					title: 'Servers',
					translatable: true,
					icon: 'database',
          type: 'vm',
					onclick: {
						function: this.routeTo,
						paramsArr: [{name: 'cloud'}],
					}
				},
				{
					title: 'Cloud',
					translatable: true,
					icon: 'cloud-server',
          type: 'cloud',
					onclick: {
						function: this.routeTo,
						paramsArr: [{name: 'cloud', query: {type: 'iaas'}}],
					}
				},
				{
					title: 'SSL',
					icon: 'lock',
          type: 'ssl',
					onclick: {
						// function: this.openNotification,
						// paramsArr: [{name: 'services'}],
						function: this.routeTo,
						paramsArr: [{name: 'products', query: {type: 'ssl'}}],
					}
				},
				{
					title: 'Virtual',
					translatable: true,
					icon: 'solution',
          type: 'virtual',
					onclick: {
						function: this.routeTo,
						paramsArr: [{name: 'products', query: {type: 'virtual'}}],
					}
				},
        {
          title: 'Domains',
          translatable: true,
          icon: 'global',
          type: 'domains',
          onclick: {
            // function: this.openNotification,
            // paramsArr: [{name: 'services'}],
            function: this.routeTo,
            paramsArr: [{name: 'products', query: {type: 'domains'}}],
          },
        }
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
			const { avaliable = [] } = this.$store.getters['getDomainInfo'] || {};

			return this.services.filter((el) => avaliable.includes(el.type)); 
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