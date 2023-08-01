<template>
  <div class="openInvoice__fullscreen">
    <transition name="invoiceApear">
      <div v-if="!isLoading" class="openInvoice">
        <div class="openInvoice__header">
          <div class="container full-height">
            <div class="openInvoice__header--content">
              <div class="openInvoice__back" @click="goBack()">
                <div class="icon__wrapper">
                  <a-icon type="left" />
                </div>
              </div>
              <div class="openInvoice__title">
                <div
                  class="openInvoice__title-color"
                  :style="{ 'background-color': statusColor }"
                ></div>
                {{
                  $t("singleInvoice") +
                  " " +
                  "#" +
                  parseInt(this.$route.params.uuid, 10)
                }}
              </div>
            </div>
          </div>
        </div>

        <div class="openInvoice__main">
          <div class="container full-height">
            <div class="openInvoice__main-content">
              <div class="openInvoice__cost">
                <svg viewBox="0 0 120 25">
                  <text
                    class="openInvoice__cost-text"
                    x="50%"
                    y="75%"
                    dominant-baseline="middle"
                    text-anchor="middle"
                  >
                    {{ (+invoice.total || total).toFixed(2) }}
                    {{ invoice.currencycode || "USD" }}
                  </text>
                </svg>
              </div>
              <div class="openInvoice__info">
                <div class="info__header-title">{{ $t("Information") }}</div>

                <div class="info__main">
                  <div class="info__dates">
                    <div class="info__date-item">
                      <div class="info__date-title">
                        {{ $t("invoiceDate") }}
                      </div>
                      <div class="info__date-value">
                        {{ invoice.date | dateFormat }}
                      </div>
                    </div>
                    <div class="info__date-item">
                      <div class="info__date-title">{{ $t("dueDate") }}</div>
                      <div class="info__date-value">
                        {{ (invoice.datepaid ?? invoice.duedate) | dateFormat }}
                      </div>
                    </div>
                  </div>

                  <div class="info__table table">
                    <div class="table__header">
                      <div class="table__header-item">
                        {{ $t("invoice_Description") }}
                      </div>
                      <div class="table__header-item">
                        {{ $t("invoice_Price") }}
                      </div>
                    </div>
                    <div class="table__wrapper">
                      <transition name="tableAnim">
                        <table v-if="!showFullTable" class="table__table">
                          <tr>
                            <td
                              v-if="
                                invoice.items.item[0].description === 'Add funds'
                              "
                            >
                              {{ $t("Add funds") }}
                            </td>
                            <td v-else>{{ invoice.items.item[0].description }}</td>
                            <td>
                              {{ total.toFixed(2) }}
                              {{ invoice.currencycode || "USD" }}
                            </td>
                          </tr>
                        </table>
                        <table v-else class="table__table">
                          <tr
                            v-for="(item, index) of invoice.items.item"
                            :key="index"
                          >
                            <td>{{ item.description }}</td>
                            <td v-if="item.amount">
                              {{ item.amount }}
                              {{ invoice.currencycode || "USD" }}
                            </td>
                          </tr>
                        </table>
                      </transition>
                    </div>
                    <div
                      v-if="invoice.items.item.length > 1 && !showFullTable"
                      @click="showfull"
                      class="table__show-full"
                    >
                      {{ $t("Show full list") }} ({{ invoice.items.item.length }})
                    </div>
                  </div>
                </div>
                <div class="info__footer">
                  <!-- <p class="info__footer__discount">
                    {{ $t("VNDExcludeVAT") }}
                  </p> -->
                  <template v-if="invoice.status == 'Unpaid'">
                    <!-- <div class="info__postpone" @click="showConfirm">
                      <a-icon type="clock-circle" />
                    </div> -->

                    <!-- <div class="info__button info__button--pay"> -->
                      <a-button class="info__button" :loading="confirmLoading" @click='showPayModal'>
                        {{ $t("Pay") }}
                      </a-button>
                    <!-- </div> -->
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <loading v-else color="#fff" :style="{'position': 'absolute', 'height':
      '100%', 'width': '100%'}" key="loading" duration: />
    </transition>
  </div>
