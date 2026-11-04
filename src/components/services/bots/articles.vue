<template>
  <div class="articles">
    <div class="articles__toolbar">
      <a-input-search
        v-model:value="search"
        allow-clear
        :placeholder="t('bots_databases.articles.search')"
        style="max-width: 320px"
      />

      <a-dropdown :trigger="['click']">
        <a-button type="primary" :loading="isImporting">
          {{ t("bots_databases.articles.add") }}
        </a-button>
        <template #overlay>
          <a-menu @click="onAddMenu">
            <a-menu-item key="write">{{ t("bots_databases.articles.add_write") }}</a-menu-item>
            <a-menu-item key="text">{{ t("bots_databases.articles.add_text") }}</a-menu-item>
            <a-menu-item key="file">{{ t("bots_databases.articles.add_file") }}</a-menu-item>
            <a-menu-item key="url">{{ t("bots_databases.articles.add_url") }}</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>

      <input
        ref="fileInput"
        type="file"
        hidden
        accept=".pdf,.docx,.xlsx,.csv,.txt,application/pdf,text/plain,text/csv"
        @change="onFilePicked"
      />
    </div>

    <div class="articles__budget">
      <span>
        {{ t("bots_databases.articles.budget", { used: used, budget: budget }) }}
      </span>
      <a-progress
        :percent="budget ? Math.min(100, Math.round((used / budget) * 100)) : 0"
        :status="used > budget ? 'exception' : 'normal'"
        size="small"
      />
    </div>

    <a-spin :spinning="isLoading">
      <a-empty v-if="!isLoading && !articles.length" :description="t('bots_databases.articles.empty')" />

      <div
        v-for="(article, index) in filteredArticles"
        :key="article.id"
        class="article"
        :class="{ 'article--off': !article.enabled || !article.fits }"
      >
        <div class="article__head">
          <span class="article__title" @click="openEditor(article)">{{ article.title }}</span>
          <a-tag v-if="article.source_type">{{ sourceLabel(article.source_type) }}</a-tag>
          <a-tag v-if="article.enabled && !article.fits" color="orange">
            {{ t("bots_databases.articles.does_not_fit") }}
          </a-tag>
          <span class="article__tokens">~{{ article.tokens }}</span>
        </div>
        <div class="article__body" @click="openEditor(article)">
          {{ preview(article.body) }}
        </div>
        <div class="article__actions">
          <a-switch
            size="small"
            :checked="article.enabled"
            :loading="busyId === article.id"
            @change="toggleEnabled(article, $event)"
          />
          <span class="article__switch-label">{{ t("bots_databases.articles.enabled") }}</span>
          <a-button
            size="small"
            type="text"
            :disabled="!!search || index === 0"
            @click="move(article, -1)"
          >↑</a-button>
          <a-button
            size="small"
            type="text"
            :disabled="!!search || index === filteredArticles.length - 1"
            @click="move(article, 1)"
          >↓</a-button>
          <a-button size="small" @click="openEditor(article)">
            {{ t("bots_databases.articles.edit") }}
          </a-button>
          <a-popconfirm
            :title="t('bots_databases.articles.delete_confirm')"
            @confirm="removeArticle(article)"
          >
            <a-button size="small" danger>{{ t("bots_databases.articles.delete") }}</a-button>
          </a-popconfirm>
        </div>
      </div>
    </a-spin>

    <!-- One article: write or edit -->
    <a-modal
      v-model:open="isEditorOpen"
      :title="editor.id ? t('bots_databases.articles.edit') : t('bots_databases.articles.add_write')"
      :confirm-loading="isSaving"
      :ok-text="t('bots_databases.articles.save')"
      width="760px"
      @ok="saveEditor"
    >
      <a-input
        v-model:value="editor.title"
        :placeholder="t('bots_databases.articles.title')"
        style="margin-bottom: 10px"
      />
      <a-segmented
        v-model:value="editorMode"
        :options="[
          { label: t('bots_databases.articles.mode_edit'), value: 'edit' },
          { label: t('bots_databases.articles.mode_preview'), value: 'preview' },
        ]"
        style="margin-bottom: 10px"
      />
      <a-textarea
        v-if="editorMode === 'edit'"
        v-model:value="editor.body"
        :auto-size="{ minRows: 10, maxRows: 24 }"
        :placeholder="t('bots_databases.articles.body')"
      />
      <div v-else class="article__markdown" v-html="renderMarkdown(editor.body)" />
    </a-modal>

    <!-- Paste text / link to import -->
    <a-modal
      v-model:open="isSourceOpen"
      :title="sourceKind === 'url' ? t('bots_databases.articles.add_url') : t('bots_databases.articles.add_text')"
      :confirm-loading="isImporting"
      :ok-text="t('bots_databases.articles.parse')"
      width="760px"
      @ok="runSourceImport"
    >
      <p>{{ t("bots_databases.articles.import_hint") }}</p>
      <a-input
        v-if="sourceKind === 'url'"
        v-model:value="sourceUrl"
        placeholder="https://docs.google.com/document/d/..."
      />
      <a-textarea
        v-else
        v-model:value="sourceText"
        :auto-size="{ minRows: 10, maxRows: 24 }"
      />
    </a-modal>

    <!-- Drafts from an import: pick, edit, save -->
    <a-modal
      v-model:open="isDraftsOpen"
      :title="t('bots_databases.articles.drafts_title', { count: drafts.length })"
      :confirm-loading="isSaving"
      :ok-text="t('bots_databases.articles.save_selected')"
      :ok-button-props="{ disabled: !drafts.some((d) => d.selected) }"
      width="860px"
      @ok="saveDrafts"
    >
      <a-empty v-if="!drafts.length" :description="t('bots_databases.articles.drafts_empty')" />
      <div v-for="(draft, index) in drafts" :key="index" class="draft">
        <a-checkbox v-model:checked="draft.selected" />
        <div class="draft__content">
          <a-input v-model:value="draft.title" />
          <a-textarea v-model:value="draft.body" :auto-size="{ minRows: 2, maxRows: 10 }" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { marked } from "marked";
