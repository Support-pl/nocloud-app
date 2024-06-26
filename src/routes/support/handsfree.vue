<template>
  <div class="handsfree-wrapper">
    <a-card title="Code">
      <a-list size="small" :data-source="data">
        <template #renderItem="{ item, index }">
          <a-list-item v-if="item === 'input'" style="padding: 12px 0 0; gap: 5px">
            <a-input :value="code" :max-length="6" @input="formatText" />
            <a-button type="primary" :loading="isLoading" @click="sendCode">
              {{ capitalize($t('Send')) }}
            </a-button>
          </a-list-item>

          <a-list-item v-else>
            {{ `${index + 1}. ${$t(item)}` }}

            <template v-if="index === 0">
              <a :href="link" target="_blank">link</a>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { notification } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { createPromiseClient } from '@connectrpc/connect'
import { HandsfreeService } from 'infinimesh-proto/build/es/handsfree/handsfree_connect'
import { ControlPacket } from 'infinimesh-proto/build/es/handsfree/handsfree_pb'

import api from '@/api.js'

import { useAuthStore } from '@/stores/auth.js'
import { useChatsStore } from '@/stores/chats.js'

const router = useRouter()
const route = useRoute()
const i18n = useI18n()

const authStore = useAuthStore()
const chatsStore = useChatsStore()

const isLoading = ref(false)
const code = ref('')
const link = ref('')
const data = [
  'Go to the telegram bot using the',
  'Press the start button or type /start',
  'Enter the code received by the bot',
  'Click on send button',
  'input'
]

async function sendCode () {
  const handsfree = createPromiseClient(HandsfreeService, chatsStore.transport)

  try {
    isLoading.value = true
    const { appId } = await handsfree.send(new ControlPacket({
      payload: [code.value, authStore.token]
    }))

    if (appId !== 'core-chatting.telegram-bot') {
      throw new Error('[Error]: Failed to connect')
    } else if (authStore.userdata.data?.telegram) {
      router.push({ name: 'support' })
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
    await chatsStore.fetchChats()
    await authStore.fetchUserData(true)

    const { telegram } = authStore.userdata.data ?? { telegram: -1 }
    let { uuid } = Array.from(chatsStore.chats.values()).find(
      ({ meta }) => meta.data.telegram?.toJSON() === telegram
    ) ?? {}
    const chat = JSON.parse(localStorage.getItem('telegramChat') ?? 'null')

    if (!chat) {
      localStorage.setItem('gateway', 'telegram')
      router.back()
    } else if (!uuid) {
      const { departments } = chatsStore.getDefaults
      const { admins, id: key } = departments.find(({ id }) => id === chat.department) ?? {}

      const response = await chatsStore.createChat({
        admins,
        department: key,
        gateways: (chat.gateway === 'userApp') ? [] : [chat.gateway],
        chat: {
          message: chat.message, subject: chat.title
        },
        meta: [{ key: 'instance', value: chat.instanceId }]
      })

      uuid = response.uuid
    }

    await chatsStore.sendMessage({
      uuid,
      content: chat.message,
      account: authStore.userdata.uuid,
      date: BigInt(Date.now())
    })

    localStorage.removeItem('telegramChat')
    router.push({ path: `/ticket/${uuid}` })
  } catch (error) {
    notification.error({
      message: i18n.t(error.response?.data?.message ?? error.message ?? error)
    })
    console.debug(error)
  } finally {
    isLoading.value = false
  }
}

async function getURL () {
  const settings = await api.settings.get(['telegram-bot-config'])
  const { url } = JSON.parse(settings['telegram-bot-config'])

  link.value = url
}

function formatText ({ target }) {
  target.value = target.value.replace(/[^a-f0-9]/gm, '')
  code.value = target.value
}

onMounted(() => {
  if (route.query.code) {
    code.value = +route.query.code
  }

  getURL()
})
</script>

<script>
export default { name: 'HandsfreeView' }
</script>

<style scoped>
.handsfree-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--main);
}
</style>
