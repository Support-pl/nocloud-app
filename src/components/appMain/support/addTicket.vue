<template>
  <a-modal
    :title="(instanceId) ? $t('new chat') : $t('ask a question') | capitalize"
    :visible="supportStore.isAddingTicket"
    :footer="null"
    @cancel="closeFields"
  >
    <a-spin tip="Loading..." :spinning="isLoading || isSending">
      <a-form-model layout="vertical">
        <a-form-model-item v-if="!instanceId" :label="$t('department')">
          <a-select v-model="ticketDepartment" placeholder="department">
            <a-select-option
              v-for="dep of filteredDepartments"
              :key="dep.id"
              :value="dep.id"
            >
              {{ dep.name }}
            </a-select-option>
          </a-select>
        </a-form-model-item>

        <a-form-model-item :label="$t('subject')">
          <a-input v-model="ticketTitle" placeholder="" />
        </a-form-model-item>

        <a-form-model-item :label="(instanceId) ? null : $t('question')">
          <a-textarea
            v-model="ticketMessage"
            rows="10"
            :placeholder="(instanceId) ? $t('input text') : null"
          />
        </a-form-model-item>

        <a-button
          v-if="isTicket"
          type="primary"
          style="display: block; margin-left: auto"
          @click="sendNewTicket"
        >
          {{ $t('Send') }}
        </a-button>

        <a-form-model-item v-else :label="$t('gateways')">
          <div class="order__grid">
            <div
              v-for="gate of gateways"
              :key="gate.id"
              class="order__slider-item"
              :value="gate.id"
              :class="{ 'order__slider-item--active': gateway === gate.id }"
              @click="changeGateway(gate.id)"
            >
              <span class="order__slider-name" :title="gate.name">
                <img class="img_prod" :src="`/img/icons/${gate.id}.png`" :alt="gate.id" @error="onError">
                {{ gate.name }}
              </span>
            </div>
          </div>
        </a-form-model-item>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { message, notification } from 'ant-design-vue'
import Markdown from 'markdown-it'
import emoji from 'markdown-it-emoji'

import store from '@/store'
import i18n from '@/i18n'

import { useAuthStore } from '@/stores/auth.js'
import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'
import api from '@/api'
import router from '@/router'

const md = new Markdown({
  html: true,
  linkify: true,
  typographer: true
})

md.use(emoji)

const props = defineProps({
  instanceId: { type: String, default: null }
})

const authStore = useAuthStore()
const chatsStore = useChatsStore()
const supportStore = useSupportStore()

const gateway = ref('')
const ticketDepartment = ref(-1)
const ticketTitle = ref('')
const ticketMessage = ref('')
const isSending = ref(false)
const isLoading = ref(false)

const user = computed(() =>
  store.getters['nocloud/auth/billingData']
)

const userdata = computed(() =>
  store.getters['nocloud/auth/userdata']
)

const isTicket = computed(() =>
  supportStore.departments.find(({ id }) => id === ticketDepartment.value)
)

const filteredDepartments = computed(() => {
  const chatsDeparts = chatsStore.getDefaults.departments

  if (user.value.only_tickets) return supportStore.departments
  else {
    return [...supportStore.departments, ...chatsDeparts]
  }
})

watch(filteredDepartments, (value) => {
  if (value.length < 1) return
  if (props.instanceId) {
    const result = value.find(({ id }) => `${id}`.includes('openai'))

    ticketDepartment.value = result?.id ?? value[0]?.id ?? -1
    return
  }
  ticketDepartment.value = value[0]?.id ?? -1
})

const gateways = computed(() => {
  const { gateways = [] } = chatsStore.getDefaults
  const result = gateways.map((gateway) => ({
    id: gateway,
    name: `${gateway[0].toUpperCase()}${gateway.slice(1)}`
  }))
  const i = result.findIndex(({ id }) => id.includes('email'))

  if (props.instanceId) result.splice(i, 1)
  return result
})

function validation () {
  if (ticketTitle.value.length < 3 || ticketMessage.value.length < 3) {
    message.warn(i18n.t('ticket subject or message is too short'))
    return false
  }

  if (ticketDepartment.value === -1) {
    message.warn(i18n.t('departments are loading'))
    return false
  }

  return true
}

