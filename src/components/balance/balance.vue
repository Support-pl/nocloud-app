<template>
  <div class="balance" v-if="isLogged">
    <div
      class="balance__item"
      @click="showModal"
      :class="{ clickable: clickable }"
    >
      {{ (userdata.balance || 0).toFixed(2) }}

      <span class="currency__suffix">{{ currency.suffix }}</span>
      <span class="badge" v-if="clickable">
        <a-icon type="plus" />
      </span>
    </div>
    <addFunds :modalVisible="modalVisible" :hideModal="hideModal" />
  </div>
</template>

<script>
import addFunds from "./addFunds.vue";
import md5 from "md5";
export default {
  name: "balance_item",
  components: {
    addFunds,
  },
  props: {
    clickable: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      currency: {},
      modalVisible: false,
      confirmLoading: false,
      amount: 10,
      btns: [5, 10, 50, 100, 500, 1000],
      stay: false,
    };
  },
  mounted() {
    this.$store.dispatch("nocloud/auth/fetchBillingData")
      .then((res) => {
        this.currency.suffix = res.currency_code ?? this.defaultCurrency;
        this.currency = Object.assign({}, this.currency);
      })
      .catch((err) => console.error(err));
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    userdata() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    defaultCurrency() {
      return this.$store.getters['nocloud/auth/defaultCurrency'];
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
    showModal() {
      if (this.clickable) {
        this.modalVisible = true;
      }
    },
    hideModal() {
      this.modalVisible = false;
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
          this.modalVisible = false;
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
      this.modalVisible = false;
    },
    addAmount(amount) {
      if (this.amount == "") this.amount = 0;
      this.amount += amount;
    },
  },
  watch: {
    defaultCurrency(value) {
      if (this.user.currency_code) return;

      this.$set(this.currency, 'suffix', value);
    }
  }
};
</script>

<style>
.balance__item.clickable {
  cursor: pointer;
}
.currency__suffix {
  font-size: 14px;
}
.badge {
  position: absolute;
  font-size: 12px;
  right: 3px;
  top: 7px;
  background: #f5222d;
  border-radius: 50%;
  border: 1.6px solid #fff;
  width: 22px;
  height: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>
