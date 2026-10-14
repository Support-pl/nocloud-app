<template>
  <a-spin :spinning="isLoading">
    <div v-if="data" class="mcp">
      <div
        class="mcp__status"
        :class="{ 'mcp__status--on': data.mcp.enabled }"
      >
        <div>
          <div class="mcp__status-title">
            {{ data.mcp.enabled ? t("mcp.status_on") : t("mcp.status_off") }}
          </div>
          <div class="mcp__hint">{{ t("mcp.enabled_hint") }}</div>
        </div>
        <a-switch
          :checked="!!data.mcp.enabled"
          :loading="saving === 'enabled'"
          @change="(value) => save({ enabled: value })"
        />
      </div>

      <section class="mcp__card">
        <h3 class="mcp__heading">{{ t("mcp.allowed") }}</h3>
        <p class="mcp__hint">{{ t("mcp.allowed_hint") }}</p>
        <div v-for="item of toggles" :key="item" class="mcp__row">
          <div>
            <div class="mcp__title">{{ t(`mcp.${item}`) }}</div>
            <div class="mcp__hint">{{ t(`mcp.${item}_hint`) }}</div>
          </div>
          <a-switch
            :checked="!!data.mcp[item]"
            :disabled="!data.mcp.enabled"
            :loading="saving === item"
            @change="(value) => save({ [item]: value })"
          />
        </div>
      </section>

      <section class="mcp__card">
        <h3 class="mcp__heading">{{ t("mcp.limits") }}</h3>
        <p class="mcp__hint">{{ t("mcp.limits_hint") }}</p>
        <div class="mcp__limits">
          <div v-for="item of limits" :key="item.key" class="mcp__limit">
            <div class="mcp__title">{{ t(`mcp.${item.key}`) }}</div>
            <a-input-number
              v-model:value="form[item.key]"
              class="mcp__number"
              :min="0"
              :precision="item.money ? undefined : 0"
              :placeholder="item.money ? t('mcp.no_limit') : ''"
              :addon-after="item.money ? currency.title : undefined"
              :disabled="!data.mcp.enabled"
            />
            <div class="mcp__hint">
              {{ t(`mcp.${item.used}`, { n: used(item) }) }}
            </div>
          </div>
        </div>
        <a-button
          v-if="isDirty"
          type="primary"
          size="large"
          :loading="saving === 'limits'"
          @click="saveLimits"
        >
          {{ t("mcp.save") }}
        </a-button>
      </section>

      <section class="mcp__card">
        <h3 class="mcp__heading">{{ t("mcp.connection") }}</h3>
        <p class="mcp__hint">{{ t("mcp.connection_hint") }}</p>

        <a-input-password
          :value="data.token"
          readonly
          class="mcp__token"
          :visibility-toggle="true"
        />
        <div class="mcp__actions">
          <a-button type="primary" size="large" @click="addToClipboard(configToCopy)">
            <template #icon><copy-outlined /></template>
            {{ t("mcp.copy_config") }}
          </a-button>
          <a-button size="large" @click="addToClipboard(data.token)">
            {{ t("mcp.copy_token") }}
          </a-button>
          <a-popconfirm
            :title="t('mcp.rotate_confirm')"
            :ok-text="t('mcp.rotate')"
            :cancel-text="t('Cancel')"
            ok-type="danger"
            @confirm="rotate"
          >
            <a-button danger size="large" :loading="saving === 'token'">
              <template #icon><reload-outlined /></template>
              {{ t("mcp.rotate") }}
            </a-button>
          </a-popconfirm>
        </div>
      </section>

      <section class="mcp__card">
        <h3 class="mcp__heading">{{ t("mcp.howto") }}</h3>
        <p class="mcp__hint">{{ t("mcp.howto_intro") }}</p>
        <ol class="mcp__steps">
          <li>{{ t("mcp.howto_1") }}</li>
          <li>{{ t("mcp.howto_2") }}</li>
          <li>{{ t("mcp.howto_3") }}</li>
        </ol>
        <a-collapse :bordered="false" ghost>
          <a-collapse-panel key="format" :header="t('mcp.howto_format')">
            <div class="mcp__label">URL</div>
            <pre class="mcp__code">{{ serverUrl }}</pre>
            <div class="mcp__label">{{ t("mcp.howto_header") }}</div>
            <pre class="mcp__code">Authorization: Bearer &lt;{{ t("mcp.howto_token") }}&gt;</pre>
            <div class="mcp__label">{{ t("mcp.howto_json") }}</div>
            <pre class="mcp__code">{{ prettyConfig }}</pre>
            <p class="mcp__hint">{{ t("mcp.howto_clients") }}</p>
          </a-collapse-panel>
        </a-collapse>
        <a-alert type="warning" show-icon :message="t('mcp.howto_secret')" />
      </section>
    </div>
  </a-spin>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { CopyOutlined, ReloadOutlined } from "@ant-design/icons-vue";
import api from "@/api.js";
import { useClipboard, useCurrency, useNotification } from "@/hooks/utils";

