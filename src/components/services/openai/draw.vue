<template>
  <a-row class="module" style="margin-top: 10px" :gutter="[10, 10]">
    <a-col span="24">
      <a-tabs v-model:activeKey="activeApiTab">
        <a-tab-pane key="2" tab="API v2">
          <openai-prices
            compact
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
                  @click="addToClipboard(exampleV2.replace('<token>', token))"
                />
              </div>
              <template
                v-if="!['video', 'vision'].includes(selectedTypeV2)"
                style="display: flex; align-items: center"
              >
                <div
                  style="height: 25px; font-weight: normal"
                  v-html="
                    marked(
                      t('openai.labels.api_compatible_with_openai')
                    )
                  "
                />
              </template>
            </div>
            <pre
              class="code-block"
            ><code class="language-curl" v-html="highlightedExampleV2"></code></pre>
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
            <pre
              class="code-block"
            ><code class="language-curl" v-html="highlightedExampleV1"></code></pre>
          </a-col>
        </a-tab-pane>
      </a-tabs>
    </a-col>

    <a-col span="24" style="margin-top: 10px">
      <a-button
        size="small"
        type="primary"
        :disabled="!service.status.includes('RUNNING')"
        @click="
          router.replace({
            name: 'openaiChats',
            params: { id: service.uuid },
            query: { create: true },
          })
        "
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
import { useInstancesStore } from "@/stores/instances.js";
import { useClipboard, useCurrency } from "@/hooks/utils";
import SwaggerUI from "swagger-ui";
import "swagger-ui/dist/swagger-ui.css";
import loading from "@/components/ui/loading.vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";
import TicketItem from "@/components/openai-chats/ticketItem.vue";
import router from "@/router";
import { marked } from "marked";

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
const instancesStore = useInstancesStore();
const { currency } = useCurrency();
const { addToClipboard } = useClipboard();
const { t, locale } = useI18n();

// handle links for instrction
const renderer = new marked.Renderer();

renderer.link = function (href, title, text) {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked.setOptions({ renderer });

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

const isVisible = ref(false);
const isSwaggerVideosInitWas = ref(false);
const isLoading = ref(false);
const activeApiTab = ref("2");
const token = ref("-");

const endpointv1 = `${VUE_APP_BASE_URL}nocloud/chat/completions`;
const exampleV1 = `curl <endpoint> \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "messages": [
      {
        "role": "system", 
        "content": "You are a helpful assistant."
      },
      {
        "role": "user", 
        "content": "Hello!"
      }
    ]
  }'`;

const selectedModelV2 = ref("gpt-4o-mini");
const selectedProviderV2 = ref("openai");
const selectedTypeV2 = ref("text");
const baseUrlV2 = `${window.location.origin}/api/openai`;
const exampleV2 = computed(() => {
  if (selectedTypeV2.value === "image") {
    return `curl ${baseUrlV2}/v1/images/generations \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "model": "${selectedModelV2.value}",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024"
  }'`;
  } else if (
    ["audio_to_text", "text_to_audio"].includes(selectedTypeV2.value)
  ) {
    return `curl ${baseUrlV2}/v1/audio/speech \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "model": "${selectedModelV2.value}",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "alloy"
  }' \\
  --output speech.mp3`;
  } else if (selectedTypeV2.value === "video") {
    return `curl ${baseUrlV2}/video/generate \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "model": "${selectedModelV2.value}",
    "prompt": "Cyberpunk car driving down the road",
    "aspect_ratio": "16:9",
    "duration": 8,
    "generate_audio": true
  }'`;
  } else if (selectedTypeV2.value === "vision") {
    return `curl ${baseUrlV2}/vision \\
  -X POST \\
  -H "Authorization: Bearer <token>" \\
  -F "file=@/path/to/image.png" \\
  -F "model=${selectedModelV2.value}"`;
  } else if (selectedTypeV2.value === "embedding") {
    return `curl ${baseUrlV2}/embeddings \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{
    "input": "The food was delicious and the waiter...",
    "model": "${selectedModelV2.value}"
  }'`;
  } else {
    return `curl ${baseUrlV2}/v1/chat/completions \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
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
  }'`;
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

watch(selectedTypeV2, (_, prev) => {
  if (prev == "video") {
    isSwaggerVideosInitWas.value = false;
  }
});

function highlightCurl(code) {
  return code
    .replace("<token>", token.value.slice(0, 15) + "...")
    .replace(/^curl/gm, '<span class="hljs-built_in">curl</span>')
    .replace(/\s(-[A-Za-z]+)/g, ' <span class="hljs-params">$1</span>')
    .replace(
      /(POST|GET|PUT|DELETE|PATCH)/g,
      '<span class="hljs-string">$1</span>'
    )
    .replace(/(https?:\/\/[^\s]+)/g, '<span class="hljs-link">$1</span>')
    .replace(/"([^"]*)"(?=\s|$|,)/g, '<span class="hljs-string">"$1"</span>')
    .replace(/"([^"]*)"(\s*:)/g, '<span class="hljs-attr">"$1"</span>$2')
    .replace(/:\s*"([^"]*)"/g, ': <span class="hljs-string">"$1"</span>')
    .replace(/:\s*(\d+)/g, ': <span class="hljs-number">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="hljs-literal">$1</span>')
    .replace(/\\$/gm, '<span class="hljs-meta">\\</span>')
    .replace(/([{}[\]])/g, '<span class="hljs-punctuation">$1</span>');
}

const highlightedExampleV1 = computed(() => {
  const highlighted = highlightCurl(exampleV1);
  return addLineNumbers(highlighted);
});

const highlightedExampleV2 = computed(() => {
  const highlighted = highlightCurl(exampleV2.value);
  return addLineNumbers(highlighted);
});

function addLineNumbers(code) {
  const lines = code.split("\n");
  return lines
    .map(
      (line, index) =>
        `<span class="line-number" data-line="${index + 1}">${line}</span>`
    )
    .join("\n");
}
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
  font-size: 1rem;
}

.code-block {
  background-color: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  margin: 8px 0;
  overflow-x: auto;
  font-family: "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo",
    monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #e6edf3;
  position: relative;
  padding-left: 0;
}

.code-block code {
  background: none;
  padding: 16px 16px 16px 60px;
  border: none;
  font-family: inherit;
  font-size: inherit;
  display: block;
  white-space: pre;
  overflow-x: auto;
  margin: 0;
}

.code-block::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 25px;
  background-color: #161b22;
  border-right: 1px solid #30363d;
}

.code-block code :deep(.line-number) {
  position: relative;
}

.code-block code :deep(.line-number::before) {
  content: attr(data-line);
  position: absolute;
  left: -60px;
  padding-right: 12px;
  text-align: right;
  color: #7d8590;
  font-size: 12px;
  user-select: none;
  pointer-events: none;
  margin-left: 5px;
}

.code-block code :deep(.hljs-built_in) {
  color: #ffa657;
}

.code-block code :deep(.hljs-params) {
  color: #ff7b72;
}

.code-block code :deep(.hljs-string) {
  color: #a5d6ff;
}

.code-block code :deep(.hljs-attr) {
  color: #7ee787;
}

.code-block code :deep(.hljs-number) {
  color: #79c0ff;
}

.code-block code :deep(.hljs-literal) {
  color: #79c0ff;
}

.code-block code :deep(.hljs-link) {
  color: #58a6ff;
}

.code-block code :deep(.hljs-meta) {
  color: #8b949e;
}

.code-block code :deep(.hljs-punctuation) {
  color: #e6edf3;
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
