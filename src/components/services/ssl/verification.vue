<template>
  <div>
    <a-alert
      style="margin: 10px"
      :message="$t('ssl_product.verification_warning')"
      type="warning"
      show-icon
    />
    <a-form-model ref="verification" :model="verification" :rules="rules">
      <a-form-model-item :label="$t('ssl_product.domain')" prop="domain">
        <a-input disabled v-model="verification.domain" />
      </a-form-model-item>
      <a-form-model-item :label="$t('ssl_product.DCV Method')" prop="dcv">
        <a-select v-model="verification.dcv">
          <a-select-option v-for="item in dcv_list" :value="item" :key="item">
            {{ item }}
          </a-select-option>
        </a-select>
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.email')" prop="email">
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
        <a-button type="primary" @click="$emit('handleClickPrev', verification)">
          <a-icon type="left" /> {{ $t("ssl_product.back") }}
        </a-button>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import loading from "@/components/loading/loading";

export default {
  name: "Verification",
  components: { loading },
  props: {
    verification_back: { type: Object, default: () => {} },
    csr: { type: Object, default: () => {} }
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
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
        email: [
          {
            required: true,
            message: `${this.$t("ssl_product.field is required")}`,
          },
        ],
      },
    };
  },
  mounted() {
    if (!('dcv' in this.verification_back)) this.$emit('getVerification', this.verification);
    else this.verification = this.verification_back;
  }
};
</script>
