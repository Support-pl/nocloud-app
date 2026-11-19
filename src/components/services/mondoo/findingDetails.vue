<template>
  <a-spin v-if="loading" />
  <div v-else class="finding">
    <div v-if="facts.length" class="finding__facts">
      <a-tag v-for="fact in facts" :key="fact.label">
        <a v-if="fact.href" :href="fact.href" target="_blank" rel="noopener noreferrer">
          {{ fact.label }}: {{ fact.value }}
        </a>
        <template v-else>{{ fact.label }}: {{ fact.value }}</template>
      </a-tag>
    </div>

    <div class="finding__title">
      {{ $t("mondoo.details.affected") }} ({{ details.assets?.length ?? 0 }})
    </div>
    <div class="finding__hosts">
      <a-tag v-for="asset in details.assets" :key="asset.asset">
        {{ asset.asset_name }}
        <span v-for="pkg in asset.packages" :key="pkg.name" class="finding__package">
          · {{ pkg.name }} {{ pkg.installed }}
          <template v-if="pkg.available">→ {{ pkg.available }}</template>
        </span>
      </a-tag>
    </div>

    <template v-if="details.description || details.message">
      <div class="finding__title">{{ $t("mondoo.details.meaning") }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -- rendered with HTML disabled -->
      <div class="finding__text" v-html="render(details.description || details.message)" />
    </template>

    <div class="finding__title">{{ $t("mondoo.details.fix") }}</div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="details.remediation" class="finding__text" v-html="render(details.remediation)" />
    <div v-else class="finding__text finding__text--muted">
      {{ $t("mondoo.details.no fix") }}
    </div>

    <a-collapse v-if="details.audit" ghost class="finding__audit">
      <a-collapse-panel key="audit" :header="$t('mondoo.details.verify')">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="finding__text" v-html="render(details.audit)" />
      </a-collapse-panel>
    </a-collapse>

    <template v-if="details.references?.length">
      <div class="finding__title">{{ $t("mondoo.details.references") }}</div>
      <ul class="finding__text">
        <li v-for="reference in details.references" :key="reference.url">
          <a :href="reference.url" target="_blank" rel="noopener noreferrer">
            {{ reference.title || reference.url }}
          </a>
        </li>
      </ul>
    </template>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import markdown from "markdown-it";
import api from "@/api.js";

const props = defineProps({
  uuid: { type: String, required: true },
  mrn: { type: String, required: true },
  rating: { type: String, default: "" },
  state: { type: String, default: "" },
  namespace: { type: String, default: "" },
});

// HTML in the source is escaped, not rendered.
const md = markdown({ html: false, linkify: false });
const openLink =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  return openLink(tokens, idx, options, env, self);
};
const render = (text) => md.render(String(text ?? ""));

const loading = ref(true);
const details = ref({});

const facts = computed(() => {
  const d = details.value;
  const out = [];

  if (d.id) {
    out.push({
      label: "ID",
      value: d.id,
      href: /^CVE-/.test(d.id)
        ? `https://nvd.nist.gov/vuln/detail/${d.id}`
        : undefined,
    });
  }
  if (d.cvss !== undefined) out.push({ label: "CVSS", value: d.cvss });
  return out;
});

onMounted(async () => {
  try {
    const { meta = {} } = await api.instances.action({
      uuid: props.uuid,
      action: "finding",
      params: {
        mrn: props.mrn,
        ...(props.rating && { rating: props.rating }),
        ...(props.state && { state: props.state }),
        ...(props.namespace && { namespace: props.namespace }),
      },
    });

    details.value = meta;
  } catch (error) {
    message.error(error.response?.data?.message ?? error.message ?? error);
  } finally {
    loading.value = false;
  }
});
</script>

<script>
export default { name: "MondooFindingDetails" };
</script>

<style scoped>
.finding {
  padding: 4px 0 8px;
  white-space: normal;
}

.finding__facts {
  margin-bottom: 10px;
}

.finding__title {
  margin: 6px 0;
  font-weight: 600;
}

.finding__text {
  margin-bottom: 12px;
  line-height: 1.55;
}

.finding__text--muted,
.finding__package {
  color: var(--gray);
}

.finding__hosts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 0;
  margin-bottom: 12px;
}

.finding__audit {
  margin: 0 0 12px -16px;
}

.finding__text :deep(p),
.finding__text :deep(ul),
.finding__text :deep(ol) {
  margin: 0 0 8px;
}

.finding__text :deep(ul),
.finding__text :deep(ol),
ul.finding__text {
  padding-left: 22px;
}

.finding__text :deep(h1),
.finding__text :deep(h2),
.finding__text :deep(h3),
.finding__text :deep(h4) {
  margin: 10px 0 4px;
  font-size: 1em;
  font-weight: 600;
}

.finding__text :deep(code) {
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.18);
  font-size: 0.9em;
}

.finding__text :deep(pre) {
  margin: 0 0 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  overflow-x: auto;
}

.finding__text :deep(pre code) {
  padding: 0;
  background: none;
}
</style>
