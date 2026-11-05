<template>
  <div class="assistant">
    <div class="assistant__toolbar">
      <a-segmented
        v-model:value="tab"
        :options="[
          { value: 'assistant', label: t('bots.assistant.tab_assistant') },
          { value: 'test', label: t('bots.assistant.tab_test') },
        ]"
      />
      <div class="assistant__toolbar-right">
        <span v-if="tab === 'assistant' && model" class="assistant__hint">
          {{ model }}
        </span>
        <a-button
          v-if="tab === 'assistant'"
          size="small"
          :disabled="isSending || !messages.length"
          @click="resetEditor"
        >
          {{ t("bots.assistant.new_conversation") }}
        </a-button>
        <a-button v-else size="small" :disabled="!testMessages.length" @click="resetTest">
          {{ t("bots.assistant.restart_test") }}
        </a-button>
      </div>
    </div>

    <!-- The owner's conversation with the editing assistant -->
    <section v-show="tab === 'assistant'" class="chat">
      <div ref="editorScroll" class="chat__messages">
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
            <span v-for="file in message.attachments" :key="file.id || file.filename" class="msg__file">
              <paperclip-icon class="msg__file-icon" />
              <span class="msg__file-name">{{ file.filename }}</span>
            </span>
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

      <div class="composer">
        <div v-if="pendingFiles.length" class="composer__files">
          <a-tag
            v-for="(file, index) in pendingFiles"
            :key="file.name + index"
            closable
            @close="pendingFiles.splice(index, 1)"
          >
            <paperclip-icon /> {{ file.name }}
          </a-tag>
        </div>
        <a-textarea
          v-model:value="draft"
          :bordered="false"
          :auto-size="{ minRows: 2, maxRows: 8 }"
          :placeholder="t('bots.assistant.placeholder')"
          :disabled="isSending"
          @pressEnter="onEnter($event, sendToEditor)"
        />
        <div class="composer__bar">
          <input
            ref="fileInput"
            type="file"
            multiple
            :accept="acceptedFiles"
            style="display: none"
            @change="onFilesPicked"
          />
          <a-tooltip :title="t('bots.assistant.attach')">
            <a-button type="text" :disabled="isSending" @click="fileInput.click()">
              <template #icon><paperclip-icon /></template>
              {{ t("bots.assistant.attach_short") }}
            </a-button>
          </a-tooltip>
          <a-button
            type="primary"
            :loading="isSending"
            :disabled="!draft.trim() && !pendingFiles.length"
            @click="sendToEditor"
          >
            {{ t("bots.assistant.send") }}
          </a-button>
        </div>
      </div>
    </section>

    <!-- The owner's test chat with the bot itself -->
    <section v-show="tab === 'test'" class="chat">
      <div ref="testScroll" class="chat__messages">
        <div v-if="!testMessages.length" class="chat__empty">
          {{ t("bots.assistant.test_hint") }}
        </div>
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

      <div class="composer">
        <a-textarea
          v-model:value="testDraft"
          :bordered="false"
          :auto-size="{ minRows: 1, maxRows: 5 }"
          :placeholder="t('bots.assistant.test_placeholder')"
          @pressEnter="onEnter($event, sendToTest)"
        />
        <div class="composer__bar composer__bar--end">
          <a-button type="primary" :disabled="!testDraft.trim()" @click="sendToTest">
            {{ t("bots.assistant.send") }}
          </a-button>
        </div>
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

// The server reads PDF, DOCX, XLSX, CSV and plain text. The browser gives
// .md as text/markdown or nothing at all: any other text goes as plain text.
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
    // A bad request (file, size) says what to fix; a failure of the model
    // behind it means nothing to the owner, so it gets a plain message.
    if (err?.response?.data?.error_code === "INTERNAL") {
      console.error(err);
      openNotification("error", { message: t("bots.assistant.failed") });
    } else {
      openNotification("error", { message: `Error: ${errorText(err)}` });
    }
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
  await aiBotsStore.startChatsStream({ playground_message: playgroundHandler });
  await Promise.all([loadHistory(), resetTest()]);
});

onUnmounted(() => {
  aiBotsStore.removeCustomHandler("playground_message", playgroundHandler);
  clearTimeout(testWaitTimer);
});
</script>

<style scoped>
.assistant {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.assistant__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.assistant__toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.assistant__hint {
  font-size: 12px;
  opacity: 0.6;
}
.chat {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border_color, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
  height: max(420px, calc(100vh - 330px));
}
.chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chat__empty {
  margin: auto;
  max-width: 360px;
  text-align: center;
  opacity: 0.6;
}
.composer {
  border-top: 1px solid var(--border_color, #e5e7eb);
  padding: 8px 12px;
}
.composer :deep(textarea) {
  padding: 4px 0;
  resize: none;
}
.composer__files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}
.composer__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}
.composer__bar--end {
  justify-content: flex-end;
}
.msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 14px;
  word-break: break-word;
  line-height: 1.5;
}
.msg--user {
  align-self: flex-end;
  background: var(--main, #1677ff);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg--assistant {
  align-self: flex-start;
  background: var(--bright_bg, #f3f4f6);
  border-bottom-left-radius: 4px;
}
.msg--typing {
  font-style: italic;
  opacity: 0.7;
}
.msg__text :deep(p) {
  margin-bottom: 8px;
}
.msg__text :deep(p:last-child),
.msg__text :deep(ul:last-child) {
  margin-bottom: 0;
}
.msg__text :deep(ul) {
  padding-left: 20px;
  margin-bottom: 8px;
}
.msg__files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.msg__file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.06);
}
.msg--user .msg__file {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.msg__file-icon {
  font-size: 13px;
  opacity: 0.85;
}
.msg__file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.msg__why {
  padding: 0;
  height: auto;
  margin-top: 4px;
}
.proposal {
  border: 1px solid var(--border_color, #d9d9d9);
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 10px;
  background: var(--bright_font, #fff);
  color: inherit;
}
.proposal__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.proposal__item {
  margin-top: 8px;
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
.proposal__articles :deep(.ant-collapse-header) {
  padding: 4px 0 !important;
}
.proposal__article {
  font-size: 13px;
  max-height: 260px;
  overflow-y: auto;
}
.proposal__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.diff--removed {
  background: rgba(255, 77, 79, 0.18);
  text-decoration: line-through;
}
.diff--added {
  background: rgba(82, 196, 26, 0.22);
}
</style>
