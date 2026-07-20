<template>
  <div class="flow">
    <div class="flow__topbar">
      <a-radio-group v-model:value="view" button-style="solid" size="small">
        <a-radio-button value="editor">{{ t("bots.flow.view_editor") }}</a-radio-button>
        <a-radio-button value="graph">{{ t("bots.flow.view_graph") }}</a-radio-button>
      </a-radio-group>
    </div>

    <!-- ============================ EDITOR ============================ -->
    <template v-if="view === 'editor'">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        :message="t('bots.flow.intro')"
      />

      <draggable
        v-model="steps"
        item-key="_id"
        handle=".flow__grip"
        :animation="180"
        ghost-class="flow__ghost"
        drag-class="flow__dragging"
        @change="emitChange"
      >
        <template #item="{ element: step, index: i }">
          <div class="flow__step">
            <div class="flow__head">
              <span
                class="flow__grip"
                :title="t('bots.flow.drag_hint')"
                >⠿</span
              >
              <span class="flow__badge">{{ i + 1 }}</span>
          <a-input
            v-model:value="step.name"
            class="flow__name"
            :placeholder="t('bots.flow.step_name_ph')"
            @change="emitChange"
          />
          <a-tooltip :title="t('bots.flow.reply_tip')">
            <a-checkbox v-model:checked="step.reply" @change="emitChange">
              {{ t("bots.flow.reply") }}
            </a-checkbox>
          </a-tooltip>
          <a-button class="flow__del" size="small" danger @click="removeStep(i)"
            >✕</a-button
          >
        </div>

        <div class="flow__row">
          <div class="flow__col">
            <label class="flow__lbl">{{ t("bots.flow.model") }}</label>
            <a-select
              :options="modelsOptions"
              style="width: 100%"
              allow-clear
              :placeholder="t('bots.flow.model_default')"
              :value="step.model || undefined"
              @update:value="((step.model = $event || ''), emitChange())"
            />
          </div>
          <div class="flow__col">
            <label class="flow__lbl">{{ t("bots.flow.databases") }}</label>
            <a-select
              mode="multiple"
              style="width: 100%"
              allow-clear
              :options="databaseOptions"
              :placeholder="t('bots.flow.databases_ph')"
              v-model:value="step.database_ids"
              @change="emitChange"
            />
          </div>
          <div class="flow__col flow__col--switch">
            <label class="flow__lbl">{{ t("bots.flow.use_history") }}</label>
            <a-switch v-model:checked="step.use_history" @change="emitChange" />
          </div>
        </div>

        <label class="flow__lbl">{{ t("bots.flow.prompt") }}</label>
        <a-textarea
          v-model:value="step.prompt"
          :auto-size="{ minRows: 3 }"
          :placeholder="t('bots.flow.prompt_ph')"
          @change="emitChange"
        />
        <div class="flow__vars">
          <span class="flow__vars-lbl">{{ t("bots.flow.available_vars") }}:</span>
          <a-tag
            v-for="v in varsBefore(i)"
            :key="v"
            class="flow__var"
            @click="insertVar(step, v)"
            >{{ wrap(v) }}</a-tag
          >
        </div>

        <!-- Output fields -> compiled to a JSON schema on save -->
        <div class="flow__block">
          <label class="flow__lbl"
            >{{ t("bots.flow.output") }}
            <a-tooltip :title="t('bots.flow.output_tip')"
              ><span class="flow__hint">?</span></a-tooltip
            ></label
          >
          <div v-for="(f, fi) in step._fields" :key="fi" class="flow__field">
            <a-input
              v-model:value="f.key"
              style="width: 150px"
              :placeholder="t('bots.flow.field_key_ph')"
              @change="emitChange"
            />
            <a-select
              v-model:value="f.type"
              style="width: 110px"
              :options="typeOptions"
              @change="emitChange"
            />
            <a-select
              v-if="enumAllowed(f.type)"
              mode="tags"
              style="flex: 1; min-width: 150px"
              :placeholder="t('bots.flow.field_enum_ph')"
              v-model:value="f.enum"
              @change="emitChange"
            />
            <span v-else class="flow__field-note">{{ t("bots.flow.no_enum") }}</span>
            <a-button size="small" danger @click="removeField(step, fi)"
              >✕</a-button
            >
          </div>
          <a-button size="small" type="dashed" @click="addField(step)">
            + {{ t("bots.flow.add_field") }}
          </a-button>
        </div>

        <!-- Routes -->
        <div class="flow__block">
          <label class="flow__lbl"
            >{{ t("bots.flow.routes") }}
            <a-tooltip :title="t('bots.flow.routes_tip')"
              ><span class="flow__hint">?</span></a-tooltip
            ></label
          >
          <div v-for="(r, ri) in step.routes" :key="ri" class="flow__route">
            <span class="flow__route-if">{{ t("bots.flow.when") }}</span>
            <a-select
              v-model:value="r.when_var"
              style="width: 150px"
              allow-clear
              :options="varOptions(i)"
              :placeholder="t('bots.flow.route_default')"
              @change="emitChange"
            />
            <span class="flow__route-eq">=</span>
            <a-input
              v-model:value="r.equals"
              style="width: 120px"
              :placeholder="t('bots.flow.value_ph')"
              @change="emitChange"
            />
            <span class="flow__route-then">→</span>
            <a-select
              v-model:value="r.goto"
              style="width: 150px"
              :options="gotoOptions"
              @change="emitChange"
            />
            <a-button size="small" danger @click="removeRoute(step, ri)"
              >✕</a-button
            >
          </div>
          <a-button size="small" type="dashed" @click="addRoute(step)">
            + {{ t("bots.flow.add_route") }}
          </a-button>
        </div>
          </div>
        </template>
      </draggable>

      <a-button type="primary" ghost block @click="addStep">
        + {{ t("bots.flow.add_step") }}
      </a-button>
    </template>

    <!-- ============================ GRAPH ============================ -->
    <div v-else class="graph">
      <div
        v-for="(node, i) in graphNodes"
        :key="node.id"
        class="graph__row"
      >
        <div
          class="graph__node"
          :class="{
            'graph__node--reply': node.reply,
            'graph__node--branch': node.edges.length > 1,
            'graph__node--dead': !node.reachable,
          }"
        >
          <span class="graph__num">{{ i + 1 }}</span>
          <span class="graph__name">{{ node.name || t("bots.flow.unnamed") }}</span>
          <span v-if="node.reply" class="graph__tag graph__tag--reply">✉ {{ t("bots.flow.reply") }}</span>
          <span v-if="node.model" class="graph__tag">{{ node.model }}</span>
          <span v-if="node.dbs" class="graph__tag">RAG·{{ node.dbs }}</span>
          <span v-if="node.fields" class="graph__tag">{ } {{ node.fields }}</span>
          <span v-if="!node.reachable" class="graph__tag graph__tag--dead">{{ t("bots.flow.unreachable") }}</span>
        </div>
        <div class="graph__edges">
          <div v-for="(e, ei) in node.edges" :key="ei" class="graph__edge">
            <span class="graph__arrow">↳</span>
            <span v-if="e.cond" class="graph__cond">{{ e.cond }}</span>
            <span v-else class="graph__cond graph__cond--default">{{ e.defaultLabel }}</span>
            <span class="graph__to">→ {{ e.toLabel }}</span>
          </div>
        </div>
      </div>
      <a-empty v-if="!graphNodes.length" :description="t('bots.flow.add_step')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

