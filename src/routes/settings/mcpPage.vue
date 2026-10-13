<template>
  <div class="mcp-page">
    <div class="container">
      <div class="mcp-page__card">
        <mcp-settings />
      </div>
    </div>
  </div>
</template>

<script setup>
import mcpSettings from "@/components/settings/mcpSettings.vue";
</script>

<script>
export default { name: "McpPage" };
</script>

<style scoped>
.mcp-page {
  padding-top: 20px;
}

.mcp-page__card {
  padding: 20px;
  border-radius: 10px;
  background: var(--bright_font);
}
</style>
