<template>
  <div class="settings">
    <div class="container">
      <div class="settings__content">
        <div class="settings__info">
          <div class="settings__user">
            <div v-if="authStore.isLogged" class="settings__name">
              <!-- нету юзера -->
              <!-- {{ user.firstname }} {{ user.lastname }} -->
            </div>
            <div class="settings__balance">
              {{ $t("Balance") }}:
              <balance style="display: inline-block" :clickable="false" />
            </div>
          </div>
          <div v-if="user_btn" class="settings__user-btn">
            <right-icon />
          </div>
        </div>

        <div class="settings__item" @click="GoToPersonalArea()">
          <div class="settings__logo">
            <user-icon />
          </div>
          <div class="settings__title">
            {{ $t("Personal Area") }}
          </div>
        </div>

        <div class="settings__item" @click="changeLanguage()">
          <div class="settings__logo">
            <global-icon />
          </div>
          <div class="settings__title">
            {{ $t("Language") }}
          </div>

          <a-modal
            :title="$t('Language')"
            :open="modal.language"
            :footer="false"
            @cancel="closeModal('language')"
          >
            <div
              v-for="lang in langs"
              :key="lang"
              class="singleLang"
              @click="changeLocale(lang)"
            >
              <span class="singleLang__title">
                {{ $t("localeLang", lang) }}
              </span>
              <span
                v-if="$i18n.locale == lang"
                class="singleLang__current-marker"
              />
            </div>
          </a-modal>
        </div>

        <div
          v-if="isAddFundsVisible"
          class="settings__item"
          @click="showModal('addFunds')"
        >
          <div class="settings__logo">
            <dolar-icon />
          </div>
          <div class="settings__title">
            {{ $t("Add Funds") }}
          </div>
          <add-funds :modal-visible="modal.addFunds" :hide-modal="hideFunds" />
        </div>

        <div class="settings__item" @click="showModal('SSH')">
          <div class="settings__logo">
            <safety-icon />
          </div>
          <div class="settings__title">
            SSH
          </div>
          <a-modal
            v-model:open="modal.SSH"
            :title="$t('SSH keys')"
            :footer="null"
          >
            <div v-if="sshKeys.length" style="margin-bottom: 20px">
              <div
                v-for="(item, index) in sshKeys"
                :key="item.uuid"
                style="display: flex; align-items: center; margin-bottom: 20px"
              >
                <a-col style="width: 100%">
                  <div style="display: flex; align-items: center; margin-right: 10px">
                    <div style="margin-right: 10px; width: 20%">
                      {{ index + 1 }}.{{ item.title }}
                    </div>
                    <a-input
                      :value="item.value"
                      style="width: 80%; margin-left: auto"
                    />
                  </div>
                </a-col>
                <a-col style="margin-left: auto">
                  <a-button danger @click="deleteSSH(index)">
                    <close-icon />
                  </a-button>
                </a-col>
              </div>
            </div>
            <p v-else>
              {{ $t('while here is not one SSH key') }}
            </p>
            <addSSH />
          </a-modal>
        </div>

        <a-spin :spinning="isAuthLoading">
          <div v-if="isVisible" class="settings__item" style="border-bottom: 0" @click="showModal('login')">
            <div class="settings__logo">
              <login-icon />
            </div>
            <div class="settings__title">
              {{ capitalize($t('link')) }} {{ $t('account') }}
            </div>

            <a-modal
              :title="capitalize($t('link'))"
              :open="modal.login"
              :footer="false"
              @cancel="closeModal('login')"
            >
              <div
                v-for="text in authStore.loginButtons"
                :key="text"
                :class="{ disabled: checkAuth(text) }"
                class="singleLang"
                @click="authStore.linkAccount(text)"
              >
                <span class="singleLang__title">
                  <img
                    :key="text"
                    :alt="text"
                    :src="`/img/icons/${getImageName(text)}.png`"
                    style="width: 32px; margin-right: 5px"
                  >
                  {{ capitalize(text) }}
                </span>
                <span v-if="checkAuth(text)" class="singleLang__current-marker" />
              </div>
            </a-modal>
          </div>
        </a-spin>

        <div v-if="authStore.userdata.subaccounts && !authStore.userdata.accountOwner" class="settings__item" @click="showModal('accounts')">
          <div class="settings__logo">
            <accounts-icon />
          </div>
          <div class="settings__title">
            {{ capitalize($t('subaccounts')) }}
          </div>

          <a-modal
            :title="capitalize($t('subaccounts'))"
            :open="modal.accounts"
            :footer="false"
            @cancel="closeModal('accounts')"
          >
            <account-create
              v-if="isAccountCreateVisible"
              :account="currentAccount"
              @cancel="currentAccount = null; isAccountCreateVisible = false"
            />
            <template v-else>
              <div
                v-for="account of subaccounts"
                :key="account.uuid"
                class="singleLang"
                @click="currentAccount = account; isAccountCreateVisible = true"
              >
                <span class="singleLang__title">
                  {{ account.title }}
                </span>
              </div>

              <a-button type="primary" style="margin-top: 10px" @click="isAccountCreateVisible = true">
                {{ $t('Add') }}
                <template #icon>
                  <account-add-icon />
                </template>
              </a-button>
            </template>
          </a-modal>
        </div>

        <div class="settings__item" @click="showModal('QR')">
          <div class="settings__logo">
            <qrcode-icon />
          </div>
          <div class="settings__title">
            {{ capitalize($t("share app link")) }}
          </div>

          <a-modal
            :title="capitalize($t('share'))"
            :open="modal.QR"
            :footer="false"
            @cancel="closeModal('QR')"
          >
            <h3 style="text-align: center">
              {{ capitalize($t("copy link")) }}:
              <span class="link--clickable" @click="copyLink">
                <copy-icon /> {{ selfHost }}
              </span>
            </h3>
            <h3 style="text-align: center">
              {{ capitalize($t('your QR code')) }}:
            </h3>
            <div class="qr__wrapper">
              <a-qrcode
                :value="selfUrl"
                :size="150"
                error-level="M"
                type="svg"
              />
            </div>
          </a-modal>
        </div>

        <button
          v-if="
            false && authStore.userdata.access &&
              ['ROOT', 'ADMIN'].includes(authStore.userdata.access.level)
          "
          class="settings__login"
          @click="loginToAdmin"
        >
          {{ $t('Login to admin panel') }}
        </button>
        <button class="settings__exit" @click="logoutFunc">
          {{ $t('Exit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent, ref, reactive } from 'vue'
import { mapStores } from 'pinia'
import config from '@/appconfig.js'

import { useAuthStore } from '@/stores/auth.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useNotification } from '@/hooks/utils'

import balance from '@/components/ui/balance.vue'
import addFunds from '@/components/ui/addFunds.vue'
import addSSH from '@/components/ui/addSSH.vue'
import accountCreate from '@/components/settings/accountCreate.vue'

const rightIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/RightOutlined')
)
const userIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/UserOutlined')
)
const globalIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/GlobalOutlined')
)

const dolarIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/DollarOutlined')
)
const safetyIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SafetyOutlined')
)
const closeIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CloseOutlined')
)

const copyIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CopyOutlined')
)
const loginIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoginOutlined')
)
const qrcodeIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/QrcodeOutlined')
)

const accountsIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/TeamOutlined')
)
const accountAddIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/UsergroupAddOutlined')
)

export default {
  name: 'SettingsView',
  components: {
    balance,
    addFunds,
    addSSH,
    accountCreate,

    rightIcon,
    userIcon,
    globalIcon,
    dolarIcon,
    safetyIcon,
    closeIcon,
    copyIcon,
    loginIcon,
    qrcodeIcon,
    accountsIcon,
    accountAddIcon
  },
  setup () {
    const { openNotification } = useNotification()

    return {
      openNotification,

      isAuthLoading: ref(false),
      confirmLoading: ref(false),
      user_btn: ref(false),
      isAccountCreateVisible: ref(false),
      currentAccount: ref(null),
      modal: reactive({
        login: false,
        language: false,
        addFunds: false,
        accounts: false,
        SSH: false,
        QR: false
      })
    }
  },
  computed: {
    ...mapStores(useAuthStore, useNamespasesStore),
    isVisible () {
      if (this.isAuthLoading) return true
      return !localStorage.getItem('oauth') && this.authStore.loginButtons.length > 0
    },
    isAddFundsVisible () {
      if (!localStorage.getItem('oauth')) return true
      return !this.authStore.billingUser.paid_stop
    },
    subaccounts () {
      return this.namespacesStore.accounts.filter(({ uuid }) =>
        this.authStore.userdata.subaccounts?.includes(uuid)
      )
    },
    langs () {
      return config.languages
    },
    selfUrl () {
      return location.href
    },
    selfHost () {
      return location.host
    },
    sshKeys () {
      return this.authStore.userdata?.data?.ssh_keys ?? []
    }
  },
  async created () {
    try {
      await this.namespacesStore.fetchAccounts()
    } catch (error) {
      this.openNotificationWithIcon('error', {
        message: error.response?.data.message ?? error.message ?? error
      })
    }

    try {
      this.isAuthLoading = true
      if (this.authStore.loginButtons.length < 1) {
        await this.authStore.fetchAuth()
      }
    } finally {
      this.isAuthLoading = false
    }
  },
  methods: {
    exit () {
      this.$router.push('login')
    },
    showModal (name) {
      this.modal[name] = true
    },
    closeModal (name) {
      this.modal[name] = false
    },
    hideFunds () {
      this.closeModal('addFunds')
    },
    changeLanguage () {
      this.showModal('language')
    },
    changeLocale (lang) {
      this.closeModal('language')
      this.$i18n.locale = lang
      localStorage.setItem('lang', this.$i18n.locale)
    },
    getImageName (name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0]
    },
    // changeLocale(lang) {
    //   this.closeModal("language");
    //   this.$i18n.locale = lang;
    //   localStorage.setItem("lang", this.$i18n.locale);

    //   let billingLang = lang == "vi" ? "vietnam" : "english";
    //   api
    //     .sendAsUser("user.update", {
    //       language: billingLang,
    //     })
    //     .then((res) => {
    //       this.$message.success(this.$t("Successfully changed"));
    //     })
    //     .catch((err) => {
    //       console.error(err);
    //       this.openNotification('error', {
    //         message: this.$t(err.response?.data?.message)
    //       });
    //     })
    //     .finally(() => {
    //       this.isSendingInfo = false;
    //     });
    // },
    loginToAdmin () {
      const url = `${VUE_APP_BASE_URL}/admin`
      const win = window.open(url)

      console.log(win)
      setTimeout(() => { win.postMessage(this.authStore.token, url) }, 100)
    },
    logoutFunc () {
      this.authStore.logout()
      localStorage.removeItem('data')
    },
    URLparameter (obj, outer = '') {
      let str = ''
      for (const key in obj) {
        if (key === 'price') continue
        if (str !== '') {
          str += '&'
        }
        if (typeof obj[key] === 'object') {
          str += this.URLparameter(obj[key], outer + key)
        } else {
          str += outer + key + '=' + encodeURIComponent(obj[key])
        }
      }
      return str
    },
    addAmount (amount) {
      if (this.amount === '') this.amount = 0
      this.amount += amount
    },
    GoToPersonalArea () {
      this.$router.push({ name: 'cabinet' })
      // const close_your_eyes = md5('openWHMCSclientDetails'+this.user.id+this.user.secret);
      // window.open(config.whmcsSiteUrl + config.appFolder + `/openWHMCSclientDetails.php?userid=${this.user.id}&secret=${close_your_eyes}`);
    },
    copyLink () {
      navigator.clipboard
        .writeText(location.href.replace('settings', ''))
        .then(() => {
          this.$message.success(this.$t('Link copyed successfully'))
        })
        .catch(() => {
          this.$message.success(this.$t('Some error. Copy link manually'))
        })
    },
    deleteSSH (index) {
      for (const item in this.authStore.userdata.data.ssh_keys) {
        if (+item === index) {
          this.authStore.userdata.data.ssh_keys.splice(item, 1)
        }
      }
      const dataSSH = {
        id: this.authStore.userdata.uuid,
        body: { data: this.authStore.userdata.data }
      }

      this.authStore.addSSH(dataSSH)
        .then((result) => {
          if (result) {
            this.openNotification('success', {
              message: this.$t('delete SSH key successfully')
            })
            this.authStore.fetchUserData()
          } else {
            this.openNotification('error', {
              message: this.$t('error delete SSH key')
            })
          }
        })
        .catch((err) => {
          this.openNotification('error', {
            message: this.$t('error delete SSH key')
          })
          console.error(err)
        })
        .finally(() => {
          this.modal.confirmLoading = false
        })
    },
    checkAuth (text) {
      return this.authStore.userdata.data?.oauth_types
        ?.find((type) => type.includes(text))
    }
  }
}
</script>

