<template>
  <div class="balance" v-if="isLogged">
    <div
      class="balance__item"
      @click="showModal"
      :class="{ clickable: clickable }"
    >
      {{ currency.prefix }}{{ user.balance }}

      <span class="currency__suffix">{{ currency.suffix }}</span>
      <span class="badge" v-if="clickable">
        <a-icon type="plus" />
      </span>
      <template v-else>
        {{ currency.suffix }}
      </template>
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
      modalVisible: false,
      confirmLoading: false,
      amount: 10,
      btns: [5, 10, 50, 100, 500, 1000],
      stay: false,
    };
  },
  mounted() {
    //нету юзера

    // this.$api
    //   .sendAsUser("getBalance")
    //   .then((res) => {
    //     if (this.isLogged && this.user.id == res.userid) {
    //       this.$store.dispatch("updateBalance", res.balance);
    //       this.$store.dispatch("updateCurrency", res.currency_code);
    //     }
    //   })
    //   .catch((err) => console.error(err));
  },
  computed: {
    user() {
      return this.$store.getters.getUser;
    },
    currency() {
      return this.$config.currency;
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
