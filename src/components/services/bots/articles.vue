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
        accept=".pdf,.docx,.xlsx,.csv,.txt,.md"
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
      <a-empty
        v-if="!isLoading && !articles.length && !newArticle"
        :description="t('bots_databases.articles.empty')"
      />

      <article-card
        v-if="newArticle"
        :key="'new'"
        :article="newArticle"
        :saving="isSaving"
        @save="createArticle"
        @cancel="newArticle = null"
      />
      <article-card
        v-for="(article, index) in filteredArticles"
        :key="article.id"
        :article="article"
        :busy="busyId === article.id"
        :saving="savingId === article.id"
        :can-up="!search && index > 0"
        :can-down="!search && index < filteredArticles.length - 1"
        @save="updateArticle(article, $event)"
        @toggle="toggleEnabled(article, $event)"
        @move="move(article, $event)"
        @remove="removeArticle(article)"
      />
    </a-spin>

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
import api from "@/api";
import ArticleCard from "@/components/services/bots/articleCard.vue";
import { useNotification } from "@/hooks/utils";

const props = defineProps({
  database: { type: String, required: true },
});
// Fired after anything here changed the base, so the page can reload what it
// shows elsewhere (the Q&A tools work on the same articles).
const emit = defineEmits(["changed"]);

const { t } = useI18n();
const { openNotification } = useNotification();

const articles = ref([]);
const budget = ref(0);
const used = ref(0);
const search = ref("");
const isLoading = ref(false);
const isSaving = ref(false);
const isImporting = ref(false);
const busyId = ref("");

const savingId = ref("");
// The article being written from scratch, shown on top until saved.
const newArticle = ref(null);

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

function openEditor() {
  newArticle.value = { id: "", title: "", body: "", enabled: true, version: 0 };
}

async function createArticle({ title, body }) {
  isSaving.value = true;
  try {
    await api.post("/agents/api/create_articles", {
      database: props.database,
      articles: [{ title, body, source_type: "manual" }],
    });
    newArticle.value = null;
    await changed();
  } catch (err) {
    notifyError(err);
  } finally {
    isSaving.value = false;
  }
}

async function updateArticle(article, { title, body }) {
  savingId.value = article.id;
  try {
    await api.post("/agents/api/update_article", {
      id: article.id,
      title,
      body,
      enabled: article.enabled,
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
    savingId.value = "";
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
  if (key === "write") return openEditor();
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

// The server reads PDF, DOCX, XLSX, CSV and plain text; .md and other text
// files come from the browser as text/markdown or untyped.
const fileType = (file) => {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "csv") return "text/csv";
  if (!file.type || file.type.startsWith("text/")) return "text/plain";
  return file.type;
};

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
      file: { filename: file.name, content_type: fileType(file), data: await readAsDataURL(file) },
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
