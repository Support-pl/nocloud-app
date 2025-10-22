<template>
  <a-row
    type="flex"
    justify="space-around"
    style="margin-top: 15px; margin-bottom: 10px; border-top: 1px solid #e8e8e8"
  >
    <slot name="before" />

    <a-col :span="22" style="margin-top: 15px">
      <a-button
        v-if="nextButtonOptions.visible"
        block
        type="primary"
        shape="round"
        @click="nextButtonOptions.onClick"
      >
        {{ capitalize($t("next")) }}
      </a-button>

      <a-button
        v-else
        block
        type="primary"
        shape="round"
        :disabled="createButtonOptions.disabled"
        @click="createButtonOptions.onClick"
      >
        {{ $t("Create") }}
      </a-button>

      <a-modal
        :title="$t(modalOptions.title)"
        :open="modalOptions.visible"
        :ok-button-props="{
          props: modalOptions.okProps,
        }"
        :confirm-loading="modalOptions.loading"
        :cancel-text="modalOptions.cancelText ?? $t('Cancel')"
        @ok="modalOptions.onOk"
        @cancel="modalOptions.onCancel"
      >
        <slot name="modalContent" />
      </a-modal>
    </a-col>

    <slot name="after" />
  </a-row>
</template>

<script setup>
import { toRefs } from "vue";

const props = defineProps({
  modalOptions: { type: Object, required: true },
  createButtonOptions: { type: Object, required: true },
  nextButtonOptions: { type: Object, required: true },
});

const { modalOptions, createButtonOptions, nextButtonOptions } = toRefs(props);
</script>

<script>
export default { name: "CreateActions" };
</script>
