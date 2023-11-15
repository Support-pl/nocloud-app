<template>
  <a-row :gutter="[10, 0]" style="margin-top: 10px">
    <a-col span="12" style="padding-bottom: 0; font-weight: 700">
      Input kilotoken:
    </a-col>
    <a-col span="12" style="padding-bottom: 0; font-weight: 700">
      Output kilotoken:
    </a-col>

    <a-col span="12" style="padding-top: 0; font-size: 18px">
      {{ service.resources.inputKilotoken }} {{ currency.code }}
    </a-col>
    <a-col span="12" style="padding-top: 0; font-size: 18px">
      {{ service.resources.outputKilotoken }} {{ currency.code }}
    </a-col>

    <a-col span="24" style="margin-top: 10px">
      <a-button
        size="small"
        type="primary"
        :disabled="!service.status.includes('RUNNING')"
        @click="moduleEnter"
      >
        {{ capitalize($t('new chat')) }}
      </a-button>
    </a-col>

    <a-col v-if="isLoading" span="24">
      <loading />
    </a-col>
    <a-col v-else-if="chats.length > 0" span="24">
      <ticket-item
        v-for="chat of chats"
        :key="chat.id"
        :ticket="chat"
        :instance-id="service.uuid"
      />
    </a-col>
    <a-col v-else span="24">
      <a-empty />
    </a-col>
  </a-row>

  <add-ticket :instance-id="service.uuid" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { Status } from '@/libs/cc_connect/cc_pb.js'

import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'
import { useCurrency } from '@/hooks/utils'

import addTicket from '@/components/support/addTicket.vue'
import ticketItem from '@/components/support/ticketItem.vue'
import loading from '@/components/ui/loading.vue'

const props = defineProps({
  service: { type: Object, required: true }
})

const chatsStore = useChatsStore()
const supportStore = useSupportStore()
const { currency } = useCurrency()

const chats = computed(() => {
  const result = []

  chatsStore.chats.forEach((chat) => {
    const { value } = chat.meta.data.instance?.kind ?? {}
    if (value !== props.service.uuid) return

    const status = Status[chat.status].toLowerCase().split('_')
    const capitalized = status.map((el) =>
      `${el[0].toUpperCase()}${el.slice(1)}`
    ).join(' ')

    result.push({
      id: chat.uuid,
      tid: `${chat.uuid.slice(0, 8)}...`,
      title: chat.topic,
      date: Number(chat.meta.lastMessage?.sent ?? chat.created),
      message: chat.meta.lastMessage?.content ?? '',
      status: capitalized,
      unread: chat.meta.unread
    })
  })

  result.sort((a, b) => b.date - a.date)

  return result
})

function moduleEnter () {
  supportStore.isAddingTicket = !supportStore.isAddingTicket
}

const isLoading = ref(false)

async function fetch () {
  try {
    isLoading.value = true
    await chatsStore.fetchChats()
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

fetch()
</script>

<script>
export default { name: 'OpenaiDraw' }
</script>

<style>
.module .ticket {
  background-color: var(--main);
  color: var(--bright_font);
  transition: .2s;
}

.module .ticket:hover {
  background-color: var(--main);
  opacity: 0.8;
}

.module .ticket__time {
  color: var(--bright_bg);
}
</style>