/**
 * The account's MCP settings: what an AI client connected with the key may do for it. One block
 * of data comes back from every call, so each answer replaces `data` whole.
 */
const { t } = useI18n();
const { addToClipboard } = useClipboard();
const { openNotification } = useNotification();
const { currency } = useCurrency();

const DEFAULT_URL = "https://mcp.support.by/mcp";

const toggles = ["pay", "reboot", "tickets"];
const limits = [
  { key: "ordersDay", used: "used_orders", counter: "ordersToday" },
  { key: "rebootsDay", used: "used_reboots", counter: "rebootsToday" },
  { key: "spendDay", used: "used_spend", counter: "spentDay", money: true },
  { key: "spendMonth", used: "used_spend_month", counter: "spentMonth", money: true },
];

const data = ref(null);
const isLoading = ref(false);
const saving = ref("");
/** The limits as typed. */
const form = ref({});

/** A limit as saved: a missing count is 0, a missing money limit is none. */
const saved = ({ key, money }) => data.value.mcp[key] ?? (money ? null : 0);

const run = async (key, request) => {
  saving.value = key;
  try {
    data.value = await request();
    form.value = Object.fromEntries(limits.map((item) => [item.key, saved(item)]));
  } catch (error) {
    openNotification("error", {
      message: error.response?.data?.message ?? error.message ?? error,
    });
  } finally {
    saving.value = "";
  }
};

/** Sends only the given fields: the mask names them, so the rest stay as they are. */
const save = (fields) =>
  run(Object.keys(fields)[0], () =>
    api.patch("/accounts/me/mcp", {
      updateMask: Object.keys(fields).join(","),
      ...fields,
    })
  );

/** A limit as typed: a count left empty is 0, a money limit left empty is none. */
const typed = ({ key, money }) => form.value[key] ?? (money ? null : 0);

const changedLimits = () => limits.filter((item) => typed(item) !== saved(item));

const isDirty = computed(() => changedLimits().length > 0);

const saveLimits = () => {
  const changed = changedLimits();
  // a money limit in the mask without a value is no limit
  const fields = Object.fromEntries(
    changed.filter((item) => typed(item) !== null).map((item) => [item.key, typed(item)])
  );
  const mask = changed.map(({ key }) => key).join(",");

  return run("limits", () =>
    api.patch("/accounts/me/mcp", { updateMask: mask, ...fields })
  );
};

const rotate = () => run("token", () => api.post("/accounts/me/mcp/token", {}));

const used = ({ counter, money }) => {
  const value = data.value[counter] ?? 0;
  return money ? `${value} ${currency.value.title ?? ""}` : value;
};

/**
 * The config comes as one line of JSON. It is copied indented, so it reads when pasted; a string
 * that does not parse is copied as it came.
 */
const parsedConfig = computed(() => {
  try {
    return JSON.parse(data.value.config);
  } catch {
    return null;
  }
});
const serverUrl = computed(
  () => parsedConfig.value?.mcpServers?.["support.by"]?.url ?? DEFAULT_URL
);
const configToCopy = computed(() =>
  parsedConfig.value
    ? JSON.stringify(parsedConfig.value, null, 2)
    : data.value.config
);
const prettyConfig = computed(() =>
  JSON.stringify(
    {
      mcpServers: {
        "support.by": {
          url: serverUrl.value,
          headers: { Authorization: "Bearer <token>" },
        },
      },
    },
    null,
    2
  )
);

onMounted(async () => {
  isLoading.value = true;
  await run("", () => api.get("/accounts/me/mcp"));
  isLoading.value = false;
});
</script>

<script>
export default { name: "McpSettings" };
</script>

<style scoped>
.mcp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mcp__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid var(--border_color);
  border-radius: 12px;
}

.mcp__status--on {
  border-color: var(--success);
  background-color: color-mix(in srgb, var(--success) 8%, transparent);
}

.mcp__status-title {
  font-size: 1.15rem;
  font-weight: 600;
}

.mcp__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--border_color);
  border-radius: 12px;
}

.mcp__heading {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.mcp__card p {
  margin: 0;
}

.mcp__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border_color);
}

.mcp__title {
  font-weight: 500;
}

.mcp__hint {
  color: var(--gray);
  font-size: 0.9rem;
}

.mcp__steps {
  margin: 0;
  padding-left: 20px;
  line-height: 1.7;
}

.mcp__limits {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.mcp__limit {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mcp__number {
  width: 100%;
}

.mcp__token {
  font-family: monospace;
}

.mcp__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mcp__label {
  margin: 8px 0 2px;
  font-weight: 500;
}

.mcp__code {
  margin: 0;
  padding: 8px 12px;
  overflow-x: auto;
  border: 1px solid var(--border_color);
  border-radius: 8px;
  font-size: 0.85rem;
}

@media (max-width: 576px) {
  .mcp__limits {
    grid-template-columns: 1fr;
  }

  .mcp__actions .ant-btn {
    flex: 1 1 100%;
  }
}
</style>
