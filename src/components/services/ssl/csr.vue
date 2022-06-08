<template>
  <div>
    <a-alert
      style="margin: 10px"
      :message="$t('ssl.csr_warning')"
      type="warning"
      show-icon
    />
    <a-form-model ref="csrFormField" :model="fieldCSR" :rules="rules">
      <a-form-model-item label="CSR" prop="csr">
        <a-spin tip="Loading..." :spinning="areaLoading">
          <a-textarea v-model="fieldCSR.csr" style="height: 150px" />
        </a-spin>
      </a-form-model-item>
      <a-form-model-item>
        <router-link :to="{ name: 'csr' }">
          <a-button type="primary"> {{ $t("ssl.generate") }} CSR</a-button>
        </router-link>
        <a-button
          type="primary"
          @click="handleClickNext"
          :style="{ marginLeft: '10px' }"
        >
          {{ $t("ssl.continue") }}<a-icon type="right"
        /></a-button>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import api from "@/api.js";
const keys = {
  firstname: "tech_firstname",
  lastname: "tech_lastname",
  email: "tech_email",
  address1: "tech_addressline1",
  city: "tech_city",
  state: "tech_region",
  phonenumber: "tech_phone",
  country: "tech_country",
  companyname: "tech_organization",
  org_name: "org_name",
  org_division: "org_division",
  org_duns: "org_duns",
  org_addressline1: "org_addressline1",
  org_city: "org_city",
  org_region: "org_region",
  org_lei: "org_lei",
  org_postalcode: "org_postalcode",
  org_phone: "org_phone",
};
export default {
  name: "certificate",
  props: {
    csr: {
      type: Object,
      default: () => {},
    },
    product_info: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      fieldCSR: {
        csr: "",
      },
      areaLoading: false,
      rules: {
        csr: [
          {
            required: true,
            message: `${this.$t("ssl.field is required")}`,
            min: 40,
          },
        ],
      },
    };
  },
  methods: {
    handleClickNext() {
      this.$refs.csrFormField.validate(async (valid) => {
        let params =
          "domain" in this.$route.params
            ? this.$route.params
            : await this.decodeCSR(this.fieldCSR.csr);

        if (valid) {
          const data = {
            ...this.fieldCSR,
            ...params,
          };
          this.$emit("handleClickNext", data);
        } else {
          this.$message.error(`${this.$t("ssl.fields is required")}`);
          return false;
        }
      });
    },
    decodeCSR(csr) {
      const data = {
        csr,
      };
      return new Promise((resolve) => {
        api
          .sendAsUser(
            "moduleTouch",
            { ...data, ...{ path: "ssl/decodeCSR" } },
            "moduleTouch.phpssl"
          )
          .then((resp) => {
            let result;
            if (resp.error) {
              throw resp;
            }
            if ("csrResult" in resp && resp.success) {
              result = {
                domain: resp.csrResult.CN,
                org_name: resp.csrResult.O,
                org_division: resp.csrResult.OU,
                org_city: resp.csrResult.L,
                org_country: resp.csrResult.C,
                org_region: resp.csrResult.S,
              };
            }
            resolve(result);
          })
          .catch((err) => {
            console.error(err);
            this.$message.error(err.description);
            resolve(err);
          });
      });
    },
  },
  mounted() {
    this.fieldCSR.csr = this.$route.params.csr || this.csr.csr;
  },
  created() {
    this.areaLoading = this.$route.params.reissue ? true : false;
    api
      .sendAsUser("services.getInfo", {
        serviceid: this.$route.params.id,
      })
      .then((res) => {
        if (res.SSL.remoteid) {
          this.fieldCSR.csr = res.SSL.configdata.csr_code;
          let data = {};
          for (let key in keys) {
            this.$set(data, key, res.SSL.configdata[keys[key]]);
          }
          this.$set(data, "result", "success");
          this.$set(data, "remoteid", res.SSL.remoteid);
          this.$emit("saveReissueInfo", data);
        }

        this.$emit("saveProductInfo", res);
        this.areaLoading = false;
      })
      .catch((err) => {
        console.error(err);
      });
  },
};
</script>