<style>
.settings {
  height: 100%;
}

.settings__content {
  padding: 20px 10px 0;
  overflow: auto;
}

.settings__info {
  display: flex;
  padding: 0 10px 0 40px;
  margin-bottom: 20px;
}

.settings__user {
  flex: 1 0;
}

.settings__user-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 42px;
  height: 42px;
  translate: background-color 0.2s ease;
  cursor: pointer;
}

.settings__user-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.settings__login,
.settings__exit {
  background-color: var(--err);
  border: none;
  outline: none;
  color: var(--gloomy_font);
  font-weight: 600;
  width: 100%;
  padding: 12px 0;
  border-radius: 12px;
  margin-top: 20px;
  cursor: pointer;
  transition: filter 0.2s ease;
}

.settings__login {
  margin-top: 40px;
  background-color: var(--main);
}

.settings__exit:hover {
  filter: brightness(2);
}

.settings__exit:active {
  filter: saturate(0.8);
}

.singleLang .singleLang__title {
  padding-left: 20px;
}

.singleLang__current-marker {
  position: absolute;
  right: 20px;
  top: 50%;
  background-color: var(--main);
  border-radius: 50%;
  width: 7px;
  height: 7px;
  transform: translateY(-50%);
}

.singleLang {
  position: relative;
  font-size: 1rem;
  padding: 16px 0;
  border-top: 1px solid var(--border_color);
  cursor: pointer;
  transition: filter 0.2s ease;
}

.singleLang:hover {
  filter: brightness(0.8);
}

.singleLang:last-of-type {
  border-bottom: 1px solid var(--border_color);
}

.singleLang.disabled {
  background: #ddd;
  color: var(--gray);
  pointer-events: none;
}

.settings__item {
  display: flex;
  position: relative;
  font-size: 1rem;
  padding: 16px 0;
  border-top: 1px solid var(--border_color);
  cursor: pointer;
  transition: filter 0.2s ease;
}

.settings__item:hover {
  filter: brightness(0.8);
}

.settings__item:last-of-type {
  border-bottom: 1px solid var(--border_color);
}

.settings__logo {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 20px;
  font-size: 1.4rem;
}

.settings__title {
  padding-left: 60px;
}

.qr__wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.link--clickable {
  color: var(--main);
  text-decoration: underline;
  cursor: pointer;
  padding: 5px;
}
</style>
