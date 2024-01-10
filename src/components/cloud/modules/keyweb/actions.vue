<template>
  <div class="Fcloud__buttons">
    <div
      v-if="vm.state?.state !== 'STOPPED'"
      class="Fcloud__button"
      :class="{ disabled: statusVM.shutdown }"
      @click="sendAction('stop')"
    >
      <div class="Fcloud__BTN-icon">
        <div class="cloud__icon cloud__icon--stop" />
      </div>
      <div class="Fcloud__BTN-title">
        {{ $t('Power off') }}
      </div>
    </div>

    <div
      v-else
      class="Fcloud__button"
      :class="{ disabled: statusVM.start }"
      @click="sendAction('start')"
    >
      <div class="Fcloud__BTN-icon">
        <caret-right-icon />
      </div>
      <div class="Fcloud__BTN-title">
        {{ $t('Start') }}
      </div>
    </div>

    <div
      class="Fcloud__button"
      :class="{ disabled: statusVM.reboot }"
      @click="sendAction('reboot')"
    >
      <div class="Fcloud__BTN-icon">
        <redo-icon />
      </div>
      <div class="Fcloud__BTN-title">
        {{ $t('Reboot') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '@/stores/instances.js'
import { useNotification } from '@/hooks/utils'

const props = defineProps({
  vm: { type: Object, required: true }
})

const redoIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/RedoOutlined')
)

const caretRightIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CaretRightOutlined')
)

const instancesStore = useInstancesStore()
const { openNotification } = useNotification()

const statusVM = computed(() => {
  if (!props.vm.state) {
    return {
      start: true, shutdown: true, reboot: true
    }
  }
  const isSuspended = props.vm.state.state === 'SUSPENDED' || props.vm.data.suspended_manually

  if (isSuspended || props.vm.data.lock || props.vm.state.state === 'PENDING') {
    return {
      start: true, shutdown: true, reboot: true
    }
  }
  return {
    shutdown: props.vm.state.state === 'STOPPED',
    reboot: props.vm.state.state === 'STOPPED',
    start: props.vm.state.state === 'RUNNING'
  }
})

async function sendAction (action) {
  try {
    await instancesStore.invokeAction({
      uuid: props.vm.uuid,
      uuidService: props.vm.uuidService,
      action
    })

    openNotification('success', {
      message: `${useI18n().t('Done')}!`
    })
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
  }
}
</script>

<script>
export default { name: 'KeywebActions' }
</script>
