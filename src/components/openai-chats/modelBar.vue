<template>
  <div class="model_bar">
    <a-segmented
      :value="tier"
      :options="tierOptions"
      size="small"
      @change="onTierChange"
    />

    <a-select
      class="model_bar__select"
      size="small"
      :value="model"
      :options="modelOptions"
      @update:value="$emit('update:model', $event)"
    />

    <a-tooltip>
      <template #title>{{ t("openai.labels.speak_replies_tip") }}</template>
      <div class="model_bar__speak">
        <a-switch
          size="small"
          :checked="chatsStore.speakReplies"
          @update:checked="chatsStore.setSpeakReplies"
        />
        <span>{{ t("openai.labels.speak_replies") }}</span>
      </div>
    </a-tooltip>

    <div v-if="showBalance" class="model_bar__balance">
      {{ t("openai.labels.balance") }}:
      <strong>{{ formatPrice(userBalance) }} {{ currency.title }}</strong>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useCurrency } from "@/hooks/utils";
import {
  pickCheaperModel,
  pickSmarterModel,
  publicTextModels,
} from "./helpers.js";

const props = defineProps({
  model: { type: String, default: "" },
  models: { type: Array, default: () => [] },
  showBalance: { type: Boolean, default: true },
});

const emit = defineEmits(["update:model"]);

const { t } = useI18n();
const { currency, formatPrice } = useCurrency();
const authStore = useAuthStore();
const chatsStore = useChatsStore();
const { userBalance } = storeToRefs(authStore);

const cheaper = computed(() => pickCheaperModel(props.models));
const smarter = computed(() => pickSmarterModel(props.models));

const tier = computed(() => {
  if (props.model && props.model === cheaper.value) return "cheaper";
  if (props.model && props.model === smarter.value) return "smarter";
  return "custom";
});

const tierOptions = computed(() => [
  { value: "cheaper", label: t("openai.labels.cheaper") },
  { value: "smarter", label: t("openai.labels.smarter") },
]);

const modelOptions = computed(() =>
  publicTextModels(props.models).map((model) => ({
    value: model.key,
    label: model.name || model.key,
  }))
);

function onTierChange(value) {
  if (value === "cheaper" && cheaper.value) {
    emit("update:model", cheaper.value);
  }
  if (value === "smarter" && smarter.value) {
    emit("update:model", smarter.value);
  }
}
</script>

<style scoped>
.model_bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.model_bar__select {
  min-width: 170px;
}

.model_bar__speak {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gray);
  cursor: pointer;
}

.model_bar__balance {
  margin-left: auto;
  font-size: 13px;
  color: var(--gray);
}

@media (max-width: 768px) {
  .model_bar__balance {
    margin-left: 0;
    width: 100%;
  }
}
</style>
