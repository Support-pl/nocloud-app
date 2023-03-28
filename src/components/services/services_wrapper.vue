<template>
	<div class="services__wrapper" :style="{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }">
		<template v-for="service in avaliableServices">
			<a-badge
        count="+"
        :number-style="{
          fontSize: '20px',
          transform: (hovered === service.title) ? 'none' : 'scale(0) translate(-20px, -20px)',
          backgroundColor: '#fff',
          boxShadow: '0 0 0 1px var(--main)',
          color: 'var(--main)',
          cursor: 'pointer',
          transition: '0.3s'
        }"
        @click="newProductHandler(service)"
        @mouseover.native="hovered = service.title"
        @mouseleave.native="hovered = null"
      >
        <service-item
          v-if="!service.needLogin || isLogged"
          :key="service.title"
          :service="service"
          @mouseover.native="hovered = service.title"
          @mouseleave.native="hovered = null"
        />
      </a-badge>
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
      hovered: null,
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
    newProductHandler(service) {
      const provider = service.onclick.paramsArr[0].query.service;
      const { type } = this.sp.find(({ title }) => title === provider) ?? {};
      let name = 'service-virtual';
      let query = {};

      switch (type) {
        case 'opensrs':
          name = 'service-domains';
          break;
        case 'goget':
          name = 'service-ssl';
          break;
        case 'ione':
        case 'ovh':
          name = 'newPaaS';
          query = { service: provider }
      }

      this.$router.push({ name, query });
    },
	},
	computed: {
		sp(){
			return this.$store.getters['nocloud/sp/getSP'];
		},
		isLogged(){
			return this.$store.getters['nocloud/auth/isLoggedIn'];
		},

		avaliableServices(){
      const services = (this.$config.sharedEnabled) ? [{
        title: 'Virtual',
        translatable: true,
        icon: 'solution',
        type: 'virtual',
        onclick: {
          function: this.routeTo,
          paramsArr: [{name: 'products', query: { service: 'Virtual' }}],
        }
      }] : [];

			this.sp.forEach(({ meta: { service }, title }) => {
        if (service.title) services.push({
          ...service,
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: 'products', query: { service: title } }]
          }
        });
      });

      return services;
		},
    columnsCount(){
      let count = 5;
      if (document.documentElement.clientWidth < 575) count = 3;

      return (this.avaliableServices.length < count) ? this.avaliableServices.length : count;
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
