<template>
  <div class="user__settings">
    <div class="container">
      <div class="content__wrapper">
        <!-- нету юзера -->
        <div class="content__title">
          {{ $t("Personal Area") }}
          <span class="content__small"> #{{ userData.id }} </span>
        </div>
        <div class="content__fields-wrapper" :style="{ margin: (!userData.firstname) ? 'auto' : null }">
          <a-form-model
            ref="form"
            :model="form"
            v-if="!isLoading && userData.firstname"
            :rules="rules"
          >
            <a-form-model-item
              :label="$t('clientinfo.firstname') | capitalize"
              prop="firstname"
            >
              <a-input :disabled="isDisabled" v-model="form.firstname" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.lastname') | capitalize"
              prop="lastname"
            >
              <a-input :disabled="isDisabled" v-model="form.lastname" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.companyname') | capitalize"
              prop="companyname"
            >
              <a-input :disabled="isDisabled" v-model="form.companyname" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.email') | capitalize"
              prop="email"
            >
              <a-input :disabled="isDisabled" v-model="form.email" />
            </a-form-model-item>

            <a-form-model-item
              :label="$t('clientinfo.address1') | capitalize"
              prop="address1"
            >
              <a-input :disabled="isDisabled" v-model="form.address1" />
            </a-form-model-item>

            <a-form-model-item
              :label="$t('clientinfo.city') | capitalize"
              prop="city"
            >
              <a-input :disabled="isDisabled" v-model="form.city" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.state') | capitalize"
              prop="state"
            >
              <a-input :disabled="isDisabled" v-model="form.state" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.postcode') | capitalize"
              prop="postcode"
            >
              <a-input :disabled="isDisabled" v-model="form.postcode" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.phonenumber') | capitalize"
              prop="phonenumber"
            >
              <input
                type="tel"
                class="ant-input"
                v-phone="phonecode"
                v-model="form.phonenumber"
                :disabled="!form.countryname || isDisabled"
              />
            </a-form-model-item>

            <a-form-model-item>
              <a-form-model-item
                :label="$t('clientinfo.countryname') | capitalize"
                prop="countryname"
              >
                <a-select
                  show-search
                  option-filter-prop="children"
                  v-model="form.countryname"
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
                class="user__button user__button--submit"
                type="primary"
                v-if="!isDisabled"
                :loading="isSendingInfo"
                @click="sendInfo"
              >
                {{ $t("Submit") }}
              </a-button>
              <a-button
                class="user__button user__button--cancel"
                v-if="!isDisabled"
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
import { mapGetters } from "vuex";
import { countries } from "@/setup/countries";
import countriesWithDialCode from "@/countries.json";
import notification from "@/mixins/notification"
import loading from "@/components/loading/loading";
import empty from '../components/empty/empty.vue';
import api from "@/api.js";

export default {
  name: "userSettings-view",
  components: { loading, empty },
  mixins: [notification],
  data() {
    return {
      form: {},
      isLoading: false,
      isSendingInfo: false,
      countries,
      rules: {
        firstname: [
          {
            required: true,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        lastname: [
          {
            required: true,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        companyname: [
          {
            required: false,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        email: [
          {
            required: true,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        address1: [
          {
            required: false,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        city: [
          {
            required: false,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        state: [
          {
            required: false,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        countryname: [
          {
            required: true,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        postcode: [
          {
            required: false,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        phonenumber: [
          {
            required: true,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
      },
    };
  },
  methods: {
    installDataToBuffer() {
      const interestedKeys = [
        "firstname",
        "lastname",
        "companyname",
        "email",
        "address1",
        "address2",
        "city",
        "state",
        "postcode",
        "countryname",
        "phonenumber",
      ];
      interestedKeys.forEach((key) => {
        this.$set(this.form, key, this.userData[key]);
      });
    },
    fetchInfo() {
      this.isLoading = true;
      this.$store.dispatch('nocloud/auth/fetchBillingData')
        .then((res) => {
          if (res.ERROR) throw res.ERROR.toLowerCase();
          if (res.result === 'error') throw res.message;
          this.installDataToBuffer();
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          });
          console.error(err);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    sendInfo() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.isSendingInfo = true;
          api.get(this.baseURL, { params: {
            run: 'update_client',
            user: { ...this.userData, ...this.deltaInfo }
          }})
            .then(() => {
              sessionStorage.removeItem('user');
              this.$message.success("success");
              this.fetchInfo();
            })
            .catch((err) => {
              const message = err.response?.data?.message ?? err.message ?? err;

              this.openNotificationWithIcon('error', {
                message: this.$t(message)
              });
              console.error(err);
            })
            .finally(() => {
              this.isSendingInfo = false;
            });
        } else {
          this.openNotificationWithIcon('error', {
            message: this.$t("ssl_product.fields is required")
          });

          this.isSendingInfo = false;
          return false;
        }
      });
    },
  },
  computed: {
    ...mapGetters("nocloud/auth", { baseURL: "getURL", userData: "billingData" }),
    deltaInfo() {
      const info = { ...this.form, country: this.form.countryname };
      for (let key in info) {
        if (info[key] == this.userData[key]) {
          delete info[key];
        }
      }
      return info;
    },
    phonecode() {
      return countriesWithDialCode.find(({ title }) => title === this.form.countryname)?.dial_code;
    },
    isDisabled() {
      return !this.userData.roles?.settings;
    }
  },
  mounted() {
    if (!('firstname' in this.userData)) this.fetchInfo();
    else this.installDataToBuffer();
  }
};
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
