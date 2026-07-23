<template>
  <div class="canvas">
    <div class="canvas__bar">
      <a-button type="primary" size="small" @click="addAgent">
        + {{ t("bots.flow.add_agent") }}
      </a-button>
      <a-popconfirm
        v-if="nodes.length"
        :title="t('bots.flow.load_example_confirm')"
        :ok-text="t('Yes')"
        :cancel-text="t('Cancel')"
        @confirm="loadPreset"
      >
        <a-button size="small">{{ t("bots.flow.load_example") }}</a-button>
      </a-popconfirm>
      <a-button v-else size="small" @click="loadPreset">
        {{ t("bots.flow.load_example") }}
      </a-button>
      <span class="canvas__hint">{{ t("bots.flow.canvas_hint") }}</span>
    </div>

    <div class="canvas__stage">
      <VueFlow
        v-model:nodes="displayNodes"
        v-model:edges="displayEdges"
        :fit-view-on-init="true"
        :min-zoom="0.3"
        :max-zoom="1.6"
        :connection-line-style="{ stroke: '#1677ff', strokeWidth: 2 }"
        @connect="onConnect"
        @node-click="onNodeClick"
        @edge-double-click="onEdgeDblClick"
      >
        <Background :gap="18" pattern-color="#e2e2e2" />

        <Panel position="top-right" class="ctrl">
          <a-tooltip :title="t('bots.flow.undo')">
            <button class="ctrl__btn" :disabled="!canUndo" @click="undo">
              <undo-outlined />
            </button>
          </a-tooltip>
          <a-tooltip :title="t('bots.flow.redo')">
            <button class="ctrl__btn" :disabled="!canRedo" @click="redo">
              <redo-outlined />
            </button>
          </a-tooltip>
          <span class="ctrl__sep" />
          <a-popconfirm
            :title="t('bots.flow.reset') + '?'"
            :ok-text="t('Yes')"
            :cancel-text="t('Cancel')"
            @confirm="resetFlow"
          >
            <a-tooltip :title="t('bots.flow.reset')">
              <button class="ctrl__btn"><reload-outlined /></button>
            </a-tooltip>
          </a-popconfirm>
        </Panel>

        <template #node-agent="{ id, data }">
          <div
            class="fnode"
            :class="{
              'fnode--reply': data.reply,
              'fnode--branch': outcomesOf(data).length > 1,
              'fnode--sel': id === selectedId,
            }"
          >
            <Handle type="target" :position="Position.Left" class="fnode__in" />
            <div class="fnode__title">
              {{ data.name || t("bots.flow.unnamed") }}
            </div>
            <div class="fnode__meta">
              <span v-if="outcomesOf(data).length > 1" class="fnode__tag fnode__tag--branch"
                >⑂ {{ t("bots.flow.branch") }}</span
              >
              <span v-if="data.reply" class="fnode__tag fnode__tag--reply"
                >✉ {{ t("bots.flow.reply") }}</span
              >
              <span v-if="data.model" class="fnode__tag">{{ data.model }}</span>
              <span v-if="(data.database_ids || []).length" class="fnode__tag"
                >RAG</span
              >
            </div>
            <div class="fnode__outs">
              <div
                v-for="(o, oi) in outcomesOf(data)"
                :key="o.id"
                class="fnode__out"
              >
                <span
                  v-if="o.id !== 'next'"
                  class="fnode__out-dot"
                  :style="{ background: colorFor(oi) }"
                />
                <span class="fnode__out-lbl">{{
                  o.id === "next" ? t("bots.flow.next") : o.label || "…"
                }}</span>
                <Handle
                  :id="o.id"
                  type="source"
                  :position="Position.Right"
                  class="fnode__port"
                  :style="{
                    top: outTop(oi, outcomesOf(data).length),
                    background: o.id === 'next' ? '#8c8c8c' : colorFor(oi),
                  }"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- purely decorative: marks where the flow begins, not part of the model -->
        <template #node-start>
          <div class="fnode-start">
            ▶ {{ t("bots.flow.start") }}
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>
      </VueFlow>
    </div>

    <div class="canvas__legend">
      <span class="canvas__legend-item">
        <span class="canvas__swatch" style="background: #1677ff" />
        <b>{{ t("bots.flow.start") }}</b> — {{ t("bots.flow.start_tip") }}
      </span>
      <span class="canvas__legend-item">
        <span class="canvas__swatch" style="background: #fa8c16" />
        <b>{{ t("bots.flow.branch") }}</b> — {{ t("bots.flow.branch_tip") }}
      </span>
      <span class="canvas__legend-item">
        <span class="canvas__swatch" style="background: #52c41a" />
        <b>{{ t("bots.flow.reply") }}</b> — {{ t("bots.flow.reply_tip") }}
      </span>
    </div>

    <!-- editor panel -->
    <a-drawer
      :open="!!selectedId"
      :title="t('bots.flow.edit_agent')"
      placement="right"
      :width="400"
      :mask="false"
      @close="selectedId = null"
    >
      <template v-if="selectedNode">
        <label class="fld__lbl">{{ t("bots.flow.step_name_ph") }}</label>
        <a-input
          v-model:value="selectedNode.data.name"
          :placeholder="t('bots.flow.step_name_ph')"
          @change="emitChange"
        />

        <label class="fld__lbl">{{ t("bots.flow.prompt") }}</label>
        <a-textarea
          v-model:value="selectedNode.data.prompt"
          :auto-size="{ minRows: 4 }"
          :placeholder="t('bots.flow.prompt_ph')"
          @change="emitChange"
        />

        <label class="fld__lbl">{{ t("bots.flow.model") }}</label>
        <a-select
          :options="modelsOptions"
          style="width: 100%"
          allow-clear
          :placeholder="t('bots.flow.model_default')"
          :value="selectedNode.data.model || undefined"
          @update:value="((selectedNode.data.model = $event || ''), emitChange())"
        />

        <label class="fld__lbl">{{ t("bots.flow.databases") }}</label>
        <a-select
          mode="multiple"
          style="width: 100%"
          allow-clear
          :options="databaseOptions"
          :placeholder="t('bots.flow.databases_ph')"
          v-model:value="selectedNode.data.database_ids"
          @change="emitChange"
        />

        <div class="fld__switch">
          <span>{{ t("bots.flow.use_history") }}</span>
          <a-switch
            v-model:checked="selectedNode.data.use_history"
            @change="emitChange"
          />
        </div>
        <div class="fld__switch">
          <span>{{ t("bots.flow.reply") }}</span>
          <a-switch
            v-model:checked="selectedNode.data.reply"
            @change="emitChange"
          />
        </div>

        <a-divider />

        <!-- linear flow: single next target -->
        <template v-if="!selectedNode.data.outcomes.length">
          <label class="fld__lbl">{{ t("bots.flow.next") }} →</label>
          <a-select
            style="width: 100%"
            :value="edgeTargetOf(selectedId, 'next')"
            :options="nodeTargetOptions"
            @change="(v) => setTarget(selectedId, 'next', v)"
          />
        </template>

        <label class="fld__lbl">{{ t("bots.flow.branches") }}</label>
        <p class="fld__hint">{{ t("bots.flow.branches_hint") }}</p>
        <div
          v-for="(b, bi) in selectedNode.data.outcomes"
          :key="b.id"
          class="branch"
        >
          <div class="branch__head">
            <span class="brow__dot" :style="{ background: colorFor(bi) }" />
            <a-input
              v-model:value="b.label"
              :placeholder="t('bots.flow.branch_name_ph')"
              @change="onBranchesChange"
            />
            <a-button size="small" type="text" danger @click="removeBranch(bi)"
              >✕</a-button
            >
          </div>
          <div class="branch__to">
            <span class="branch__arrow">→</span>
            <a-select
              style="flex: 1"
              :value="edgeTargetOf(selectedId, b.id)"
              :options="nodeTargetOptions"
              @change="(v) => setTarget(selectedId, b.id, v)"
            />
          </div>
        </div>
        <a-button size="small" type="dashed" block @click="addBranch">
          + {{ t("bots.flow.add_branch") }}
        </a-button>

        <a-divider />
        <a-popconfirm
          :title="t('bots.flow.delete_node') + '?'"
          :ok-text="t('Yes')"
          :cancel-text="t('Cancel')"
          @confirm="deleteNode(selectedId)"
        >
          <a-button danger block>{{ t("bots.flow.delete_node") }}</a-button>
        </a-popconfirm>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { VueFlow, Handle, Position, MarkerType, Panel, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import {
  UndoOutlined,
  RedoOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";

const { t } = useI18n();
const { updateNodeInternals, fitView } = useVueFlow();

const props = defineProps({
  modelValue: { type: Object, default: () => ({ steps: [] }) },
  modelsOptions: { type: Array, default: () => [] },
  databases: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue"]);

const PALETTE = ["#1677ff", "#fa8c16", "#52c41a", "#722ed1", "#eb2f96", "#13c2c2", "#faad14"];
const colorFor = (i) => PALETTE[i % PALETTE.length];

const nodes = ref([]);
const edges = ref([]);
const selectedId = ref(null);
let idSeq = 0;
let branchSeq = 0;

// ------- undo / redo / reset history -------
const history = ref([]);
const histIdx = ref(-1);
let restoring = false;
let initialSnapshot = null;
const canUndo = computed(() => histIdx.value > 0);
const canRedo = computed(() => histIdx.value < history.value.length - 1);

function snapshot() {
  return {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    edges: JSON.parse(JSON.stringify(edges.value)),
  };
}
function pushHistory() {
  if (restoring) return;
  history.value = history.value.slice(0, histIdx.value + 1);
  history.value.push(snapshot());
  if (history.value.length > 60) history.value.shift();
  histIdx.value = history.value.length - 1;
}
function restoreSnap(s) {
  restoring = true;
  nodes.value = JSON.parse(JSON.stringify(s.nodes));
  edges.value = JSON.parse(JSON.stringify(s.edges));
  restoring = false;
  refreshHandles();
  emit("update:modelValue", toFlow());
}
function undo() {
  if (canUndo.value) {
    histIdx.value--;
    restoreSnap(history.value[histIdx.value]);
  }
}
function redo() {
  if (canRedo.value) {
    histIdx.value++;
    restoreSnap(history.value[histIdx.value]);
  }
}
function resetFlow() {
  if (initialSnapshot) {
    restoreSnap(initialSnapshot);
    pushHistory();
  }
  selectedId.value = null;
}

const databaseOptions = computed(() =>
  (props.databases || []).map((d) => ({ value: d.id, label: d.name || d.id }))
);

const selectedNode = computed(() =>
  nodes.value.find((n) => n.id === selectedId.value)
);

// Decorative-only "Start" node/edge pointing at the entry node (the node
// nothing points to) — never part of the saved flow. Fed into VueFlow
// alongside the real nodes/edges; the writable computed strips it back out
// before it could ever land in `nodes`/`edges` (and so in toFlow()'s output).
const START_ID = "__start__";
const startNode = computed(() => {
  const withIncoming = new Set(edges.value.map((e) => e.target));
  const entry = nodes.value.find((n) => !withIncoming.has(n.id)) || nodes.value[0];
  const position = entry
    ? { x: entry.position.x - 140, y: entry.position.y + 20 }
    : { x: -140, y: 20 };
  return {
    id: START_ID,
    type: "start",
    position,
    draggable: false,
    selectable: false,
    connectable: false,
  };
});
const displayNodes = computed({
  get: () => (nodes.value.length ? [...nodes.value, startNode.value] : nodes.value),
  set: (val) => {
    nodes.value = val.filter((n) => n.type !== "start");
  },
});
const displayEdges = computed({
  get: () => {
    const withIncoming = new Set(edges.value.map((e) => e.target));
    const entry = nodes.value.find((n) => !withIncoming.has(n.id));
    if (!entry) return edges.value;
    return [
      ...edges.value,
      {
        id: `${START_ID}->${entry.id}`,
        source: START_ID,
        target: entry.id,
        selectable: false,
        style: { stroke: "#bfbfbf", strokeWidth: 1.5 },
      },
    ];
  },
  set: (val) => {
    edges.value = val.filter((e) => e.source !== START_ID);
  },
});

// Targets you can send an output to (every other node + "end"). Lets you wire
// the flow from the panel with a dropdown instead of dragging tiny ports.
const nodeTargetOptions = computed(() => [
  { value: "", label: t("bots.flow.end") },
  ...nodes.value
    .filter((n) => n.id !== selectedId.value)
    .map((n) => ({ value: n.id, label: n.data.name || n.id })),
]);

function edgeTargetOf(source, handle) {
  const e = edges.value.find(
    (x) => x.source === source && (x.sourceHandle || "next") === handle
  );
  return e ? e.target : "";
}
function setTarget(source, handle, target) {
  edges.value = edges.value.filter(
    (e) => !(e.source === source && (e.sourceHandle || "next") === handle)
  );
  if (target) edges.value.push(makeEdge(source, handle, target));
  commitStructuralChange();
  refreshHandles();
}

// An agent's outputs. No named branches -> a single "→" that flows to the next
// node. Named branches -> the agent itself chooses one (by its prompt), and you
// connect each. Branch ids are stable so renaming a branch keeps its arrow.
function outcomesOf(data) {
  const named = (data.outcomes || []).filter((o) => o && o.id);
  if (named.length) return named.map((o) => ({ id: o.id, label: o.label || "" }));
  return [{ id: "next", label: "→" }];
}
function outTop(i, n) {
  return `${((i + 1) * 100) / (n + 1)}%`;
}
function branchIndex(data, handleId) {
  return (data.outcomes || []).findIndex((o) => o.id === handleId);
}
function branchLabel(data, handleId) {
  const b = (data.outcomes || []).find((o) => o.id === handleId);
  return b ? b.label : "";
}
function handleColor(data, handleId) {
  if (handleId === "next") return "#8c8c8c";
  const i = branchIndex(data, handleId);
  return i >= 0 ? colorFor(i) : "#8c8c8c";
}

// Edge look: color + condition label match the branch, so you can read which
// arrow means what.
function edgePresentation(sourceData, handle) {
  const color = handleColor(sourceData, handle);
  const label = handle === "next" ? "" : branchLabel(sourceData, handle) || "…";
  return {
    type: "smoothstep",
    label,
    labelBgPadding: [6, 2],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.92 },
    labelStyle: { fill: color, fontWeight: 600, fontSize: 11 },
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  };
}
function makeEdge(source, handle, target) {
  const sn = nodes.value.find((n) => n.id === source);
  return {
    id: `${source}:${handle}->${target}`,
    source,
    sourceHandle: handle,
    target,
    ...edgePresentation(sn ? sn.data : {}, handle),
  };
}
// Re-apply colors/labels to every edge (call after branch rename/reorder).
function restyleEdges() {
  edges.value = edges.value.map((e) => {
    const sn = nodes.value.find((n) => n.id === e.source);
    if (!sn) return e;
    return { ...e, ...edgePresentation(sn.data, e.sourceHandle || "next") };
  });
}

function refreshHandles() {
  nextTick(() => updateNodeInternals());
}

// ------------------------------ interactions ------------------------------
function addAgent() {
  const id = "n" + ++idSeq;
  // drop it just right of the currently selected node, so connecting is easy
  const anchor = selectedNode.value || nodes.value[nodes.value.length - 1];
  const pos = anchor
    ? { x: anchor.position.x + 240, y: anchor.position.y }
    : { x: 80, y: 80 };
  nodes.value.push({
    id,
    type: "agent",
    position: pos,
    data: {
      name: "",
      prompt: "",
      model: "",
      database_ids: [],
      use_history: true,
      reply: false,
      outcomes: [],
    },
  });
  selectedId.value = id;
  commitStructuralChange();
}

function onNodeClick({ node }) {
  if (node.type === "start") return;
  selectedId.value = node.id;
}

function onConnect(conn) {
  if (conn.source === START_ID || conn.target === START_ID) return;
  const handle = conn.sourceHandle || "next";
  edges.value = edges.value.filter(
    (e) => !(e.source === conn.source && (e.sourceHandle || "next") === handle)
  );
  edges.value.push(makeEdge(conn.source, handle, conn.target));
  commitStructuralChange();
}

function onEdgeDblClick({ edge }) {
  if (edge.source === START_ID) return;
  edges.value = edges.value.filter((e) => e.id !== edge.id);
  commitStructuralChange();
}

function addBranch() {
  if (!selectedNode.value) return;
  selectedNode.value.data.outcomes.push({ id: "b" + ++branchSeq, label: "" });
  onBranchesChange();
  pushHistory();
}
function removeBranch(bi) {
  const list = selectedNode.value.data.outcomes;
  const [removed] = list.splice(bi, 1);
  edges.value = edges.value.filter(
    (e) => !(e.source === selectedId.value && e.sourceHandle === removed.id)
  );
  onBranchesChange();
  pushHistory();
}
// Also used for branch label edits, which are a parameter change (no history push).
function onBranchesChange() {
  restyleEdges();
  emitChange();
  refreshHandles();
}

function deleteNode(id) {
  nodes.value = nodes.value.filter((n) => n.id !== id);
  edges.value = edges.value.filter((e) => e.source !== id && e.target !== id);
  selectedId.value = null;
  commitStructuralChange();
}

function pruneEdges() {
  const valid = {};
  for (const n of nodes.value) {
    valid[n.id] = new Set(outcomesOf(n.data).map((o) => o.id));
  }
  edges.value = edges.value.filter((e) => {
    const set = valid[e.source];
    return set && set.has(e.sourceHandle || "next");
  });
}

// ------------------------------ layout ------------------------------
function layout() {
  const incoming = {};
  edges.value.forEach((e) => (incoming[e.target] = true));
  const adj = {};
  edges.value.forEach((e) => (adj[e.source] = adj[e.source] || []).push(e.target));

  const depth = {};
  const q = [];
  nodes.value.forEach((n) => {
    if (!incoming[n.id]) {
      depth[n.id] = 0;
      q.push(n.id);
    }
  });
  if (!q.length && nodes.value.length) {
    depth[nodes.value[0].id] = 0;
    q.push(nodes.value[0].id);
  }
  while (q.length) {
    const id = q.shift();
    for (const tgt of adj[id] || []) {
      if (depth[tgt] === undefined) {
        depth[tgt] = depth[id] + 1;
        q.push(tgt);
      }
    }
  }
  const perDepth = {};
  nodes.value.forEach((n) => {
    const d = depth[n.id] ?? 0;
    perDepth[d] = perDepth[d] || 0;
    n.position = { x: d * 280, y: perDepth[d] * 160 };
    perDepth[d] += 1;
  });
}

// ------------------------------ (de)serialization ------------------------------
function nameOf(id) {
  const n = nodes.value.find((x) => x.id === id);
  return (n && (n.data.name || n.id)) || id;
}

function toFlow() {
  const withIncoming = new Set(edges.value.map((e) => e.target));

  const steps = nodes.value.map((n) => {
    const d = n.data;
    const step = { name: d.name || n.id, prompt: d.prompt || "", reply: !!d.reply };
    if (d.model) step.model = d.model;
    if ((d.database_ids || []).length) step.database_ids = d.database_ids;
    if (d.use_history) step.use_history = true;

    const edgeFor = (handleId) =>
      edges.value.find(
        (e) => e.source === n.id && (e.sourceHandle || "next") === handleId
      );

    const branches = (d.outcomes || []).filter((o) => o && o.label);
    const routes = [];
    if (branches.length) {
      const labels = branches.map((o) => o.label);
      step.output = {
        type: "object",
        properties: { route: { type: "string", enum: labels } },
        required: ["route"],
        additionalProperties: false,
      };
      for (const b of branches) {
        const e = edgeFor(b.id);
        if (e) routes.push({ when_var: `${step.name}.route`, equals: b.label, goto: nameOf(e.target) });
      }
    } else {
      const e = edgeFor("next");
      if (e) routes.push({ when_var: "", equals: "", goto: nameOf(e.target) });
    }
    if (routes.length) step.routes = routes;
    return step;
  });

  const entryIdx = nodes.value.findIndex((n) => !withIncoming.has(n.id));
  if (entryIdx > 0) {
    const [s] = steps.splice(entryIdx, 1);
    steps.unshift(s);
  }
  return { steps };
}

function fromFlow(flow) {
  const steps = (flow && flow.steps) || [];
  const ns = [];
  const es = [];
  const nameToId = {};
  const labelToBranchId = {}; // stepId -> { label -> branchId }
  steps.forEach((s, i) => (nameToId[s.name] = "n" + (i + 1)));

  steps.forEach((s, i) => {
    const id = "n" + (i + 1);
    idSeq = Math.max(idSeq, i + 1);
    const enumLabels =
      s.output && s.output.properties && s.output.properties.route
        ? s.output.properties.route.enum || []
        : [];
    const outcomes = enumLabels.map((label) => {
      const bid = "b" + ++branchSeq;
      (labelToBranchId[id] = labelToBranchId[id] || {})[label] = bid;
      return { id: bid, label };
    });
    ns.push({
      id,
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        name: s.name || "",
        prompt: s.prompt || "",
        model: s.model || "",
        database_ids: s.database_ids || [],
        use_history: !!s.use_history,
        reply: !!s.reply,
        outcomes,
      },
    });
  });

  // second pass: edges (need branch ids resolved above)
  steps.forEach((s, i) => {
    const id = "n" + (i + 1);
    const hasBranches = (labelToBranchId[id] && Object.keys(labelToBranchId[id]).length) > 0;
    for (const r of s.routes || []) {
      if (!r.goto) continue;
      const target = nameToId[r.goto];
      if (!target) continue;
      const handle = hasBranches ? labelToBranchId[id][r.equals] : "next";
      if (!handle) continue;
      es.push({
        id: `${id}:${handle}->${target}`,
        source: id,
        sourceHandle: handle,
        target,
      });
    }
  });

  nodes.value = ns;
  edges.value = es;
  layout();
  restyleEdges();
  refreshHandles();
  nextTick(() => fitView({ padding: 0.2 }));
}

// Mock support flow: intake agent decides (by prompt) new vs existing client;
// existing -> billing summary -> admin note (full dump, operator-only) ->
// classify -> generate (each step auto-sees the previous); new -> a separate
// answer with its own knowledge bases.
function presetSupport() {
  return {
    steps: [
      {
        name: "Приёмная",
        prompt:
          "Ты — приёмная службы поддержки хостинга. Определи тип клиента строго по этому техническому " +
          'признаку (не по смыслу и тону сообщения): account_id = "{{account_id}}".\n' +
          "• account_id непустой → «Существующий клиент».\n" +
          '• account_id пустой (равен "") → «Новый клиент».',
        model: "gpt-4o-mini",
        use_history: true,
        output: {
          type: "object",
          properties: {
            route: { type: "string", enum: ["Новый клиент", "Существующий клиент"] },
          },
          required: ["route"],
          additionalProperties: false,
        },
        routes: [
          { when_var: "Приёмная.route", equals: "Новый клиент", goto: "Ответ новому клиенту" },
          { when_var: "Приёмная.route", equals: "Существующий клиент", goto: "Сводка из биллинга" },
        ],
      },
      {
        name: "Сводка из биллинга",
        prompt:
          "Собери ПОЛНОЕ досье клиента для оператора — это не ответ на конкретный вопрос клиента, " +
          "поэтому игнорируй рекомендации самих инструментов о том, какой один action выбрать под вопрос. " +
          "Вызови ВСЕ пять, именно все, вне зависимости от того, о чём спросил клиент:\n" +
          "nocloud_instances(action=list), nocloud_billing(action=account), " +
          "nocloud_billing(action=balance), nocloud_billing(action=invoices), nocloud_tickets(action=list).\n" +
          "Дай короткую фактическую сводку без воды по итогам всех пяти вызовов. " +
          "Если данных нет — так и скажи, не выдумывай. Сводку увидят следующие шаги.",
        model: "gpt-4o-mini",
        use_history: true,
        routes: [{ when_var: "", equals: "", goto: "Создание admin note" }],
      },
      {
        name: "Создание admin note",
        prompt:
          "Вызови инструмент create_admin_note. В поле note перечисли КАЖДЫЙ объект из сводки выше " +
          "отдельной строкой, поимённо/по номеру — не считай и не обобщай:\n" +
          "- каждый инстанс: имя, статус;\n" +
          "- баланс, тариф, статус аккаунта;\n" +
          "- каждый неоплаченный счёт: номер, сумма, дата;\n" +
          "- суть обращения клиента.\n" +
          "Запрещены фразы вида '8 неоплаченных инвойсов' или '10 инстансов' без перечисления каждого — " +
          "если их 8, должно быть 8 строк с номером и суммой. Клиент эту заметку не видит. " +
          "Пользователю в этом шаге не отвечай — твоя единственная задача здесь — вызвать инструмент.",
        model: "gpt-4o-mini",
        use_history: true,
        routes: [{ when_var: "", equals: "", goto: "Классификация" }],
      },
      {
        name: "Классификация",
        prompt:
          "Определи, в какой отдел направить обращение существующего клиента:\n" +
          "• «Биллинг» — оплаты, счета, тарифы, продление, возвраты.\n" +
          "• «Техника» — сервер не работает, ошибки, доступы, настройка, производительность.\n" +
          "• «Другое» — всё остальное и общие вопросы.\n" +
          "Выбери ветку.",
        model: "gpt-4o-mini",
        use_history: true,
        output: {
          type: "object",
          properties: {
            route: { type: "string", enum: ["Биллинг", "Техника", "Другое"] },
          },
          required: ["route"],
          additionalProperties: false,
        },
        routes: [
          { when_var: "Классификация.route", equals: "Биллинг", goto: "Ответ по биллингу" },
          { when_var: "Классификация.route", equals: "Техника", goto: "Технический ответ" },
          { when_var: "Классификация.route", equals: "Другое", goto: "Общий ответ" },
        ],
      },
      {
        name: "Ответ по биллингу",
        prompt:
          "Ты — специалист отдела биллинга. Начни ответ ровно с фразы «Здравствуйте, я специалист отдела " +
          "биллинга.» — это обязательное представление, не пропускай и не перефразируй его. Далее, опираясь " +
          "на сводку по клиенту выше, реши вопрос по оплатам, счетам и тарифам: дай конкретику по суммам и " +
          "срокам, подскажи как оплатить/продлить. Не выдумывай цифры — бери из сводки и базы знаний.",
        model: "gpt-4o-mini",
        use_history: true,
        reply: true,
        database_ids: [],
      },
      {
        name: "Технический ответ",
        prompt:
          "Ты — инженер техподдержки. Начни ответ ровно с фразы «Здравствуйте, я инженер технической " +
          "поддержки.» — это обязательное представление, не пропускай и не перефразируй его. Далее помоги " +
          "решить техническую проблему пошагово, с учётом услуг клиента из сводки. Спрашивай уточнения, только " +
          "если без них не обойтись. Опирайся на техническую базу знаний.",
        model: "gpt-4o-mini",
        use_history: true,
        reply: true,
        database_ids: [],
      },
      {
        name: "Общий ответ",
        prompt:
          "Ты — специалист общей поддержки. Начни ответ ровно с фразы «Здравствуйте, я специалист общей " +
          "поддержки.» — это обязательное представление, не пропускай и не перефразируй его. Далее ответь на " +
          "общий вопрос клиента дружелюбно и по делу, опираясь на базу знаний. Если вопрос не по адресу — " +
          "подскажи, куда обратиться.",
        model: "gpt-4o-mini",
        use_history: true,
        reply: true,
        database_ids: [],
      },
      {
        name: "Ответ новому клиенту",
        prompt:
          "Ты — менеджер по продажам. Начни ответ ровно с фразы «Здравствуйте, я менеджер по продажам.» — " +
          "это обязательное представление, не пропускай и не перефразируй его. Клиент новый, аккаунта нет — " +
          "не запрашивай данные аккаунта и не обещай лишнего. Ответь дружелюбно на вопрос, подскажи подходящий " +
          "тариф и мягко предложи оформить услугу. Опирайся на базу знаний по продуктам и ценам.",
        model: "gpt-4o-mini",
        use_history: true,
        reply: true,
        database_ids: [],
      },
    ],
  };
}

function loadPreset() {
  fromFlow(presetSupport());
  selectedId.value = null;
  commitStructuralChange();
}

function emitChange() {
  pruneEdges();
  emit("update:modelValue", toFlow());
}

// History (undo/redo) should only track structural edits — adding/removing
// agents or branches, (dis)connecting them — not every keystroke in a
// parameter field like name/prompt/model.
function commitStructuralChange() {
  emitChange();
  pushHistory();
}

function sameAsModel(v) {
  return JSON.stringify(toFlow()) === JSON.stringify(v || { steps: [] });
}

fromFlow(props.modelValue);
initialSnapshot = snapshot();
history.value = [snapshot()];
histIdx.value = 0;

watch(
  () => props.modelValue,
  (v) => {
    if (!sameAsModel(v)) {
      fromFlow(v);
      pushHistory();
    }
  }
);
</script>

<style scoped>
.canvas__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.canvas__hint {
  font-size: 0.8rem;
  color: #999;
}
.canvas__stage {
  height: 540px;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  overflow: hidden;
  background: #fcfcfc;
}
.canvas__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}
.canvas__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.canvas__swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
}

