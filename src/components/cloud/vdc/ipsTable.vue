<template>
  <a-table row-key="ip" :columns="headers" :data-source="data">
    <template #bodyCell="{ column, record }">
      <div v-if="column.key === 'status'" class="status">
        <div class="status__color" :style="{ background: record.color }" />
        <div class="status__title">
          {{ record.title }}
        </div>
      </div>

      <a-popconfirm
        v-if="column.key === 'actions'"
        :title="$t('disk_manage.Do you want to proceed?')"
        :ok-text="$t('Yes')"
        :cancel-text="$t('Cancel')"
        @confirm="removeIP(record)"
      >
        <a-button danger>
          {{ capitalize($t('free IP')) }}
        </a-button>
      </a-popconfirm>
    </template>
  </a-table>
</template>

<script setup>
import { computed } from 'vue'
import { getInstStatusColor } from '@/functions.js'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '@/stores/instances.js'
import { useNotification } from '@/hooks/utils'

const props = defineProps({
  instances: { type: Array, required: true },
  options: { type: Array, required: true },
  selected: { type: String, required: true }
})

const i18n = useI18n()
const instancesStore = useInstancesStore()
const { openNotification } = useNotification()

const headers = computed(() => [
  { title: 'IP', dataIndex: 'ip', key: 'ip' },
  {
    title: i18n.t('status'),
    dataIndex: 'status',
    key: 'status',
    sorter: (a, b) => a.status.localeCompare(b.status)
  },
  { title: i18n.t('Actions'), key: 'actions' }
])

const data = computed(() => {
  let { networking, status } = props.options.find(
    ({ uuid }) => uuid === props.selected
  ) ?? {}

  if (!props.selected) {
    props.options.forEach((option) => {
      networking = { ...(networking ?? {}), ...option.networking }
      status = { ...(status ?? {}), ...option.status }
    })
  }
  if (!networking) return []

  return setTableData(networking, status)
})

function setTableData (networking, status) {
  const result = []

  Object.entries(networking).forEach(([key, value]) => {
    value.private?.forEach((ip) => {
      result.push({
        ip,
        type: 'private',
        instanceUuid: key,
        title: value.title,
        status: status[key],
        color: getInstStatusColor(status[key])
      })
    })

    value.public?.forEach((ip) => {
      result.push({
        ip,
        type: 'public',
        instanceUuid: key,
        title: value.title,
        status: status[key],
        color: getInstStatusColor(status[key])
      })
    })
  })

  return result
}

async function removeIP (item) {
  const { serviceUuid, groupUuid } = props.instances.find(
    ({ uuid }) => uuid === item.instanceUuid
  ) ?? {}
  const serviceItem = instancesStore.services.find(({ uuid }) => uuid === serviceUuid)

  const service = JSON.parse(JSON.stringify(serviceItem))
  const group = service?.instancesGroups.find(({ uuid }) => uuid === groupUuid)
  const instance = group.instances.find(({ uuid }) => uuid === item.instanceUuid)

  setIpsToInst(instance, item)
  setIpsToGroup(group)

  await updateService(service)
}

function setIpsToInst (inst, item) {
  if (item.type === 'private') {
    const i = inst.state.meta.networking.private.indexOf(item.ip)

    inst.resources.ips_private -= 1
    inst.state.meta.networking.private.splice(i, 1)
  }

  if (item.type === 'public') {
    const i = inst.state.meta.networking.public.indexOf(item.ip)

    inst.resources.ips_public -= 1
    inst.state.meta.networking.public.splice(i, 1)
  }
}

function setIpsToGroup (group) {
  const ips = group.instances.reduce((prev, curr) => ({
    private: prev.private + curr.resources.ips_private,
    public: prev.public + curr.resources.ips_public
  }), { private: 0, public: 0 })

  group.resources.ips_private = ips.private
  group.resources.ips_public = ips.public
}

async function updateService (service) {
  try {
    await instancesStore.updateService(service)

    openNotification('success', { message: i18n.t('Done') })
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
    console.error(error)
  }
}
</script>

<style scoped>
.status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status__color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
