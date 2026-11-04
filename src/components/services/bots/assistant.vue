<template>
  <div class="assistant" :class="{ 'assistant--wide': isWide }">
    <a-segmented
      v-if="!isWide"
      v-model:value="tab"
      block
      style="margin-bottom: 8px"
      :options="[
        { value: 'assistant', label: t('bots.assistant.tab_assistant') },
        { value: 'test', label: t('bots.assistant.tab_test') },
      ]"
    />
    <!-- The owner's conversation with the editing assistant -->
    <section v-show="isWide || tab === 'assistant'" class="assistant__pane">
      <div class="assistant__pane-title" v-if="isWide">{{ t("bots.assistant.tab_assistant") }}</div>
      <div class="assistant__model" v-if="model">
        {{ t("bots.assistant.runs_on", { model }) }}
        <a-button type="link" size="small" @click="resetEditor">
          {{ t("bots.assistant.new_conversation") }}
        </a-button>
      </div>

      <div ref="editorScroll" class="assistant__messages">
        <div v-if="!messages.length && !isLoading" class="msg msg--assistant">
          <div class="msg__text" v-html="renderMarkdown(t('bots.assistant.welcome'))" />
        </div>
        <div
          v-for="message in messages"
          :key="message.id"
          class="msg"
          :class="message.role === 'user' ? 'msg--user' : 'msg--assistant'"
        >
          <div v-if="message.content" class="msg__text" v-html="renderMarkdown(message.content)" />
          <div v-if="message.attachments?.length" class="msg__files">
            <a-tag v-for="file in message.attachments" :key="file.id || file.filename" class="msg__file">
              <paperclip-icon /> {{ file.filename }}
            </a-tag>
          </div>

          <div
            v-for="proposal in proposalsOf(message)"
            :key="proposal.id"
            class="proposal"
          >
            <div class="proposal__head">
              <strong>{{ proposalTitle(proposal) }}</strong>
              <a-tag :color="statusColor(proposal.status)">
                {{ t(`bots.assistant.status_${proposal.status}`) }}
              </a-tag>
            </div>

            <a-alert
              v-for="(warning, index) in previewOf(proposal).warnings || []"
              :key="index"
              type="warning"
              show-icon
              style="margin: 6px 0"
              :message="t(`bots.assistant.warning_${warning.code}`, { detail: warning.detail || '' })"
            />

            <a-collapse
              v-if="proposal.kind === 'articles_create'"
              ghost
              size="small"
              class="proposal__articles"
            >
              <a-collapse-panel
                v-for="(item, index) in previewOf(proposal).items"
                :key="index"
                :header="item.before"
              >
                <div class="msg__text proposal__article" v-html="renderMarkdown(item.after)" />
              </a-collapse-panel>
            </a-collapse>

            <div
              v-for="item in proposal.kind === 'articles_create' ? [] : previewOf(proposal).items"
              :key="item.field"
              class="proposal__item"
            >
              <div class="proposal__field">{{ fieldLabel(item.field) }}</div>
              <div v-if="isLongField(item.field)" class="proposal__diff">
                <span
                  v-for="(part, index) in wordDiff(item.before, item.after)"
                  :key="index"
                  :class="`diff--${part.type}`"
                >{{ part.text }}</span>
              </div>
              <div v-else class="proposal__short">
                <span class="diff--removed">{{ item.before || "—" }}</span>
                →
                <span class="diff--added">{{ item.after || "—" }}</span>
              </div>
            </div>

            <div v-if="proposal.status === 'pending'" class="proposal__actions">
              <a-tooltip :title="blockedByForm(proposal) ? t('bots.assistant.form_dirty') : ''">
                <a-button
                  type="primary"
                  size="small"
                  :disabled="blockedByForm(proposal)"
                  :loading="busyProposal === proposal.id"
                  @click="applyProposal(proposal)"
                >
                  {{ t("bots.assistant.apply") }}
                </a-button>
              </a-tooltip>
              <a-button size="small" @click="rejectProposal(proposal)">
                {{ t("bots.assistant.reject") }}
              </a-button>
            </div>
          </div>
        </div>
        <div v-if="isSending" class="msg msg--assistant msg--typing">
          {{ t("bots.assistant.thinking") }}
        </div>
      </div>

      <div v-if="pendingFiles.length" class="assistant__files">
        <a-tag
          v-for="(file, index) in pendingFiles"
          :key="file.name + index"
          closable
          @close="pendingFiles.splice(index, 1)"
        >
          <paperclip-icon /> {{ file.name }}
        </a-tag>
      </div>
      <div class="assistant__input">
        <input
          ref="fileInput"
          type="file"
          multiple
          :accept="acceptedFiles"
          style="display: none"
          @change="onFilesPicked"
        />
        <a-tooltip :title="t('bots.assistant.attach')">
          <a-button :disabled="isSending" @click="fileInput.click()">
            <template #icon><paperclip-icon /></template>
          </a-button>
        </a-tooltip>
        <a-textarea
          v-model:value="draft"
          :auto-size="{ minRows: 2, maxRows: 8 }"
          :placeholder="t('bots.assistant.placeholder')"
          :disabled="isSending"
          @pressEnter="onEnter($event, sendToEditor)"
        />
        <a-button
          type="primary"
          :loading="isSending"
          :disabled="!draft.trim() && !pendingFiles.length"
          @click="sendToEditor"
        >
          {{ t("bots.assistant.send") }}
        </a-button>
      </div>
    </section>

    <!-- The owner's test chat with the bot itself -->
    <section v-show="isWide || tab === 'test'" class="assistant__pane">
      <div class="assistant__pane-title" v-if="isWide">{{ t("bots.assistant.tab_test") }}</div>
      <div class="assistant__model">
        {{ t("bots.assistant.test_hint") }}
        <a-button type="link" size="small" @click="resetTest">
          {{ t("bots.assistant.restart_test") }}
        </a-button>
      </div>

      <div ref="testScroll" class="assistant__messages">
        <a-empty v-if="!testMessages.length" :description="t('bots.assistant.test_empty')" />
        <div
          v-for="(message, index) in testMessages"
          :key="index"
          class="msg"
          :class="message.role === 'user' ? 'msg--user' : 'msg--assistant'"
        >
          <div class="msg__text" v-html="renderMarkdown(message.text)" />
          <a-button
            v-if="message.role === 'bot'"
            type="link"
            size="small"
            class="msg__why"
            @click="askWhy"
          >
            {{ t("bots.assistant.why") }}
          </a-button>
        </div>
        <div v-if="isTestWaiting" class="msg msg--assistant msg--typing">
          {{ t("bots.assistant.bot_typing") }}
        </div>
      </div>

      <div class="assistant__input">
        <a-textarea
          v-model:value="testDraft"
          :auto-size="{ minRows: 1, maxRows: 5 }"
          :placeholder="t('bots.assistant.test_placeholder')"
          @pressEnter="onEnter($event, sendToTest)"
        />
        <a-button type="primary" :disabled="!testDraft.trim()" @click="sendToTest">
          {{ t("bots.assistant.send") }}
        </a-button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { defineAsyncComponent, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { marked } from "marked";
import DOMPurify from "dompurify";
import api from "@/api";
import { useNotification } from "@/hooks/utils";
import { useAiBotsStore } from "@/stores/aiBots";

const props = defineProps({
  botId: { type: String, required: true },
  // The settings form has unsaved edits: a change to the settings applied now
  // would be overwritten by that form (the server would refuse its save).
  formDirty: { type: Boolean, default: false },
});

const { t, te, locale } = useI18n();
const { openNotification } = useNotification();
const aiBotsStore = useAiBotsStore();

const paperclipIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PaperClipOutlined")
);

