<template>
  <div class="dns_editor">
    <div class="container">
      <div class="content__wrapper">
        <div class="content__title">
          {{ $t("DNS Editor") }}
        </div>
      </div>
      <iframe class="iframe" :src="iframeLink"></iframe>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const authStore = useAuthStore();
const { token, userdata } = storeToRefs(authStore);

const { locale } = useI18n();

const iframeLink = computed(() => {
  const fullParams = JSON.stringify({
    title: userdata.value.title,
    token: token.value,
    api: VUE_APP_BASE_URL,
    theme: "light",
    params: {},
    lang: locale.value,
  });

  return `${VUE_APP_BASE_URL}dns.ui/?a=${btoa(
    unescape(encodeURIComponent(fullParams))
  ).toString("base64")}`;
});
</script>

<style scoped>
.dns_editor {
  padding-top: 10px;
}

.dns_editor .container {
  width: 80vw;
  min-width: 80vw;
  min-height: 80vh;
  height: 80vh;
}

.dns_editor .iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.content__wrapper {
  display: flex;
  padding: 10px 10px 15px 10px;
  border-radius: 10px;
  background: var(--bright_font);
}

.content__fields-wrapper {
  min-height: 100%;
}

.content__title {
  font-size: 1.6rem;
  margin-bottom: 5px;
}
</style>
