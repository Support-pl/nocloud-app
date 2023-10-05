<template>
  <div class="login">
    <div class="login__title login__layout">
      <div class="logo" :class="['pos_'+config.appLogo.pos]">
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
        <div v-if="getOnlogin.info" class="login__action-info">
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

        <div class="login__inputs">
          <form>
            <!-- <div v-if="loginError" class="login__error">{{loginError}}</div> -->

            <!-- <div class="inputs__log-pas">
              <input type="text" placeholder="Email" v-model="userinfo.email">
              <span class="login__horisontal-line"></span>
              <input type="password" :placeholder="$t('clientinfo.password') | capitalize"  v-model="userinfo.password">
            </div> -->

            <div class="inputs__log-pas">
              <input
                v-model="userinfo.firstname"
                type="text"
                name="firstname"
                :placeholder="$t('clientinfo.firstname') + ' *' | capitalize"
                readonly
                onfocus="this.removeAttribute('readonly')"
              >
              <span class="login__horisontal-line" />
              <input
                v-model="userinfo.lastname"
                type="text"
                name="lastname"
                :placeholder="$t('clientinfo.lastname') + ' *' | capitalize"
                readonly
                onfocus="this.removeAttribute('readonly')"
              >
              <span class="login__horisontal-line" />
              <input
                v-model="userinfo.email"
                type="email"
                name="email"
                :placeholder="$t('clientinfo.email') + ' *' | capitalize"
                readonly
                onfocus="this.removeAttribute('readonly')"
              >

              <span class="login__horisontal-line" />
              <a-select
                id="country"
                v-model="userinfo.country"
                show-search
                :placeholder="$t('clientinfo.countryname') + ' *' | capitalize"
                name="country"
                option-filter-prop="children"
              >
                <a-select-option v-for="country in countries" :key="country.code" :value="country.code">
                  {{ country.title }}
                </a-select-option>
              </a-select>

              <span class="login__horisontal-line" />
              <input
                v-model="userinfo.phonenumber"
                v-phone="phonecode"
                type="tel"
                name="phone"
                :placeholder="$t('clientinfo.phone number') + ' *' | capitalize"
                :disabled="!userinfo.country"
                autocomplete="tel"
                maxlength="18"
              >
              <span class="login__horisontal-line" />
              <input
                v-model="userinfo.password"
                type="password"
                name="password"
                :placeholder="$t('clientinfo.password') + ' *' | capitalize"
                readonly
                onfocus="this.removeAttribute('readonly')"
              >
              <span class="login__horisontal-line" />
            </div>

            <div class="inputs__log-pas" style="padding: 8px 16px">
              <a-checkbox v-model="invoiceChecked">
                {{ $t('Company Details') }}
              </a-checkbox>
            </div>

            <div v-if="invoiceChecked" class="inputs__log-pas">
              <input v-model="userinfo.companyname" :placeholder="$t('clientinfo.companyname') + ' *' | capitalize">
              <span class="login__horisontal-line" />
              <input v-model="userinfo.tax_id" placeholder="VAT ID">
              <!-- <span class="login__horisontal-line"></span>
              <input :placeholder="$t('clientinfo.state') | capitalize" v-model="userinfo.state"> -->
              <span class="login__horisontal-line" />
              <input v-model="userinfo.city" :placeholder="$t('clientinfo.city') + ' *' | capitalize">
              <span class="login__horisontal-line" />
              <input v-model="userinfo.postcode" :placeholder="$t('clientinfo.postcode') + ' *' | capitalize">
              <span class="login__horisontal-line" />
              <input v-model="userinfo.address1" :placeholder="$t('clientinfo.address') + ' *' | capitalize">
            </div>

            <div class="inputs__log-pas">
              <a-select style="width: 100%; border: none" :value="$i18n.locale" @change="(e) => $i18n.locale = e">
                <a-select-option v-for="lang in config.languages" :key="lang" :value="lang">
                  {{ $t('localeLang', lang) }}
                </a-select-option>
              </a-select>

              <span class="login__horisontal-line" />
              <a-select v-model="userinfo.currency" style="width: 100%; border: none">
                <a-select-option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                  {{ currency.code }}
                </a-select-option>
              </a-select>
            </div>

            <button v-if="!registerLoading" class="login__submit" @click.prevent="submitHandler">
              {{ $t('clientinfo.register') | capitalize }}
            </button>

            <div v-else class="login__loading">
              <span class="load__item" />
              <span class="load__item" />
              <span class="load__item" />
            </div>
          </form>
        </div>
        <div class="register__already-has" style="margin-top: 40px">
          <router-link :to="{name: 'login'}">
            {{ $t('clientinfo.already have account?') | capitalize }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { notification, message } from 'ant-design-vue'
import store from '@/store'
import router from '@/router'
import i18n from '@/i18n'
import api from '@/api.js'
import config from '@/appconfig.js'
import countries from '@/countries.json'

const currencies = ref([])
const registerLoading = ref(false)
const invoiceChecked = ref(false)
const userinfo = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  address1: '',
  city: '',
  // state: '',
  postcode: '',
  country: undefined,
  phonenumber: '',
  currency: 1,
  companyname: '',
  tax_id: ''
})

