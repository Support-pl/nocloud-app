<template>
  <div class="services">
    <div class="container">
      <services-wrapper
        v-if="!authStore.billingUser.non_buyer"
        class="services__block"
        :products-count="productsCount"
      />
      <user-products ref="productsComponent" class="services__block" :min="false" />

      <a-pagination
        v-if="products.length > 0 && authStore.isLogged"
        show-size-changer
        style="width: fit-content; margin: 0 0 20px auto"
        :page-size-options="pageSizeOptions"
        :page-size="productsStore.size"
        :total="productsStore.total"
        :current="productsStore.page"
        @show-size-change="onShowSizeChange"
        @change="onShowSizeChange"
      />
    </div>

    <div v-if="['services', 'root'].includes(route.name)" class="logo__wrapper">
      <div v-if="config.appLogo.path">
        <img :src="config.appLogo.path" alt="logo" style="width: 100%">
      </div>
      <div v-if="companyName" class="logo__title">
        {{ companyName }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import config from '@/appconfig.js'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSpStore } from '@/stores/sp.js'
import { useProductsStore } from '@/stores/products.js'
import { useInstancesStore } from '@/stores/instances.js'

import servicesWrapper from '@/components/services/servicesWrapper.vue'
import userProducts from '@/components/services/products.vue'

const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

const providersStore = useSpStore()
const productsStore = useProductsStore()
const instancesStore = useInstancesStore()

const productsComponent = ref(null)
const pageSizeOptions = ['5', '10', '25', '50', '100']

const providers = computed(() =>
  providersStore.servicesProviders
)

const companyName = computed(() =>
  appStore.domainInfo.name ?? config.appTitle
)

const products = computed(() => {
  const instances = instancesStore.getInstances ?? []

  if (route.query.service) {
    return [...productsStore.products, ...instances].filter(({ sp }) => {
      const { title } = providers.value.find(({ uuid }) => uuid === sp) ?? {}

      return checkedTypes.value.some((service) => service === title)
    })
  }
  return [...productsStore.products, ...instances]
})

watch(products, (value) => {
  productsStore.total = value.length
})

const checkedTypes = computed(() =>
  route.query?.service?.split(',').filter((el) => el.length > 0) ?? []
)

function productsCount (type, filter) {
  return productsComponent.value.productsCount(type, filter)
}

function onShowSizeChange (page, limit) {
  if (page !== productsStore.page) {
    productsStore.page = page
  }
  if (limit !== productsStore.size) {
    productsStore.size = limit
  }

  localStorage.setItem('servicesPagination', JSON.stringify({ page, limit }))
}

onMounted(() => {
  const pagination = localStorage.getItem('servicesPagination')

  if (!pagination) return
  const { page, limit } = JSON.parse(pagination)

  onShowSizeChange(page, limit)
})

</script>

<script>
export default { name: 'PageServices' }
</script>

<style scoped>
.services {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 15px;
}

.services > .container {
  min-height: auto;
  width: 100%;
}

.services__block {
  margin-bottom: 10px;
}

.logo__wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 40vh;
  padding: 10px;
  background: var(--main);
}

.logo__title {
  color: var(--bright_font);
  font-size: 36px;
  font-weight: 700;
}

/* @media screen and (max-width: 768px) {
  .services{
    padding-left: 10px;
    padding-right: 10px;
  }
} */
</style>
