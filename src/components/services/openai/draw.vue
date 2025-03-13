<template>
  <a-row class="module" style="margin-top: 10px" :gutter="[10, 10]">
    <a-col span="24">
      <div class="token-title">
        Token API:

        <visible-icon
          v-if="isVisible"
          style="font-size: 18px"
          @click="isVisible = false"
        />
        <invisible-icon
          v-else
          style="font-size: 18px"
          @click="isVisible = true"
        />
        <copy-icon style="font-size: 18px" @click="addToClipboard(token)" />
      </div>
      <div style="padding-top: 0; font-size: 18px; word-break: break-word">
        {{ isVisible ? token : `${token.slice(0, 15)}...` }}
      </div>
    </a-col>

    <a-col span="24">
      <a-tabs v-model:activeKey="activeApiTab">
        <a-tab-pane key="1" tab="API v1">
          <a-row style="padding: 0px 5px; margin-bottom: 10px">
            <a-col span="12">
              <div style="padding-bottom: 0; font-weight: 700">
                Input kilotoken:
              </div>
              <div style="padding-top: 0; font-size: 18px">
                {{ service.resources.inputKilotoken }} {{ currency.title }}
              </div>
            </a-col>
            <a-col span="12">
              <div style="padding-bottom: 0; font-weight: 700">
                Output kilotoken:
              </div>
              <div style="padding-top: 0; font-size: 18px">
                {{ service.resources.outputKilotoken }} {{ currency.title }}
              </div>
            </a-col>
          </a-row>

          <a-col span="24">
            <div class="token-title">
              API endpoint:
              <copy-icon
                style="font-size: 18px"
                @click="addToClipboard(endpointv1)"
              />
            </div>
            <div style="padding-top: 0; font-size: 18px">
              {{ endpointv1 }}
            </div>
          </a-col>

          <a-col span="24">
            <div class="token-title">
              API example:
              <copy-icon
                style="font-size: 18px"
                @click="addToClipboard(exampleV1)"
              />
            </div>
            <code>{{ exampleV1 }}</code>
          </a-col>
        </a-tab-pane>
        <a-tab-pane key="2" tab="API v2 (BETA)">
          <a-row style="padding: 0px 5px">
            <a-col span="12">
              <a-select
                style="width: 100%; margin-right: 5px"
                v-model:value="selectedTypeV2"
                :options="typesOptionsV2"
              ></a-select>
            </a-col>

            <a-col span="12">
              <a-select
                style="margin-left: 5px; margin-right: 10px; width: 100%"
                v-model:value="selectedModelV2"
                :options="modelsOptionsV2"
              ></a-select>
            </a-col>

            <a-col span="12">
              <div style="padding-bottom: 0; font-weight: 700">
                Input kilotoken:
              </div>
              <div style="padding-top: 0; font-size: 18px">
                {{
                  service.resources[
                    `${selectedTypeV2}|${selectedModelV2}|input`
                  ]
                }}
                {{ currency.title }}
              </div>
            </a-col>
            <a-col span="12">
              <div style="padding-bottom: 0; font-weight: 700">
                Output kilotoken:
              </div>
              <div style="padding-top: 0; font-size: 18px">
                {{
                  service.resources[
                    `${selectedTypeV2}|${selectedModelV2}|output`
                  ]
                }}
                {{ currency.title }}
              </div>
            </a-col>
          </a-row>

          <a-col span="24">
            <div class="token-title">
              Base URL:
              <copy-icon
                style="font-size: 18px"
                @click="addToClipboard(baseUrlV2)"
              />
            </div>
            <div style="padding-top: 0; font-size: 18px">
              {{ baseUrlV2 }}
            </div>
          </a-col>

          <a-col span="24">
            <div
              class="token-title"
              style="display: flex; justify-content: space-between"
            >
              <div>
                <span> API example: </span>
                <copy-icon
                  style="font-size: 18px"
                  @click="addToClipboard(exampleV2)"
                />
              </div>
              <a-button @click="openOpenAiDocs" type="link">{{
                $t("moreExamples")
              }}</a-button>
            </div>
            <code>{{ exampleV2 }}</code>
          </a-col>
        </a-tab-pane>
      </a-tabs>
    </a-col>

    <a-col span="24" style="margin-top: 10px">
      <a-button
        size="small"
        type="primary"
        :disabled="!service.status.includes('RUNNING')"
        @click="moduleEnter"
      >
        {{ capitalize($t("new chat")) }}
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
import { computed, ref, defineAsyncComponent } from "vue";
import { EyeOutlined as visibleIcon } from "@ant-design/icons-vue";
import { Status } from "@/libs/cc_connect/cc_pb.js";

