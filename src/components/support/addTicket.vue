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

        <a-form-item
          v-if="!authStore.billingUser.only_tickets"
          style="margin-bottom: 0; padding-bottom: 0"
          :label="$t('gateway')"
        >
          <div class="order__grid">
            <div
              v-for="gate of gateways"
              :key="gate.id"
              class="order__slider-item"
              :value="gate.id"
              :class="{ 'order__slider-item--active': gateway === gate.id }"
              @click="gateway = gate.id"
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

        <a-form-item
          v-if="!authStore.billingUser.only_tickets"
          style="margin-bottom: 0; padding-bottom: 0"
          :label="capitalize($t('generate image'))"
        >
          <a-switch v-model:checked="genImage.checked" />
        </a-form-item>

        <a-form-item
          v-if="genImage.checked"
          style="margin-bottom: 0; padding-bottom: 0"
          :label="capitalize($t('resolution'))"
        >
          <a-select v-model:value="genImage.size" :options="sizes" />
        </a-form-item>

        <a-form-item
          v-if="genImage.checked"
          style="margin-bottom: 0; padding-bottom: 0"
          :label="capitalize($t('quality'))"
        >
          <a-select v-model:value="genImage.quality" :options="qualityList" />
        </a-form-item>

        <a-form-item :label="(upload?.fileList.length > 0) ? $t('files') : null">
          <div class="addTicket__buttons">
            <upload-files v-if="showSendFiles" ref="upload" file-list-style="order: -1; grid-column: 1 / 3">
              <a-button type="primary">
                <upload-icon />
              </a-button>
            </upload-files>
            <a-button
              type="primary"
              @click="(gateway === 'telegram') ? sendTelegramMessage() : sendNewTicket()"
            >
              OK
            </a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue'
import { message, notification } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import markdown from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'
import api from '@/api'

import { useAuthStore } from '@/stores/auth.js'
import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'

import uploadFiles from '@/components/support/upload.vue'

const uploadIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/UploadOutlined')
)

const md = markdown({
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

const gateway = ref('userApp')
const ticketDepartment = ref(-1)
const ticketTitle = ref('')
const ticketMessage = ref('')
const isSending = ref(false)
const isLoading = ref(false)

const genImage = reactive({
  checked: false,
  size: '1024*1024',
  quality: 'standard'
})
const sizes = [{ value: '1024*1024' }, { value: '1024*1792' }]
const qualityList = [
  { label: 'HD', value: 'hd' },
  { label: 'Standard', value: 'standard' }
]

const upload = ref()
const showSendFiles = computed(() => globalThis.VUE_APP_S3_BUCKET)

const filteredDepartments = computed(() => {
  const chatsDeparts = (props.instanceId)
    ? chatsStore.getDefaults.departments
    : chatsStore.getDefaults.departments.filter(
      ({ id }) => id !== 'openai'
    )

  if (authStore.billingUser.only_tickets) {
    return chatsDeparts.filter(({ id }) => id === 'colobridge')
  } else {
    return chatsDeparts.filter((dep) => dep.public && dep.id !== 'colobridge') // [...supportStore.departments, ...chatsDeparts]
  }
})

watch(filteredDepartments, setDepartment)
onMounted(setDepartment)

const gateways = computed(() => {
  const { gateways = [] } = chatsStore.getDefaults
  let result = gateways.map((gateway) => ({
    id: gateway,
    name: `${gateway[0].toUpperCase()}${gateway.slice(1)}`
  }))

  if (props.instanceId) {
    result = result.filter(({ id }) => id === 'telegram')
  }
  result.unshift({ id: 'userApp', name: 'User App' })

  return result
})

function setDepartment () {
  const departments = (props.instanceId)
    ? chatsStore.getDefaults.departments
    : filteredDepartments.value

  if (departments.length < 1) return
  if (props.instanceId) {
    const result = departments.find(({ id }) => `${id}`.includes('openai'))

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
  const { admins, id: key, whmcsId } = departments.find(({ id }) => id === ticketDepartment.value) ?? {}

  try {
    const files = await upload.value.sendFiles()
    const template = (files.length > 0)
      ? `<div class="chat__files">
          ${files.map((file) => `<div class="files__preview">
            <img src="${file.url}" alt="${file.name}">
          </div>`).join('\n')}
        </div>`
      : ''

    const message = md.render(ticketMessage.value).trim()
      .replace(/^<p>/, '').replace(/<\/p>$/, '') + template

    const response = await chatsStore.createChat({
      admins,
      department: key,
      gateways: (gateway.value === 'userApp') ? [] : [gateway.value],
      chat: {
        message,
        subject: ticketTitle.value,
        meta: [
          { key: 'dept_id', value: whmcsId },
          { key: 'instance', value: props.instanceId }
        ]
      }
    })

    if (response.uuid) {
      const result = {
        uuid: response.uuid,
        content: message,
        account: authStore.userdata.uuid,
        date: BigInt(Date.now()),
        attachments: files.map(({ uuid }) => uuid),
        meta: [
          { key: 'mode', value: (genImage.checked) ? 'generate' : 'default' }
        ]
      }

      if (genImage.checked) {
        result.meta.push(
          { key: 'size', value: genImage.size },
          { key: 'quality', value: genImage.quality }
        )
      }

      await chatsStore.sendMessage(result)
    }

    const query = { from: props.instanceId }

    router.push({ path: `/ticket/${response.uuid}`, query })
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
  supportStore.isAddingTicket = false
}

function sendTelegramMessage () {
  if (authStore.userdata.data?.telegram) {
    sendNewTicket()
    return
  }

  localStorage.setItem('telegramChat', JSON.stringify({
    message: md.render(ticketMessage.value)
      .trim()
      .replace(/^<p>/, '').replace(/<\/p>$/, ''),
    gateway: gateway.value,
    department: ticketDepartment.value,
    title: ticketTitle.value,
    instanceId: props.instanceId
  }))
  router.push({ name: 'handsfree' })
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
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  justify-items: end;
  gap: 10px;
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

:deep(.ant-form-item:last-child) {
  margin-bottom: 0;
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
  box-shadow: inset 0 0 0 1px var(--border_color);
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
  background-color: var(--main);
  color: var(--gloomy_font);
}

.order__grid .order__slider-name > .img_prod {
  display: block;
  max-height: 20px;
}

.order__grid .order__slider-item--active .img_prod {
  background: var(--gloomy_font);
  border-radius: 50%;
  padding: 2px;
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
