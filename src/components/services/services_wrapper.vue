<template>
	<div class="services__wrapper" :style="{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }">
		<template v-for="service in avaliableServices">
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
  created() {
    this.$store.dispatch('nocloud/sp/fetch')
      .catch((err) => {
        const message = err.response?.data?.message ?? err.message ?? err;

        this.$notification['error']({ message: this.$t(message) });
      });
  },
	computed: {
		sp(){
			return this.$store.getters['nocloud/sp/getSP'];
		},
		isLogged(){
			return this.$store.getters['nocloud/auth/isLoggedIn'];
		},

		avaliableServices(){
      const services = [];

			this.sp.forEach(({ meta: { service } }) => {
        const item = this.services.find(({ type }) => type === service?.type);

        if (item) services.push({ ...item, ...service });
      });

      return services;
		},
    columnsCount(){
      return (this.avaliableServices.length < 5) ? this.avaliableServices.length : 5;
    }
	}
}
</script>

<style>
.services__wrapper{
	/* background-color: red; */
	display: grid;
	grid-gap: 5px;
	grid-template-columns: repeat(5, 1fr);
}
</style>
