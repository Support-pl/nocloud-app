<template>
	<div class="btn">
		<a-button block :disabled="service.data.blocked" @click.stop="moduleEnter">
      {{ $t('renew') | capitalize }}
      <template v-if="currency">
        {{ (currency.code === 'USD') ? `$${slicedPrice}` : priceWithoutPrefix }}
      </template>
    </a-button>

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
	props: ['service', 'price', 'currency'],
  data: () => ({
    addfunds: { visible: false, amount: 0 }
  }),
	methods: {
		moduleEnter() {
      if (!this.checkBalance()) return;

      const key = (this.service.billingPlan.type.includes('ovh'))
        ? `${this.service.config.duration} ${this.service.config.planCode}`
        : this.service.product;
      const { period, price } = this.service.billingPlan.products[key];

      const currentPeriod = (this.service.billingPlan.type.includes('ovh'))
        ? this.service.data.expiration
        : this.date(null, this.service.data.last_monitoring);

      const newPeriod = (this.service.billingPlan.type.includes('ovh'))
        ? this.date(this.service.data.expiration, +period)
        : this.date(null, this.service.data.last_monitoring + +period);

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

            <div style="margin-top: 10px">
              <span style="font-weight: 700">{ this.$t('Tariff price') }: </span>
              { price } { this.currency.code }
              <div>
                <span style="font-weight: 700">{ this.$t('Addons prices') }:</span>
                <ul style="list-style: '-  '; padding-left: 25px; margin-bottom: 5px">
                  { ...Object.entries(this.addonsPrice).map(([key, value]) =>
                    <li>{ key }: { value } { this.currency.code }</li>
                  ) }
                </ul>
              </div>

              <div>
                <span style="font-weight: 700">{ this.$t('Total') }: </span>
                { this.price } { this.currency.code }
              </div>
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
              this.$set(this.service.data, 'blocked', true);
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
      if (this.user.balance < parseFloat(this.price)) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance.'),
          content: () => (
            <div>{ this.$t('Click OK to replenish the account with the missing amount') }</div>
          ),
          onOk: () => {
            this.addfunds.amount = Math.ceil(parseFloat(this.price) - this.user.balance);
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
    },
    slicedPrice() {
      if (`${this.price}`.replace('.').length > 3) {
        return (`${this.price}`[2] === '.')
          ? `${this.price.toString().slice(0, 4)}...`
          : `${this.price.toString().slice(0, 3)}...`
      } else {
        return this.price;
      }
    },
    priceWithoutPrefix() {
      const code = (`${this.price}`.replace('.').length > 3) ? '' : this.currency.code;

      return `${this.slicedPrice} ${code}`;
    },
    addonsPrice() {
      if (this.service.billingPlan.type.includes('ovh')) {
        return this.service.config.addons.reduce((res, addon) => {
          const { price } = this.service.billingPlan.resources.find(
            ({ key }) => key === `${this.service.config.duration} ${addon}`
          );
          let key = '';

          if (addon.includes('additional')) key = this.$t('adds drive');
          if (addon.includes('snapshot')) key = this.$t('Snapshot');
          if (addon.includes('backup')) key = this.$t('Backup');
          if (addon.includes('windows')) key = this.$t('Windows');

          return { ...res, [key]: +price };
        }, {});
      } else {
        return this.service.billingPlan.resources.reduce((prev, curr) => {
          if (curr.key === `drive_${this.service.resources.drive_type.toLowerCase()}`) {
            const key = this.$t('Drive');

            return {
              ...prev,
              [key]: curr.price * this.service.resources.drive_size / 1024
            };
          } else if (curr.key === "ram") {
            const key = this.$t('ram');

            return {
              ...prev,
              [key]: curr.price * this.service.resources.ram / 1024
            };
          } else if (this.service.resources[curr.key]) {
            const key = this.$t(curr.key.replace('_', ' '));

            return {
              ...prev,
              [key]: curr.price * this.service.resources[curr.key]
            };
          }
          return prev;
        }, {});
      }
    }
  }
}
</script>

<style scoped>
.btn {
  grid-column: 2 / 4;
  justify-self: end;
  width: fit-content;
}

.btn button {
	height: 100%;
}
</style>
