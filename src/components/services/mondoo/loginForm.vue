<template>
  <div v-if="expanded">
    <p class="login__hint">{{ $t("mondoo.login.hint") }}</p>
    <a-form layout="vertical" autocomplete="off">
      <a-form-item :label="$t('mondoo.login.user')">
        <a-input
          :value="value.user"
          autocomplete="off"
          placeholder="root"
          @update:value="set('user', $event)"
        />
      </a-form-item>
      <a-form-item :label="$t('mondoo.login.password')">
        <a-input-password
          :value="value.password"
          autocomplete="new-password"
          @update:value="set('password', $event)"
        />
      </a-form-item>
      <a-form-item :label="$t('mondoo.login.key')">
        <a-textarea
          :value="value.key"
          :rows="4"
          spellcheck="false"
          class="login__key"
          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
          @update:value="set('key', $event)"
        />
      </a-form-item>
    </a-form>
  </div>
  <a-collapse v-else ghost class="login">
    <a-collapse-panel key="login" :header="$t('mondoo.login.title')">
      <p class="login__hint">{{ $t("mondoo.login.hint") }}</p>
      <a-form layout="vertical" autocomplete="off">
        <a-form-item :label="$t('mondoo.login.user')">
          <a-input
            :value="value.user"
            autocomplete="off"
            placeholder="root"
            @update:value="set('user', $event)"
          />
        </a-form-item>
        <a-form-item :label="$t('mondoo.login.password')">
          <a-input-password
            :value="value.password"
            autocomplete="new-password"
            @update:value="set('password', $event)"
          />
        </a-form-item>
        <a-form-item :label="$t('mondoo.login.key')">
          <a-textarea
            :value="value.key"
            :rows="4"
            spellcheck="false"
            class="login__key"
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
            @update:value="set('key', $event)"
          />
        </a-form-item>
      </a-form>
    </a-collapse-panel>
  </a-collapse>
</template>

<script setup>
// An SSH login for one scan or fix, for a server our own key no longer opens.
const props = defineProps({
  value: { type: Object, required: true },
  expanded: { type: Boolean, default: false },
});
const emit = defineEmits(["update:value"]);

const set = (field, v) => emit("update:value", { ...props.value, [field]: v });
</script>

<script>
export default { name: "MondooLoginForm" };
</script>

<style scoped>
.login {
  margin: 0 0 0 -16px;
}

.login__hint {
  color: var(--gray);
}

.login__key {
  font-family: monospace;
  font-size: 12px;
}

.login :deep(.ant-form-item) {
  margin-bottom: 10px;
}
</style>