const { t } = useI18n();

const props = defineProps({
  modelValue: { type: Object, default: () => ({ steps: [] }) },
  modelsOptions: { type: Array, default: () => [] },
  databases: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue"]);

// Seed vars the backend injects before the flow runs (see runFlow in ai-bot-manager).
const SEED_VARS = ["account_id", "channel", "input"];

const typeOptions = [
  { value: "string", label: "string" },
  { value: "integer", label: "integer" },
  { value: "number", label: "number" },
  { value: "boolean", label: "boolean" },
  { value: "array", label: "array" },
];
// enum only makes sense (and routes only compare) on scalar values.
const enumAllowed = (type) => ["string", "integer", "number"].includes(type);

const view = ref("editor");
const steps = ref([]);
let idSeq = 0;

const databaseOptions = computed(() =>
  (props.databases || []).map((d) => ({ value: d.id, label: d.name || d.id }))
);

const gotoOptions = computed(() => [
  ...steps.value
    .filter((s) => s.name)
    .map((s) => ({ value: s.name, label: s.name })),
  { value: "", label: t("bots.flow.end") },
]);

// wrap renders a var name as a {{placeholder}} chip without tripping the Vue
// template parser on nested mustaches.
const wrap = (v) => "{{" + v + "}}";

// Vars available to step i: seeds + output fields declared by earlier steps.
function varsBefore(i) {
  const out = [...SEED_VARS];
  for (let j = 0; j < i; j++) {
    const s = steps.value[j];
    for (const f of s._fields || []) {
      if (!f.key) continue;
      out.push(f.key);
      if (s.name) out.push(`${s.name}.${f.key}`);
    }
  }
  return out;
}
function varOptions(i) {
  return varsBefore(i).map((v) => ({ value: v, label: v }));
}

function insertVar(step, v) {
  step.prompt = `${step.prompt || ""}${wrap(v)}`;
  emitChange();
}

// Drag & drop is handled by vuedraggable (v-model="steps"); we only re-emit
// once a reorder actually changes the list.

// ------------------------------ step mutations ------------------------------
function addStep() {
  steps.value.push(blankStep());
  emitChange();
}
function removeStep(i) {
  steps.value.splice(i, 1);
  emitChange();
}
function addField(step) {
  step._fields.push({ key: "", type: "string", enum: [] });
  emitChange();
}
function removeField(step, fi) {
  step._fields.splice(fi, 1);
  emitChange();
}
function addRoute(step) {
  step.routes.push({ when_var: "", equals: "", goto: "" });
  emitChange();
}
function removeRoute(step, ri) {
  step.routes.splice(ri, 1);
  emitChange();
}

function blankStep() {
  return {
    _id: ++idSeq,
    name: "",
    prompt: "",
    model: "",
    database_ids: [],
    use_history: true,
    reply: false,
    routes: [],
    _fields: [],
  };
}

// ------------------------------ graph preview ------------------------------
// Nodes with computed outgoing edges + reachability from step 0. Mirrors the
// backend nextStepIndex rules: routes decide when present (WhenVar "" = default,
// empty Goto = end); otherwise fall through to the next step, end after last.
const graphNodes = computed(() => {
  const list = steps.value;
  const byName = {};
  list.forEach((s, i) => {
    if (s.name) byName[s.name] = i;
  });

  const edgesOf = (s, i) => {
    if (s.routes && s.routes.length) {
      return s.routes.map((r) => {
        const isDefault = !r.when_var;
        const toEnd = !r.goto;
        return {
          cond: isDefault ? "" : `${r.when_var} = ${r.equals || "∅"}`,
          defaultLabel: t("bots.flow.edge_default"),
          toIdx: toEnd ? -1 : byName[r.goto] ?? -1,
          toLabel: toEnd ? t("bots.flow.end") : r.goto,
        };
      });
    }
    const nextIdx = i + 1 < list.length ? i + 1 : -1;
    return [
      {
        cond: "",
        defaultLabel: t("bots.flow.edge_next"),
        toIdx: nextIdx,
        toLabel: nextIdx >= 0 ? list[nextIdx].name || t("bots.flow.unnamed") : t("bots.flow.end"),
      },
    ];
  };

  const edges = list.map((s, i) => edgesOf(s, i));

  // reachability from node 0 following every edge target.
  const reachable = new Set();
  const walk = (i) => {
    if (i < 0 || i >= list.length || reachable.has(i)) return;
    reachable.add(i);
    for (const e of edges[i]) walk(e.toIdx);
  };
  if (list.length) walk(0);

  return list.map((s, i) => ({
    id: s._id,
    name: s.name,
    reply: !!s.reply,
    model: s.model || "",
    dbs: (s.database_ids || []).length,
    fields: (s._fields || []).filter((f) => f.key).length,
    reachable: reachable.has(i),
    edges: edges[i],
  }));
});

// --- (de)serialization between the editor shape and the backend flow shape ---
function fieldsFromSchema(schema) {
  if (!schema || !schema.properties) return [];
  return Object.entries(schema.properties).map(([key, def]) => ({
    key,
    type: def.type === "array" ? "array" : def.type || "string",
    enum: Array.isArray(def.enum) ? def.enum.map(String) : [],
  }));
}

function schemaFromFields(fields) {
  const props_ = {};
  const required = [];
  for (const f of fields || []) {
    if (!f.key) continue;
    let def;
    if (f.type === "array") {
      def = { type: "array", items: { type: "string" } };
    } else {
      def = { type: f.type || "string" };
      if (enumAllowed(f.type) && f.enum && f.enum.length) def.enum = f.enum;
    }
    props_[f.key] = def;
    required.push(f.key);
  }
  if (required.length === 0) return null;
  return {
    type: "object",
    properties: props_,
    required,
    additionalProperties: false,
  };
}

function fromFlow(flow) {
  const src = (flow && flow.steps) || [];
  steps.value = src.map((s) => ({
    _id: ++idSeq,
    name: s.name || "",
    prompt: s.prompt || "",
    model: s.model || "",
    database_ids: s.database_ids || [],
    use_history: !!s.use_history,
    reply: !!s.reply,
    routes: (s.routes || []).map((r) => ({
      when_var: r.when_var || "",
      equals: r.equals || "",
      goto: r.goto || "",
    })),
    _fields: fieldsFromSchema(s.output),
  }));
}

function toFlow() {
  return {
    steps: steps.value.map((s) => {
      const out = { name: s.name, prompt: s.prompt, reply: !!s.reply };
      if (s.model) out.model = s.model;
      if (s.database_ids && s.database_ids.length)
        out.database_ids = s.database_ids;
      if (s.use_history) out.use_history = true;
      const schema = schemaFromFields(s._fields);
      if (schema) out.output = schema;
      if (s.routes && s.routes.length)
        out.routes = s.routes.filter((r) => r.when_var !== "" || r.goto !== "");
      return out;
    }),
  };
}

// toFlow() drops editor-only keys (_id/_fields), so compare on the backend shape.
function sameAsModel(v) {
  return JSON.stringify(toFlow()) === JSON.stringify(v || { steps: [] });
}

function emitChange() {
  emit("update:modelValue", toFlow());
}

fromFlow(props.modelValue);

watch(
  () => props.modelValue,
  (v) => {
    if (!sameAsModel(v)) fromFlow(v);
  }
);
</script>

<style scoped>
.flow__topbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.flow__step {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fafafa;
  transition: box-shadow 0.15s, border-color 0.15s, opacity 0.15s;
}
/* vuedraggable: placeholder gap + the element being dragged */
.flow__ghost {
  opacity: 0.5;
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}
.flow__dragging {
  cursor: grabbing;
}
.flow__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.flow__grip {
  cursor: grab;
  color: #bbb;
  font-size: 18px;
  line-height: 1;
  user-select: none;
  padding: 0 2px;
}
.flow__grip:active {
  cursor: grabbing;
}
.flow__badge {
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: 50%;
  background: #1677ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.flow__name {
  max-width: 240px;
  font-weight: 600;
}
.flow__del {
  margin-left: auto;
}
.flow__row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.flow__col {
  flex: 1;
}
.flow__col--switch {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.flow__lbl {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin: 6px 0 2px;
}
.flow__vars {
  margin: 6px 0;
}
.flow__vars-lbl {
  font-size: 0.8rem;
  color: #999;
  margin-right: 4px;
}
.flow__var {
  cursor: pointer;
  font-family: monospace;
}
.flow__block {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #ddd;
}
.flow__field,
.flow__route {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.flow__field-note {
  flex: 1;
  min-width: 150px;
  color: #bbb;
  font-size: 0.8rem;
  font-style: italic;
}
.flow__route-if,
.flow__route-then,
.flow__route-eq {
  color: #888;
  font-size: 0.85rem;
}
.flow__hint {
  display: inline-flex;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #ddd;
  color: #555;
  font-size: 11px;
  align-items: center;
  justify-content: center;
  cursor: help;
}

/* ---- graph preview ---- */
.graph {
  padding: 4px 2px;
}
.graph__row {
  margin-bottom: 6px;
}
.graph__node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-left: 4px solid #1677ff;
  border-radius: 6px;
  background: #fff;
}
.graph__node--reply {
  border-left-color: #52c41a;
}
.graph__node--branch {
  border-left-color: #fa8c16;
}
.graph__node--dead {
  opacity: 0.6;
  border-left-color: #bfbfbf;
  background: #f5f5f5;
}
.graph__num {
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 50%;
  background: #f0f0f0;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
.graph__name {
  font-weight: 600;
}
.graph__tag {
  font-size: 0.72rem;
  padding: 1px 7px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #666;
}
.graph__tag--reply {
  background: #f6ffed;
  color: #389e0d;
}
.graph__tag--dead {
  background: #fff1f0;
  color: #cf1322;
}
.graph__edges {
  margin: 2px 0 0 26px;
}
.graph__edge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #777;
  padding: 1px 0;
}
.graph__arrow {
  color: #bbb;
}
.graph__cond {
  font-family: monospace;
  color: #555;
}
.graph__cond--default {
  font-family: inherit;
  font-style: italic;
  color: #999;
}
.graph__to {
  color: #1677ff;
}
</style>
