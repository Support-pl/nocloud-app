<template>
  <a-row class="module" style="margin-top: 10px" :gutter="[10, 10]">
    <a-col span="24">
      <a-tabs v-model:activeKey="activeApiTab">
        <a-tab-pane key="2" tab="API v2">
          <openai-prices
            :selected-model="selectedModelV2"
            @update:selectedModel="selectedModelV2 = $event"
            :selected-provider="selectedProviderV2"
            @update:selectedProvider="selectedProviderV2 = $event"
            :selected-type="selectedTypeV2"
            @update:selectedType="selectedTypeV2 = $event"
          />

          <a-col span="24" style="margin: 5px 0px">
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
              <copy-icon
                style="font-size: 18px"
                @click="addToClipboard(token)"
              />
            </div>
            <div
              style="padding-top: 0; font-size: 18px; word-break: break-word"
            >
              {{ isVisible ? token : `${token.slice(0, 15)}...` }}
            </div>
          </a-col>

          <a-col span="24" style="margin: 5px 0px">
            <div
              class="token-title"
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                "
              >
                <span> {{ t("openai.labels.api_example") }} </span>
                <copy-icon
                  style="font-size: 18px; margin-left: 5px"
                  @click="addToClipboard(exampleV2)"
                />
              </div>
              <a-button
                v-if="selectedTypeV2 !== 'video'"
                @click="openOpenAiDocs"
                type="link"
                >{{ $t("moreExamples") }}</a-button
              >
            </div>
            <code>{{ exampleV2 }}</code>
          </a-col>

          <a-collapse
            v-if="selectedTypeV2 === 'video'"
            @change="onCallapseOpen"
          >
            <a-collapse-panel key="video" :header="t('moreExamples')">
              <div id="swagger-video" />
            </a-collapse-panel>
          </a-collapse>
        </a-tab-pane>

        <a-tab-pane key="1" style="opacity: 0.5">
          <template #tab>
            <span style="opacity: 0.5"> API v1 (DEPRECATED) </span>
          </template>

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
              <copy-icon
                style="font-size: 18px"
                @click="addToClipboard(token)"
              />
            </div>
            <div
              style="padding-top: 0; font-size: 18px; word-break: break-word"
            >
              {{ isVisible ? token : `${token.slice(0, 15)}...` }}
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
      <openai-ticket-item
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

  <add-ticket
    :model="selectedModelV2"
    :provider="selectedProviderV2"
    :instance-id="service.uuid"
  />
</template>

<script setup>
import {
  computed,
  ref,
  defineAsyncComponent,
  capitalize,
  onMounted,
  watch,
} from "vue";
import { EyeOutlined as visibleIcon } from "@ant-design/icons-vue";
import { Status } from "@/libs/cc_connect/cc_pb.js";
import openaiPrices from "./prices.vue";

import { useChatsStore } from "@/stores/chats.js";
import { useSupportStore } from "@/stores/support.js";
import { useInstancesStore } from "@/stores/instances.js";
import { useClipboard, useCurrency } from "@/hooks/utils";
import SwaggerUI from "swagger-ui";
import "swagger-ui/dist/swagger-ui.css";
import addTicket from "@/components/support/addTicket.vue";
import OpenaiTicketItem from "@/components/support/openaiTicketItem.vue";
import loading from "@/components/ui/loading.vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";

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
const appStore = useAppStore();
const supportStore = useSupportStore();
const instancesStore = useInstancesStore();
const { currency } = useCurrency();
const { addToClipboard } = useClipboard();
const { t, locale } = useI18n();

const chats = computed(() => {
  const result = [];

  chatsStore.chats.forEach((chat) => {
    const { value } = chat.meta.data.instance?.kind ?? {};
    if (value !== props.service.uuid) return;
    const { value: model } = chat.meta.data.model?.kind ?? {};

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
      model,
      attachments: chat.meta.lastMessage?.attachments ?? [],
    });
  });

  result.sort((a, b) => b.date - a.date);
  return result;
});

onMounted(() => {
  appStore.setTabByNameNoRoute("openai-api");
});

function moduleEnter() {
  supportStore.isAddingTicket = !supportStore.isAddingTicket;
}

const isVisible = ref(false);
const isSwaggerVideosInitWas = ref(false);
const isLoading = ref(false);
const activeApiTab = ref("2");
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
const selectedProviderV2 = ref("openai");
const selectedTypeV2 = ref("text");
const baseUrlV2 = `${window.location.origin}/api/openai`;
const exampleV2 = computed(() => {
  if (selectedTypeV2.value === "image") {
    return `
  curl ${baseUrlV2}/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "model": "${selectedModelV2.value}",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024"
  }'`;
  } else if (
    ["audio_to_text", "text_to_audio"].includes(selectedTypeV2.value)
  ) {
    return `
  curl ${baseUrlV2}/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "model": "${selectedModelV2.value}",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "alloy"
  }'
--output speech.mp3`;
  } else if (selectedTypeV2.value === "video") {
    return `
  curl ${baseUrlV2}video/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "model": "${selectedModelV2.value}",
    "prompt": "Сyberpunk car driving down the road. Engine roar sounds",
    "aspect_ratio": "16:9",
    "duration": 8,
    "generate_audio": true
  }'
`;
  } else if (selectedTypeV2.value === "embedding") {
    return `curl ${baseUrlV2}api/openai/embeddings -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{
    "input": "The food was delicious and the waiter...",
    "model": "${selectedModelV2.value}"
  }'`;
  } else {
    return `
  curl ${baseUrlV2}/v1/chat/completions \
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
`;
  }
});

function openOpenAiDocs() {
  window.open(
    "https://platform.openai.com/docs/api-reference/chat/create",
    "_blanc"
  );
}

function onCallapseOpen() {
  if (isSwaggerVideosInitWas.value) {
    return;
  }
  isSwaggerVideosInitWas.value = true;
  setTimeout(() => {
    SwaggerUI({
      dom_id: "#swagger-video",
      url: `/schemas/swagger-video.${locale.value}.json`,
      docExpansion: "full",
      supportedSubmitMethods: [],
      tryItOutEnabled: false,
      defaultModelsExpandDepth: -1,
    });
  }, 200);
}

async function fetch() {
  try {
    isLoading.value = true;

    await chatsStore.fetchChats();
    await chatsStore.fetch_models_list();

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

watch(selectedTypeV2, (curr, prev) => {
  if (prev == "video") {
    isSwaggerVideosInitWas.value = false;
  }
});
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

<style>
.swagger-ui .opblock-summary {
  pointer-events: none;
  cursor: default !important;
  user-select: none;
}

.swagger-ui .opblock-tag {
  display: none;
}

.swagger-ui .main {
  display: none;
}

.swagger-ui .opblock-section-header {
  display: none;
}
.swagger-ui .parameters-container {
  display: none;
}

.ant-collapse-content-box {
  padding: 0px !important;
}
</style>
