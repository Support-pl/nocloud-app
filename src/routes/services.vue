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
        v-if="products.length > 0"
        show-size-changer
        style="width: fit-content; margin: 0 0 20px auto"
        :page-size-options="pageSizeOptions"
        :page-size="productsStore.size"
        :total="productsStore.total"
        :current="productsStore.page"
        @showSizeChange="onShowSizeChange"
        @change="onShowSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import store from '@/store'
import router from '@/router'

import { useAuthStore } from '@/stores/auth.js'
import { useSpStore } from '@/stores/sp.js'
import { useProductsStore } from '@/stores/products.js'

import servicesWrapper from '@/components/services/services_wrapper.vue'
import userProducts from '@/components/userProducts/userProducts.vue'

const authStore = useAuthStore()
const providersStore = useSpStore()
const productsStore = useProductsStore()

const productsComponent = ref(null)
const pageSizeOptions = ['5', '10', '25', '50', '100']

const providers = computed(() =>
  providersStore.servicesProviders
)

const products = computed(() => {
  const instances = store.getters['nocloud/vms/getInstances'] ?? []

  if (router.currentRoute.query.service) {
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
  router.currentRoute.query?.service?.split(',').filter((el) => el.length > 0) ?? []
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

<style>
.services {
  padding-top: 15px;
}

.services__block {
  margin-bottom: 10px;
}

@media screen and (max-width: 768px) {
  .services{
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
