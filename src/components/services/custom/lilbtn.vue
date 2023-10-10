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
      :modal-visible="addfunds.visible"
      :hide-modal="() => addfunds.visible = false"
    />
  </div>
</template>

<script lang="jsx">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'

import addFunds from '@/components/balance/addFunds.vue'

export default defineComponent({
  components: { addFunds },
  props: {
    price: { type: Number, required: true },
    service: { type: Object, required: true },
    currency: { type: Object, required: true }
  },
  data: () => ({
    addfunds: { visible: false, amount: 0 },
    isLoading: false
  }),
  computed: {
    ...mapState(useAuthStore, ['userdata']),
    slicedPrice () {
      if (`${this.price}`.replace('.').length > 3) {
        return (`${this.price}`[2] === '.')
          ? `${this.price.toString().slice(0, 4)}...`
          : `${this.price.toString().slice(0, 3)}...`
      } else {
        return this.price
      }
    },
    priceWithoutPrefix () {
      const code = (`${this.price}`.replace('.').length > 3) ? '' : this.currency.code

      return `${this.slicedPrice} ${code}`
    }
  },
  methods: {
    moduleEnter () {
      if (!this.checkBalance()) return

      const key = this.service.product
      const { period } = this.service.billingPlan.products[key]

      const currentPeriod = this.date(this.service.data.next_payment_date)

      const newPeriod = this.date(this.service.data.next_payment_date + +period)

      this.$confirm({
        title: this.$t('Do you want to renew service?'),
        content: () => (
          <div>
            <div style="font-weight: 700">{ `${this.service.title}` }</div>
            <div>
              { `${this.$t('from')} ` }
              <span style="font-style: italic">{ `${currentPeriod}` }</span>
            </div>
            <div>
              { `${this.$t('to')} ` }
              <span style="font-style: italic">{ `${newPeriod}` }</span>
            </div>

            <div style="margin-top: 10px">
              <span style="font-weight: 700">{ this.$t('Tariff price') }: </span>
              { this.price } { this.currency.code }
            </div>
          </div>
        ),
        okText: this.$t('Yes'),
        cancelText: this.$t('Cancel'),
        okButtonProps: {
          props: { disabled: (this.service.data.blocked) }
        },
        onOk: async () => {
          const data = { uuid: this.service.uuid, action: 'manual_renew' }

          return this.$store.dispatch('nocloud/vms/actionVMInvoke', data)
            .then(() => {
              this.$notification.success({ message: 'Done!' })
              this.$set(this.service.data, 'blocked', true)
            })
            .catch((err) => {
              this.$notification.error({
                message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`
              })
            })
        },
        onCancel () {}
      })
    },
    checkBalance () {
      if (this.userdata.balance < parseFloat(this.price)) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance'),
          content: this.$t('Click OK to replenish the account with the missing amount'),
          onOk: () => {
            this.addfunds.amount = Math.ceil(parseFloat(this.price) - this.userdata.balance)
            this.addfunds.visible = true
          }
        })
        return false
      }
      return true
    },
    date (timestamp) {
      if (timestamp < 1) return '-'

      const date = new Date(timestamp * 1000)
      const time = date.toTimeString().split(' ')[0]

      const year = date.getFullYear()
      let month = date.getMonth() + 1
      let day = date.getDate()

      if (`${month}`.length < 2) month = `0${month}`
      if (`${day}`.length < 2) day = `0${day}`

      return `${day}.${month}.${year} ${time}`
    }
  }
})
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
