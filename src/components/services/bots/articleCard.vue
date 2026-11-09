<template>
  <div
    class="card"
    :class="{
      'card--off': !isNew && (!article.enabled || !article.fits),
      'card--dirty': isDirty,
    }"
    @keydown.ctrl.s.prevent="save"
    @keydown.meta.s.prevent="save"
  >
    <div class="card__head">
      <input
        ref="titleInput"
        v-model="title"
        class="card__title"
        :placeholder="t('bots_databases.articles.title')"
      />
      <a-tag v-if="article.source_type && !isNew" class="card__tag">
        {{ sourceLabel(article.source_type) }}
      </a-tag>
      <a-tag v-if="!isNew && article.enabled && !article.fits" color="orange" class="card__tag">
        {{ t("bots_databases.articles.does_not_fit") }}
      </a-tag>
      <span v-if="!isNew" class="card__tokens">~{{ article.tokens }}</span>
    </div>

    <!-- Writing: plain Markdown with a small toolbar -->
    <div v-if="isEditing" class="card__editor">
      <div class="card__tools" @mousedown.prevent>
        <a-tooltip v-for="tool in tools" :key="tool.key" :title="tool.hint">
          <button type="button" class="card__tool" @click="applyTool(tool)">
            <span :class="tool.cls">{{ tool.label }}</span>
          </button>
        </a-tooltip>
        <span class="card__hint">{{ t("bots_databases.articles.md_hint") }}</span>
      </div>
      <textarea
        ref="bodyInput"
        v-model="body"
        class="card__textarea"
        :placeholder="t('bots_databases.articles.body')"
        @input="autosize"
        @blur="onBlur"
      />
    </div>

    <!-- Reading: rendered Markdown, a click starts writing -->
    <div
      v-else
      class="card__body"
      :class="{ 'card__body--clamped': !isExpanded && isLong }"
      @click="startEditing"
    >
      <div v-if="body.trim()" class="md" v-html="rendered" />
      <div v-else class="card__placeholder">{{ t("bots_databases.articles.body") }}</div>
    </div>
    <a-button
      v-if="!isEditing && isLong"
      type="link"
      size="small"
      class="card__more"
      @click="isExpanded = !isExpanded"
    >
      {{ isExpanded ? t("bots_databases.articles.collapse") : t("bots_databases.articles.expand") }}
    </a-button>

    <div class="card__actions" @mousedown.prevent>
      <template v-if="!isNew">
        <a-switch
          size="small"
          :checked="article.enabled"
          :loading="busy"
          @change="emit('toggle', $event)"
        />
        <span class="card__switch-label">{{ t("bots_databases.articles.enabled") }}</span>
        <a-button size="small" type="text" :disabled="!canUp" @click="emit('move', -1)">↑</a-button>
        <a-button size="small" type="text" :disabled="!canDown" @click="emit('move', 1)">↓</a-button>
      </template>

      <div class="card__right">
        <a-button v-if="isDirty || isNew" size="small" @click="discard">
          {{ t("bots_databases.articles.cancel") }}
        </a-button>
        <a-button
          size="small"
          type="primary"
          :disabled="!isDirty || !title.trim()"
          :loading="saving"
          @click="save"
        >
          {{ t("bots_databases.articles.save") }}
        </a-button>
        <a-popconfirm
          v-if="!isNew"
          :title="t('bots_databases.articles.delete_confirm')"
          @confirm="emit('remove')"
        >
          <a-button size="small" danger>{{ t("bots_databases.articles.delete") }}</a-button>
        </a-popconfirm>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { marked } from "marked";
import DOMPurify from "dompurify";

// One knowledge article, editable where it stands: the text reads as rendered
// Markdown and turns into an editor on click. Save lights up once something
// changed; nothing is sent until then.
const props = defineProps({
  article: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  canUp: { type: Boolean, default: false },
  canDown: { type: Boolean, default: false },
});
const emit = defineEmits(["save", "toggle", "move", "remove", "cancel"]);

const { t, te } = useI18n();

const isNew = computed(() => !props.article.id);
const title = ref(props.article.title || "");
const body = ref(props.article.body || "");
const isEditing = ref(false);
const isExpanded = ref(false);
const titleInput = ref();
const bodyInput = ref();

const isDirty = computed(
  () => title.value !== (props.article.title || "") || body.value !== (props.article.body || "")
);
const isLong = computed(() => body.value.length > 600 || body.value.split("\n").length > 12);
const rendered = computed(() => DOMPurify.sanitize(marked(body.value || "")));

const sourceLabel = (source) => {
  const key = `bots_databases.articles.source_${source}`;
  return te(key) ? t(key) : source;
};

// A reload brings the saved article; edits in progress are kept.
watch(
  () => [props.article.title, props.article.body, props.article.version],
  () => {
    if (!isDirty.value || props.saving) {
      title.value = props.article.title || "";
      body.value = props.article.body || "";
    }
  }
);

