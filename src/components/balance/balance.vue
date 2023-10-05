<template>
  <div v-if="isLogged" class="balance">
    <div
      class="balance__item"
      :class="{ clickable: clickable }"
      @click="showModal"
    >
      {{ (userdata.balance || 0).toFixed(2) }}

      <span class="currency__suffix">{{ currency.suffix }}</span>
      <span v-if="clickable" class="badge">
        <a-icon type="plus" />
      </span>
    </div>
    <add-funds :modal-visible="modalVisible" :hide-modal="hideModal" />
  </div>
</template>

<script>
import addFunds from '@/components/balance/addFunds.vue'

export default {
  name: 'BalanceItem',
  components: {
    addFunds
  },
  props: {
    clickable: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      currency: {},
      modalVisible: false,
      confirmLoading: false,
      amount: 10,
      btns: [5, 10, 50, 100, 500, 1000],
      stay: false
    }
  },
  computed: {
    user () {
      return this.$store.getters['nocloud/auth/billingData']
    },
    userdata () {
      return this.$store.getters['nocloud/auth/userdata']
    },
    isLogged () {
      return this.$store.getters['nocloud/auth/isLoggedIn']
    },
    defaultCurrency () {
      return this.$store.getters['nocloud/auth/defaultCurrency']
    }
  },
  watch: {
    defaultCurrency (value) {
      if (this.user.currency_code) return

      this.$set(this.currency, 'suffix', value)
    },
    user (value) {
      this.$set(this.currency, 'suffix', value.currency_code ?? this.defaultCurrency)
    }
  },
  created () {
    this.$store.dispatch('nocloud/auth/fetchBillingData')
      .then((result) => {
        if (result.id && localStorage.getItem('oauth')) {
          localStorage.removeItem('oauth')
          this.$router.replace('/')
        }
      })
  },
  mounted () {
    this.$set(this.currency, 'suffix', this.user.currency_code ?? this.defaultCurrency)
  },
  methods: {
    URLparameter (obj, outer = '') {
      let str = ''
      for (const key in obj) {
        if (key === 'price') continue
        if (str !== '') {
          str += '&'
        }
        if (typeof obj[key] === 'object') {
          str += this.URLparameter(obj[key], outer + key)
        } else {
          str += outer + key + '=' + encodeURIComponent(obj[key])
        }
      }
      return str
    },
    showModal () {
      if (this.clickable) {
        this.modalVisible = true
      }
    },
    hideModal () {
      this.modalVisible = false
    },
    addAmount (amount) {
      if (this.amount === '') this.amount = 0
      this.amount += amount
    }
  }
}
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
