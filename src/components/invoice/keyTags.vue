<template>
  <div class="key-tags">
    <a-button
      v-for="key in apiKeys.list"
      :key="key.id"
      class="key-filter-btn"
      :class="{ 'key-filter-btn--deleted': key.revoked }"
      :type="modelValue.includes(key.id) ? 'primary' : 'default'"
      @click="toggle(key.id)"
    >
      <div class="key-content">
        {{ key.name }}
        <span v-if="key.revoked" class="deleted-mark">
          ({{ t("invoices.reports.deleted") }})
        </span>
        <plus-icon v-if="!modelValue.includes(key.id)" class="toggle-icon" />
        <minus-icon v-else class="toggle-icon" />
      </div>
    </a-button>
    <span v-if="!apiKeys.list.length" class="key-tags__empty">
      {{ t("invoices.reports.no_keys") }}
    </span>
  </div>
</template>

<script setup>
import { defineAsyncComponent, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useApiKeysStore } from "@/stores/apiKeys.js";

const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusCircleOutlined")
);
const minusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CloseCircleOutlined")
);

/** Filter chips over the account's API keys, styled as the service chips: the selected ids. */
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
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.key-filter-btn {
  margin: 0;
  cursor: pointer;
  user-select: none;
}

.key-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-icon {
  font-size: 14px;
}

.key-filter-btn--deleted:not(.ant-btn-primary) {
  opacity: 0.6;
}

.deleted-mark {
  font-size: 0.85em;
}

.key-tags__empty {
  color: var(--gray);
}
</style>
