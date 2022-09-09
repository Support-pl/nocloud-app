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
    <a-input-number min="0" v-model="amount" allow-clear />
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
export default {
  name: "balance_addFunds",
  props: ["modalVisible", "hideModal"],
  data() {
    return {
      confirmLoading: false,
      amount: 5,
      btns: [5, 10, 50, 100, 200],
      stay: false,
    };
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    isLogged() {
      return this.$store.getters['nocloud/auth/isLoggedIn'];
    },
    baseURL() {
      return $store.getters['support/getURL'];
    }
  },
  methods: {
    handleOk() {
      this.confirmLoading = true;
      this.$api.get(this.baseURL, { params: {
        run: 'add_funds',
        userid: this.user.uuid,
        amount: this.amount
      }})
        .then((res) => {
          this.hideModal();
          this.confirmLoading = false;
          if (!this.stay) {
            this.$router.push({ path: `/invoice/${res.data.invoiceid}` });
          } else {
            this.$message.success(`Now look invoice#${res.data.invoiceid}`);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    },
    handleCancel() {
      this.hideModal();
    },
    addAmount(amount) {
      if (this.amount == "") this.amount = 0;
      this.amount += amount;
    },
  }
}
</script>