</template>

<script>
import loading from "@/components/loading/loading.vue";

export default {
  name: "openInvoice",
  components: { loading },
  data() {
    return {
      payment: ["visa", "mastercard", "yandex.money"],
      showFullTable: false,
      confirmLoading: false,
      elem: "",
    };
  },
  methods: {
    goBack() {
      this.$router.push("/billing");
    },
    showfull() {
      this.showFullTable = true;
    },
    showPayModal() {
      this.confirmLoading = true;
      this.$api.get(this.baseURL, { params: {
        run: 'get_pay_token',
        invoice_id: this.invoice.id
      }})
      .then((res) => {
        window.location.href = res;
      })
      .finally(() => {
        this.confirmLoading = false;
      });
      // window.location.href = this.invoice.paytoken.checkout.redirect_url;
    },
    showConfirm() {
      this.$confirm({
        title: this.$t("Do you want to defer payment?"),
        maskClosable: true,
        content: () => (
          <div>
            {this.$t(
              "The payment can be postponed only once. The payment is postponed for 5 days."
            )}
          </div>
        ),
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        onOk() {},
        onCancel() {},
        class: "test",
      });
    },
  },
  mounted() {
    setTimeout(() => {
      const { uuid } = this.$route.params;

      sessionStorage.setItem('invoice', uuid);
    });

    this.$store.dispatch('invoices/autoFetch')
      .catch((err) => {
        this.$router.push("/billing");
        console.error(err);
      });
  },
  destroyed() {
    if (!this.$route.name.includes('billing')) {
      sessionStorage.removeItem('invoice');
    }
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    baseURL() {
      return this.$store.getters['invoices/getURL'];
    },
    invoice() {
      const { uuid } = this.$route.params;

      return this.$store.getters['invoices/getInvoices']
        .find((invoice) => invoice.id === +uuid);
    },
    isLoading() {
      return this.$store.getters['invoices/isLoading'];
    },
    statusColor() {
      return this.invoice?.status.toLowerCase() == "paid"
        ? this.$config.colors.success
        : this.$config.colors.err;
    },
    total() {
      return this.invoice.items.item.reduce((a, b) => a + +b.amount, 0);
    },
  },
};
</script>

