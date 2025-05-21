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
        <a-tab-pane key="2" tab="API v2">
          <a-row style="padding: 0px 5px">
            <a-col span="4" style="min-width: 100px; margin-right: 5px">
              <a-select
                style="width: 100%; margin-top: 10px"
                v-model:value="selectedProviderV2"
                :options="providersOptionsV2"
              ></a-select>
            </a-col>

            <a-col span="7" style="min-width: 150px; margin-right: 5px">
              <a-select
                style="width: 100%; margin-right: 5px; margin-top: 10px"
                v-model:value="selectedTypeV2"
                :options="typesOptionsV2"
              ></a-select>
            </a-col>

            <a-col span="12" style="margin-right: 5px">
              <a-auto-complete
                style="margin-right: 10px; width: 100%; margin-top: 10px"
                v-model:value="selectedModelV2"
                :options="sortedModelsOptionsV2"
                @blur="selectedModelV2 = modelsOptionsV2[0]?.value"
              ></a-auto-complete>
            </a-col>

            <a-col
              v-if="selectedTypeV2 !== 'image'"
              v-for="priceItem in pricesItemsV2"
              span="12"
            >
              <div style="padding-bottom: 0; font-weight: 700">
                {{
                  t(
                    `openai.payment_types.${priceItem
                      .split("|")
                      .slice(2)
                      .join("_")}`
                  )
                }}:
              </div>
              <div style="padding-top: 0; font-size: 18px">
                {{ fullPrices[priceItem] }}
                {{ currency.title }}
              </div>
            </a-col>

            <a-col v-else span="24">
              <a-table
                :pagination="false"
                :dataSource="
                  pricesItemsV2.map((key) => ({
                    resolution: key.split('|')[2],
                    quality: t(`openai.images_quality.${key.split('|')[3]}`),
                    price: `${fullPrices[key]} ${currency.title}`,
                  }))
                "
                :columns="imagesColumns"
              />
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
                <span> {{ t("openai.labels.api_example") }} </span>
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
import { computed, ref, defineAsyncComponent, watch, capitalize } from "vue";
import { EyeOutlined as visibleIcon } from "@ant-design/icons-vue";
import { Status } from "@/libs/cc_connect/cc_pb.js";

import { useChatsStore } from "@/stores/chats.js";
import { useSupportStore } from "@/stores/support.js";
import { useInstancesStore } from "@/stores/instances.js";
import { useClipboard, useCurrency } from "@/hooks/utils";

import addTicket from "@/components/support/addTicket.vue";
import ticketItem from "@/components/support/ticketItem.vue";
import loading from "@/components/ui/loading.vue";
import api from "@/api";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { usePlansStore } from "@/stores/plans";

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
const { globalModelsList } = storeToRefs(chatsStore);
const supportStore = useSupportStore();
const plansStore = usePlansStore();
const instancesStore = useInstancesStore();
const { currency } = useCurrency();
const { addToClipboard } = useClipboard();
const { t } = useI18n();

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
const fullPrices = ref({});
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
  curl <baseUrl>/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "model": "${selectedModelV2.value}",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024"
  }'`;
  } else if (selectedTypeV2.value === "audio") {
    return `
  curl <baseUrl>/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "model": "${selectedModelV2.value}",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "alloy"
  }'
--output speech.mp3`;
  } else {
    return `
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
`;
  }
});

const imagesColumns = computed(() => [
  {
    title: t("openai.images_properties.resolution"),
    dataIndex: "resolution",
    key: "resolution",
  },
  {
    title: t("openai.images_properties.quality"),
    dataIndex: "quality",
    key: "quality",
  },
  {
    title: t("openai.images_properties.price"),
    dataIndex: "price",
    key: "price",
  },
]);

const modelByProvidersV2 = computed(() => {
  const resources = Object.keys(props.service?.resources || {})
    .filter((key) => key.split("|").length > 2)
    .filter((key) =>
      (globalModelsList.value[selectedProviderV2.value] || []).includes(
        key.split("|")[1]
      )
    );

  return resources;
});

const modelsOptionsV2 = computed(() => {
  const resources = modelByProvidersV2.value
    .filter((key) => getModelType(key) === selectedTypeV2.value)
    .map((key) => key.split("|")[1]);

  return [...new Set(resources).values()].map((key) => ({
    value: key,
    label: `${capitalize(t("model"))}: ${key}`,
  }));
});

const sortedModelsOptionsV2 = computed(() => {
  return modelsOptionsV2.value.sort((a, b) => {
    const va = (v, s) =>
      v.toLowerCase().startsWith(s.toLowerCase())
        ? 2
        : v.toLowerCase().includes(s.toLowerCase())
        ? 1
        : 0;
    return (
      va(b.label, selectedModelV2.value) - va(a.label, selectedModelV2.value)
    );
  });
});

const typesOptionsV2 = computed(() => {
  const resources = modelByProvidersV2.value.map((key) => getModelType(key));

  return [...new Set(resources).values()].map((key) => ({
    value: key,
    label: t(`openai.types.${key}`),
  }));
});

const providersOptionsV2 = computed(() => {
  return Object.keys(globalModelsList.value || {}).map((key) => ({
    value: key,
    label: t(`openai.providers.${key}`),
  }));
});

const pricesItemsV2 = computed(() => {
  const data = Object.keys(props.service.resources).filter((r) =>
    r.startsWith(`${selectedTypeV2.value}|${selectedModelV2.value}|`)
  );
  if (selectedTypeV2.value === "image") {
    const imagesData = data.filter((resource, index) => {
      const subtype = resource.split("|")[2];
      let reversedSubType = `${subtype.split("x")[1]}x${subtype.split("x")[0]}`;
      reversedSubType += `|${resource.split("|")[3]}`;
      let indexOfReversed = data.findIndex(
        (r) => r.split("|").slice(2).join("|") === reversedSubType
      );

      indexOfReversed =
        indexOfReversed === -1 ? Number.MAX_SAFE_INTEGER : indexOfReversed;

      return !(
        index > indexOfReversed &&
        fullPrices.value[data[indexOfReversed]] === fullPrices.value[resource]
      );
    });

    return imagesData;
  }

  return data;
});

function getModelType(key) {
  const type = key.split("|")[0];

  if (["speech", "translation", "transcription"].includes(type)) {
    return "audio";
  }
  return type;
}

function openOpenAiDocs() {
  window.open(
    "https://platform.openai.com/docs/api-reference/chat/create",
    "_blanc"
  );
}

async function fetch() {
  try {
    isLoading.value = true;

    (
      await plansStore.fetchById(props.service.billingPlan.uuid)
    ).resources.forEach((r) => {
      fullPrices.value[r.key] = r.price;
    });

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

watch(typesOptionsV2, (data) => {
  if (!data.find((v) => v.value === selectedTypeV2.value)) {
    selectedTypeV2.value = data[0]?.value;
  }
});

watch(modelsOptionsV2, (data) => {
  if (!data.find((v) => v.value === selectedModelV2.value)) {
    selectedModelV2.value = data[0]?.value;
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
