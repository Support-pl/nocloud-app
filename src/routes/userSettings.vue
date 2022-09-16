<template>
  <div class="user__settings">
    <div class="container">
      <div class="content__wrapper">
        <!-- нету юзера -->
        <div class="content__title">
          {{ $t("Personal Area") }}
          <span class="content__small"> #{{ userData.id }} </span>
        </div>
        <div class="content__fields-wrapper">
          <a-form-model
            ref="form"
            :model="form"
            v-if="userData.firstname"
            :rules="rules"
          >
            <a-form-model-item
              :label="$t('clientinfo.firstname') | capitalize"
              prop="firstname"
            >
              <a-input v-model="form.firstname" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.lastname') | capitalize"
              prop="lastname"
            >
              <a-input v-model="form.lastname" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.companyname') | capitalize"
              prop="companyname"
            >
              <a-input v-model="form.companyname" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.email') | capitalize"
              prop="email"
            >
              <a-input v-model="form.email" />
            </a-form-model-item>

            <a-form-model-item
              :label="$t('clientinfo.address1') | capitalize"
              prop="address1"
            >
              <a-input v-model="form.address1" />
            </a-form-model-item>

            <a-form-model-item
              :label="$t('clientinfo.city') | capitalize"
              prop="city"
            >
              <a-input v-model="form.city" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.state') | capitalize"
              prop="state"
            >
              <a-input v-model="form.state" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.postcode') | capitalize"
              prop="postcode"
            >
              <a-input v-model="form.postcode" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.phonenumber') | capitalize"
              prop="phonenumber"
            >
              <a-input v-model="form.phonenumber" />
            </a-form-model-item>

            <a-form-model-item>
              <a-form-model-item
                :label="$t('clientinfo.countryname') | capitalize"
                prop="countryname"
              >
                <a-select v-model="form.countryname">
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
                @click="sendInfo"
                :loading="isSendingInfo"
              >
                {{ $t("Submit") }}
              </a-button>
              <a-button
                class="user__button user__button--cancel"
                @click="installDataToBuffer"
              >
                {{ $t("Cancel") }}
              </a-button>
            </a-form-model-item>
          </a-form-model>

          <loading v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { countries } from "@/setup/countries";
import loading from "@/components/loading/loading";
import api from "@/api.js";

export default {
  name: "userSettings-view",
  components: { loading },
  data() {
    return {
      form: {},
      isSendingInfo: false,
      countries,
      rules: {
        firstname: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        lastname: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        companyname: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        email: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        address1: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        city: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        state: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        countryname: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        postcode: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        phonenumber: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
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
      this.$store.dispatch('nocloud/auth/fetchBillingData')
        .then(() => {
          this.installDataToBuffer();
        })
        .catch((res) => {
          console.error(res);
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
              this.$message.success("success");
              this.fetchInfo();
            })
            .catch((err) => {
              console.error(err);
              this.$message.error("Something went wrong");
            })
            .finally(() => {
              this.isSendingInfo = false;
            });
        } else {
          this.$message.error(`${this.$t("ssl.fields is required")}`);
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
  },
  mounted() {
    if (!('firstname' in this.userData)) this.fetchInfo();
    else this.installDataToBuffer();
  },
};
</script>

<style>
.user__settings {
  padding-top: 10px;
}

.content__wrapper {
  background: #fff;
  border-radius: 10px;
  padding: 10px 10px 15px 10px;
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
