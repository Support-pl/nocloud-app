<template>
	<div class="btn">
		<a-button block @click.stop="moduleEnter">{{$t('renew') | capitalize}}</a-button>

    <add-funds
      v-if="addfunds.visible"
      :sum="addfunds.amount"
      :modalVisible="addfunds.visible"
      :hideModal="() => addfunds.visible = false"
    />
	</div>
</template>

<script>
import addFunds from '@/components/balance/addFunds.vue';

export default {
  components: { addFunds },
	props: ['service'],
  data: () => ({
    addfunds: { visible: false, amount: 0 }
  }),
	methods: {
		moduleEnter() {
      if (!this.checkBalance()) return;
			this.$confirm({
        title: this.$t('Do you want to renew server?'),
        okText: this.$t('Yes'),
        cancelText: this.$t('Cancel'),
        onOk: async () => {
          const data = { uuid: this.service.orderid, action: 'manual_renew' };

          return this.$store.dispatch('nocloud/vms/actionVMInvoke', data)
            .then(() => {
              this.$notification.success({ message: `Done!` });
            })
            .catch((err) => {
              this.$notification.error({
                message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`,
              });
            });
        },
        onCancel() {},
      });
		},
    checkBalance() {
      const key = (this.service.billingPlan.type.includes('ovh'))
        ? `${this.service.config.duration} ${this.service.config.planCode}`
        : this.service.product;
      const sum = this.service.billingPlan?.products[key]?.price ?? 0;

      if (this.user.balance < parseFloat(sum)) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance.'),
          content: () => (
            <div>{ this.$t('Click OK to replenish the account with the missing amount') }</div>
          ),
          onOk: () => {
            this.addfunds.amount = Math.ceil(parseFloat(sum) - this.user.balance);
            this.addfunds.visible = true;
          }
        });
        return false;
      }
      return true;
    }
	},
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    }
  }
}
</script>

<style scoped>
.btn{
  width: fit-content;
	transform: translateX(10px);
}

.btn button{
	height: 100%;
}
</style>