import DOMPurify from "dompurify";
import api from "@/api";
import { useNotification } from "@/hooks/utils";

const props = defineProps({
  database: { type: String, required: true },
});
// Fired after anything here changed the base, so the page can reload what it
// shows elsewhere (the Q&A tools work on the same articles).
const emit = defineEmits(["changed"]);

const { t, te } = useI18n();
const { openNotification } = useNotification();

const articles = ref([]);
const budget = ref(0);
const used = ref(0);
const search = ref("");
const isLoading = ref(false);
const isSaving = ref(false);
const isImporting = ref(false);
const busyId = ref("");

const isEditorOpen = ref(false);
const editorMode = ref("edit");
const editor = ref({ id: "", title: "", body: "", enabled: true, version: 0 });

const isSourceOpen = ref(false);
const sourceKind = ref("text");
const sourceText = ref("");
const sourceUrl = ref("");
const fileInput = ref();

const isDraftsOpen = ref(false);
const drafts = ref([]);

const filteredArticles = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return articles.value;
  return articles.value.filter(
    (a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
  );
});

const errorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Unknown";

const notifyError = (err) =>
  openNotification("error", { message: `Error: ${errorMessage(err)}` });

const isConflict = (err) => err?.response?.data?.error_code === "CONFLICT";

const preview = (body) => {
  const text = (body || "").replace(/\s+/g, " ").trim();
  return text.length > 220 ? `${text.slice(0, 220)}…` : text;
};

const renderMarkdown = (text) => DOMPurify.sanitize(marked(text || ""));

const sourceLabel = (source) => {
  const key = `bots_databases.articles.source_${source}`;
  return te(key) ? t(key) : source;
};

async function load() {
  isLoading.value = true;
  try {
    const data = await api.get(
      `/agents/api/articles?database=${encodeURIComponent(props.database)}`
    );
    articles.value = data.articles || [];
    budget.value = data.budget || 0;
    used.value = data.used || 0;
  } catch (err) {
    notifyError(err);
  } finally {
    isLoading.value = false;
  }
}

async function changed() {
  await load();
  emit("changed");
}

function openEditor(article) {
  editor.value = article
    ? { id: article.id, title: article.title, body: article.body, enabled: article.enabled, version: article.version }
    : { id: "", title: "", body: "", enabled: true, version: 0 };
  editorMode.value = "edit";
  isEditorOpen.value = true;
}

