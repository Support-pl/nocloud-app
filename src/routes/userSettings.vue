<template>
  <div class="user__settings">
    <div class="container">
      <div class="content__wrapper">
        <!-- нету юзера -->
        <div class="content__title">
          {{ $t("Personal Area") }}
          <span class="content__small"> #{{ userData.id }} </span>
        </div>
        <div class="content__fields-wrapper" :style="{ margin: (!isVisible) ? 'auto' : null }">
          <a-form-model
            v-if="isVisible"
            ref="form"
            :model="form"
            :rules="rules"
          >
            <a-form-model-item
              :label="$t('clientinfo.firstname') | capitalize"
              prop="firstname"
            >
              <a-input v-model="form.firstname" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.lastname') | capitalize"
              prop="lastname"
            >
              <a-input v-model="form.lastname" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.companyname') | capitalize"
              prop="companyname"
            >
              <a-input v-model="form.companyname" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.email') | capitalize"
              prop="email"
            >
              <a-input v-model="form.email" :disabled="isDisabled" />
            </a-form-model-item>

            <a-form-model-item
              :label="$t('clientinfo.address1') | capitalize"
              prop="address1"
            >
              <a-input v-model="form.address1" :disabled="isDisabled" />
            </a-form-model-item>

            <a-form-model-item
              :label="$t('clientinfo.city') | capitalize"
              prop="city"
            >
              <a-input v-model="form.city" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.state') | capitalize"
              prop="state"
            >
              <a-input v-model="form.state" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.postcode') | capitalize"
              prop="postcode"
            >
              <a-input v-model="form.postcode" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.phonenumber') | capitalize"
              prop="phonenumber"
            >
              <input
                v-model="form.phonenumber"
                v-phone="phonecode"
                type="tel"
                class="ant-input"
                :disabled="!form.countryname || isDisabled"
              >
            </a-form-model-item>

            <a-form-model-item>
              <a-form-model-item
                :label="$t('clientinfo.countryname') | capitalize"
                prop="countryname"
              >
                <a-select
                  v-model="form.countryname"
                  show-search
                  option-filter-prop="children"
                  :disabled="userData.country_stop === 1 || isDisabled"
                >
                  <a-select-option
                    v-for="country in Object.keys(countries)"
                    :key="country"
                    :value="country"
                  >
                    {{ $t(`country.${country}`) }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>

              <a-button
                v-if="!isDisabled"
                class="user__button user__button--submit"
                type="primary"
                :loading="isSendingInfo"
                @click="sendInfo"
              >
                {{ $t("Submit") }}
              </a-button>
              <a-button
                v-if="!isDisabled"
                class="user__button user__button--cancel"
                @click="installDataToBuffer"
              >
                {{ $t("Cancel") }}
              </a-button>
            </a-form-model-item>
          </a-form-model>

          <loading v-else-if="isLoading" />
          <empty v-else style="height: 100%" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import empty from '../components/empty/empty.vue'
import { countries } from '@/setup/countries'
import countriesWithDialCode from '@/countries.json'
import notification from '@/mixins/notification'
import loading from '@/components/loading/loading.vue'
import api from '@/api.js'

export default {
  name: 'UserSettingsView',
  components: { loading, empty },
  mixins: [notification],
  data () {
    return {
      form: {},
      isLoading: false,
      isSendingInfo: false,
      countries,
      rules: {
        firstname: [
          {
            required: true,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        lastname: [
          {
            required: true,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        companyname: [
          {
            required: false,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        email: [
          {
            required: true,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        address1: [
          {
            required: false,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        city: [
          {
            required: false,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        state: [
          {
            required: false,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        countryname: [
          {
            required: true,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        postcode: [
          {
            required: false,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ],
        phonenumber: [
          {
            required: true,
            message: `${this.$t('ssl_product.field is required')}`
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters('nocloud/auth', { baseURL: 'getURL', userData: 'billingData' }),
    deltaInfo () {
      const info = { ...this.form, country: this.form.countryname }
      for (const key in info) {
        if (info[key] === this.userData[key]) {
          delete info[key]
        }
      }
      return info
    },
    phonecode () {
      return countriesWithDialCode.find(({ title }) => title === this.form.countryname)?.dial_code
    },
    isDisabled () {
      if (!this.userData.roles) return
      return !!this.userData.roles.settings
    },
    isVisible () {
      return (!this.isLoading && this.userData.firstname) || localStorage.getItem('oauth')
    }
  },
  mounted () {
    if (!('firstname' in this.userData)) this.fetchInfo()
    else this.installDataToBuffer()
  },
  methods: {
    installDataToBuffer () {
      const interestedKeys = [
        'firstname',
        'lastname',
        'companyname',
        'email',
        'address1',
        'address2',
        'city',
        'state',
        'postcode',
        'countryname',
        'phonenumber'
      ]
      interestedKeys.forEach((key) => {
        this.$set(this.form, key, this.userData[key])
      })
    },
    fetchInfo () {
      this.isLoading = true
      this.$store.dispatch('nocloud/auth/fetchBillingData')
        .then((result) => {
          if (localStorage.getItem('oauth')) return
          if (result.ERROR) throw result.ERROR.toLowerCase()
          if (result.result === 'error') throw result.message
          this.installDataToBuffer()
        })
        .catch((error) => {
          const message = error.response?.data?.message ?? error.message ?? error

          this.openNotificationWithIcon('error', { message: this.$t(message) })
          console.error(error)
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    sendInfo () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          const { locale } = this.$i18n.getLocaleMessage(this.$i18n.locale)
          const params = (localStorage.getItem('oauth'))
            ? { ...this.deltaInfo, app_language: locale, run: 'create_user' }
            : {
                run: 'update_client',
                user: { ...this.userData, ...this.deltaInfo }
              }

          this.isSendingInfo = true
          api.get(this.baseURL, { params })
            .then(() => {
              localStorage.removeItem('oauth')
              this.$message.success('success')
              this.fetchInfo()
            })
            .catch((err) => {
              const message = err.response?.data?.message ?? err.message ?? err

              this.openNotificationWithIcon('error', {
                message: this.$t(message)
              })
              console.error(err)
            })
            .finally(() => {
              this.isSendingInfo = false
            })
        } else {
          this.openNotificationWithIcon('error', {
            message: this.$t('ssl_product.fields is required')
          })

          this.isSendingInfo = false
          return false
        }
      })
    }
  }
}
</script>

<style>
.user__settings {
  padding-top: 10px;
}

.content__wrapper {
  display: flex;
  flex-direction: column;
  padding: 10px 10px 15px 10px;
  border-radius: 10px;
  background: #fff;
}

.content__fields-wrapper {
  min-height: 100%;
}

.content__title {
  font-size: 1.6rem;
  margin-bottom: 5px;
}

.content__small {
  font-size: 0.7em;
  opacity: 0.5;
}
.user__button--cancel {
  margin-left: 10px;
}
</style>
