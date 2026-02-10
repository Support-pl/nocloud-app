<template>
  <div class="consent">
    <div class="consent__title consent__layout">
      <div class="logo" :class="['pos_' + config.appLogo.pos]">
        <div v-if="companyName" class="logo__title">
          {{ companyName }}
        </div>
        <div v-if="config.appLogo.path" class="logo__image">
          <img :src="config.appLogo.path" alt="logo" />
        </div>
      </div>
      <svg class="clipPathSvg" width="0" height="0">
        <defs>
          <clipPath id="myCurve" clipPathUnits="objectBoundingBox">
            <path
              d="M0.000,0.000 L1,-0.000 L1,0.743 C1,0.7 1,0.806 0.846,0.806 C0.728,0.806 0.635,0.791 0.400,0.791 C0.130,0.791 0.022,0.976 0.000,1 L0.000,-0.000 Z"
            />
          </clipPath>
        </defs>
      </svg>
    </div>
    <div class="consent__main consent__layout">
      <div class="consent__UI">
        <div v-if="isLoading" class="consent__loading">
          <span class="load__item" />
          <span class="load__item" />
          <span class="load__item" />
        </div>

        <template v-else-if="error">
          <div class="consent__error-container">
          
            <div class="consent__error">
              {{ error }}
            </div>
            <p v-if="closeCountdown > 0" class="consent__countdown">
              {{ $t("consent.window_closing_in", { seconds: closeCountdown }) }}
            </p>
          </div>
        </template>

        <template v-else>
          <div class="consent__app-info">
            <img
              v-if="interactionInfo?.client?.logo_url"
              :src="interactionInfo.client.logo_url"
              alt="app logo"
              class="consent__app-logo"
            />
            <div v-else class="consent__app-logo-placeholder">
              <appstore-outlined />
            </div>
            <h2 class="consent__app-name">
              {{ interactionInfo?.client?.name || $t("consent.application") }}
            </h2>
          </div>

          <p class="consent__description">
            {{ $t("consent.app_wants_access") }}
          </p>

          <div v-if="accountTitle" class="consent__account">
            <span class="consent__account-label">{{ $t("consent.as_account") }}:</span>
            <span class="consent__account-name">{{ accountTitle }}</span>
          </div>

          <div v-if="requestedScopes?.length" class="consent__scopes">
            <div class="consent__scopes-title">
              {{ $t("consent.requested_permissions") }}:
            </div>
            <ul class="consent__scope-list">
              <li
                v-for="scope in requestedScopes"
                :key="scope"
                class="consent__scope-item"
              >
                <check-circle-outlined class="consent__scope-icon" />
                <span>{{ getScopeLabel(scope) }}</span>
              </li>
            </ul>
          </div>

          <div
            v-if="interactionInfo?.client?.website_url"
            class="consent__website"
          >
            <a
              :href="interactionInfo.client.website_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <link-outlined /> {{ $t("consent.visit_website") }}
            </a>
          </div>

          <div class="consent__actions">
            <button
              class="consent__submit consent__submit--approve"
              :disabled="isSubmitting"
              @click="handleConsent(true)"
            >
              {{ $t("consent.allow") }}
            </button>
            <button
              class="consent__submit consent__submit--deny"
              :disabled="isSubmitting"
              @click="handleConsent(false)"
            >
              {{ $t("consent.deny") }}
            </button>
          </div>

          <p class="consent__note">
            {{ $t("consent.note") }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { notification } from "ant-design-vue";
import {
  CheckCircleOutlined,
  AppstoreOutlined,
  LinkOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons-vue";

import config from "@/appconfig.js";
import api from "@/api.js";
import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";

const route = useRoute();
const { t } = useI18n();
const appStore = useAppStore();
const authStore = useAuthStore();

const isLoading = ref(true);
const isSubmitting = ref(false);
const error = ref("");
const interactionInfo = ref(null);
const closeCountdown = ref(0);
let countdownInterval = null;

const interactionId = computed(() => route.query.interaction_id);
const companyName = computed(() => appStore.domainInfo.name ?? config.appTitle);
const accountTitle = computed(() => authStore.userdata?.title || authStore.userdata?.email || "");

const requestedScopes = computed(
  () => interactionInfo.value?.requested_scopes || [],
);

const scopeLabels = {
  openid: "consent.scopes.openid",
  profile: "consent.scopes.profile",
  email: "consent.scopes.email",
  offline_access: "consent.scopes.offline_access",
  read: "consent.scopes.read",
  write: "consent.scopes.write",
};

function getScopeLabel(scope) {
  return scopeLabels[scope] ? t(scopeLabels[scope]) : scope;
}

function startCloseCountdown(errorMessage) {
  error.value = errorMessage;
  closeCountdown.value = 10;

  countdownInterval = setInterval(() => {
    closeCountdown.value--;
    if (closeCountdown.value <= 0) {
      clearInterval(countdownInterval);
      window.close();
    }
  }, 1000);
}

async function fetchInteractionInfo() {
  if (!interactionId.value) {
    error.value = t("consent.missing_interaction_id");
    isLoading.value = false;
    return;
  }

  try {
    const response = await api.axios.get(
      `/oauth/interaction/${interactionId.value}`,
      { withCredentials: true },
    );
    interactionInfo.value = response.data;
  } catch (err) {
    console.error("Failed to fetch interaction info:", err);
    error.value = t("consent.failed_to_load");
  } finally {
    isLoading.value = false;
  }
}

async function handleConsent(approve) {
  if (!interactionId.value) return;

  isSubmitting.value = true;

  try {
    const response = await api.axios.post(
      `/oauth/interaction/${interactionId.value}/confirm`,
      { approve },
      {
        withCredentials: true,
      },
    );

    if (!approve) {
      startCloseCountdown(t("consent.access_denied"));
      return;
    }

    // Handle redirect
    const redirectUrl = response.data?.redirect_to;
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  } catch (err) {
    console.error("Failed to submit consent:", err);

    if (err.response?.status === 403) {
      startCloseCountdown(t("consent.access_denied"));
      return;
    }

    startCloseCountdown(t("consent.failed_to_submit"));
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  fetchInteractionInfo();
});

const theme = inject("theme");
const shadowColor = computed(() =>
  theme.value ? "var(--bright_font)" : "rgba(164, 180, 244, .5)",
);
</script>

<script>
export default { name: "ConsentView" };
</script>

<style>
.logo {
  display: flex;
  grid-gap: 15px;
  align-items: center;
}

.logo__image {
  max-width: 70%;
}

.logo__image img {
  max-width: 100%;
}

.pos_top {
  flex-direction: column-reverse;
}

.pos_bottom {
  flex-direction: column;
}

.pos_left {
  flex-direction: row-reverse;
}

.pos_right {
  flex-direction: row;
}

.logo__title {
  text-align: center;
}

.clipPathSvg {
  height: 0;
  width: 0;
}

.consent {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.consent__layout {
  flex: 1 0;
}

.consent__title {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--main);
  clip-path: url(#myCurve);
  color: var(--gloomy_font);
  font-size: 36px;
  font-weight: bold;
}

.consent__main {
  background: var(--bright_bg);
}

.consent__UI {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
}

.consent__app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.consent__app-logo {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 3px 8px 20px v-bind("shadowColor");
}

.consent__app-logo-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: var(--main);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gloomy_font);
  font-size: 28px;
}

.consent__app-name {
  margin: 12px 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: var(--main_text_color);
}

.consent__app-description {
  font-size: 13px;
  color: var(--gray_text);
  margin: 0;
  text-align: center;
}

.consent__description {
  font-size: 15px;
  color: var(--gray_text);
  margin: 0 0 15px;
  text-align: center;
}

.consent__account {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 20px;
  background: var(--bright_font);
  border-radius: 8px;
  box-shadow: 3px 8px 20px v-bind("shadowColor");
}

.consent__account-label {
  font-size: 14px;
  color: var(--gray_text);
}

.consent__account-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--main);
}