function autosize() {
  const el = bodyInput.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight + 2}px`;
}

async function startEditing() {
  isEditing.value = true;
  await nextTick();
  autosize();
  bodyInput.value?.focus();
}

function onBlur() {
  isEditing.value = false;
}

function save() {
  if (!isDirty.value || !title.value.trim() || props.saving) return;
  emit("save", { title: title.value.trim(), body: body.value });
}

function discard() {
  title.value = props.article.title || "";
  body.value = props.article.body || "";
  isEditing.value = false;
  if (isNew.value) emit("cancel");
}

// Toolbar: wraps the selection or starts lines with a marker.
const tools = computed(() => [
  { key: "bold", label: "B", cls: "tool--bold", hint: t("bots_databases.articles.md_bold"), wrap: "**" },
  { key: "italic", label: "I", cls: "tool--italic", hint: t("bots_databases.articles.md_italic"), wrap: "_" },
  { key: "heading", label: "H", cls: "tool--bold", hint: t("bots_databases.articles.md_heading"), line: "## " },
  { key: "list", label: "•", hint: t("bots_databases.articles.md_list"), line: "- " },
  { key: "numbered", label: "1.", hint: t("bots_databases.articles.md_numbered"), line: "1. " },
  { key: "link", label: "🔗", hint: t("bots_databases.articles.md_link"), link: true },
]);

async function applyTool(tool) {
  const el = bodyInput.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = body.value;
  const selected = text.slice(start, end);
  let next;
  let cursorFrom;
  let cursorTo;

  if (tool.wrap) {
    const inner = selected || t("bots_databases.articles.md_text");
    next = text.slice(0, start) + tool.wrap + inner + tool.wrap + text.slice(end);
    cursorFrom = start + tool.wrap.length;
    cursorTo = cursorFrom + inner.length;
  } else if (tool.link) {
    const label = selected || t("bots_databases.articles.md_text");
    const insert = `[${label}](https://)`;
    next = text.slice(0, start) + insert + text.slice(end);
    cursorFrom = start + label.length + 3;
    cursorTo = cursorFrom + "https://".length;
  } else {
    // Every selected line (or the current one) gets the marker.
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", end) === -1 ? text.length : text.indexOf("\n", end);
    const lines = text.slice(lineStart, lineEnd).split("\n");
    const prefixed = lines
      .map((l, i) => (tool.key === "numbered" ? `${i + 1}. ` : tool.line) + l.replace(/^(#+\s|[-*]\s|\d+\.\s)/, ""))
      .join("\n");
    next = text.slice(0, lineStart) + prefixed + text.slice(lineEnd);
    cursorFrom = lineStart;
    cursorTo = lineStart + prefixed.length;
  }

  body.value = next;
  await nextTick();
  el.focus();
  el.setSelectionRange(cursorFrom, cursorTo);
  autosize();
}

onMounted(async () => {
  if (isNew.value) {
    await nextTick();
    titleInput.value?.focus();
    isEditing.value = true;
    await nextTick();
    autosize();
  }
});
</script>

<style scoped>
.card {
  border: 1px solid var(--border_color, #e5e7eb);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
  transition: border-color 0.15s;
}
.card:hover {
  border-color: var(--main, #1677ff);
}
.card--dirty {
  border-color: var(--main, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.08);
}
.card--off {
  opacity: 0.6;
}
.card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card__title {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: inherit;
  padding: 2px 0;
}
.card__title::placeholder {
  font-weight: 400;
  opacity: 0.5;
}
.card__tag {
  margin: 0;
}
.card__tokens {
  font-size: 12px;
  opacity: 0.55;
  white-space: nowrap;
}
.card__body {
  margin-top: 6px;
  cursor: text;
  border-radius: 6px;
  padding: 4px 6px;
  margin-left: -6px;
  margin-right: -6px;
}
.card__body:hover {
  background: var(--bright_bg, #f5f6f8);
}
.card__body--clamped {
  max-height: 220px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, #000 75%, transparent);
  mask-image: linear-gradient(to bottom, #000 75%, transparent);
}
.card__placeholder {
  opacity: 0.45;
}
.card__more {
  padding: 0;
  height: auto;
}
.card__editor {
  margin-top: 6px;
  border: 1px solid var(--border_color, #d9d9d9);
  border-radius: 8px;
  overflow: hidden;
}
.card__tools {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--border_color, #e5e7eb);
  background: var(--bright_bg, #f8f9fb);
  flex-wrap: wrap;
}
.card__tool {
  min-width: 28px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: inherit;
  font-size: 13px;
}
.card__tool:hover {
  background: rgba(0, 0, 0, 0.06);
}
.tool--bold {
  font-weight: 700;
}
.tool--italic {
  font-style: italic;
  font-family: serif;
}
.card__hint {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.55;
}
.card__textarea {
  display: block;
  width: 100%;
  min-height: 120px;
  border: none;
  outline: none;
  resize: none;
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.55;
  background: transparent;
  color: inherit;
}
.card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.card__switch-label {
  font-size: 12px;
  margin-right: 6px;
}
.card__right {
  margin-left: auto;
  display: flex;
  gap: 6px;
}
.md {
  line-height: 1.55;
  word-break: break-word;
}
.md :deep(h1),
.md :deep(h2),
.md :deep(h3) {
  font-size: 15px;
  font-weight: 600;
  margin: 10px 0 4px;
}
.md :deep(h1:first-child),
.md :deep(h2:first-child),
.md :deep(h3:first-child) {
  margin-top: 0;
}
.md :deep(p) {
  margin: 0 0 6px;
}
.md :deep(ul),
.md :deep(ol) {
  padding-left: 20px;
  margin: 0 0 6px;
}
.md :deep(li) {
  margin: 2px 0;
}
.md :deep(table) {
  border-collapse: collapse;
  margin: 6px 0;
}
.md :deep(th),
.md :deep(td) {
  border: 1px solid var(--border_color, #e5e7eb);
  padding: 4px 8px;
}
.md :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  padding: 0 4px;
}
.md :deep(> :last-child) {
  margin-bottom: 0;
}
</style>
