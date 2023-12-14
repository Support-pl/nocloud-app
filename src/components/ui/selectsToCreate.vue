<template>
  <a-row
    v-if="providers.length > 1 || plans.length > 1 || namespaces.length > 1 || services.length > 1"
    style="margin-top: 10px"
    :gutter="[10, 10]"
  >
    <a-col v-if="providers.length > 1" span="24">
      <a-select
        placeholder="Providers"
        style="width: 100%"
        :value="provider"
        :options="providers"
        :field-names="fieldNames"
        @change="(value) => emits('update:provider', value)"
      />
    </a-col>

    <a-col v-if="plans.length > 1" span="24">
      <a-select
        placeholder="Price models"
        style="width: 100%"
        :value="plan"
        :options="plans"
        :field-names="fieldNames"
        @change="(value) => emits('update:plan', value)"
      />
    </a-col>

    <a-col v-if="services.length > 1" span="24">
      <a-select
        placeholder="Services"
        style="width: 100%"
        :value="service"
        :options="services"
        :field-names="fieldNames"
        @change="(value) => emits('update:service', value)"
      />
    </a-col>

    <a-col v-if="namespaces.length > 1" span="24">
      <a-select
        placeholder="Namespaces"
        style="width: 100%"
        :value="namespace"
        :options="namespaces"
        :field-names="fieldNames"
        @change="(value) => emits('update:namespace', value)"
      />
    </a-col>
  </a-row>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useInstancesStore } from '@/stores/instances.js'

const props = defineProps({
  spList: { type: Array, default: () => ([]) },
  plansList: { type: Array, default: () => ([]) },
  servicesList: { type: Array, default: () => ([]) },
  namespacesList: { type: Array, default: () => ([]) },

  provider: { type: String, default: null },
  plan: { type: String, default: null },
  service: { type: String, default: null },
  namespace: { type: String, default: null },

  isProvidersVisible: { type: Boolean, default: false },
  isPlansVisible: { type: Boolean, default: true }
})
const emits = defineEmits(
  ['update:provider', 'update:plan', 'update:service', 'update:namespace']
)

const spStore = useSpStore()
const plansStore = usePlansStore()
const namespacesStore = useNamespasesStore()
const instancesStore = useInstancesStore()

const fieldNames = {
  label: 'title', value: 'uuid', options: 'options'
}

const providers = computed(() => {
  if (!props.isProvidersVisible) {
    return []
  }
  if (props.spList.length > 0) {
    return props.spList
  }

  return spStore.servicesProviders
})

const plans = computed(() => {
  if (!props.isPlansVisible) {
    return []
  }
  if (props.plansList.length > 0) {
    return props.plansList
  }

  return plansStore.plans
})

const services = computed(() => {
  if (props.servicesList.length > 0) {
    return props.servicesList
  }

  return instancesStore.services.filter(
    ({ status }) => status !== 'DEL'
  )
})

const namespaces = computed(() => {
  if (props.namespacesList.length > 0) {
    return props.namespacesList
  }

  return namespacesStore.namespaces
})

onMounted(() => {
  if (!props.provider && providers.value.length === 1) {
    emits('update:provider', providers.value[0].uuid)
  }
  if (!props.plan && plans.value.length === 1) {
    emits('update:provider', plans.value[0].uuid)
  }
  if (!props.service && services.value.length === 1) {
    emits('update:provider', services.value[0].uuid)
  }
  if (!props.namespace && namespaces.value.length === 1) {
    emits('update:provider', namespaces.value[0].uuid)
  }
})

watch(providers, (value) => {
  if (value.length !== 1) return
  emits('update:provider', value[0].uuid)
})
watch(plans, (value) => {
  if (value.length !== 1) return
  emits('update:plan', value[0].uuid)
})
watch(services, (value) => {
  if (value.length !== 1) return
  emits('update:service', value[0].uuid)
})
watch(namespaces, (value) => {
  if (value.length !== 1) return
  emits('update:namespace', value[0].uuid)
})
</script>
