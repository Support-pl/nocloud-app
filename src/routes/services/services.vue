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
        @show-size-change="onShowSizeChange"
        @change="onShowSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/stores/auth.js'
import { useSpStore } from '@/stores/sp.js'
import { useProductsStore } from '@/stores/products.js'
import { useInstancesStore } from '@/stores/instances.js'

import servicesWrapper from '@/components/services/servicesWrapper.vue'
import userProducts from '@/components/services/products.vue'

const route = useRoute()

const authStore = useAuthStore()
const providersStore = useSpStore()
const productsStore = useProductsStore()
const instancesStore = useInstancesStore()

const productsComponent = ref(null)
const pageSizeOptions = ['5', '10', '25', '50', '100']

const providers = computed(() =>
  providersStore.servicesProviders
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
