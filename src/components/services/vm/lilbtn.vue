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

      const key = (this.service.billingPlan.type.includes('ovh'))
        ? `${this.service.config.duration} ${this.service.config.planCode}`
        : this.service.product;
      const { period } = this.service.billingPlan.products[key];

      const currentPeriod = (this.service.billingPlan.type.includes('ovh'))
        ? this.service.data.expiration
        : this.date(this.service.data.last_monitoring);

      const newPeriod = (this.service.billingPlan.type.includes('ovh'))
        ? this.date(this.service.data.expiration, +period)
        : this.date(this.service.data.last_monitoring + +period);

			this.$confirm({
        title: this.$t('Do you want to renew server?'),
        content: () => (
          <div>
            <div style="font-weight: 700">{ `${this.service.title}` }</div>
            <div>
              { `${this.$t("from")} ` }
              <span style="font-style: italic">{ `${currentPeriod}` }</span>
            </div>
            <div>
              { `${this.$t("to")} ` }
              <span style="font-style: italic">{ `${newPeriod}` }</span>
            </div>
          </div>
        ),
        okText: this.$t('Yes'),
        cancelText: this.$t('Cancel'),
        okButtonProps: {
          props: { disabled: (this.service.data.blocked) },
        },
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
    },
    date(string, timestamp) {
      if (timestamp < 1) return '-';

      const dateFromString = (string) ? new Date(string).getTime() : 0;
      const date = new Date(timestamp * 1000 + dateFromString);
      const time =  date.toTimeString().split(' ')[0];

      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      if (string) return `${year}-${month}-${day}`;
      return `${day}.${month}.${year} ${time}`;
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
  display: inline-block;
  width: fit-content;
	transform: translateX(10px);
}

.btn button{
	height: 100%;
}
</style>