async function saveEditor() {
  if (!editor.value.title.trim()) {
    return openNotification("error", { message: t("bots_databases.articles.no_title") });
  }
  isSaving.value = true;
  try {
    if (editor.value.id) {
      await api.post("/agents/api/update_article", {
        id: editor.value.id,
        title: editor.value.title,
        body: editor.value.body,
        enabled: editor.value.enabled,
        version: editor.value.version,
      });
    } else {
      await api.post("/agents/api/create_articles", {
        database: props.database,
        articles: [{ title: editor.value.title, body: editor.value.body, source_type: "manual" }],
      });
    }
    isEditorOpen.value = false;
    await changed();
  } catch (err) {
    if (isConflict(err)) {
      openNotification("error", { message: t("bots_databases.articles.conflict") });
      await load();
    } else {
      notifyError(err);
    }
  } finally {
    isSaving.value = false;
  }
}

async function toggleEnabled(article, enabled) {
  busyId.value = article.id;
  try {
    await api.post("/agents/api/update_article", {
      id: article.id,
      title: article.title,
      body: article.body,
      enabled,
      version: article.version,
    });
    await changed();
  } catch (err) {
    if (isConflict(err)) {
      openNotification("error", { message: t("bots_databases.articles.conflict") });
      await load();
    } else {
      notifyError(err);
    }
  } finally {
    busyId.value = "";
  }
}

async function move(article, delta) {
  const ids = articles.value.map((a) => a.id);
  const from = ids.indexOf(article.id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  try {
    await api.post("/agents/api/reorder_articles", { database: props.database, ids });
    await changed();
  } catch (err) {
    notifyError(err);
  }
}

async function removeArticle(article) {
  try {
    await api.post("/agents/api/delete_article", { id: article.id });
    await changed();
  } catch (err) {
    notifyError(err);
  }
}

function onAddMenu({ key }) {
  if (key === "write") return openEditor(null);
  if (key === "file") return fileInput.value?.click();
  sourceKind.value = key;
  sourceText.value = "";
  sourceUrl.value = "";
  isSourceOpen.value = true;
}

function showDrafts(list) {
  drafts.value = (list || []).map((d) => ({ ...d, selected: true }));
  isDraftsOpen.value = true;
}

async function runSourceImport() {
  isImporting.value = true;
  try {
    const data =
      sourceKind.value === "url"
        ? await api.post("/agents/api/ingest_url", { database: props.database, url: sourceUrl.value })
        : await api.post("/agents/api/ingest_text", { database: props.database, text: sourceText.value });
    isSourceOpen.value = false;
    showDrafts(data.drafts);
  } catch (err) {
    notifyError(err);
  } finally {
    isImporting.value = false;
  }
}

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

async function onFilePicked(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  isImporting.value = true;
  try {
    const data = await api.post("/agents/api/ingest_file", {
      database: props.database,
      file: { filename: file.name, content_type: file.type, data: await readAsDataURL(file) },
    });
    showDrafts(data.drafts);
  } catch (err) {
    notifyError(err);
  } finally {
    isImporting.value = false;
  }
}

async function saveDrafts() {
  const chosen = drafts.value
    .filter((d) => d.selected && d.title.trim())
    .map(({ title, body, source_type, source_ref }) => ({ title, body, source_type, source_ref }));
  if (!chosen.length) return;
  isSaving.value = true;
  try {
    await api.post("/agents/api/create_articles", { database: props.database, articles: chosen });
    isDraftsOpen.value = false;
    openNotification("success", {
      message: t("bots_databases.articles.saved", { count: chosen.length }),
    });
    await changed();
  } catch (err) {
    notifyError(err);
  } finally {
    isSaving.value = false;
  }
}

// Lets the page hand over drafts it produced itself (the site import).
defineExpose({ showDrafts, load });

watch(() => props.database, load);
onMounted(load);
</script>

<style scoped>
.articles__toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 12px;
}
.articles__budget {
  margin-bottom: 12px;
}
.article {
  border: 1px solid var(--border_color, #e5e5e5);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.article--off {
  opacity: 0.6;
}
.article__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.article__title {
  font-weight: 600;
  cursor: pointer;
}
.article__tokens {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.6;
}
.article__body {
  margin: 6px 0;
  cursor: pointer;
  opacity: 0.85;
  word-break: break-word;
}
.article__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.article__switch-label {
  margin-right: 8px;
  font-size: 12px;
}
.article__markdown {
  max-height: 60vh;
  overflow: auto;
}
.draft {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.draft__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
