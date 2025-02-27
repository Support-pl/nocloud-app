<template>
  <a-config-provider :theme="{ token }">
    <router-view
      v-if="!isInitLoading"
      v-slot="{ Component }"
      :style="{
        position: 'absolute',
        width: '100%',
        height: '100%',
        minHeight: authStore.isLogged ? 'auto' : '100vh',
      }"
    >
      <transition name="slide">
        <component :is="Component" />
      </transition>
    </router-view>
    <update-notification />

    <a-float-button
      v-if="isThemeButtonVisible"
      type="primary"
      class="theme-button"
      @click="isDarkTheme = !isDarkTheme"
    >
      <template #icon>
        <bulb-icon v-if="isDarkTheme" style="color: var(--bright_bg)" />
        <bulb-icon v-else />
      </template>
    </a-float-button>

    <add-funds
      v-if="modal.visible"
      :sum="modal.amount"
      :modal-visible="modal.visible"
      :hide-modal="() => (modal.visible = false)"
    />
  </a-config-provider>
</template>

<script setup>
import {
  computed,
  defineAsyncComponent,
  onMounted,
  provide,
  ref,
  watch,
} from "vue";
import { Modal, theme } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import api, { addApiInterceptors } from "@/api.js";
import config from "@/appconfig.js";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";

import addFunds from "@/components/ui/addFunds.vue";
import updateNotification from "@/components/ui/updateNotification.vue";
import { useCurrenciesStore } from "./stores/currencies";
import { useSpStore } from "./stores/sp";

const bulbIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/BulbFilled")
);

const router = useRouter();
const route = useRoute();
const i18n = useI18n();

const appStore = useAppStore();
const spStore = useSpStore();
const authStore = useAuthStore();
const currenciesStore = useCurrenciesStore();

watch(
  () => authStore.billingUser,
  (value) => {
    const isServicesExist = value.roles && !value.roles.services;

    if (isServicesExist && ["root", "services"].includes(route.name)) {
      router.replace("settings");
    }
  }
);

const isInitLoading = ref(true);

const modal = ref({
  amount: 0,
  visible: false,
});
provide("checkBalance", checkBalance);

function checkBalance(price = 0) {
  const { balance = 0 } = authStore.userdata;

  if (!authStore.isLogged) return true;
  if (balance < parseFloat(price)) {
    Modal.confirm({
      title: i18n.t("You do not have enough funds on your balance"),
      content: i18n.t(
        "Click OK to replenish the account with the missing amount"
      ),
      onOk: () => {
        modal.value.amount = +(parseFloat(price) - balance).toFixed(2);
        modal.value.visible = true;
      },
    });
    return false;
  }
  return true;
}

function isRouteExist(name) {
  if (name === "root") name = "services";
  if (!authStore.billingUser.roles) return true;

  switch (name) {
    case "billing":
      return authStore.billingUser.roles?.invoice;

    case "settings":
      return true;

    default:
      if (!(name in authStore.billingUser.roles)) {
        return true;
      }
      return authStore.billingUser.roles[name];
  }
}

function redirectByType({ uuid, type }) {
  switch (type) {
    case "ovh":
    case "ione":
    case "keyweb":
      router.replace({ name: "openCloud", params: { uuid } });
      break;

    default:
      router.replace({ name: "service", params: { id: uuid } });
      break;
  }
}

window.addEventListener("message", async ({ data, origin }) => {
  if (!origin.includes("https://api.")) return;
  api.applyToken(data.token);
  authStore.setToken(data.token);
  authStore.load();

  addApiInterceptors();

  await authStore.fetchUserData(true);
  await authStore.fetchBillingData(true);

  if (data.chatId)
    router.replace({ name: "ticket", params: { id: data.chatId } });
  else if (data.uuid) redirectByType(data);
  else if (route.name.includes("login")) {
    router.replace({ name: "root" });
  }
});

router.beforeEach((to, _, next) => {
  const mustBeLoggined = to.matched.some((el) => !!el.meta?.mustBeLoggined);

  if (localStorage.getItem("oauth")) {
    appStore.isButtonsVisible = false;
  } else {
    appStore.isButtonsVisible = true;
  }

  if (mustBeLoggined && !authStore.isLogged && !isInitLoading.value) {
    next({ name: "login" });
  } else if (!isRouteExist(to.name)) {
    if (!authStore.billingUser.roles?.services) {
      next({ name: "settings" });
    } else {
      next({ name: "root" });
    }
  } else if (to.name === "login" && authStore.isLogged) {
    next({ name: "root" });
  } else next();
});