<style>
.openInvoice__fullscreen {
  background: var(--main);
}
.openInvoice {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.openInvoice__header {
  height: 64px;
  line-height: 64px;
  background-color: var(--main);
  color: #fff;
  padding: 0;
}

.openInvoice__header--content {
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
  height: 100%;
}

.openInvoice__title {
  font-weight: bold;
  line-height: 1.1rem;
  position: relative;
}

.openInvoice__title-color {
  position: absolute;
  height: 10px;
  width: 10px;
  border-radius: 50%;
  top: 50%;
  left: -15px;
  transform: translateY(-50%);
}

.openInvoice__back {
  font-size: 1.4rem;
  cursor: pointer;
}

.openInvoice__main {
  flex: 1 0;
  background-color: var(--main);
}

.openInvoice__main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.openInvoice__cost {
  width: 100%;
}

.openInvoice__cost-text {
  fill: #fff;
}

.openInvoice__info {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  background-color: #fff;
  border-radius: 25px 25px 0 0;
  padding: 10px 20px 20px;
  position: relative;
}

.info__main {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  padding-bottom: 64px;
}

.info__dates {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.info__date-item {
  text-align: center;
}
.info__date-title {
  font-weight: bold;
  font-size: 16px;
  padding: 0;
}
.info__date-value {
  font-weight: bold;
  font-size: 16px;
  line-height: 10px;
  padding: 0;
}

.info__table {
  flex: 1 0;
  overflow: auto;
}
.table__wrapper {
  overflow: auto;
}

.table__header {
  display: flex;
  justify-content: space-between;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 5px;
}

.table__header-item {
  font-weight: 700;
  font-size: 1.4rem;
}

.table__table {
  border: 1px solid #5252d5;
  width: 100%;
  overflow: hidden;
}

.table__table td {
  padding: 10px 0;
  font-size: 16px;
}
.table__table td:first-child {
  font-weight: bold;
  padding-left: 20px;
}

.table__table td:last-child {
  border-left: 1px solid #5252d5;
  text-align: right;
  width: 34%;
  max-width: 150px;
  padding-right: 10px;
  color: #06a506;
  font-weight: 500;
}
.info__footer {
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  height: 45px;
  position: absolute;
  bottom: 30px;
  left: 20px;
  right: 20px;
  flex-direction: column;
}
/* .info__footer__discount {
  font-size: 18px;
  font-weight: 500;
  text-align: center;
} */

.info__postpone {
  font-size: 24px;
  padding: 9px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.info__postpone:hover {
  transform: scale(1.1);
}

.info__postpone:active {
  transform: scale(0.9);
}

.info__button {
  flex: 1 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  font-weight: 600;
  color: var(--bright_font);
  cursor: pointer;
  font-size: 16px;
  transition: filter 0.2s ease;
  background-color: var(--success);
  background-size: 150% 200%;
  background-position: 0 0;
  animation: AnimationName 1s ease infinite;
}

.info__button--pay:hover {
  filter: brightness(1.05);
}

.info__button--pay:active {
  filter: brightness(0.95);
}
.table__show-full {
  cursor: pointer;
}
.info__row {
  display: flex;
  border-top: 1px solid rgb(230, 230, 230);
}

.info__row--pay {
  margin-top: 40px;
}

.info__title,
.info__value {
  flex: 1 0;
  padding: 10px 5px;
}

.info__row:last-child {
  border-bottom: 1px solid rgb(230, 230, 230);
}

.info__title {
  border-right: 1px solid rgb(230, 230, 230);
}

.info__value {
  text-align: center;
}

.full-height {
  height: 100%;
}

.info__header-title {
  text-align: center;
  margin-top: 15px;
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.info__payment-select {
  border: none;
  outline: none;
  background-color: rgb(250, 250, 250);
  width: 90%;
}

.info__payment-select > option {
  border: none;
  outline: none;
}

.info__row--pay-btn {
  background-color: #0fd058;
  color: #fff;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
  border-radius: 20px;
  transition: background-color 0.2s ease;
  margin-top: 30px;
}

.info__row--pay-btn:hover {
  background-color: #18da62;
  filter: brightness(0.8);
}

.info__row--pay-btn:active {
  background-color: rgb(22, 194, 88);
}

/* anims */

.invoiceApear-enter-active,
.invoiceApear-leave-active {
  transition: opacity 0.6s;
}
.invoiceApear-enter,
.invoiceApear-leave-to {
  opacity: 0;
}

.invoiceApear-enter-active .openInvoice__title {
  transition: transform 0.2s 0.4s ease;
}

.invoiceApear-enter .openInvoice__title {
  transform-origin: center left;
  transform: translateY(-50px) rotate(10deg);
}

.invoiceApear-enter-active .openInvoice__cost {
  transition: transform 0.2s 0.3s ease, opacity 0.2s 0.4s ease;
}

.invoiceApear-enter .openInvoice__cost {
  opacity: 0;
  transform-origin: center left;
  transform: translateY(-50px) rotate(10deg);
}

.opencloud-enter-active .openInvoice__info {
  transition: transform 0.2s 0.4s ease, opacity 0.2s 0.2s ease;
}

.opencloud-enter .openInvoice__info {
  transform: translateY(200px);
  opacity: 0;
}
.invoiceApear-enter-active .info__footer {
  transition: transform 0.3s 0.3s ease, opacity 0.2s 0.4s ease;
}

.invoiceApear-enter .info__footer {
  transform: translateY(50px);
  opacity: 0;
}

@media screen and (max-width: 768px) {
  .info__dates {
    justify-content: space-between;
  }
  .openInvoice__info {
    border-radius: 60px 0px 0 0;
    margin-top: 55px;
  }
  .openInvoice__info::after {
    content: url("../../../../public/img/images/radius.png");
    position: absolute;
    top: -49px;
    right: 0;
  }
}
</style>
