<template>
  <div>
    <a-modal v-model="isVisible" :title="$t('Add a new SSH key')" @ok="handleOk">
      <a-row :gutter="[10, 10]" style="display: flex; align-items: center">
        <a-col :xs="24" :sm="4">
          {{ $t('title') | capitalize }}
        </a-col>
        <a-col :xs="24" :sm="20">
          <a-input v-model="title" type="text" />
        </a-col>
      </a-row>
      <a-row
        :gutter="[10, 10]"
        style="display: flex; align-items: center; margin-top: 5px"
      >
        <a-col :xs="24" :sm="4">
          SSH
        </a-col>
        <a-col :xs="24" :sm="20">
          <a-textarea v-model="value" :auto-size="{ minRows: 3, maxRows: 5 }" />
        </a-col>
      </a-row>
    </a-modal>

    <slot name="actions" :show-modal="() => { isVisible = true }">
      <a-button @click="isVisible = true">
        {{ $t('Add') }} SSH
      </a-button>
    </slot>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { notification } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth.js'
import i18n from '@/i18n'

const authStore = useAuthStore()

const isLoading = ref(false)
const isVisible = ref(false)
const title = ref('')
const value = ref('')

async function handleOk () {
  isLoading.value = true
  const ssh = { title: title.value, value: value.value }
  const body = {
    data: {
      ssh_keys: []
    }
  }

  if (authStore.userdata.data?.ssh_keys) {
    body.data.ssh_keys.push(...authStore.userdata.data.ssh_keys, ssh)
  } else {
    body.data.ssh_keys.push(ssh)
  }

  try {
    const response = await authStore.addSSH({
      id: authStore.userdata.uuid, body
    })

    if (response) {
      notification.success({ message: i18n.t('Add SSH key successfully') })

      isVisible.value = false
      title.value = ''
      value.value = ''

      authStore.fetchUserData()
    } else {
      notification.error({ message: i18n.t('Error adding SSH key') })
    }
  } catch (error) {
    notification.error({ message: i18n.t('Error adding SSH key') })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
</script>
