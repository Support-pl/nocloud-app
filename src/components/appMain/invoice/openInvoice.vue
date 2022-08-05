<template>
  <div class="openInvoice__fullscreen">
    <transition name="invoiceApear">
      <div v-if="!loading" class="openInvoice">
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
                <div class="info__main">
                  <a-table row-key="uuid" :data-source="records" :columns="columns">
                    <template slot="inst" slot-scope="text, record">
                      {{ (!visibleHash.includes(record.uuid))
                        ? `${record.instance.slice(0, 8)}...`
                        : record.instance }}
                      <a-icon
                        type="eye"
                        v-if="!visibleHash.includes(record.uuid)"
                        @click="visibleHash.push(record.uuid, text)"
                      />
                      <a-icon
                        v-else
                        type="eye-invisible"
                        @click="changeVisible(record.uuid)"
                      />
                    </template>
                    <template slot="date" slot-scope="text, record">
                      {{ date(record.exec) }}
                    </template>
                    <template slot="amount" slot-scope="text, record">
                      {{ record.total }} BYN
                    </template>
                    <template slot="product" slot-scope="text, record">
                      {{ (record.resource)
                        ? record.resource.toUpperCase()
                        : record.product.replaceAll('_', ' ').toUpperCase() }}
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
  name: "openInvoice",
  components: { loading },
  data: () => ({
    loading: true,
    visibleHash: [],
    records: null,
    columns: [
      {
        title: 'Instance',
        dataIndex: 'instance',
        scopedSlots: { customRender: 'inst' }
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
      const month = date.getMonth() + 1;
      const day = date.getDate();

      return `${day}.${month}.${year} ${time}`;
    },
    changeVisible(uuid) {
      this.visibleHash = this.visibleHash.filter(
        (el) => el !== uuid
      );
    }
  },
  mounted() {
    const url = `/billing/transactions/${this.$route.params.uuid}`;
    this.$api.get(url)
      .then(({ pool }) => {
        this.records = pool;
        this.loading = false;

        this.columns[1].title = (pool[0].resource) ? 'Resource' : 'Product';
      })
      .catch((err) => {
        this.$router.push("/invoice");
        console.error(err);
      });
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
