<template>
  <a-spin
    v-if="isLoading"
    style="display: block; margin: 0 auto"
    :spinning="isLoading"
    :tip="$t('loading')"
  />

  <a-flex v-else vertical gap="small" class="addons">
    <a-card
      v-for="(group, name) in groups"
      :key="name"
      :title="capitalize(name)"
      style="width: 100%"
    >
      <a-card-grid
        v-for="addon of group"
        :key="addon.uuid"
        class="card-item"
        @click="changeAddons(addon)"
      >
        <div
          class="order__slider-name"
          style="grid-template-columns: 1fr auto auto; gap: 10px"
        >
          <span style="font-weight: 700; font-size: 16px">
            {{ addon.title }}
          </span>

          <span style="font-weight: 700">
            {{ getPeriod(product.period) }}
          </span>

          <a-checkbox :checked="options.addons.includes(addon.title)" />
          <span style="grid-column: 1 / 4" v-html="addon.description ?? ''" />
        </div>
      </a-card-grid>
    </a-card>
  </a-flex>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { useAddonsStore } from '@/stores/addons.js'
import { useCloudStore } from '@/stores/cloud.js'
import { useNotification, usePeriod } from '@/hooks/utils'

defineProps({
  mode: { type: String, required: true },
  plans: { type: Array, required: true },
  products: { type: Array, required: true },
  productSize: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false }
})

const addonsStore = useAddonsStore()
const cloudStore = useCloudStore()

const { getPeriod } = usePeriod()
const { openNotification } = useNotification()
const [product] = inject('useProduct')()
const [options, setOptions] = inject('useOptions')()
const [price, setPrice] = inject('usePriceOVH')()

const addons = computed(() =>
  addonsStore.addons.filter(({ uuid }) =>
    cloudStore.plan.addons.includes(uuid) || product.value.addons?.includes(uuid)
  )
)

const groups = computed(() =>
  Object.groupBy(addons.value, ({ group }) => group)
)

function changeAddons ({ title, periods }) {
  if (options.addons.includes(title)) {
    const value = { ...price.addons }

    delete value[title]
    setOptions('addons', options.addons.filter((addon) => addon !== title))
    setPrice('addons', value)
  } else {
    setOptions('addons', [...options.addons, title])
    setPrice('addons', {
      ...price.addons, [title]: periods[product.value.period]
    })
  }
}

const isLoading = ref(false)

async function fetch () {
  isLoading.value = true
  try {
    await addonsStore.fetch({ filters: {} })

    console.log(addonsStore.addons)
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

fetch()

const theme = inject('theme')
const backgroundStyle = computed(() =>
  (theme.value) ? 'var(--bright_font)' : 'var(--bright_bg)'
)
</script>

<script>
export default { name: 'IoneAddonsPanel' }
</script>

<style scoped>
.addons :deep(.ant-card-head) {
  padding: 0 16px;
  background: v-bind('backgroundStyle');
}

.addons :deep(.ant-card-body) {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.addons :deep(.ant-card-loading-content) {
  width: 100%;
}

.addons .card-item {
  width: 100%;
  padding: 12px 16px;
  cursor: pointer;
  border: 0 solid transparent;
  background: v-bind('backgroundStyle');
}

.addons .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.addons .order__slider-name :deep(.ant-checkbox) {
  box-shadow: 0 0 5px var(--main);
}

.addons .order__slider-name img {
  max-height: 65px;
}

.card-item .order__slider-name {
  justify-items: start;
}

.card-item--active {
  padding: 19px;
  border: 5px solid var(--main);
}
</style>
