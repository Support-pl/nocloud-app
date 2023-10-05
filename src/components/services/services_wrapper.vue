<template>
  <div class="services__wrapper" :style="{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }">
    <a-badge
      v-for="service in avaliableServices"
      :key="service.title"
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
        :products-count="productsCount"
        @mouseover.native="hovered = service.title"
        @mouseleave.native="hovered = null"
      />
    </a-badge>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import serviceItem from './service_min.vue'
import config from '@/appconfig.js'
import { useSpStore } from '@/stores/sp.js'
import { useProductsStore } from '@/stores/products.js'

export default {
  name: 'ServicesWrapper',
  components: { serviceItem },
  props: {
    productsCount: { type: Function, required: true }
  },
  data () {
    return {
      hovered: null,
      srvs: [
        {
          title: 'Servers',
          translatable: true,
          icon: 'database',
          type: 'vm',
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: 'cloud' }]
          }
        },
        {
          title: 'Cloud',
          translatable: true,
          icon: 'cloud-server',
          type: 'cloud',
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: 'cloud', query: { type: 'iaas' } }]
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
            paramsArr: [{ name: 'products', query: { type: 'ssl' } }]
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
            paramsArr: [{ name: 'products', query: { type: 'domains' } }]
          }
        }
      ]
    }
  },
  computed: {
    ...mapState(useProductsStore, ['services']),
    ...mapState(useSpStore, {
      sp: 'servicesProviders',
      showcases: 'getShowcases'
    }),
    isLogged () {
      return this.$store.getters['nocloud/auth/isLoggedIn']
    },
    baseURL () {
      return this.$store.getters['nocloud/auth/getURL']
    },

    avaliableServices () {
      const services = (config.sharedEnabled)
        ? [{
            title: 'Virtual',
            translatable: true,
            icon: 'solution',
            type: 'virtual',
            onclick: {
              function: this.routeTo,
              paramsArr: [{ name: 'products', query: { service: 'Virtual' } }]
            }
          }]
        : []

      Object.keys(this.services).forEach((service) => {
        services.push({
          title: service,
          icon: 'shopping',
          type: service,
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: 'products', query: { service } }]
          }
        })
      })

      this.showcases.forEach((showcase) => {
        showcase.icon = this.toKebabCase(showcase.icon)
        let theme = showcase.icon.split('-').at(-1)
        let icon = showcase.icon.replace(`-${theme}`, '')

        if (!['outlined', 'filled'].includes(theme)) {
          icon = showcase.icon
          theme = null
        } else if (theme === 'tone') {
          icon = icon.replace('-two')
          theme = 'two-tone'
        }

        services.push({
          ...showcase,
          icon,
          theme,
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: 'products', query: { service: showcase.uuid } }]
          }
        })
      })

      services.sort((a, b) => {
        if (a.icon === 'shopping' && b.icon !== 'shopping') return -1
        if (b.icon === 'shopping' && a.icon !== 'shopping') return 1
        if (a.icon === 'shopping' && b.icon === 'shopping') return 0
        return a.title > b.title
      })

      return services
    },
    columnsCount () {
      let count = 5
      if (document.documentElement.clientWidth < 575) count = 3

      return (this.avaliableServices.length < count) ? this.avaliableServices.length : count
    }
  },
  methods: {
    routeTo (param) {
      this.$router.push(param)
    },
    openNotification () {
      this.$notification.info({
        key: 'coming soon',
        message: 'Coming soon',
        // description:
        //   'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
        onClick: () => {
          // console.log('Notification Clicked!');
        }
      })
    },
    newProductHandler (service) {
      const provider = service.onclick.paramsArr[0].query.service
      const { type } = this.sp.find(({ uuid }) => {
        const showcase = this.showcases.find(({ uuid }) => uuid === provider)

        return showcase?.servicesProvider?.includes(uuid)
      }) ?? {}

      let name = 'service-virtual'
      const query = { service: provider }

      switch (type) {
        case 'opensrs':
          name = 'service-domains'
          break
        case 'goget':
          name = 'service-ssl'
          break
        case 'acronis':
          name = 'service-acronis'
          break
        case 'empty':
          name = 'service-custom'
          break
        case 'openai':
          name = 'service-openai'
          break
        case 'ione':
        case 'ovh':
          name = 'newPaaS'
      }

      if (!type && this.services[provider]) {
        name = 'service-iaas'
      }

      this.$router.push({ name, query })
    },
    toKebabCase (text) {
      return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    }
  }
}
</script>

<style>
.services__wrapper {
  /* background-color: red; */
  display: grid;
  grid-gap: 5px;
  grid-template-columns: repeat(5, 1fr);
}
</style>
