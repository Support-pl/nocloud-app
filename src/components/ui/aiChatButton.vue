<template>
  <a-button
    class="ai-chat-button"
    type="primary"
    size="large"
    block
    :href="chatUrl"
    target="_blank"
    rel="noopener"
    @click="shareSession"
  >
    <template #icon><message-outlined /></template>
    <slot>{{ t("ai_packages.open_chat") }}</slot>
  </a-button>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { MessageOutlined } from "@ant-design/icons-vue";
import cookies from "js-cookie";
import config from "@/appconfig.js";
import { useAuthStore } from "@/stores/auth.js";

const { t } = useI18n();
const authStore = useAuthStore();

/** LibreChat signs the visitor in with their NoCloud session at /oauth/nocloud. */
const chatUrl = `${config.aiChatUrl.replace(/\/$/, "")}/oauth/nocloud`;

/** LibreChat's nocloud.sso.cookie: the cookie /oauth/nocloud reads the token from. */
const SSO_COOKIE = "nocloud_token";

/**
 * The domain this page and the chat share (global.support.by and ai.support.by → support.by), or ""
 * when they share none and the chat can only show its login form.
 */
const sharedDomain = (a, b) => {
  const x = a.split(".").reverse();
  const y = b.split(".").reverse();
  let n = 0;
  while (n < x.length && x[n] === y[n]) n++;
  return n >= 2 ? x.slice(0, n).reverse().join(".") : "";
};

/**
 * Hands the session to the chat for the one redirect: the cookie lives a minute on the shared domain,
 * not for the whole session, so other subdomains hardly ever get to see it.
 */
const shareSession = () => {
  const domain = sharedDomain(location.hostname, new URL(chatUrl).hostname);
  if (!domain || !authStore.token) return;

  cookies.set(SSO_COOKIE, authStore.token, {
    domain,
    expires: 1 / 1440,
    secure: location.protocol === "https:",
    sameSite: "lax",
  });
};
</script>

<script>
export default { name: "AiChatButton" };
</script>

<style scoped>
/*
 * rendered as a link, an ant button keeps its text at the top of a taller box; the selector
 * outweighs ant's own .ant-btn.ant-btn-lg, which otherwise keeps its height
 */
.ant-btn.ant-btn-lg.ai-chat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  border-radius: 12px;
  font-size: 1.15rem;
  font-weight: 500;
}
</style>
