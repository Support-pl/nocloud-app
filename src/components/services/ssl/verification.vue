<template>
  <div>
    <a-alert
      style="margin: 10px"
      :message="$t('ssl.verification_warning')"
      type="warning"
      show-icon
    />
    <a-form-model ref="verification" :model="verification" :rules="rules">
      <a-form-model-item :label="$t('ssl.domain')" prop="domain">
        <a-input disabled v-model="verification.domain" />
      </a-form-model-item>
      <a-form-model-item :label="$t('ssl.DCV Method')" prop="dcv">
        <a-select v-model="verification.dcv">
          <a-select-option v-for="item in dcv_list" :value="item" :key="item">
            {{ item }}
          </a-select-option>
        </a-select>
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl.email')" prop="email">
        <a-select v-model="verification.email">
          <a-select-option
            v-for="item in email_list"
            :key="item"
            :value="`${item}${csr.domain}`"
          >
            {{ item }}{{ csr.domain }}
          </a-select-option>
        </a-select>
      </a-form-model-item>

      <a-form-model-item>
        <a-button type="primary" @click="handleClickPrev"
          ><a-icon type="left" /> {{ $t("ssl.back") }}</a-button
        >
        <a-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
          style="margin-left: 10px"
        >
          {{ $t("ssl.send") }}
        </a-button>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import loading from "@/components/loading/loading";
import api from "@/api.js";
export default {
  name: "Verification",
  components: { loading },
  props: {
    personal: {
      type: Object,
      default: () => {},
    },
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
      loading: false,
      data: "",
      verification: {
        domain: this.csr.domain,
        dcv: "EMAIL",
        email: `admin@${this.csr.domain}`,
      },
      dcv_list: ["EMAIL", "HTTP", "HTTPS", "DNS"],
      email_list: [
        "admin@",
        "administrator@",
        "hostmaster@",
        "webmaster@",
        "postmaster@",
      ],
      rules: {
        dcv: [
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
      },
    };
  },
  methods: {
    handleClickPrev() {
      this.$emit("handleClickPrev", this.personal);
    },
    handleSubmit() {
      this.$refs.verification.validate((valid) => {
        if (valid) {
          const data = {
            ...this.csr,
            ...this.personal,
            dcv: this.verification.dcv,
            approver_email: this.verification.email,
            serviceid: this.$route.params.id,
            pid: this.product_info.pid,
            certificate_name: this.product_info.name,
          };

          let method = this.personal.remoteid ? "ssl/reissue" : "ssl/configure";

          this.loading = true;
          api
            .sendAsUser(
              "moduleTouch",
              { ...data, ...{ path: method } },
              "moduleTouch.phpssl"
            )
            .then((resp) => {
              if (resp.error) {
                throw resp;
              }

              if (resp.success) {
                this.$router.push({ name: "service" });
              }
            })
            .catch((err) => {
              console.error(err);
              this.$message.error(err.description);
            })
            .finally(() => (this.loading = false));
        } else {
          this.$message.error("Please fill in all fields");
          return false;
        }
      });
    },
  },
};
</script>