.ctrl {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.ctrl__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #555;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ctrl__btn:hover:not(:disabled) {
  background: #f0f5ff;
  color: #1677ff;
}
.ctrl__btn:disabled {
  color: #ccc;
  cursor: default;
}
.ctrl__sep {
  width: 1px;
  height: 18px;
  background: #eaeaea;
  margin: 0 2px;
}

.fnode {
  min-width: 160px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #1677ff;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: grab;
}
.fnode:active {
  cursor: grabbing;
}
.fnode--reply {
  border-left-color: #52c41a;
  background: #f6ffed;
}
.fnode--branch {
  border-left-color: #fa8c16;
  background: #fffbf0;
}
.fnode--sel {
  box-shadow: 0 0 0 2px #1677ff, 0 2px 10px rgba(22, 119, 255, 0.25);
}
.fnode-start {
  min-width: 70px;
  padding: 8px 14px;
  border: 1px solid #91caff;
  border-left: 4px solid #1677ff;
  border-radius: 10px;
  background: #e6f4ff;
  color: #1677ff;
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.fnode__title {
  font-weight: 600;
  font-size: 0.95rem;
}
.fnode__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}
.fnode__tag {
  font-size: 0.68rem;
  padding: 1px 7px;
  border-radius: 9px;
  background: #f0f0f0;
  color: #666;
}
.fnode__tag--branch {
  background: #fff7e6;
  color: #d4670a;
}
.fnode__tag--reply {
  background: #f6ffed;
  color: #389e0d;
}
.fnode__outs {
  margin-top: 8px;
}
.fnode__out {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  font-size: 0.74rem;
  color: #555;
  padding: 2px 0;
}
.fnode__out-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
.fnode__out-lbl {
  padding-right: 10px;
}

/* bigger, easier-to-grab ports */
.fnode :deep(.vue-flow__handle) {
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}
.fnode :deep(.vue-flow__handle:hover) {
  transform: scale(1.25);
}
.fnode__in {
  background: #bfbfbf;
}

.fld__lbl {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin: 12px 0 4px;
}
.fld__hint {
  font-size: 0.78rem;
  color: #999;
  margin: 0 0 8px;
}
.fld__switch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
.brow__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: none;
}
.branch {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  background: #fafafa;
}
.branch__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.branch__to {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding-left: 20px;
}
.branch__arrow {
  color: #999;
}
</style>
