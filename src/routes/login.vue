<template>
  <div class="login">
    <div class="login__title login__layout">
      <div class="logo" :class="['pos_' + companyLogoPos]">
        <div v-if="companyName" class="logo__title">
          {{ companyName }}
        </div>
        <div v-if="companyLogo" class="logo__image">
          <img :src="companyLogo" alt="logo">
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
          <div v-if="!getOnlogin.info" class="login__see-services">
            <router-link :to="{ name: 'services' }">
              <a-icon type="shopping-cart" />
              {{ $t("unregistered.see services") | capitalize }}
            </router-link>
          </div>

          <div v-else class="login__action-info">
            {{ $t('comp_services.Your orders') }}:
            <div class="order__card">
              <div class="order__icon">
                <a-icon :type="config.services[getOnlogin.info.type]?.icon" />
              </div>
              <div class="order__info">
                <div class="order__title">
                  {{ getOnlogin.info.title }}
                </div>
                <div class="order__cost">
                  {{ getOnlogin.info.cost }} {{ getOnlogin.info.currency }}
                </div>
              </div>
              <div class="order__remove" @click="$store.commit('clearOnlogin')">
                <a-icon type="close" />
              </div>
            </div>
          </div>
        </div>

        <div class="login__inputs">
          <div v-if="loginError" class="login__error">
            {{ $t(loginError) }}
          </div>
          <div class="inputs__log-pas" @keyup.enter="submitHandler()">
            <input v-model="email" type="text" placeholder="Email">
            <template v-if="remember">
              <span class="login__horisontal-line" />
              <a-input-password
                v-model="password"
                placeholder="Password"
              />
            </template>
          </div>

          <template v-if="!tryingLogin">
            <div class="login__button">
              <button
                v-if="remember"
                class="login__submit"
                @click="submitHandler()"
              >
                {{ $t("login") | capitalize }}
              </button>
              <button v-else class="login__submit" @click="restorePass()">
                {{ $t("restore") | capitalize }}
              </button>

              <a-select
                style="width: 70px"
                :value="$i18n.locale.replace(/-[a-z]{2}/i, '')"
                @change="(lang) => changeLocale(lang)"
              >
                <a-select-option
                  v-for="lang in langs"
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

        <p v-if="authStore.loginButtons.length > 0" style="margin: 20px 0 0">
          {{ $t('login') }} {{ $t('with') }}:
        </p>
        <div style="display: flex; justify-content: center">
          <img
            v-for="text of authStore.loginButtons"
            :key="text"
            :alt="text"
            :src="`/img/icons/${text}24.png`"
            style="width: 32px; cursor: pointer"
            @click="login(text)"
          >
        </div>

        <div class="login__forgot" style="margin-top: 30px">
          <a-dropdown :trigger="['click']" placement="bottomCenter">
            <a class="ant-dropdown-link" @click.prevent>
              {{ $t('advanced options') }}
              <a-icon type="down" />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item key="0">
                  <a-checkbox v-model="type">
                    {{ $t('use standard credentials') }}
                  </a-checkbox>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
        <div class="login__forgot">
          <a href="#" @click.prevent="forgotPass">{{
            remember ? $t("forgotPass") : $t("I have a password") | capitalize
          }}</a>
        </div>
        <div class="login__forgot" style="margin-bottom: 30px">
          <router-link :to="{ name: 'register' }">
            {{
              $t("sign up") | capitalize
            }}
          </router-link>
        </div>

        <div id="qrcode" style="margin-top: 50px; text-align: center">
          <p>{{ $t("Use on your phone:") }}</p>
          <qrcode-vue :value="selfUrl" size="150" level="M" render-as="svg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { notification } from 'ant-design-vue'
import QrcodeVue from 'qrcode.vue'
import store from '@/store'
import router from '@/router'
import i18n from '@/i18n.js'
import config from '@/appconfig.js'
import api from '@/api.js'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()

const tryingLogin = ref(false)
const loginError = ref('')
const remember = ref(true)
const password = ref('')
const email = ref('')
const type = ref(false)

const baseURL = computed(() =>
  store.getters['nocloud/auth/getURL']
)
const getOnlogin = computed(() =>
  store.getters.getOnlogin
)
const companyName = computed(() =>
  store.getters.getDomainInfo.name ?? config.appTitle
)
const companyLogo = computed(() =>
  config.appLogo.path
)
const companyLogoPos = computed(() =>
  config.appLogo.pos
)
const selfUrl = computed(() =>
  location.href
)
const langs = computed(() =>
  config.languages
)

function submitHandler () {
  tryingLogin.value = true
  send()
}

async function send () {
  try {
    const formatedEmail = `${email.value[0].toLowerCase()}${email.value.slice(1)}`

    await store.dispatch('nocloud/auth/login', {
      login: formatedEmail.trim(),
      password: password.value,
      type: (type.value) ? 'standard' : 'whmcs'
    })

    if (localStorage.getItem('data')) {
      try {
        const data = JSON.parse(localStorage.getItem('data'))
        router.push({ path: data.path })
      } catch {
        localStorage.removeItem('data')
      }
    } else if (getOnlogin.value.redirect) {
      const name = getOnlogin.value.redirect
      const service = getOnlogin.value.info.title

      router.replace({ name, query: { service } })
    } else {
      router.push({ name: 'root' })
      store.dispatch('nocloud/auth/fetchUserData')
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      notification.error({
        message: i18n.t(error.response.data.message)
      })
    }
  } finally {
    tryingLogin.value = false
  }
}

function forgotPass () {
  remember.value = !remember.value
}

async function restorePass () {
  try {
    const formatedEmail = `${email.value[0].toLowerCase()}${email.value.slice(1)}`

    const { result, message } = api.get(baseURL.value, {
      params: {
        run: 'reset_password', email: encodeURIComponent(formatedEmail)
      }
    })

    if (result === 'success') {
      notification.success({ message: i18n.t('Done') })
    } else if (result === 'error') {
      loginError.value = i18n.t(message)
      tryingLogin.value = false
    }
  } catch (error) {
    notification.error({
      message: i18n.t("Can't connect to the server")
    })
    console.error(error)
  } finally {
    tryingLogin.value = false
  }
}

function changeLocale (lang) {
  i18n.locale = lang
  localStorage.setItem('lang', i18n.locale)
}

authStore.fetchAuth()

async function login (type) {
  const { url } = await api.get(`/oauth/${type}/sign_in`, {
    params: {
      state: Math.random().toString(16).slice(2),
      redirect: `https://${location.host}/login`
    }
  })

  location.assign(url)
}

onMounted(() => {
  if (router.currentRoute.query.token) {
    store.commit('nocloud/auth/setToken', router.currentRoute.query.token)
    router.replace({ name: 'root' }).then(() =>
      location.reload()
    )
  }
})
</script>

<script>
export default { name: 'LoginView' }
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

.login__title {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--main);
  clip-path: url(#myCurve);
  color: var(--bright_font);
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
  background: #f4f4f4;
}

.inputs__log-pas {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 3px 8px 20px rgba(164, 180, 244, 0.5);
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
  color: #fff;
  font-weight: 600;
  border-radius: 10px;
  padding: 7px 20px;
  background: linear-gradient(90deg, #427cf7, #8baef2);
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

.login__see-services a i {
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
