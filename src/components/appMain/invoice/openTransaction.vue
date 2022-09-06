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
                />
                {{ `${$t("singleInvoice")} #${this.$route.params.uuid}` }}
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
                    x="50%" y="75%"
                    dominant-baseline="middle"
                    text-anchor="middle"
                  >
                    {{ records.reduce((prev, el) => +prev + +el.total, 0) }}
                    {{ user && user.currency_code || "BYN" }}
                  </text>
                </svg>
              </div>
              <div class="openInvoice__info">
                <div class="info__header-title">{{ $t("Information") }}</div>

                  <div class="info__dates">
                    <div class="info__date-item">
                      <div class="info__date-title">{{ $t("invoiceDate") }}</div>
                      <div class="info__date-value">
                        {{ invoice && date(invoice.exec) }}
                      </div>
                    </div>
                    <div class="info__date-item">
                      <div class="info__date-title">{{ $t("dueDate") }}</div>
                      <div class="info__date-value">
                        {{ invoice && date(invoice.proc) }}
                      </div>
                    </div>
                  </div>

                <div class="info__main">
                  <a-table row-key="uuid" :data-source="records" :columns="columns">
                    <template slot="date" slot-scope="text, record">
                      {{ date(record.exec) }}
                    </template>
                    <template slot="amount" slot-scope="text, record">
                      {{ record.total }} BYN
                    </template>
                    <template slot="product" slot-scope="text, record">
                      {{ (record.product)
                        ? record.product.replaceAll('_', ' ').toUpperCase()
                        : record.resource.toUpperCase() }}
                    </template>
                  </a-table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <loading v-else class="loading" color="#fff" key="loading" duration: />
    </transition>
  </div>
</template>

<script>
import loading from "@/components/loading/loading.vue";

export default {
  name: "openTransaction",
  components: { loading },
  data: () => ({
    isLoading: true,
    records: null,
    columns: [
      {
        title: 'Instance',
        dataIndex: 'instance'
      },
      {
        title: 'Product',
        dataIndex: 'product',
        scopedSlots: { customRender: 'product' }
      },
      {
        title: 'Date',
        dataIndex: 'exec',
        scopedSlots: { customRender: 'date' }
      },
      {
        title: 'Amount',
        dataIndex: 'total',
        scopedSlots: { customRender: 'amount' }
      },
    ],
  }),
  methods: {
    goBack() {
      this.$router.push("/invoice");
    },
    date(timestamp) {
      if (timestamp < 1) return '-';

      const date = new Date(timestamp * 1000);
      const time =  date.toTimeString().split(' ')[0];

      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      return `${day}.${month}.${year} ${time}`;
    }
  },
  mounted() {
    const url = `/billing/transactions/${this.$route.params.uuid}`;

    this.$store.dispatch('nocloud/vms/fetch');
    setTimeout(() => {
      this.$api.get(url)
        .then(({ pool }) => {
          const instances = {};

          this.services.forEach((service) => {
            service.instancesGroups.forEach((group) => {
              group.instances.forEach((inst) => {
                instances[inst.uuid] = inst.title;
              });
            });
          });
          this.records = pool.map((el) => ({
            ...el, instance: instances[el.instance] ?? 'unknown'
          }));
          this.isLoading = false;

          this.columns[1].title = (pool[0].product) ? 'Product' : 'Resource';
        })
        .catch((err) => {
          this.$router.push("/invoice");
          console.error(err);
        });
    }, 1000);
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth'];
    },
    statusColor() {
      return this.records[0].processed
        ? this.$config.colors.success
        : this.$config.colors.err;
    },
    services() {
      return this.$store.getters['nocloud/vms/getServicesFull'];
    },
    invoice() {
      return this.$store.getters['nocloud/transactions/getTransactions']
        .find((el) => el.uuid === this.$route.params.uuid);
    }
  },
  watch: {
    user() {
      this.$store.dispatch('nocloud/transactions/fetch', this.user.uuid);
    }
  }
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
  top: calc(50% - 2px);
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

.loading {
  position: absolute;
  height: 100%; 
  width: 100%;
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
