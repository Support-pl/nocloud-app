<template>
  <div v-if="items.length" class="legal-checkboxes">
    <div
      v-for="item in items"
      :key="item.key"
      class="legal-checkbox-item"
    >
      <a-checkbox v-model:checked="accepted[item.key]">
        <template v-if="item.link">
          {{ item.parts[0] }}<a
            :href="item.link.url"
            target="_blank"
            rel="noopener noreferrer"
            @click.stop
          >{{ item.link.text }}</a>{{ item.parts[1] }}
        </template>
        <template v-else>{{ item.text }}</template>
      </a-checkbox>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from "vue";
import appconfig from "@/appconfig.js";

const props = defineProps({
  // Pass the modal open state so checkboxes reset each time the modal opens
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["update:valid"]);

const legal = computed(() => appconfig.legal);

// Build a flat list of checkbox items from config checkboxes (any key, any count)
const items = computed(() => {
  const cbs = legal.value?.checkboxes;
  if (!cbs || typeof cbs !== "object") return [];

  return Object.entries(cbs).map(([key, value]) => {
    const text = typeof value === "string" ? value : value?.text || "";
    let link = null;

    if (value?.link) {
      const docRef = value.link.document;
      // Try matching by label, then by file, then fall back to docRef as a direct URL/path
      const doc = legal.value?.documents?.find(
        (d) => d.label === docRef || d.file === docRef
      );
      const url = doc?.file || docRef;
      if (url) link = { text: value.link.text, url };
    }

    // Split text around the link word so we can render the <a> inline
    let parts = [text, ""];
    if (link) {
      const idx = text.indexOf(link.text);
      if (idx !== -1) {
        parts = [text.slice(0, idx), text.slice(idx + link.text.length)];
      }
    }

    return { key, text, link, parts };
  });
});

// One boolean per checkbox key, reactive record
const accepted = reactive({});

// Init / reset whenever items change or modal reopens
function resetAccepted() {
  items.value.forEach(({ key }) => {
    accepted[key] = false;
  });
}

watch(items, resetAccepted, { immediate: true });

watch(
  () => props.open,
  (isOpen) => { if (isOpen) resetAccepted(); }
);

// Emit validity: all boxes must be checked
watch(
  [() => ({ ...accepted }), items],
  () => {
    if (!items.value.length) {
      emit("update:valid", true);
      return;
    }
    emit("update:valid", items.value.every(({ key }) => accepted[key]));
  },
  { immediate: true, deep: true }
);
</script>

<script>
export default { name: "LegalCheckboxes" };
</script>

<style scoped>
.legal-checkboxes {
  margin-top: 12px;
}

.legal-checkbox-item {
  margin-top: 8px;
  font-size: 0.875rem;
  line-height: 1.4;
}

.legal-checkbox-item:first-child {
  margin-top: 0;
}

.legal-checkbox-item a {
  color: var(--main);
  text-decoration: underline;
}
</style>