const getOnlogin = computed(() =>
  store.getters.getOnlogin
)
const companyName = computed(() =>
  store.getters.getDomainInfo.name ?? config.appTitle
)
const baseURL = computed(() =>
  store.getters['nocloud/auth/getURL']
)

const companyLogo = computed(() => {
  const settings = store.getters.getDomainInfo

  if (settings.logo && typeof settings.logo === 'string') {
    return settings.logo
  }
  return config.appLogo.path
})
const phonecode = computed(() =>
  countries.find(({ code }) => code === userinfo.value.country)?.dial_code
)

async function submitHandler () {
  const info = (invoiceChecked.value)
    ? { ...userinfo.value }
    : {
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        country: 'BY',
        phonenumber: '',
        currency: 1
      }
  delete info.tax_id

  if (Object.keys(info).some(key => !`${userinfo.value[key]}`.length)) {
    message.warn(i18n.t('all fields are required'))
    return
  }

  for (const key in info) {
    if (userinfo.value[key].length < 2) {
      message.warn(`${key} ${i18n.t('field must contain more characters')}`)
      return
    }
  }

  const regexEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/

  if (!userinfo.value.email.match(regexEmail)) {
    message.warn(i18n.t('email is not valid'))
    return
  }

  const temp = JSON.parse(JSON.stringify(userinfo.value))
  const { locale } = i18n.getLocaleMessage(i18n.locale)

  temp.email = `${temp.email[0].toLowerCase()}${temp.email.slice(1)}`
  temp.phonenumber = temp.phonenumber.replace(phonecode.value, '').replace(/[\s-]/g, '')

  try {
    registerLoading.value = true
    const response = await api.get(baseURL.value, {
      params: { ...temp, app_language: locale, run: 'create_user' }
    })

    if (response.result === 'error') throw response
    else message.success(i18n.t('account created successfully'))
    router.push({ name: 'login' })
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  } finally {
    registerLoading.value = false
  }
}

async function fetchCurrencies () {
  try {
    const response = await api.get(baseURL.value, {
      params: { run: 'get_currencies' }
    })

    currencies.value = response.currency
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  }
}

fetchCurrencies()
</script>

<script>
export default { name: 'RegisterView' }
</script>

<style>

.logo {
  display: flex;
  grid-gap: 15px
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
  height: 100%;
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
  flex-shrink: 0;
  min-height: 50%;
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
  overflow-y: auto;
}

.login__action-info {
  margin-bottom: 20px;
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
  box-shadow: 3px 8px 20px rgba(164, 180, 244, .5);
  margin-bottom: 25px;
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
  width: 100%;
}
#qrcode {
  display: none;
}

.login__submit:hover {
  animation: gradient 2s ease infinite;
}

@keyframes gradient {
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
}

.inputs__log-pas input,
.inputs__log-pas select {
  border: none;
  outline: none;
  padding: 10px 15px;
}

.inputs__log-pas .ant-select-search__field {
  padding-left: 0;
}

.inputs__log-pas input::placeholder {
  opacity: .5;
}

.register__already-has a {
  text-decoration: none;
}

.register__already-has a:hover {
  text-decoration: underline;
}

.inputs__log-pas
.ant-select-selection--single
.ant-select-selection__rendered {
  margin-left: 15px;
}

.login__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 35px;
}

.load__item:not(:first-child){
  margin-left: 10px;
}

.load__item {
  display: block;
  width: 25px;
  height: 25px;
  background: #437dfb;
  border-radius: 50%;
}

.load__item:nth-child(1){
  animation: loading 1.4s .2s ease infinite;
}
.load__item:nth-child(2){
  animation: loading 1.4s .4s ease infinite;
}
.load__item:nth-child(3){
  animation: loading 1.4s .6s ease infinite;
}

.inputs__log-pas .ant-select-selection {
  border: none;
}

@keyframes loading {
  from, to {transform: scale(1)}
  50% {transform: scale(.2);}
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

@media screen and (min-width: 1024px){
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
