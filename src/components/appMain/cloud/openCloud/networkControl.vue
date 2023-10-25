<template>
  <div class="network-control">
    <a-table
      :columns="columns"
      :data-source="networks"
      :pagination="false"
      row-key="id"
    >
      <template #ip="{ value }">
        <span>{{ value ?? '--' }}</span>
      </template>
    </a-table>

    <a-row style="margin: 15px 0" :gutter="[10, 10]">
      <a-col style="display: flex; align-items: center" :sm="12" :xs="24">
        <span>{{ $t('Public network') }}:</span>
        <a-switch
          v-model="networking.public.status"
          style="margin: 0 5px"
          @change="changeNetwork('public')"
        />
        <a-input-number
          v-model="networking.public.count"
          :min="publicMin"
          :max="10"
          :disabled="!networking.public.status"
        />
      </a-col>

      <a-col style="display: flex; align-items: center" :sm="12" :xs="24">
        <span>{{ $t('Private network') }}:</span>
        <a-switch
          v-model="networking.private.status"
          style="margin: 0 5px"
          @change="changeNetwork('private')"
        />
        <a-input-number
          v-model="networking.private.count"
          :min="privateMin"
          :max="10"
          :disabled="!networking.private.status"
        />
      </a-col>
    </a-row>

    <div style="display: flex; justify-content: right; gap: 10px">
      <a-button @click="$emit('closeModal')">
        {{ $t('Cancel') }}
      </a-button>
      <a-button type="primary" :loading="isLoading" @click="sendNewIP">
        {{ $t('Send') }}
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { notification } from 'ant-design-vue'
import i18n from '@/i18n.js'
import { useInstancesStore } from '@/stores/instances.js'

const props = defineProps({
  itemService: { type: Object, required: true },
  instance: { type: Object, required: true }
})
const emits = defineEmits(['closeModal'])

const instancesStore = useInstancesStore()

const isLoading = ref(false)
const columns = [
  {
    title: '№',
    dataIndex: 'id',
    key: 'id',
    width: 50,
    align: 'center'
  },
  {
    title: 'IP',
    dataIndex: 'ip',
    key: 'ip',
    scopedSlots: { customRender: 'ip' }
  },
  {
    title: i18n.t('cloud_Type'),
    dataIndex: 'type',
    key: 'type'
  }
]

const networking = reactive({
  private: ref({
    list: ref([]),
    status: false,
    count: 0
  }),
  public: ref({
    list: ref([]),
    status: false,
    count: 0
  })
})

const networks = computed(() => {
  const networks = []
  const { length } = networking.private.list

  networking.private.list.forEach((ip, i) => {
    networks.push({ id: i + 1, ip, type: 'private' })
  })

  networking.public.list.forEach((ip, i) => {
    networks.push({ id: length + i + 1, ip, type: 'public' })
  })

  return networks
})

const privateMin = computed(() =>
  (networking.private.status) ? 1 : 0
)

const publicMin = computed(() =>
  (networking.public.status) ? 1 : 0
)

function changeNetwork (type) {
  switch (type) {
    case 'public':
      if (!networking.public.status) {
        networking.private.status = true
        networking.public.count = 0
      }
      break
    case 'private':
      if (!networking.private.status) {
        networking.public.status = true
        networking.private.count = 0
      }
      break
  }
}

async function updateService (service) {
  try {
    const result = await instancesStore.updateService(service)
    if (result) {
      notification.success({
        message: i18n.t('Change ip successfully')
      })

      emits('closeModal')
    } else {
      notification.error({
        message: i18n.t('Can\'t change ip VM')
      })
    }
  } catch (error) {
    notification.error({
      message: i18n.t('Can\'t change ip VM')
    })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function sendNewIP () {
  try {
    isLoading.value = true
    const { pool } = await instancesStore.fetch(true)
    let group = props.itemService.instancesGroups.find(
      ({ sp }) => sp === props.instance.sp
    )
    let instance = group.instances.find(({ uuid }) =>
      uuid === props.instance.uuid
    )

    if (!instance?.resources) {
      const service = pool.find(({ uuid }) => uuid === props.itemService.uuid)

      group = service.instancesGroups.find(({ sp }) => sp === props.instance.sp)
      instance = group.instances.find(({ uuid }) => uuid === props.instance.uuid)
    }

    instance.resources.ips_private = networking.private.count
    instance.resources.ips_public = networking.public.count
    instance.state.meta.networking = {
      private: networking.private.list,
      public: networking.public.list
    }

    const ips = group.instances.reduce((prev, curr) => ({
      private: prev.private + curr.resources.ips_private,
      public: prev.public + curr.resources.ips_public
    }), { private: 0, public: 0 })

    group.resources.ips_private = ips.private
    group.resources.ips_public = ips.public

    updateService((instance?.resources) ? props.itemService : pool)
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  }
}

onMounted(() => {
  const privateIPS = props.instance.state?.meta.networking.private ?? []
  const publicIPS = props.instance.state?.meta.networking.public ?? []
  const privateCount = props.instance.resources.ips_private
  const publicCount = props.instance.resources.ips_public

  networking.private.list = JSON.parse(JSON.stringify(privateIPS))
  networking.public.list = JSON.parse(JSON.stringify(publicIPS))
  networking.private.status = privateCount > 0
  networking.public.status = publicCount > 0
  networking.private.count = privateCount
  networking.public.count = publicCount
})

onBeforeUnmount(() => {
  emits('closeModal')
})
</script>

<script>
export default { name: 'NetworkControl' }
</script>
