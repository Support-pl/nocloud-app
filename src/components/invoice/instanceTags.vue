<template>
  <div class="instance-tags">
    <!-- Показываем первые 2 инстанса -->
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

    <!-- Кнопка "+" с количеством скрытых инстансов -->
    <a-tooltip v-if="hasMoreInstances" placement="top">
      <template #title>
        <div class="hidden-instances">
          <div v-for="uuid in hiddenInstances" :key="uuid" class="hidden-instance">
            {{ capitalize(t("service")) }}: {{ getFullInstanceName(uuid) }}
          </div>
        </div>
      </template>
      
      <a-tag class="more-tag">
        +{{ hiddenInstances.length }}
      </a-tag>
    </a-tooltip>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useInstancesStore } from "@/stores/instances";
import { capitalize } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  instances: {
    type: Array,
    default: () => [],
  },
  maxLength: {
    type: Number,
    default: 20,
  },
  maxVisible: {
    type: Number,
    default: 3,
  },
});

const instancesStore = useInstancesStore();
const { t } = useI18n();

const visibleInstances = computed(() => {
  return props.instances.slice(0, props.maxVisible);
});

const hiddenInstances = computed(() => {
  return props.instances.slice(props.maxVisible);
});

const hasMoreInstances = computed(() => {
  return props.instances.length > props.maxVisible;
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

.more-tag {
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
