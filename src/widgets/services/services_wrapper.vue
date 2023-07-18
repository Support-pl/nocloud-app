<template>
  <div
    class="services__wrapper"
    :style="{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }"
  >
    <template v-for="service in avaliableServices">
      <a-badge
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
          @mouseover.native="hovered = service.title"
          @mouseleave.native="hovered = null"
        />
      </a-badge>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import serviceItem from './service_min.vue'

import store from '@/app/store'
import router from '@/app/router'
import config from '@/shared/config/appconfig'

const hovered = ref(null)

const sp = computed(() =>
  store.getters['nocloud/sp/getSP']
)
const isLogged = computed(() =>
  store.getters['nocloud/auth/isLoggedIn']
)

const services = computed(() =>
  store.getters['products/getServices']
)

const avaliableServices = computed(() => {
  const servicesArray = (config.sharedEnabled)
    ? [{
        title: 'Virtual',
        translatable: true,
        icon: 'solution',
        type: 'virtual',
        onclick: {
          function: routeTo,
          paramsArr: [{ name: 'products', query: { service: 'Virtual' } }]
        }
      }]
    : []

  Object.keys(services.value).forEach((service) => {
    servicesArray.push({
      title: service,
      icon: 'shopping',
      type: service,
      onclick: {
        function: routeTo,
        paramsArr: [{ name: 'products', query: { service } }]
      }
    })
  })

  sp.value.forEach(({ meta: { showcase = {} } }) => {
    Object.entries(showcase).forEach(([key, value]) => {
      servicesArray.push({
        ...value,
        onclick: {
          function: routeTo,
          paramsArr: [{ name: 'products', query: { service: key } }]
        }
      })
    })
  })

  servicesArray.sort((a, b) => {
    if (a.icon === 'shopping' && b.icon !== 'shopping') return -1
    if (b.icon === 'shopping' && a.icon !== 'shopping') return 1
    if (a.icon === 'shopping' && b.icon === 'shopping') return 0
    return a.title > b.title
  })

  return servicesArray
})

const columnsCount = computed(() => {
  let count = 5
  if (document.documentElement.clientWidth < 575) count = 3

  return (avaliableServices.value.length < count) ? avaliableServices.value.length : count
})

function routeTo (param) {
  router.push(param)
}

function newProductHandler (service) {
  const provider = service.onclick.paramsArr[0].query.service
  const { type } = sp.value.find(({ meta }) => (meta.showcase ?? {})[provider]) ?? {}
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
    case 'virtual':
      name = 'service-custom'
      break
    case 'ione':
    case 'ovh':
      name = 'newPaaS'
  }

  if (!type && services.value[provider]) {
    name = 'service-iaas'
  }

  router.push({ name, query })
}
</script>

<script>
export default { name: 'ServicesWrapper' }
</script>

<style>
.services__wrapper {
  display: grid;
  grid-gap: 5px;
  grid-template-columns: repeat(5, 1fr);
}
</style>