const tab = ref("assistant");

// Side by side when there is room; one at a time on a narrow screen.
const isWide = ref(window.innerWidth >= 1100);
const onResize = () => {
  isWide.value = window.innerWidth >= 1100;
};

// Files the owner attaches for the assistant: read as text on the server.
const acceptedFiles = ".pdf,.docx,.xlsx,.csv,.txt,.md";
const maxFiles = 5;
const maxFileSize = 20 * 1024 * 1024;
const pendingFiles = ref([]);
const fileInput = ref();

const messages = ref([]);
const proposals = ref(new Map());
const model = ref("");
const draft = ref("");
const isLoading = ref(false);
const isSending = ref(false);
const busyProposal = ref("");
const editorScroll = ref();

const testMessages = ref([]);
const testDraft = ref("");
const isTestWaiting = ref(false);
const testScroll = ref();
let testWaitTimer = null;

const renderMarkdown = (text) => DOMPurify.sanitize(marked(text || ""));

const errorText = (err) => err?.response?.data?.message || err?.message || "Unknown";

const scrollDown = async (el) => {
  await nextTick();
  if (el.value) el.value.scrollTop = el.value.scrollHeight;
};

const onEnter = (event, send) => {
  if (!event.shiftKey) {
    event.preventDefault();
    send();
  }
};

// --- proposals -------------------------------------------------------------

const previewOf = (proposal) => {
  if (!proposal.preview) return { items: [] };
  return typeof proposal.preview === "string" ? JSON.parse(proposal.preview) : proposal.preview;
};

