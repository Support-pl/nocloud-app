<template>
  <a-spin
    v-if="isFlavorsLoading"
    style="display: block; margin: 0 auto"
    :tip="$t('loading')"
  />
  <template v-else-if="!$route.query.product">
    <a-row
      v-if="!$route.query.product"
      style="margin-bottom: 15px"
      align="middle"
    >
      <a-col v-if="resources.plans.length < 6 && resources.plans.length > 1" span="24">
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.plans }"
          :tip-formatter="null"
          :max="resources.plans.length - 1"
          :min="0"
          :value="resources.plans.indexOf(plan)"
          @change="(i) => plan = resources.plans[i]"
        />
      </a-col>

      <a-col v-else span="24">
        <div class="order__grid">
          <div
            v-for="provider of resources.plans"
            :key="provider"
            class="order__slider-item"
            :class="{ 'order__slider-item--active': plan === provider }"
            @click="plan = provider"
          >
            {{ provider }}
          </div>
        </div>
      </a-col>
    </a-row>

    <left-icon
      v-else-if="$route.query.product"
      style="margin-bottom: 10px; font-size: 20px"
      @click="$router.go(-1)"
    />

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px">CPU:</span>
      </a-col>
      <a-col class="changing__field" style="text-align: right">
        <loading-icon v-if="options.cpu.size === 'loading'" />
        <template v-else>
          {{ options.cpu.size }} {{ (isNaN(+options.cpu.size)) ? '' : 'vCPU' }}
        </template>
      </a-col>
    </a-row>

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px">RAM:</span>
      </a-col>
      <a-col v-if="resources.ram.length > 1" :sm="{ span: 18, order: 0 }" :xs="{ span: 24, order: 1 }">
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.ram }"
          :tip-formatter="null"
          :max="resources.ram.length - 1"
          :min="0"
          :value="resources.ram.indexOf(options.ram.size)"
          @change="(i) => setOptions('ram.size', resources.ram[i])"
          @after-change="setResources(planKey)"
        />
      </a-col>
      <transition name="textchange" mode="out-in">
        <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
          {{ options.ram.size }} Gb
        </a-col>
      </transition>
    </a-row>

    <a-row justify="space-between" align="middle" class="newCloud__prop">
      <a-col>
        <span style="display: inline-block; width: 70px">{{ $t("Drive") }}:</span>
      </a-col>
      <a-col v-if="resources.disk.length > 1" :sm="{ span: 18, order: 0 }" :xs="{ span: 24, order: 1 }">
        <a-slider
          style="margin-top: 10px"
          :marks="{ ...resources.disk }"
          :tip-formatter="null"
          :max="resources.disk.length - 1"
          :min="0"
          :value="resources.disk.indexOf(parseInt(diskSize))"
          @change="(i) => setOptions('disk.size', resources.disk[i] * 1024)"
          @after-change="setResources(planKey)"
        />
      </a-col>
      <a-col class="changing__field" :sm="3" :xs="18" style="text-align: right">
        {{ diskSize }}
      </a-col>
    </a-row>
  </template>
</template>

<script setup>
import { ref, inject, defineAsyncComponent, computed } from 'vue'

const loadingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoadingOutlined')
)
const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)

const props = defineProps({
  plans: { type: Array, required: true },
  planKey: { type: String, required: true },
  tarification: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false }
})
const emits = defineEmits(['setData'])

const [options, setOptions] = inject('useOptions', () => [])()
const [, setPrice] = inject('usePriceOVH', () => [])()
const plan = ref('')

const resources = computed(() => {
  const groups = new Set(props.plans.map(({ group }) => group))

  const ram = new Set()
  const disk = new Set()

  const filteredPlans = props.plans.filter(({ group }) => group === plan.value)

  filteredPlans.forEach(({ resources }) => {
    ram.add(resources.ram / 1024)
    disk.add(resources.disk / 1024)
  })

  return {
    plans: Array.from(groups),
    ram: Array.from(ram).sort((a, b) => a - b),
    disk: Array.from(disk).sort((a, b) => a - b)
  }
})

const mode = computed(() => {
  switch (props.tarification) {
    case 'Annually':
      return 'upfront12'
    case 'Biennially':
      return 'upfront24'
    case 'Hourly':
      return 'hourly'
    default:
      return 'default'
  }
})

const diskSize = computed(() => {
  const size = (options.disk.size / 1024).toFixed(1)

  return (size >= 1) ? `${size} Gb` : `${options.disk.size} Mb`
})

function setResources (planKey, changeTarifs = true) {
  const { periods, value, resources } = props.plans.find((el) => el.value === planKey) ?? {}
  if (!value) return

  const tarifs = []
  let plan = periods[0]

  setOptions('cpu.size', +resources.cpu)
  setOptions('ram.size', resources.ram / 1024)
  setOptions('disk.size', +resources.disk)
  setOptions('disk.type', 'SSD')

  periods.forEach((period) => {
    if (period.pricingMode === mode.value) plan = period
    switch (period.pricingMode) {
      case 'upfront12':
        tarifs.push({ value: 'Annually', label: 'annually' })
        break
      case 'upfront24':
        tarifs.push({ value: 'Biennially', label: 'biennially' })
        break
      case 'default':
        tarifs.push({ value: 'Monthly', label: 'ssl_product.Monthly' })
    }
  })

  if (changeTarifs) emits('setData', { key: 'periods', value: tarifs })
  setPrice('value', plan.price.value)
  setPrice('addons', {})

  setOptions('config.planCode', value)
  setOptions('config.duration', plan.duration)
  setOptions('config.pricingMode', plan.pricingMode)
}
</script>

<script>
export default { name: 'OvhVpsPlanPanel' }
</script>

<style scoped>
.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
  font-size: 1.1rem;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active {
  background-color: var(--main);
  color: var(--bright_font);
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
