<template>
  <div class="module">
    <a-row :gutter="[10, 10]">
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

      <a-col style="font-weight: 700">
        Chats:
        <a-button
          size="small"
          type="primary"
          :disabled="!service.status.includes('RUNNING')"
          @click="moduleEnter"
        >
          {{ $t('ticketStatus.New') }}
        </a-button>
      </a-col>

      <a-col v-if="isLoading">
        <loading />
      </a-col>
      <a-col v-else-if="chats.length > 0">
        <single-ticket
          v-for="chat of chats"
          :key="chat.id"
          :ticket="chat"
          :instance-id="service.uuid"
        />
      </a-col>
      <a-col v-else>
        <a-empty />
      </a-col>
    </a-row>

    <add-ticket :instance-id="service.uuid" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import store from '@/store'
import { Status } from '@/libs/cc_connect/cc_pb.js'
import addTicket from '@/components/appMain/support/addTicket.vue'
import singleTicket from '@/components/appMain/support/singleTicket.vue'
import loading from '@/components/loading/loading.vue'

const props = defineProps({
  service: { type: Object, required: true }
})

const chats = computed(() => {
  const allChats = store.getters['nocloud/chats/getAllChats']
  const result = []

  allChats.forEach((chat) => {
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

const currency = computed(() => {
  const user = store.getters['nocloud/auth/billingData']
  const defaultCurrency = store.getters['nocloud/auth/defaultCurrency']

  return { code: user.currency_code ?? defaultCurrency }
})

function moduleEnter () {
  store.commit('support/inverseAddTicketState')
}

const isLoading = ref(false)

async function fetch () {
  try {
    isLoading.value = true
    await store.dispatch('nocloud/chats/fetchChats')
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
