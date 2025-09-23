<template>
  <div class="instance-tags">
    <template v-if="filterMode">
      <template v-for="uuid in allInstanceUuids" :key="uuid">
        <a-tooltip
          v-if="isNameTruncated(uuid)"
          :title="getFullInstanceName(uuid)"
          placement="top"
        >
          <a-button
            class="instance-filter-btn"
            :type="isInstanceSelected(uuid) ? 'primary' : 'default'"
            :size="size"
            @click="toggleInstance(uuid)"
          >
            <div class="instance-content">
              {{ getTruncatedInstanceName(uuid) }}
              <plus-icon v-if="!isInstanceSelected(uuid)" class="toggle-icon" />
              <minus-icon v-else class="toggle-icon" />
            </div>
          </a-button>
        </a-tooltip>

        <a-button
          v-else
          class="instance-filter-btn"
          :type="isInstanceSelected(uuid) ? 'primary' : 'default'"
          :size="size"
          @click="toggleInstance(uuid)"
        >
          <div class="instance-content">
            {{ getFullInstanceName(uuid) }}
            <plus-icon v-if="!isInstanceSelected(uuid)" class="toggle-icon" />
            <minus-icon v-else class="toggle-icon" />
          </div>
        </a-button>
      </template>
    </template>

    <template v-else>
      <template v-for="uuid in visibleInstances" :key="uuid">
        <a-tooltip
          v-if="isNameTruncated(uuid)"
          :title="getFullInstanceName(uuid)"
          placement="top"
        >
          <a-tag class="instance-tag">
            {{ capitalize(t("service")) }}: {{ getTruncatedInstanceName(uuid) }}
          </a-tag>
        </a-tooltip>

        <a-tag v-else class="instance-tag">
          {{ capitalize(t("service")) }}: {{ getFullInstanceName(uuid) }}
        </a-tag>
      </template>

      <a-tooltip v-if="hasMoreInstances" placement="top">
        <template #title>
          <div class="hidden-instances">
            <div
              v-for="uuid in hiddenInstances"
              :key="uuid"
              class="hidden-instance"
            >
              {{ capitalize(t("service")) }}: {{ getFullInstanceName(uuid) }}
            </div>
          </div>
        </template>

        <a-tag class="more-tag"> +{{ hiddenInstances.length }} </a-tag>
      </a-tooltip>
    </template>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useInstancesStore } from "@/stores/instances";
import { capitalize } from "vue";
import { useI18n } from "vue-i18n";

const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusCircleOutlined")
);
const minusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CloseCircleOutlined")
);

const props = defineProps({
  instances: {
    type: Array,
    default: () => [],
  },
  maxLength: {
    type: Number,
    default: 15,
  },
  maxVisible: {
    type: Number,
    default: 2,
  },
  filterMode: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "small",
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "selection-change"]);

const instancesStore = useInstancesStore();
const { t } = useI18n();

const selectedInstances = ref([...(props.modelValue || [])]);

const allInstanceUuids = computed(() => {
  return instancesStore.allInstances.map((instance) => instance.uuid);
});

const visibleInstances = computed(() => {
  const instancesToShow = props.filterMode
    ? selectedInstances.value
    : props.instances;
  return instancesToShow.slice(0, props.maxVisible);
});

const hiddenInstances = computed(() => {
  const instancesToShow = props.filterMode
    ? selectedInstances.value
    : props.instances;
  return instancesToShow.slice(props.maxVisible);
});

const hasMoreInstances = computed(() => {
  const instancesToShow = props.filterMode
    ? selectedInstances.value
    : props.instances;
  return instancesToShow.length > props.maxVisible;
});

function getFullInstanceName(uuid) {
  if (!uuid) return null;

  return (
    instancesStore.allInstances.find((inst) => inst.uuid === uuid)?.title ??
    uuid.split("-")[0]
  );
}

function isNameTruncated(uuid) {
  const fullName = getFullInstanceName(uuid);
  return fullName && fullName.length > props.maxLength;
}

function getTruncatedInstanceName(uuid) {
  const fullName = getFullInstanceName(uuid);
  if (!fullName) return null;

  return isNameTruncated(uuid)
    ? fullName.substring(0, props.maxLength) + "..."
    : fullName;
}

function isInstanceSelected(uuid) {
  return selectedInstances.value.includes(uuid);
}

function toggleInstance(uuid) {
  const index = selectedInstances.value.indexOf(uuid);

  if (index > -1) {
    selectedInstances.value.splice(index, 1);
  } else {
    selectedInstances.value.push(uuid);
  }

  emit("update:modelValue", selectedInstances.value);
  emit("selection-change", selectedInstances.value);
}

watch(
  () => props.modelValue,
  (newValue) => {
    selectedInstances.value = [...newValue];
  },
  { immediate: true }
);

watch(
  () => props.filterMode,
  (newValue) => {
    if (newValue && selectedInstances.value.length === 0) {
      selectedInstances.value = [...allInstanceUuids.value];
      emit("update:modelValue", selectedInstances.value);
      emit("selection-change", selectedInstances.value);
    }
  },
  { immediate: true }
);
</script>

<script>
export default { name: "InstanceTags" };
</script>

<style lang="scss" scoped>
.instance-tags {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}

.instance-tag {
  margin: 0;
}

.instance-filter-btn {
  margin: 0;
  cursor: pointer;
  user-select: none;
}

.instance-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-icon {
  font-size: 14px;
}

.more-tag {
  background-color: var(--primary-color, #1890ff);
  color: white;
  border-color: var(--primary-color, #1890ff);
  cursor: help;
  margin: 0;
}

.hidden-instances {
  max-width: 300px;
}

.hidden-instance {
  padding: 2px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
}
</style>
