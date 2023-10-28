<template>
  <a-row
    type="flex"
    justify="space-around"
    style="
      margin-top: 15px;
      margin-bottom: 10px;
      border-top: 1px solid #e8e8e8;
    "
  >
    <slot name="before" />

    <a-col :span="22" style="margin-top: 15px">
      <a-button
        v-if="options.nextButton.visible"
        block
        type="primary"
        shape="round"
        @click="options.nextButton.onClick"
      >
        {{ $t('next') | capitalize }}
      </a-button>

      <a-button
        v-else
        block
        type="primary"
        shape="round"
        :disabled="options.createButton.disabled"
        @click="options.createButton.onClick"
      >
        {{ $t('Create') }}
      </a-button>

      <a-modal
        :title="$t(options.modal.title)"
        :visible="options.modal.visible"
        :ok-button-props="{
          props: options.modal.okProps
        }"
        :confirm-loading="options.modal.loading"
        :cancel-text="options.modal.cancelText ?? $t('Cancel')"
        @ok="options.modal.onOk"
        @cancel="options.modal.onCancel"
      >
        <slot name="modalContent" />
      </a-modal>
    </a-col>

    <slot name="after" />
  </a-row>
</template>

<script setup>
defineProps({
  options: { type: Object, required: true }
})
</script>

<script>
export default { name: 'CreateButton' }
</script>