async function createTicket () {
  try {
    const response = await api.get(authStore.baseURL, {
      params: {
        run: 'create_ticket',
        subject: ticketTitle.value,
        message: ticketMessage.value,
        department: ticketDepartment.value
      }
    })

    if (response.result === 'success') {
      ticketTitle.value = ''
      ticketMessage.value = ''

      supportStore.fetch(true)
      supportStore.isAddingTicket = !supportStore.isAddingTicket
    } else {
      throw response
    }
  } catch (error) {
    return { result: 'error', error }
  }
}

async function createChat () {
  const { departments } = chatsStore.getDefaults
  const { admins, id: key } = departments.find(({ id }) => id === ticketDepartment.value) ?? {}

  try {
    const response = await chatsStore.createChat({
      admins,
      department: key,
      gateways: [gateway.value],
      chat: {
        subject: ticketTitle.value,
        message: md.render(ticketMessage.value).trim().replace(/^<p>/, '').replace(/<\/p>$/, ''),
        instanceId: props.instanceId
      }
    })

    if (response.uuid) {
      if (!response.meta.lastMessage?.uuid) {
        await chatsStore.sendMessage({
          uuid: response.uuid,
          content: md.render(ticketMessage.value).trim(),
          account: userdata.value.uuid,
          date: BigInt(Date.now())
        })
      }

      const query = { from: props.instanceId }

      router.push({ path: `/ticket-${response.uuid}`, query })
    } else {
      throw response
    }
  } catch (error) {
    return { result: 'error', error }
  }
}

async function sendNewTicket () {
  if (!validation()) return

  const { departments } = chatsStore.getDefaults
  const ids = departments.map(({ id }) => id)

  try {
    isSending.value = true
    const response = (ids.includes(ticketDepartment.value))
      ? await createChat()
      : await createTicket()

    if (response.result === 'error') throw response.error
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error(i18n.t(message))
    console.error(error)
  } finally {
    isSending.value = false
  }
}

function closeFields () {
  supportStore.isAddingTicket = !supportStore.isAddingTicket
}

function changeGateway (value) {
  if (gateway.value === value) {
    sendNewTicket()
  } else {
    gateway.value = value
  }
}

function onError ({ target }) {
  target.src = '/img/OS/default.png'
}

try {
  isLoading.value = true
  Promise.all([
    chatsStore.fetchDefaults(),
    supportStore.fetchDepartments()
  ])
} catch {
  message.error(i18n.t('departments not found'))
} finally {
  isLoading.value = false
}

</script>

<script>
export default { name: 'AddTicket' }
</script>

<style scoped>
.addTicket__wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.2);
}

.addTicket {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 768px;
  height: 90%;
  background: #fff;
  border-radius: 35px 35px 0 0;
  box-shadow: 5px 2px 15px rgba(0, 0, 0, 0.2);
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
}

.addTicket__header {
  text-align: center;
  font-size: 1.3rem;
  font-weight: 600;
}

.addTicket__title {
  margin-top: 20px;
}

.addTicket__message {
  flex: 1 0;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
}

.addTicket__title-input,
.addTicket__message-input {
  width: 100%;
  border: none;
  outline: none;
  background-color: var(--bright_bg);
  border-radius: 25px;
  padding: 10px 15px;
}

.row__name {
  padding-left: 20px;
  margin-bottom: 5px;
}

.addTicket__message-input {
  border-radius: 25px 25px 0 0;
  flex: 1 0;
  resize: none;
}

.addTicket__buttons {
  display: flex;
  width: 100%;
}

.addTicket__button {
  flex-grow: 1;
  padding: 10px 15px;
  border: none;
  outline: none;
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
}

.addTicket__button--cancel {
  background-color: var(--err);
  border-radius: 0 0 0 25px;
}

.addTicket__button--send {
  background-color: var(--success);
  border-radius: 0 0 25px 0;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 10px;
  overflow-x: auto;
}

.order__slider-item {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  height: 100%;
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1rem;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active {
  background-color: #1045b4;
  color: #fff;
}

.order__grid .order__slider-name > .img_prod {
  display: block;
  max-height: 20px;
}

.order__grid .order__slider-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

@media screen and (max-width: 576px) {
.order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
