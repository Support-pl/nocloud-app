<template>
  <a-modal
    :title="capitalize((instanceId) ? $t('new chat') : $t('ask a question'))"
    :open="supportStore.isAddingTicket"
    :footer="null"
    @cancel="closeFields"
  >
    <a-spin :tip="$t('loading')" :spinning="isLoading || isSending">
      <a-form layout="vertical">
        <a-form-item
          v-if="!instanceId && filteredDepartments.length > 1"
          :label="$t('department')"
        >
          <a-select v-model:value="ticketDepartment" placeholder="department">
            <a-select-option
              v-for="department of filteredDepartments"
              :key="department.id"
              :value="department.id"
            >
              {{ department.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item :label="$t('subject')">
          <a-input v-model:value="ticketTitle" placeholder="" />
        </a-form-item>

        <a-form-item :label="(instanceId) ? null : $t('question')">
          <a-textarea
            v-model:value="ticketMessage"
            :rows="10"
            :placeholder="(instanceId) ? $t('input text') : null"
          />
        </a-form-item>

        <a-button
          v-if="isTicket"
          type="primary"
          style="display: block; margin-left: auto"
          @click="sendNewTicket"
        >
          {{ $t('Send') }}
        </a-button>

        <a-form-item v-else style="margin-bottom: 0; padding-bottom: 0" :label="$t('gateways')">
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
                <img
                  class="img_prod"
                  :src="`/img/icons/${getImageName(gate.id)}.png`"
                  :alt="gate.id" @error="onError"
                >
                {{ gate.name }}
              </span>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { message, notification } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import Markdown from 'markdown-it'
import emoji from 'markdown-it-emoji'
import api from '@/api'

import { useAuthStore } from '@/stores/auth.js'
import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'

const md = new Markdown({
  html: true,
  linkify: true,
  typographer: true
})

md.use(emoji)

const props = defineProps({
  instanceId: { type: String, default: null }
})

const router = useRouter()
const i18n = useI18n()

const authStore = useAuthStore()
const chatsStore = useChatsStore()
const supportStore = useSupportStore()

const gateway = ref('')
const ticketDepartment = ref(-1)
const ticketTitle = ref('')
const ticketMessage = ref('')
const isSending = ref(false)
const isLoading = ref(false)

const isTicket = computed(() =>
  supportStore.departments.find(({ id }) => id === ticketDepartment.value)
)

const filteredDepartments = computed(() => {
  const chatsDeparts = chatsStore.getDefaults.departments

  if (authStore.billingUser.only_tickets) {
    return supportStore.departments
  } else {
    return chatsDeparts // [...supportStore.departments, ...chatsDeparts]
  }
})

watch(filteredDepartments, setDepartment)
onMounted(setDepartment)

const gateways = computed(() => {
  const { gateways = [] } = chatsStore.getDefaults
  const result = gateways.map((gateway) => ({
    id: gateway,
    name: `${gateway[0].toUpperCase()}${gateway.slice(1)}`
  }))
  const i = result.findIndex(({ id }) => id.includes('email'))

  if (props.instanceId && i !== -1) result.splice(i, 1)
  result.push({ id: 'userApp', name: 'User App' })
  return result
})

function setDepartment () {
  if (filteredDepartments.value.length < 1) return
  if (props.instanceId) {
    const result = filteredDepartments.value.find(
      ({ id }) => `${id}`.includes('openai')
    )

    ticketDepartment.value = result?.id ?? filteredDepartments.value[0]?.id ?? -1
    return
  }
  ticketDepartment.value = filteredDepartments.value[0]?.id ?? -1
}

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
    return { result: 'success' }
  } catch (error) {
    return { result: 'error', error }
  }
}

async function createChat () {
  const { departments } = chatsStore.getDefaults
  const { admins, id: key } = departments.find(({ id }) => id === ticketDepartment.value) ?? {}

  try {
    const message = md.render(ticketMessage.value)
      .trim()
      .replace(/^<p>/, '').replace(/<\/p>$/, '')

    const response = await chatsStore.createChat({
      admins,
      department: key,
      gateways: (gateway.value === 'userApp') ? [] : [gateway.value],
      chat: {
        message,
        subject: ticketTitle.value,
        instanceId: props.instanceId
      }
    })

    if (response.uuid) {
      if (!response.meta.lastMessage?.uuid) {
        await chatsStore.sendMessage({
          uuid: response.uuid,
          content: message,
          account: authStore.userdata.uuid,
          date: BigInt(Date.now())
        })
      }

      const query = { from: props.instanceId }

      router.push({ path: `/ticket/${response.uuid}`, query })
    } else {
      throw response
    }
    return { result: 'success' }
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
    else notification.success({ message: i18n.t('Done') })
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error(i18n.t(message))
    console.error(error)
  } finally {
    isSending.value = false
    closeFields()
  }
}

function closeFields () {
  supportStore.isAddingTicket = !supportStore.isAddingTicket
}

function sendTelegramMessage () {
  if (authStore.userdata.data?.telegram) {
    sendNewTicket()
    return
  }

  const message = md.render(ticketMessage.value)
    .trim()
    .replace(/^<p>/, '').replace(/<\/p>$/, '')

  localStorage.setItem('telegramMessage', message)
  router.push({ name: 'handsfree' })
}

function changeGateway (value) {
  if (value === 'telegram' && gateway.value === value) {
    sendTelegramMessage()
  } else if (gateway.value === value) {
    sendNewTicket()
  } else {
    gateway.value = value
  }
}

function onError ({ target }) {
  target.src = '/img/OS/default.png'
}

function getImageName (name) {
  return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0]
}

async function fetch () {
  try {
    isLoading.value = true
    await chatsStore.fetchDefaults()
    await supportStore.fetchDepartments()
  } catch {
    message.error(i18n.t('departments not found'))
  } finally {
    isLoading.value = false
  }
}

fetch()
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
  background: var(--bright_font);
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
  color: var(--bright_font);
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
  color: var(--bright_font);
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