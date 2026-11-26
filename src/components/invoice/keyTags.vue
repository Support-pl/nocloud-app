<template>
  <div v-if="apiKeys.list.length" class="key-tags">
    <span class="key-tags__label">{{ t("invoices.reports.key") }}:</span>
    <a-button
      v-for="key in apiKeys.list"
      :key="key.id"
      class="key-filter-btn"
      :class="{ 'key-filter-btn--deleted': key.revoked }"
      :type="modelValue.includes(key.id) ? 'primary' : 'default'"
      @click="toggle(key.id)"
    >
      {{ key.name }}
      <span v-if="key.revoked" class="deleted-mark">
        ({{ t("invoices.reports.deleted") }})
      </span>
    </a-button>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useApiKeysStore } from "@/stores/apiKeys.js";

/** Filter chips over the account's API keys: the ids of the selected ones. */
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue"]);

const { t } = useI18n();
const apiKeys = useApiKeysStore();

function toggle(id) {
  emit(
    "update:modelValue",
    props.modelValue.includes(id)
      ? props.modelValue.filter((selected) => selected !== id)
      : [...props.modelValue, id]
  );
}

onMounted(apiKeys.fetch);
</script>

<script>
export default { name: "KeyTags" };
</script>

<style lang="scss" scoped>
.key-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.key-tags__label {
  color: var(--gray);
  margin-right: 4px;
}

.key-filter-btn {
  margin: 0;
}

.key-filter-btn--deleted:not(.ant-btn-primary) {
  opacity: 0.6;
}

.deleted-mark {
  font-size: 0.85em;
}
</style>