const proposalsOf = (message) =>
  (message.proposals || []).map((id) => proposals.value.get(id)).filter(Boolean);

const proposalTitle = (proposal) => {
  const subject = previewOf(proposal).subject || "";
  return t(`bots.assistant.kind_${proposal.kind}`, { subject });
};

const fieldLabel = (field) => {
  const key = `bots.history.field_${field}`;
  return te(key) ? t(key) : field;
};

const longFields = ["system_prompt", "article_body", "reply_rules", "processing_prompt"];
const isLongField = (field) => longFields.includes(field);

const statusColor = (status) =>
  ({ applied: "green", rejected: "default", stale: "orange", pending: "blue" })[status];

// Settings changes would be lost to an unsaved form; article changes would not.
const blockedByForm = (proposal) =>
  props.formDirty && ["settings", "prompt", "revert"].includes(proposal.kind);

// Word-level diff (longest common subsequence over words and spaces). Small
// texts only - prompts and articles - so the quadratic table is fine; past a
// size it falls back to showing old and new whole.
function wordDiff(before = "", after = "") {
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  if (a.length * b.length > 4_000_000) {
    return [
      { type: "removed", text: before },
      { type: "same", text: "\n" },
      { type: "added", text: after },
    ];
  }
  const dp = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  const push = (type, text) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ type, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("removed", a[i++]);
    } else {
      push("added", b[j++]);
    }
  }
  while (i < a.length) push("removed", a[i++]);
  while (j < b.length) push("added", b[j++]);
  return out;
}

function rememberProposals(list) {
  for (const p of list || []) proposals.value.set(p.id, p);
  proposals.value = new Map(proposals.value);
}

async function loadHistory() {
  isLoading.value = true;
  try {
    const data = await api.get(`/agents/api/editor/history?bot=${encodeURIComponent(props.botId)}`);
    messages.value = data.messages || [];
    model.value = data.model || "";
    proposals.value = new Map();
    rememberProposals(data.proposals);
    scrollDown(editorScroll);
  } catch (err) {
    openNotification("error", { message: `Error: ${errorText(err)}` });
  } finally {
    isLoading.value = false;
  }
}

function onFilesPicked(event) {
  for (const file of event.target.files || []) {
    if (pendingFiles.value.length >= maxFiles) {
      openNotification("warning", { message: t("bots.assistant.too_many_files", { max: maxFiles }) });
      break;
    }
    if (file.size > maxFileSize) {
      openNotification("warning", { message: t("bots.assistant.file_too_big", { name: file.name }) });
      continue;
    }
    pendingFiles.value.push(file);
  }
  event.target.value = "";
}

// The browser leaves the type empty for some files (.md); the server goes by it.
const fileType = (file) => {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop().toLowerCase();
  return ext === "csv" ? "text/csv" : "text/plain";
};

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

async function sendToEditor(textOverride) {
  const fromDraft = typeof textOverride !== "string";
  const text = (fromDraft ? draft.value : textOverride).trim();
  const files = fromDraft ? [...pendingFiles.value] : [];
  if ((!text && !files.length) || isSending.value) return;
  const local = {
    id: `local-${Date.now()}`,
    role: "user",
    content: text,
    attachments: files.map((f) => ({ filename: f.name })),
  };
  messages.value.push(local);
  scrollDown(editorScroll);
  isSending.value = true;
  try {
    const payload = await Promise.all(
      files.map(async (f) => ({ filename: f.name, content_type: fileType(f), data: await readAsDataURL(f) }))
    );
    if (fromDraft) {
      draft.value = "";
      pendingFiles.value = [];
    }
    const data = await api.post("/agents/api/editor/send", {
      bot: props.botId,
      text,
      locale: locale.value,
      files: payload,
    });
    rememberProposals(data.proposals);
    model.value = data.model || model.value;
    messages.value.push(data.message);
    if (data.applied?.length) {
      // Applied by saying yes: reload the statuses and the bot.
      await loadHistory();
      await aiBotsStore.getBot(props.botId);
    }
  } catch (err) {
    messages.value = messages.value.filter((m) => m !== local && m.id !== local.id);
    if (fromDraft) {
      draft.value = text;
      pendingFiles.value = files;
    }
    openNotification("error", { message: `Error: ${errorText(err)}` });
  } finally {
    isSending.value = false;
    scrollDown(editorScroll);
  }
}