onMounted(async () => {
  const lang = route.query.lang ?? localStorage.getItem("lang");

  if (lang) i18n.locale.value = lang;
  if (window.opener) {
    window.opener.postMessage("ready", "*");
    window.opener = null;
  }
  await router.isReady();

  const mustUnloggined = route.meta.mustBeUnloggined && authStore.isLogged;
  const isIncluded = ["cabinet", "settings"].includes(route.name);
  const { firstname, id } = await authStore.fetchBillingData();

  if (firstname && localStorage.getItem("oauth")) {
    localStorage.removeItem("oauth");
    appStore.isButtonsVisible = true;
  } else if (!id && config.whmcsSiteUrl) {
    appStore.isButtonsVisible = false;
  }

  if (
    route.meta?.mustBeLoggined &&
    !authStore.isLogged &&
    !isInitLoading.value
  ) {
    router.replace("login");
  } else if (localStorage.getItem("oauth") && !isIncluded) {
    router.replace("cabinet");
  } else if (mustUnloggined) {
    router.replace("/");
  }
});

watch(
  () => appStore.notification,
  (value) => {
    if (!value) return;
    setTimeout(() => {
      const app = document.getElementById("app");
      const elements = document.querySelectorAll(
        ".ant-notification-notice-close"
      );
      const close = Array.from(elements);
      const open = () => {
        if (close.length > 1) close.pop();
        else app.classList.remove("block-page");
      };

      close.forEach((el) => {
        el.addEventListener("click", open);
      });
      app.classList.add("block-page");
    }, 100);
  }
);

watch(
  () => authStore.isLogged,
  () => {
    currenciesStore.fetchCurrencies();
  }
);

const isThemeButtonVisible = import.meta.env.DEV;
const isDarkTheme = ref(
  matchMedia("(prefers-color-scheme: dark)") && isThemeButtonVisible
);

const cssVars = computed(() => {
  const colors = isDarkTheme.value
    ? {
        main: "#3d73da",
        success: "#328d53",
        warn: "#f9f038",
        err: "#e81313",
        gray: "#919191",
        gloomy_font: "rgba(255, 255, 255, 0.85)",
        bright_font: "#272727",
        bright_bg: "#424242",
        border_color: "rgba(255, 255, 255, 0.85)",
      }
    : config.colors;

  if (!colors.gloomy_font) {
    colors.gloomy_font = "#fff";
  }
  if (!colors.border_color) {
    colors.border_color = "rgba(0, 0, 0, 0.15)";
  }

  return Object.entries(colors).map(([key, value]) => [`--${key}`, value]);
});

const token = computed(() => {
  if (isDarkTheme.value) {
    return {
      ...theme.darkAlgorithm(theme.defaultSeed),
      colorBgContainer: "#424242",
      colorPrimary: config.colors.main,
      colorPrimaryBorder: config.colors.main,
      colorBorder: "#272727",
    };
  }
  return {
    ...theme.defaultAlgorithm(theme.defaultSeed),
  };
});

document.title = "Cloud";
if (localStorage.getItem("theme")) {
  isDarkTheme.value = localStorage.getItem("theme") === "dark";
}

async function firstLoad() {
  try {
    isInitLoading.value = true;

    await currenciesStore.fetchCurrencies();

    authStore.load();
    if (authStore.isLogged) {
      await authStore.fetchUserData();
    }

    await spStore.fetchShowcases(!authStore.isLogged);
  } finally {
    isInitLoading.value = false;
  }
}

firstLoad();

setTheme();
watch(isDarkTheme, setTheme);
provide("theme", isDarkTheme);

function setTheme() {
  if (isDarkTheme.value) {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }

  document.body.setAttribute(
    "style",
    cssVars.value.map(([k, v]) => `${k}:${v}`).join(";")
  );
}
</script>

<script>
export default { name: "App" };
</script>

<style>
html {
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

html,
body {
  padding: 0;
  margin: 0;
  height: 100%;
}

#app {
  height: 100%;
}

.block-page::before {
  content: "";
  position: absolute;
  z-index: 1001;
  height: 100%;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
}

.ant-divider.ant-divider-horizontal:not(.ant-divider-with-text) {
  background-color: var(--gloomy_font);
}

.ant-divider-horizontal.ant-divider-with-text::before,
.ant-divider-horizontal.ant-divider-with-text::after {
  background-color: var(--gloomy_font);
}

.slide-enter-active,
.slide-leave-active {
  /* transition: transform .5s; */
  transition: opacity 0.5s ease;
}
.slide-enter-from,
.slide-leave-to {
  /* transform: translateX(100%); */
  opacity: 0;
}
/* .slide-leave-to {
  transform: translateX(-100%);
} */

body.dark {
  color: rgba(255, 255, 255, 0.85);
}

body.dark .ant-select .ant-select-selection-placeholder {
  color: rgba(255, 255, 255, 0.55);
}

.theme-button {
  width: 60px;
  height: 60px;
}

.theme-button .ant-float-btn-body {
  background: var(--border_color);
}

.theme-button .ant-float-btn-body .ant-float-btn-content .ant-float-btn-icon {
  width: auto;
  font-size: 30px;
}
</style>
