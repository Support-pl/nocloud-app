<template>
  <a-modal
    :title="$t('Add Funds')"
    :visible="modalVisible"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
    :cancelText="$t('Cancel')"
  >
    <p v-if="isLogged">{{ $t("Enter value") }} ({{ user.currency_code }}):</p>
    <a-input type="number" min="0" v-model="amount" allow-clear />
    <a-row
      type="flex"
      justify="space-around"
      align="middle"
      :gutter="[10, 10]"
      style="margin-top: 10px"
    >
      <a-col v-for="add in btns" :key="add" :xl="6" :xs="8">
        <a-button style="width: 100%" @click="addAmount(add)"
          >+{{ add | numsepar }}</a-button
        >
      </a-col>
    </a-row>
    <a-row style="margin-top: 10px">
      <a-col>
        <label>
          <a-checkbox v-model="stay" />
          {{ $t("stay on page") }}
        </label>
      </a-col>
    </a-row>
  </a-modal>
</template>

<script>
import md5 from "md5";
export default {
  name: "balance_addFunds",
  props: ["modalVisible", "hideModal"],
  data() {
    return {
      confirmLoading: false,
      amount: 10000,
      btns: [10000, 50000, 100000, 200000, 500000],
      stay: false,
    };
  },
  computed: {
    user() {
      return this.$store.getters.getUser;
    },
    isLogged() {
      return this.$store.getters.isLogged;
    },
  },
  methods: {
    URLparameter(obj, outer = "") {
      var str = "";
      for (var key in obj) {
        if (key == "price") continue;
        if (str != "") {
          str += "&";
        }
        if (typeof obj[key] == "object") {
          str += this.URLparameter(obj[key], outer + key);
        } else {
          str += outer + key + "=" + encodeURIComponent(obj[key]);
        }
      }
      return str;
    },
    handleOk(e) {
      this.confirmLoading = true;
      let userinfo = {
        userid: this.user.id,
        amount: this.amount,
        secret: md5("addFunds" + this.user.id + this.user.secret),
      };
      this.$axios
        .get("addFunds.php?" + this.URLparameter(userinfo))
        .then((res) => {
          this.hideModal();
          this.confirmLoading = false;
          if (!this.stay) {
            this.$router.push({ path: `/invoice-${res.data.invoiceid}` });
          } else {
            this.$message.success(`Now look invoice#${res.data.invoiceid}`);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    },
    handleCancel(e) {
      this.hideModal();
    },
    addAmount(amount) {
      if (this.amount == "") this.amount = 0;
      this.amount += amount;
    },
  },
};
</script>

<style></style>
