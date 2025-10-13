<template>
  <div class="login">
    <div class="login__title login__layout">
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
    <div class="login__main login__layout">
      <div class="login__UI">
        <div class="login__onlogin-action">
          <div v-if="!appStore.onLogin.info" class="login__see-services">
            <router-link :to="{ name: 'services' }">
              <shopping-cart-icon />
              {{ capitalize($t("unregistered.see services")) }}
            </router-link>
          </div>

          <div v-else class="login__action-info">
            {{ $t("comp_services.Your orders") }}:
            <div class="order__card">
              <div class="order__icon">
                <component
                  :is="config.services[appStore.onLogin.info.type]?.icon"
                />
              </div>
              <div class="order__info">
                <div class="order__title">
                  {{ appStore.onLogin.info.title }}
                </div>
                <div class="order__cost">
                  {{ +appStore.onLogin.info.cost.toFixed(2) }}
                  {{ appStore.onLogin.info.currency }}
                </div>
              </div>
              <div class="order__remove" @click="appStore.clearOnLogin()">
                <close-icon />
              </div>
            </div>
          </div>
        </div>

        <div class="login__inputs">
          <div v-if="loginError" class="login__error">
            {{ $t(loginError) }}
          </div>
          <div class="inputs__log-pas" @keyup.enter="send">
            <input v-model="email" type="text" placeholder="Email" />
            <template v-if="remember">
              <span class="login__horisontal-line" />
              <a-input-password
                v-model:value="password"
                placeholder="Password"
                style="
                  padding: 6px 15px;
                  border: none;
                  background: var(--bright_font);
                "
              />
            </template>
          </div>

          <template v-if="!tryingLogin">
            <div class="login__button">
              <button v-if="remember" class="login__submit" @click="send">
                {{ capitalize($t("login")) }}
              </button>
              <button v-else class="login__submit" @click="restorePass">
                {{ capitalize($t("restore")) }}
              </button>

              <a-select
                style="width: 70px"
                :value="$i18n.locale.replace(/-[a-z]{2}/i, '')"
                @change="(lang) => changeLocale(lang)"
              >
                <a-select-option
                  v-for="lang in config.languages"
                  :key="lang"
                  :value="lang"
                >
                  {{ lang.toUpperCase() }}
                </a-select-option>
              </a-select>
            </div>
          </template>

          <div v-else class="login__loading">
            <span class="load__item" />
            <span class="load__item" />
            <span class="load__item" />
          </div>
        </div>

        <p v-if="authStore.loginButtons?.length > 0" style="margin: 20px 0 0">
          {{ $t("login") }} {{ $t("with") }}:
        </p>
        <div class="login__oauth">
          <img
            v-for="text of authStore.loginButtons || []"
            :key="text"
            :alt="text"
            :src="`/img/icons/${getImageName(text)}.png`"
            style="width: 32px; cursor: pointer"
            @click="login(text)"
          />
        </div>
        <div class="login__forgot">
          <a href="#" @click.prevent="forgotPass">{{
            capitalize(remember ? $t("forgotPass") : $t("I have a password"))
          }}</a>
        </div>
        <div class="login__forgot" style="margin-bottom: 30px">
          <router-link :to="{ name: 'register' }">
            {{ capitalize($t("sign up")) }}
          </router-link>
        </div>

        <div id="qrcode" style="margin-top: 50px; text-align: center">
          <p style="margin-bottom: 0">
            {{ $t("Use on your phone:") }}
          </p>
          <a-qrcode
            :value="selfUrl"
            :size="170"
            :bordered="false"
            error-level="M"
            type="svg"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  defineAsyncComponent,
  inject,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { notification } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import config from "@/appconfig.js";
import api from "@/api.js";

import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import { useInstancesStore } from "@/stores/instances.js";

const router = useRouter();
const route = useRoute();
const i18n = useI18n();

const appStore = useAppStore();
const authStore = useAuthStore();

const closeIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CloseOutlined")
);
const shoppingCartIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ShoppingCartOutlined")
);
const downIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DownOutlined")
);

const tryingLogin = ref(false);
const loginError = ref("");
const remember = ref(true);
const password = ref("");
const email = ref("");
const redirect = ref(false);

const companyName = computed(() => appStore.domainInfo.name ?? config.appTitle);
const selfUrl = location.href;

async function send() {
  if (!email.value.trim() || !password.value.trim()) {
    return;
  }

  tryingLogin.value = true;
  try {
    const formatedEmail = `${email.value[0].toLowerCase()}${email.value.slice(
      1
    )}`;

    try {
      await authStore.login({
        login: formatedEmail.trim(),
        password: password.value,
        type: "whmcs",
      });
    } catch {
      await authStore.login({
        login: formatedEmail.trim(),
        password: password.value,
        type: "standard",
      });
    }

    if (localStorage.getItem("data")) {
      redirect.value = true;
      try {
        const data = JSON.parse(localStorage.getItem("data"));
        router.push({ path: data.path, query: data.query });
      } catch {
        localStorage.removeItem("data");
      }
    } else if (appStore.onLogin.redirect) {
      redirect.value = true;
      const name = appStore.onLogin.redirect;
      const service =
        appStore.onLogin.redirectQuery?.service || appStore.onLogin.info.title;

      router.replace({ name, query: { service } });
    } else {
      useInstancesStore().$reset();
      router.push({ name: "root" });
    }

    await Promise.all([
      authStore.fetchUserData(true),
      authStore.fetchBillingData(true),
    ]);

    if (
      authStore.userdata.languageCode &&
      i18n.locale.value !== authStore.userdata.languageCode
    ) {
      i18n.locale.value = authStore.userdata.languageCode;
      localStorage.setItem("lang", authStore.userdata.languageCode);
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      notification.error({
        message: i18n.t(error.response.data.message),
      });
    }
  } finally {
    tryingLogin.value = false;
  }
}