.consent__scopes {
  width: 100%;
  background: var(--bright_font);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 3px 8px 20px v-bind("shadowColor");
}

.consent__scopes-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--main_text_color);
  margin-bottom: 10px;
}

.consent__scope-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.consent__scope-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 14px;
  color: var(--gray_text);
}

.consent__scope-icon {
  color: var(--success);
  font-size: 16px;
}

.consent__website {
  margin-bottom: 15px;
}

.consent__website a {
  color: var(--main);
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.consent__website a:hover {
  text-decoration: underline;
}

.consent__actions {
  display: flex;
  gap: 15px;
  width: 100%;
  margin-bottom: 15px;
}

.consent__submit {
  flex: 1;
  border: none;
  outline: none;
  font-weight: 600;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 15px;
  transition: opacity 0.2s;
}

.consent__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.consent__submit--approve {
  background: var(--main);
  color: var(--gloomy_font);
}

.consent__submit--approve:hover:not(:disabled) {
  opacity: 0.9;
}

.consent__submit--deny {
  background: var(--bright_font);
  color: var(--gray_text);
  box-shadow: inset 0px 0px 0px 1px var(--border_color);
}

.consent__submit--deny:hover:not(:disabled) {
  box-shadow: inset 0px 0px 0px 1px var(--err);
  color: var(--err);
}

.consent__note {
  font-size: 12px;
  color: var(--gray_text);
  margin: 0;
  text-align: center;
}

.consent__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.load__item:not(:first-child) {
  margin-left: 10px;
}

.load__item {
  display: block;
  width: 25px;
  height: 25px;
  background: var(--main);
  border-radius: 50%;
}

.load__item:nth-child(1) {
  animation: loading 1.4s 0.2s ease infinite;
}
.load__item:nth-child(2) {
  animation: loading 1.4s 0.4s ease infinite;
}
.load__item:nth-child(3) {
  animation: loading 1.4s 0.6s ease infinite;
}

@keyframes loading {
  from,
  to {
    transform: scale(1);
  }
  50% {
    transform: scale(0.2);
  }
}

.consent__error {
  color: tomato;
  text-align: center;
  padding: 20px;
}

@media screen and (max-width: 500px) and (max-height: 700px) {
  .consent__title {
    padding: 10px;
    font-size: 20px;
  }

  .logo {
    grid-gap: 8px;
  }

  .logo__image {
    max-width: 50%;
  }

  .consent__UI {
    padding: 15px;
  }

  .consent__app-logo,
  .consent__app-logo-placeholder {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .consent__app-name {
    font-size: 18px;
  }

  .consent__actions {
    flex-direction: column;
    gap: 10px;
  }

  .consent__submit {
    padding: 8px 15px;
    font-size: 14px;
  }
}

@media screen and (min-width: 1024px) {
  .consent {
    flex-direction: row;
  }

  .consent__title {
    clip-path: none;
  }

  .consent__UI {
    justify-content: center;
  }
}
</style>
