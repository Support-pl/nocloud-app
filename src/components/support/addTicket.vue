<template>
  <a-modal
    width="768px"
    :open="supportStore.isAddingTicket"
    :footer="null"
    @cancel="closeFields"
  >
    <template #title>
      <div style="display: flex; justify-content: space-between">
        {{ capitalize($t("ask a question")) }}
      </div>
    </template>

    <a-spin :tip="$t('loading')" :spinning="isLoading || isSending">
      <a-form layout="vertical">
        <a-form-item
          v-if="filteredDepartments.length > 1"
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

        <a-form-item :label="$t('question')">
          <a-textarea
            v-model:value="ticketMessage"
            :rows="10"
            :placeholder="null"
          />

          <upload-files
            v-if="showSendFiles"
            ref="upload"
            :editing="false"
            :replies="[]"
            :file-list="fileList"
            @update:file-list="fileList = $event"
          />
        </a-form-item>

        <a-form-item
          v-if="!billingUser.only_tickets"
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
                  :alt="gate.id"
                  @error="onError"
                />
                {{ gate.name }}
              </span>
            </div>
          </div>
        </a-form-item>

        <a-form-item :label="fileList.length > 0 ? $t('files') : null">
          <div class="addTicket__buttons">
            <a-button
              type="primary"
              @click="
                gateway === 'telegram' ? sendTelegramMessage() : sendNewTicket()
              "
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
import { computed, onMounted, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import markdown from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import { useNotification } from "@/hooks/utils";
import api from "@/api";
import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useSupportStore } from "@/stores/support.js";
import { capitalize } from "vue";
import UploadFiles from "../chats/uploadFiles.vue";
import { beautufyMessage } from "@/functions";
import { storeToRefs } from "pinia";

const md = markdown({
  html: true,
  linkify: true,
  typographer: true,
});

md.use(emoji);

const props = defineProps({});

const router = useRouter();
const { t } = useI18n();
const { openNotification } = useNotification();

const authStore = useAuthStore();
const { billingUser } = storeToRefs(authStore);
const chatsStore = useChatsStore();
const { getDefaults } = storeToRefs(chatsStore);
const supportStore = useSupportStore();

const gateway = ref("userApp");
const ticketDepartment = ref(-1);
const ticketTitle = ref("");
const ticketMessage = ref("");
const isSending = ref(false);
const isLoading = ref(false);
const fileList = ref([]);

const upload = ref();
const showSendFiles = computed(() => globalThis.VUE_APP_S3_BUCKET);

const filteredDepartments = computed(() => {
  const chatsDeparts = chatsStore.getDefaults.departments;

  if (billingUser.value.only_tickets) {
    return chatsDeparts.filter(({ id }) => id === "colobridge");
  } else {
    return chatsDeparts.filter((dep) => dep.public && dep.id !== "colobridge"); // [...supportStore.departments, ...chatsDeparts]
  }
});

watch(filteredDepartments, setDepartment, { deep: true });
onMounted(setDepartment);

const gateways = computed(() => {
  const { gateways = [] } = chatsStore.getDefaults;
  let result = gateways.map((gateway) => ({
    id: gateway,
    name: `${gateway[0].toUpperCase()}${gateway.slice(1)}`,
  }));

  result.unshift({ id: "userApp", name: "User App" });

  return result;
});

function setDepartment() {
  const departments = filteredDepartments.value;

  if (departments.length < 1) return;
  ticketDepartment.value = filteredDepartments.value[0]?.id ?? -1;
}

function validation() {
  if (ticketTitle.value.length < 3 || ticketMessage.value.length < 3) {
    message.warn(t("ticket subject or message is too short"));
    return false;
  }

  if (ticketDepartment.value === -1) {
    message.warn(t("departments are loading"));
    return false;
  }

  return true;
}

async function createTicket() {
  try {
    const response = await api.get(authStore.baseURL, {
      params: {
        run: "create_ticket",
        subject: ticketTitle.value,
        message: ticketMessage.value,
        department: ticketDepartment.value,
      },
    });

    if (response.result === "success") {
      ticketTitle.value = "";
      ticketMessage.value = "";

      supportStore.fetch(true);
      supportStore.isAddingTicket = !supportStore.isAddingTicket;
    } else {
      throw response;
    }
    return { result: "success" };
  } catch (error) {
    return { result: "error", error };
  }
}

async function createChat() {
  const { departments } = chatsStore.getDefaults;
  const {
    admins,
    id: key,
    whmcsId,
  } = departments.find(({ id }) => id === ticketDepartment.value) ?? {};

  try {
    const files = await chatsStore.sendChatFiles(fileList.value, undefined);
    const message = beautufyMessage(md, ticketMessage.value);

    const response = await chatsStore.createChat({
      admins,
      department: key,
      gateways: gateway.value === "userApp" ? [] : [gateway.value],
      chat: {
        message,
        subject: ticketTitle.value,
        meta: [{ key: "dept_id", value: whmcsId }].filter((v) => !!v),
      },
    });

    if (response.uuid) {
      const result = {
        uuid: response.uuid,
        content: message,
        account: authStore.userdata.uuid,
        date: BigInt(Date.now()),
        attachments: files.map(({ uuid }) => uuid),
        meta: [{ key: "mode", value: "default" }],
      };

      await chatsStore.sendMessage(result);
    }

    router.push({ path: `/ticket/${response.uuid}`, query: {} });
    return { result: "success" };
  } catch (error) {
    return { result: "error", error };
  }
}

async function sendNewTicket() {
  if (!validation()) return;

  const { departments } = chatsStore.getDefaults;
  const ids = departments.map(({ id }) => id);

  try {
    isSending.value = true;
    const response = ids.includes(ticketDepartment.value)
      ? await createChat()
      : await createTicket();

    if (response.result === "error") throw response.error;
    else openNotification("success", { message: t("Done") });
  } catch (error) {
    openNotification("error", {
      message: error.response?.data?.message ?? error.message ?? error,
    });
    console.error(error);
  } finally {
    isSending.value = false;
    closeFields();
  }
}

function closeFields() {
  supportStore.isAddingTicket = false;
}

function sendTelegramMessage() {
  if (authStore.userdata.data?.telegram) {
    sendNewTicket();
    return;
  }

  localStorage.setItem(
    "telegramChat",
    JSON.stringify({
      message: beautufyMessage(md, ticketMessage.value),
      gateway: gateway.value,
      department: ticketDepartment.value,
      title: ticketTitle.value,
    })
  );
  router.push({ name: "handsfree" });
}

function onError({ target }) {
  target.src = "/img/OS/default.png";
}

function getImageName(name) {
  return name
    .toLowerCase()
    .replace(/[-_\d]/g, " ")
    .split(" ")[0];
}

async function fetch() {
  try {
    isLoading.value = true;
    await chatsStore.fetchDefaults();
    await supportStore.fetchDepartments();
  } catch {
    message.error(t("departments not found"));
  } finally {
    isLoading.value = false;
  }
}

fetch();
</script>

<script>
export default { name: "AddTicket" };
</script>

<style scoped>
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
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
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
