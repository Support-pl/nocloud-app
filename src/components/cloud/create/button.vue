<template>
  <create-actions
    :modal-options="modalOptions"
    :create-button-options="createButtonOptions"
    :next-button-options="nextButtonOptions"
  >
    <template #before>
      <a-col
        v-if="isUnlogginedLinkVisible"
        class="products__unregistred"
        style="margin-top: 15px; text-align: center"
      >
        {{ capitalize($t('unregistered.will be able after')) }}
        <a href="#" @click.prevent="availableLogin('login')">
          {{ $t('unregistered.login') }}
        </a>.
        <br>
        <a href="#" @click.prevent="availableLogin('copy')">
          {{ $t('Copy link') }} <copy-icon />
        </a>
      </a-col>
    </template>

    <template #modalContent>
      <span
        v-if="cloudStore.authData.score < 4 && cloudStore.provider.type !== 'ovh'"
        style="color: var(--err)"
      >
        {{ $t('Password must contain uppercase letters, numbers and symbols') }}
      </span>
      <template v-else>
        {{ $t('Virtual machine will be available after paying the invoice') }}
      </template>

      <!-- <a-row v-if="cloudStore.authData.score > 3" style="margin-top: 20px">
        <a-col>
          <a-checkbox v-model:checked="cloudStore.autoRenew" />
          {{ capitalize($t('renew automatically')) }}
        </a-col>
      </a-row> -->
    </template>

    <template #after>
      <a-col
        v-if="cloudStore.provider?.type !== 'ovh' && tarification === 'Hourly'"
        style="font-size: 14px; margin: 16px 16px 0"
      >
        <span style="position: absolute; left: -8px">*</span>
        {{ $t('Payment will be made immediately after purchase') }}
      </a-col>
    </template>
  </create-actions>
</template>

<script setup>
import { defineAsyncComponent, computed, reactive, inject } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth.js'
import { useCloudStore } from '@/stores/cloud.js'
import { useClipboard } from '@/hooks/utils'

import createActions from '@/components/ui/createActions.vue'

const copyIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CopyOutlined')
)

const props = defineProps({
  createOrder: { type: Function, required: true },
  tarification: { type: String, required: true },
  productSize: { type: String, required: true },
  panels: { type: Array, required: true }
})

const router = useRouter()
const authStore = useAuthStore()
const cloudStore = useCloudStore()
const { addToClipboard } = useClipboard()

const [options] = inject('useOptions', () => [])()
const [activeKey, nextStep] = inject('useActiveKey', () => [])()
const modal = reactive({ confirmCreate: false, confirmLoading: false })

const modalOptions = computed(() => {
  const isWeakPass = cloudStore.authData.score < 4 && cloudStore.provider?.type !== 'ovh'

  return {
    title: (isWeakPass) ? 'Weak pass' : 'Confirm',
    visible: modal.confirmCreate,
    loading: modal.confirmLoading,
    okProps: { disabled: isWeakPass },
    onOk: async () => {
      modal.confirmLoading = true
      await props.createOrder()
      modal.confirmLoading = false
    },
    onCancel: () => {
      modal.confirmCreate = false
    }
  }
})

const createButtonOptions = computed(() => {
  const result = {
    disabled: true,
    onClick: () => {
      if (authStore.isLogged) modal.confirmCreate = true
      else availableLogin('login')
    }
  }

  if (cloudStore.provider?.type === 'ovh') {
    result.disabled =
      cloudStore.authData.vmName === '' ||
      (!cloudStore.namespaceId && authStore.isLogged) ||
      options.os.name === ''
  } else {
    result.disabled =
      (cloudStore.authData.password.length === 0 && authStore.isLogged) ||
      cloudStore.authData.vmName === '' ||
      (!cloudStore.namespaceId && authStore.isLogged) ||
      options.os.name === ''
  }

  return result
})

const nextButtonOptions = computed(() => ({
  visible: activeKey.value !== props.panels.at(-1),
  onClick: nextStep
}))

const isUnlogginedLinkVisible = computed(() => {
  const { score, password, vmName } = cloudStore.authData
  const isStrongPass = score > 3 && password.length > 0
  const isNotOvh = cloudStore.provider?.type !== 'ovh'

  if (authStore.isLogged) return false
  return (isNotOvh && isStrongPass) || (options.os.name && vmName)
})

function availableLogin (mode) {
  const data = {
    path: router.currentRoute.value.path,
    query: router.currentRoute.value.query,
    titleSP: cloudStore.provider.title,
    tarification: props.tarification,
    productSize: props.productSize,
    titleVM: cloudStore.authData.vmName,
    locationId: cloudStore.locationId,
    activeKey: activeKey.value,
    resources: {
      cpu: options.cpu.size,
      ram: options.ram.size * 1024,
      drive_type: options.disk.type,
      drive_size: options.disk.size,
      ips_private: options.network.private.count,
      ips_public: options.network.public.count
    },
    config: {
      template_id: options.os.id,
      template_name: options.os.name
    },
    billing_plan: { uuid: cloudStore.plan.uuid },
    ovhConfig: options.config
  }

  if (mode === 'login') {
    localStorage.setItem('data', JSON.stringify(data))
    router.push({ name: 'login' })
  } else if (mode === 'copy') {
    const link = new URL(location.href)

    link.searchParams.set('data', JSON.stringify(data))
    addToClipboard(link.href)
  } else {
    localStorage.setItem('data', JSON.stringify(data))
  }
}
</script>

<script>
export default { name: 'CloudCreateButton' }
</script>
