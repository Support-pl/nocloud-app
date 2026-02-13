<template>
  <div></div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

onMounted(() => {
  router.push({ name: "login", query: route.query });
});
</script>
