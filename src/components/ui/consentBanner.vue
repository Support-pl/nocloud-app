<template>
  <transition name="notification-appear">
    <div v-if="isVisible" class="consent-banner">
      <p class="consent-banner__message">
        {{ $t("We use cookies and collect analytics to improve the service") }}
      </p>

      <div v-if="docs.length" class="consent-banner__docs">
        <a
          v-for="doc in docs"
          :key="doc.label"
          :href="doc.file"
          target="_blank"
          rel="noopener noreferrer"
          class="consent-banner__doc-link"
        >
          {{ doc.label }}
        </a>
      </div>

      <div class="consent-banner__actions">
        <a-button ghost size="small" @click="decide('DECLINE')">
          {{ $t("Decline") }}
        </a-button>
        <a-button type="primary" size="small" @click="decide('ACCEPT')">
          {{ $t("Accept") }}
        </a-button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref } from "vue";
import api from "@/api.js";
import appconfig from "@/appconfig.js";

const POLICY_VERSION = "1";
const STORAGE_KEY = "consent_decision";

const isVisible = ref(
  appconfig.cookieConsentEnabled && !localStorage.getItem(STORAGE_KEY),
);

const docs = computed(() => (appconfig.legal?.documents ?? []).filter((d) => d.file));

async function decide(decision) {
  isVisible.value = false;
  localStorage.setItem(STORAGE_KEY, decision);

  try {
    await api.axios.post("/consent", {
      decision,
      policy_version: POLICY_VERSION,
    });
  } catch (e) {
    console.error("Failed to record consent", e);
  }
}
</script>

<script>
export default { name: "ConsentBanner" };
</script>

<style scoped>
.consent-banner {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1002;
  width: 320px;
  max-width: calc(100vw - 40px);
  background-color: #565656;
  color: var(--bright_font);
  padding: 16px 20px;
  font-size: 0.9rem;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.consent-banner__message {
  margin: 0 0 10px;
  line-height: 1.4;
}

.consent-banner__docs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-bottom: 12px;
}

.consent-banner__doc-link {
  color: inherit;
  text-decoration: underline;
  font-size: 0.8rem;
  opacity: 0.85;
}

.consent-banner__doc-link:hover {
  opacity: 1;
}

.consent-banner__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.notification-appear-enter-active,
.notification-appear-leave-active {
  transition: transform 0.5s ease, opacity 0.42s ease;
}
.notification-appear-enter-from,
.notification-appear-leave-to {
  transform: translateY(50px);
  opacity: 0;
}
</style>
