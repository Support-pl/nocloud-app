<template>
  <div class="generate-page">
    <div class="container">
      <div class="generate-page-card">
        <template v-if="generate.csr_commonname">
          <div class="generate-page__header">
            <div class="generate-page__title" v-if="result.result == 'success'">
              CSR
            </div>
            <div class="generate-page__title" v-else>
              {{ $t("ssl.csr_generation_form") }}
            </div>
          </div>
          <a-alert
            v-if="result.result !== 'success'"
            style="margin: 10px"
            :message="$t('ssl.generator_warning_info')"
            type="warning"
            show-icon
          />
          <div class="content__fields-wrapper">
            <a-form-model
              ref="csrForm"
              :model="generate"
              :rules="rules"
              v-if="result.result !== 'success'"
            >
              <a-form-model-item
                :label="$t('ssl.domain')"
                prop="csr_commonname"
              >
                <a-input v-model="generate.csr_commonname" />
              </a-form-model-item>

              <a-form-model-item label="Email" prop="csr_email">
                <a-input v-model="generate.csr_email" />
              </a-form-model-item>

              <a-form-model-item
                :label="$t('ssl.companyname')"
                prop="csr_organization"
              >
                <a-input v-model="generate.csr_organization" />
              </a-form-model-item>

              <a-form-model-item
                :label="$t('ssl.departament')"
                prop="csr_department"
              >
                <a-input v-model="generate.csr_department" />
              </a-form-model-item>

              <a-form-model-item :label="$t('ssl.city')" prop="csr_city">
                <a-input v-model="generate.csr_city" />
              </a-form-model-item>

              <a-form-model-item :label="$t('ssl.state')" prop="csr_state">
                <a-input v-model="generate.csr_state" />
              </a-form-model-item>

              <a-form-model-item
                :label="$t('ssl.countryname')"
                prop="csr_country"
              >
                <a-select v-model="generate.csr_country">
                  <a-select-option
                    v-for="country in Object.keys(countries)"
                    :key="country"
                    :value="country"
                  >
                    {{ country }}: {{ $t(`country.${country}`) }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>

              <a-form-model-item>
                <a-button
                  type="primary"
                  :loading="loading"
                  @click="generateCSR"
                >
                  {{ $t("ssl.generate") }} CSR
                </a-button>
              </a-form-model-item>
            </a-form-model>
            <div v-else-if="result.result == 'success'">
              <a-alert
                style="margin: 10px"
                :message="$t('ssl.generator_warning_save_private_key')"
                type="warning"
                show-icon
              />
              <a-form-model-item label="CSR" has-feedback prop="">
                <a-textarea
                  :value="result.csr_code"
                  :auto-size="{ minRows: 10, maxRows: 10 }"
                />
              </a-form-model-item>
              <a-form-model-item
                :label="$t('ssl.private key (RSA)')"
                style="margin-top: 20px"
              >
                <a-textarea
                  :value="result.csr_key"
                  :auto-size="{ minRows: 10, maxRows: 10 }"
                />
              </a-form-model-item>
              <a-form-model-item>
                <router-link
                  :to="{
                    name: 'certificate',
                    params: {
                      csr: result.csr_code,
                      domain: generate.csr_commonname,
                      org_name: generate.csr_organization,
                      org_division: generate.csr_department,
                      org_city: generate.csr_city,
                      org_country: generate.csr_country,
                      org_region: generate.csr_state,
                    },
                  }"
                >
                  <a-button type="primary">
                    <a-icon type="left" />{{
                      $t("ssl.save and return")
                    }}</a-button
                  >
                </router-link>
                <a-button
                  style="margin-left: 10px"
                  @click="download('txt', result.csr_key)"
                  >{{ $t("ssl.download_private_key") }}</a-button
                >
              </a-form-model-item>
            </div>
          </div>
        </template>
        <loading v-else />
      </div>
    </div>
  </div>
</template>
<script>
import loading from "@/components/loading/loading";
import { countries } from "@/setup/countries";
import { mapGetters } from "vuex";
import api from "@/api.js";
export default {
  name: "ssl-generator",
  components: {
    loading,
  },
  data() {
    return {
      countries,
      loading: false,
      generate: {
        csr_commonname: "",
        csr_organization: "",
        csr_department: "",
        csr_city: "",
        csr_state: "",
        csr_country: "",
        csr_email: "",
      },
      result: {
        csr_code: "",
        csr_key: "",
        result: "pending",
      },
      rules: {
        csr_commonname: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        csr_organization: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        csr_department: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],

        csr_email: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],

        csr_city: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        csr_state: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
        csr_country: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
          },
        ],
      },
    };
  },
  computed: {
    ...mapGetters({
      userData: "getUserData",
    }),
  },
  methods: {
    download(ext, text) {
      const domain = this.generate.csr_commonname;
      let filename = domain.replace(".", "_") + "." + ext;

      let element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
      );
      element.setAttribute("download", filename);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
     fetchService() {
      api
        .sendAsUser("services.getInfo", {
          serviceid: this.$route.params.id,
        })
        .then((res) => {
          this.generate.csr_commonname = res.domain;
        })
        .catch((err) => {
          console.error(err);
        });
    },
    fetchInfo() {
      api
        .sendAsUser("clientDetails")
        .then((res) => {
          this.$store.commit("setUserData", res);
          this.installDataToBuffer();
        })
        .catch((res) => {
          console.error(res);
        });
    },
    installDataToBuffer() {
      this.generate.csr_organization = this.userData.companyname;
      this.generate.csr_email = this.userData.email;
      this.generate.csr_country = this.userData.country;
      this.generate.csr_city = this.userData.city;
      this.generate.csr_state = this.userData.state;
    },
    generateCSR() {
      this.$refs.csrForm.validate((valid) => {
        if (valid) {
          this.loading = true;
          api
            .sendAsUser(
              "moduleTouch",
              { ...this.generate, ...{ path: "goget/generateCSR" } },
              "moduleTouch.phpgoget"
            )
            .then((resp) => {
              // console.log(resp)
              if (resp.error) {
                throw resp;
              }

              this.result.result = "success";
              this.result.csr_code = resp.csr_code;
              this.result.csr_key = resp.csr_key;
            })
            .catch((err) => {
              console.error(err);
              this.$message.error(err.description);
              this.result.result = "failed";
            })
            .finally(() => (this.loading = false));
        } else {
          this.$message.error(`${this.$t("ssl.fields is required")}`);
          return false;
        }
      });
    },

    retry() {
      this.result.csr_code = "";
      this.result.csr_key = "";
      this.result.result = "pending";
    },
  },
  mounted() {
     this.fetchService();
    this.fetchInfo();
  },
};
</script>

<style>
.ssl-generator {
  padding-top: 20px;
}

.generator__wrapper {
  background-color: #fff;
  border-radius: 20px;
  padding: 15px;
}

.generator__submit {
  margin-top: 20px;
}

.button--icon {
  font-size: 1.3rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  width: 43px;
  height: 43px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: color 0.3s ease, background-color 0.4s ease;
}

.button--icon:hover {
  /* color: var(--main); */
  background-color: var(--main);
  color: #fff;
}

.generate-page {
  padding-top: 20px;
}
.generate-page-card {
  background: #fff;
  border-radius: 10px;
  padding: 10px 15px 15px;
}
.generate-page__title {
  font-size: 1.4em;
  margin-bottom: 30px;
  font-weight: 500;
}
.generate__block {
  margin-top: 40px;
}
@media screen and (max-width: 768px) {
  .generate-page {
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>