async function applyProposal(proposal) {
  busyProposal.value = proposal.id;
  try {
    const updated = await api.post("/agents/api/editor/apply", {
      bot: props.botId,
      proposal: proposal.id,
    });
    rememberProposals([updated]);
    await aiBotsStore.getBot(props.botId);
    openNotification("success", { message: t("bots.assistant.applied") });
  } catch (err) {
    if (err?.response?.data?.error_code === "STALE") {
      rememberProposals([{ ...proposal, status: "stale" }]);
      openNotification("warning", { message: t("bots.assistant.stale") });
    } else {
      openNotification("error", { message: `Error: ${errorText(err)}` });
    }
  } finally {
    busyProposal.value = "";
  }
}

async function rejectProposal(proposal) {
  try {
    await api.post("/agents/api/editor/reject", { bot: props.botId, proposal: proposal.id });
    rememberProposals([{ ...proposal, status: "rejected" }]);
  } catch (err) {
    openNotification("error", { message: `Error: ${errorText(err)}` });
  }
}

async function resetEditor() {
  try {
    await api.post("/agents/api/editor/reset", { bot: props.botId });
    messages.value = [];
    proposals.value = new Map();
  } catch (err) {
    openNotification("error", { message: `Error: ${errorText(err)}` });
  }
}

// --- test chat --------------------------------------------------------------

function stopWaiting() {
  isTestWaiting.value = false;
  clearTimeout(testWaitTimer);
}

const playgroundHandler = (data) => {
  if (data.bot !== props.botId) return;
  testMessages.value.push({ role: "bot", text: data.text });
  stopWaiting();
  scrollDown(testScroll);
};

async function sendToTest() {
  const text = testDraft.value.trim();
  if (!text) return;
  testDraft.value = "";
  testMessages.value.push({ role: "user", text });
  scrollDown(testScroll);
  isTestWaiting.value = true;
  clearTimeout(testWaitTimer);
  // The bot may answer nothing (paused, off schedule); stop the dots eventually.
  testWaitTimer = setTimeout(stopWaiting, 120_000);
  try {
    await api.post("/agents/api/playground/send", { bot: props.botId, text });
  } catch (err) {
    stopWaiting();
    openNotification("error", { message: `Error: ${errorText(err)}` });
  }
}

// The bot remembers the test conversation until it is restarted; starting
// clean when the panel opens keeps what the bot remembers and what is shown
// the same.
async function resetTest() {
  stopWaiting();
  testMessages.value = [];
  try {
    await api.post("/agents/api/playground/reset", { bot: props.botId });
  } catch (err) {
    openNotification("error", { message: `Error: ${errorText(err)}` });
  }
}

function askWhy() {
  tab.value = "assistant";
  sendToEditor(t("bots.assistant.why_question"));
}

onMounted(async () => {
  window.addEventListener("resize", onResize);
  await aiBotsStore.startChatsStream({ playground_message: playgroundHandler });
  await Promise.all([loadHistory(), resetTest()]);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  aiBotsStore.removeCustomHandler("playground_message", playgroundHandler);
  clearTimeout(testWaitTimer);
});
</script>

<style scoped>
.assistant {
  height: 100%;
}
.assistant--wide {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
}
.assistant__pane {
  min-width: 0;
}
.assistant__pane-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.assistant__files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
.msg__files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.msg__file {
  margin: 0;
}
.proposal__articles :deep(.ant-collapse-header) {
  padding: 4px 0 !important;
}
.proposal__article {
  font-size: 13px;
  max-height: 260px;
  overflow-y: auto;
}
.assistant__model {
  font-size: 12px;
  opacity: 0.75;
  margin-bottom: 6px;
}
.assistant__messages {
  height: calc(100vh - 360px);
  min-height: 320px;
  overflow-y: auto;
  padding: 4px;
}
.assistant__input {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: flex-end;
}
.msg {
  max-width: 92%;
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  word-break: break-word;
}
.msg--user {
  margin-left: auto;
  background: var(--main, #1677ff);
  color: #fff;
}
.msg--assistant {
  background: var(--bright_bg, #f3f4f6);
}
.msg--typing {
  font-style: italic;
  opacity: 0.7;
}
.msg__text :deep(p:last-child) {
  margin-bottom: 0;
}
.msg__why {
  padding: 0;
}
.proposal {
  border: 1px solid var(--border_color, #d9d9d9);
  border-radius: 8px;
  padding: 8px;
  margin-top: 8px;
  background: var(--bright_font, #fff);
  color: inherit;
}
.proposal__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.proposal__item {
  margin-top: 6px;
}
.proposal__field {
  font-size: 12px;
  opacity: 0.7;
}
.proposal__diff {
  white-space: pre-wrap;
  max-height: 260px;
  overflow-y: auto;
  font-size: 13px;
}
.proposal__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.diff--removed {
  background: rgba(255, 77, 79, 0.18);
  text-decoration: line-through;
}
.diff--added {
  background: rgba(82, 196, 26, 0.22);
}
</style>
