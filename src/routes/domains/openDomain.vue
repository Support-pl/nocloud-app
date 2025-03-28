<template>
  <div class="service-page">
    <service-page />

    <div class="domains_table">
      <draw v-if="instance" :service="instance" />
    </div>
  </div>
</template>

<script setup>
import { useInstancesStore } from "@/stores/instances";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import servicePage from "@/routes/services/servicePage.vue";
import draw from "@/components/services/domains/draw.vue";

const route = useRoute();

const instancesStore = useInstancesStore();
const { instances } = storeToRefs(instancesStore);

const instance = computed(() =>
  instances.value.find((instance) => instance.uuid === route.params.id)
);
</script>

<style>
.domains_table {
  position: relative;
  max-width: 768px;
  min-height: 100%;
  margin: 40px auto;
}
</style>