import { useChatsStore } from "@/stores/chats.js";
import { useSupportStore } from "@/stores/support.js";
import { useInstancesStore } from "@/stores/instances.js";
import { useClipboard, useCurrency } from "@/hooks/utils";

import addTicket from "@/components/support/addTicket.vue";
import ticketItem from "@/components/support/ticketItem.vue";
import loading from "@/components/ui/loading.vue";

const invisibleIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/EyeInvisibleOutlined")
);
const copyIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CopyOutlined")
);

const props = defineProps({
  service: { type: Object, required: true },
});

const chatsStore = useChatsStore();
const supportStore = useSupportStore();
const instancesStore = useInstancesStore();
const { currency } = useCurrency();
const { addToClipboard } = useClipboard();

const chats = computed(() => {
  const result = [];

  chatsStore.chats.forEach((chat) => {
    const { value } = chat.meta.data.instance?.kind ?? {};
    if (value !== props.service.uuid) return;

    const status = Status[chat.status].toLowerCase().split("_");
    const capitalized = status
      .map((el) => `${el[0].toUpperCase()}${el.slice(1)}`)
      .join(" ");

    result.push({
      id: chat.uuid,
      tid: `${chat.uuid.slice(0, 8)}...`,
      title: chat.topic,
      date: Number(chat.meta.lastMessage?.sent ?? chat.created),
      message: chat.meta.lastMessage?.content ?? "",
      status: capitalized,
      unread: chat.meta.unread,
      attachments: chat.meta.lastMessage?.attachments ?? [],
    });
  });

  result.sort((a, b) => b.date - a.date);
  return result;
});

function moduleEnter() {
  supportStore.isAddingTicket = !supportStore.isAddingTicket;
}

const isVisible = ref(false);
const isLoading = ref(false);
const activeApiTab = ref("1");
const token = ref("-");

const endpointv1 = `${VUE_APP_BASE_URL}nocloud/chat/completions`;
const exampleV1 = `
  curl \`<endpoint>\`
  -X POST
  -H "Content-Type: application/json"
  -H "Authorization: Bearer \`<token>\`"
  -d '{
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Hello!" }
    ]
  }'
`;

const selectedModelV2 = ref("gpt-4o");
const selectedTypeV2 = ref("text");
const baseUrlV2 = `${VUE_APP_BASE_URL}nocloud/api`;
const exampleV2 = computed(
  () => `
  curl <baseUrl>/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "model": "${selectedModelV2.value}",
    "messages": [
      {
        "role": "developer",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'
`
);

const modelsOptionsV2 = computed(() => {
  const resources = Object.keys(props.service.resources)
    .filter(
      (key) =>
        key.split("|").length > 1 ?? key.split("|")[0] === selectedTypeV2.value
    )
    .map((key) => key.split("|")[1]);

  return [...new Set(resources).values()].map((key) => ({
    value: key,
    label: key,
  }));
});

const typesOptionsV2 = computed(() => {
  const resources = Object.keys(props.service.resources)
    .filter((key) => key.split("|").length > 1)
    .map((key) => key.split("|")[0]);

  return [...new Set(resources).values()].map((key) => ({
    value: key,
    label: key,
  }));
});

function openOpenAiDocs() {
  window.open(
    "https://platform.openai.com/docs/api-reference/chat/create",
    "_blanc"
  );
}

async function fetch() {
  try {
    isLoading.value = true;
    await chatsStore.fetchChats();

    const { meta } = await instancesStore.invokeAction({
      uuid: props.service.uuid,
      action: "instance_token",
    });

    token.value = meta.token;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

fetch();
</script>

<script>
export default { name: "OpenaiDraw" };
</script>

<style scoped>
.module :deep(.ticket) {
  background-color: var(--main);
  color: var(--bright_font);
  transition: 0.2s;
}

.module :deep(.ticket:hover) {
  background-color: var(--main);
  opacity: 0.8;
}

.module :deep(.ticket__time),
.module :deep(.ticket__status-text > .ant-badge) {
  color: var(--bright_bg);
}

.token-title {
  display: flex;
  gap: 5px;
  padding-bottom: 0;
  font-weight: 700;
}
</style>