function forgotPass() {
  remember.value = !remember.value;
}

async function restorePass() {
  tryingLogin.value = true;
  try {
    const formatedEmail = `${email.value[0].toLowerCase()}${email.value.slice(
      1
    )}`;

    const { result, message } = await api.get(authStore.baseURL, {
      params: {
        run: "reset_password",
        email: encodeURIComponent(formatedEmail),
      },
    });

    if (result === "success") {
      notification.success({ message: i18n.t("Done") });
    } else if (result === "error") {
      loginError.value = i18n.t(message);
      tryingLogin.value = false;
    }
  } catch (error) {
    notification.error({
      message: i18n.t("Can't connect to the server"),
    });
    console.error(error);
  } finally {
    tryingLogin.value = false;
  }
}

function changeLocale(lang) {
  i18n.locale.value = lang;
  localStorage.setItem("lang", lang);
}

authStore.fetchAuth();

async function login(type) {
  const { url } = await api.get(`/oauth/${type}/sign_in`, {
    params: {
      state: Math.random().toString(16).slice(2),
      redirect: `https://${location.host}/login`,
    },
  });

  localStorage.setItem("oauth", type);
  location.assign(url);
}

function getImageName(name) {
  return name
    .toLowerCase()
    .replace(/[-_\d]/g, " ")
    .split(" ")[0];
}

onMounted(() => {
  if (route.query.token) {
    authStore.setToken(route.query.token);
    router.replace({ name: "root" }).then(() => location.reload());
  }
});

onUnmounted(() => {
  if (!redirect.value && authStore.token) {
    appStore.onLogin = {};
    localStorage.removeItem("data");
  }
});

const theme = inject("theme");
const shadowColor = computed(() =>
  theme.value ? "var(--bright_font)" : "rgba(164, 180, 244, .5)"
);
</script>

<script>
export default { name: "LoginView" };
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

.login {
  display: flex;
  flex-direction: column;
}

.login__layout {
  flex: 1 0;
}

.login__oauth {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.login__title {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--main);
  clip-path: url(#myCurve);
  color: var(--gloomy_font);
  font-size: 36px;
  font-weight: bold;
}

.login__title::selection {
  color: var(--main);
  background: var(--bright_font);
}
.login__title::moz-selection {
  color: var(--main);
  background: var(--bright_font);
}

.login__main {
  background: var(--bright_bg);
}

.login__UI {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}

.login__inputs {
  display: flex;
  flex-direction: column;
  width: 80%;
  max-width: 500px;
  position: relative;
}

.login__horisontal-line {
  display: block;
  width: 95%;
  height: 1px;
  margin: auto;
  background: var(--bright_bg);
}

.inputs__log-pas {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 3px 8px 20px v-bind("shadowColor");
  margin-bottom: 25px;
}

.login__button {
  display: flex;
  grid-gap: 15px;
  justify-content: center;
  align-items: center;
}

.login__submit {
  border: none;
  outline: none;
  color: var(--gloomy_font);
  font-weight: 600;
  border-radius: 10px;
  padding: 7px 20px;
  background: var(--main);
  background-size: 150% 200%;
  background-position: 0 0;
  /* animation: AnimationName 1s ease infinite; */
  cursor: pointer;
  flex-grow: 1;
}
#qrcode {
  display: none;
}

.login__submit:hover {
  animation: gradient 2s ease infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.inputs__log-pas input {
  border: none;
  outline: none;
  padding: 10px 15px;
  background: var(--bright_font);
}

.login__forgot {
  margin-top: 5px;
}

.login__forgot a {
  text-decoration: none;
}

.login__forgot a:hover {
  text-decoration: underline;
}

.login__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 35px;
}

.load__item:not(:first-child) {
  margin-left: 10px;
}

.load__item {
  display: block;
  width: 25px;
  height: 25px;
  background: #437dfb;
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

.login__onlogin-action {
  margin: 20px 0 40px;
}

.login__see-services a {
  display: block;
  padding: 10px 15px;
  /* border: 1px solid #d0dfff; */
  box-shadow: inset 0px 0px 0px 1px #d0dfff;
  border-radius: 5px;
  transition: box-shadow 0.2s ease;
  display: flex;
  grid-gap: 10px;
  font-size: 1.2em;
}

.login__see-services a:hover {
  box-shadow: inset 0px 0px 0px 1px var(--main);
}

.login__see-services a span {
  font-size: 1.5em;
}

.order__card {
  margin-top: 7px;
  position: relative;
  box-sizing: border-box;
  display: flex;
  min-width: 300px;
  box-shadow: inset 0px 0px 0px 1px #d0dfff;
  border-radius: 5px;
  padding: 10px 15px;
  grid-gap: 10px;
}

.order__card .order__title {
  margin-right: 20px;
}

.order__icon {
  font-size: 32px;
}

.order__remove {
  position: absolute;
  padding: 5px;
  top: 5px;
  right: 10px;
  cursor: pointer;
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

.login__error {
  color: tomato;
  text-align: center;
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
}

@media screen and (min-width: 1024px) {
  .login {
    flex-direction: row;
  }

  .login__title {
    clip-path: none;
  }

  .login__UI {
    justify-content: center;
  }

  #qrcode {
    display: inline-block;
  }
}
</style>
