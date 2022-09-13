<template>
  <a-modal
    :title="$t('Add Funds')"
    :visible="modalVisible"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
    :cancelText="$t('Cancel')"
  >
    <p v-if="isLogged">{{ $t("Enter value") }} ({{ user.currency_code || 'USD' }}):</p>
    <a-input-number allow-clear style="width: 100%" v-model="amount" :min="0" />
    <a-row
      type="flex"
      justify="space-around"
      align="middle"
      :gutter="[10, 10]"
      style="margin-top: 10px"
    >
      <a-col v-for="add in btns" :key="add" :xl="6" :xs="8">
        <a-button style="width: 100%" @click="addAmount(add)"
          >+{{ add }}</a-button
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
      return this.$store.getters['support/getURL'];
    }
  },
  methods: {
    handleOk() {
      this.confirmLoading = true;
      this.$api.get(this.baseURL, { params: { run: 'add_func', sum: this.amount }})
        .then((res) => {
          this.hideModal();
          this.confirmLoading = false;
          if (!this.stay) {
            this.$router.push({ path: `/invoice/${res.invoiceid}` });
          } else {
            this.$message.success(`Now look invoice#${res.invoiceid}`);
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
