<template>
  <div class="mcp">
    <p class="mcp__hint">{{ t("bots.mcp.hint") }}</p>

    <div v-for="(s, si) in list" :key="si" class="srv">
      <div class="srv__head">
        <a-input
          v-model:value="s.name"
          class="srv__name"
          :placeholder="t('bots.mcp.name_ph')"
          @change="emitChange"
        />
        <div class="srv__switch">
          <span>{{ t("bots.mcp.enabled") }}</span>
          <a-switch v-model:checked="s.enabled" @change="emitChange" />
        </div>
        <a-button type="text" danger @click="removeServer(si)">✕</a-button>
      </div>

      <label class="mcp__lbl">{{ t("bots.mcp.url") }}</label>
      <a-input
        v-model:value="s.url"
        placeholder="https://mcp.example.com/mcp"
        @change="emitChange"
      />

      <label class="mcp__lbl">
        {{ t("bots.mcp.headers") }}
        <a-tooltip :title="t('bots.mcp.headers_tip')"><help-icon /></a-tooltip>
      </label>
      <div v-for="(h, hi) in s._headers" :key="hi" class="hdr">
        <a-input
          v-model:value="h.k"
          class="hdr__k"
          placeholder="Authorization"
          @change="emitChange"
        />
        <a-input
          v-model:value="h.v"
          class="hdr__v"
          placeholder="Bearer …"
          @change="emitChange"
        />
        <a-button type="text" danger @click="(s._headers.splice(hi, 1), emitChange())">✕</a-button>
      </div>
      <a-button size="small" type="dashed" @click="(s._headers.push({ k: '', v: '' }), emitChange())">
        + {{ t("bots.mcp.add_header") }}
      </a-button>

      <div class="srv__switch srv__switch--wide">
        <span>
          {{ t("bots.mcp.inject_account") }}
          <a-tooltip :title="t('bots.mcp.inject_account_tip')"><help-icon /></a-tooltip>
        </span>
        <a-switch v-model:checked="s.inject_account" @change="emitChange" />
      </div>
    </div>

    <a-button type="dashed" block @click="addServer">
      + {{ t("bots.mcp.add_server") }}
    </a-button>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { QuestionCircleOutlined as HelpIcon } from "@ant-design/icons-vue";

const { t } = useI18n();

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue"]);

// Internal working copy: each server carries a UI-only `_headers` list of
// {k,v} rows edited in the form; it is rebuilt into the headers map on emit.
const list = ref([]);

function fromModel(servers) {
  return (servers || []).map((s) => ({
    name: s.name || "",
    url: s.url || "",
    inject_account: !!s.inject_account,
    enabled: s.enabled !== false,
    _headers: Object.entries(s.headers || {}).map(([k, v]) => ({ k, v })),
  }));
}

function toModel() {
  return list.value.map((s) => {
    const headers = {};
    for (const { k, v } of s._headers) {
      if (k.trim()) headers[k.trim()] = v;
    }
    return {
      name: s.name,
      url: s.url,
      headers,
      inject_account: s.inject_account,
      enabled: s.enabled,
    };
  });
}

function emitChange() {
  emit("update:modelValue", toModel());
}

function addServer() {
  list.value.push({ name: "", url: "", inject_account: false, enabled: true, _headers: [] });
  emitChange();
}
function removeServer(i) {
  list.value.splice(i, 1);
  emitChange();
}

list.value = fromModel(props.modelValue);

// Resync when the parent replaces the array (e.g. applying the flow template
// adds the default server) — but not on our own echoed emits.
watch(
  () => props.modelValue,
  (v) => {
    if (JSON.stringify(toModel()) !== JSON.stringify(v || [])) {
      list.value = fromModel(v);
    }
  }
);
</script>

<style scoped>
.mcp__hint {
  font-size: 0.85rem;
  color: #999;
  margin: 0 0 12px;
}
.mcp__lbl {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin: 12px 0 4px;
}
.srv {
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fcfcfc;
}
.srv__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.srv__name {
  flex: 1;
  font-weight: 600;
}
.srv__switch {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.srv__switch--wide {
  justify-content: space-between;
  margin-top: 12px;
}
.hdr {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}
.hdr__k {
  flex: 0 0 40%;
}
.hdr__v {
  flex: 1;
}
</style>
