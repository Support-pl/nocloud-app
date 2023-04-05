<template>
	<div class="order_wrapper">
		<div class="order">
			<div class="order__inputs order__field">

				<div class="order_option">
          <a-steps class="order__steps" size="small" :current="currentStep">
            <a-step :title="$t('ssl_product.product')" />
            <a-step :title="$t('ssl_product.CSR')" />
            <a-step :title="$t('ssl_product.personal data')" />
            <a-step :title="$t('ssl_product.verification')" />
          </a-steps>

          <component
            :is="template"
            :csr="csr"
            :personal="personal"
            :personal_back="personal"
            :product_info="getProducts"
            :verification_back="verification"
            @handleClickNext="handleClickNext"
            @handleClickPrev="handleClickPrev"
            @getVerification="(data) => verification = data"
          />

          <template v-if="currentStep === 0">
            <a-row class="order__prop" style="margin-bottom: 5px">
              <a-col span="8" :xs="6">{{$t('provider') | capitalize}}:</a-col>
            </a-row>

            <div class="order__slider">
              <template v-if="!fetchLoading">
                <div
                  class="order__slider-item"
                  v-for="provider of Object.keys(products)"
                  :key="provider"
                  :class="{'order__slider-item--active': options.provider == provider}"
                  @click="() => options.provider = provider"
                >
                  {{ provider }}
                </div>
              </template>
              <template v-else>
                <div
                  class="order__slider-item order__slider-item--loading"
                  v-for="(provider, index) of Array(4)"
                  :key="index"
                >
                </div>
              </template>
            </div>

            <a-row class="order__prop">
              <a-col span="8" :xs="6">{{$t('product_name') | capitalize}}:</a-col>
              <a-col span="16" :xs="18">
                <a-select v-if="!fetchLoading" v-model="options.tarif" style="width: 100%">
                  <a-select-option v-for="kind of products[options.provider]" :value="kind.product" :key="kind.product">{{kind.product}}</a-select-option>
                </a-select>
                <div v-else class="loadingLine"></div>
              </a-col>
            </a-row>

            <a-row class="order__prop">
              <a-col span="8" :xs="6">{{$t('ssl_product.domain') }}:</a-col>
              <a-col span="16" :xs="18">
                <a-input v-if="!fetchLoading" v-model="options.domain" placeholder="example.com"></a-input>
                <div v-else class="loadingLine"></div>
              </a-col>
            </a-row>

            <a-row class="order__prop">
              <a-col span="24">
                <router-link :to="{ name: 'csr' }">
                  <a-button type="primary" :disabled="true">
                    {{ $t("ssl_product.generate") }} CSR
                  </a-button>
                </router-link>
                <a-button type="primary" style="margin-left: 10px" @click="handleClickNext">
                  {{ $t("ssl_product.continue") }} <a-icon type="right" />
                </a-button>
              </a-col>
            </a-row>
          </template>
        </div>
      </div>

      <div class="order__calculate order__field">

        <a-row type="flex" justify="space-around" style="margin-top: 20px">
          <a-col :xs="10" :sm="6" :lg='12' style="font-size: 1rem">
            {{$t('Payment period')}}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg='12'>
            <a-select v-if="!fetchLoading" v-model="options.period"  style="width: 100%">
              <a-select-option v-for="period in periods" :key="period.title+period.count" :value='period'>
                {{ $tc('month', period) }}
              </a-select-option>
            </a-select>
            <div v-else class="loadingLine"></div>
          </a-col>
        </a-row>

        <a-row :gutter="[10, 10]" style="margin-top: 10px">
          <a-col v-if="services.length > 1">
            <a-select
              style="width: 100%"
              placeholder="services"
              @change="(value) => service = value"
            >
              <a-select-option
                v-for="service of services"
                :key="service.uuid"
                :value="service.uuid"
              >
                {{ service.title }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col v-if="namespaces.length > 1">
            <a-select
              style="width: 100%"
              placeholder="namespaces"
              @change="(value) => namespace = value"
            >
              <a-select-option
                v-for="namespace of namespaces"
                :key="namespace.uuid"
                :value="namespace.uuid"
              >
                {{ namespace.title }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col v-if="plans.length > 1">
            <a-select
              style="width: 100%"
              placeholder="plans"
              @change="(value) => plan = value"
            >
              <a-select-option
                v-for="plan of plans"
                :key="plan.uuid"
                :value="plan.uuid"
              >
                {{ plan.title }}
              </a-select-option>
            </a-select>
          </a-col>
        </a-row>

        <a-divider orientation="left" :style="{'margin-bottom': '0'}">
          {{$t('Total')}}:
        </a-divider>

        <a-row type="flex" justify="space-around" :style="{'font-size': '1.5rem'}">
          <a-col v-if="getProducts.prices">
            <template v-if="!fetchLoading">
              {{ getProducts.prices[options.period] }} {{ currency.code }}
            </template>
            <div v-else class="loadingLine loadingLine--total"></div>
          </a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin-top: 24px; margin-bottom: 10px">
          <a-col :span="22">
            <a-button type="primary" block shape="round" :disabled="currentStep !== 3" @click="orderConfirm">
              {{$t("order") | capitalize}}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :visible="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="() => { modal.confirmCreate = false }"
            >
              <p>{{ $t('order_services.Do you want to order') }}: {{ getProducts.product }}</p>
            </a-modal>
          </a-col>
        </a-row>

      <add-funds
        v-if="addfunds.visible"
        :sum="addfunds.amount"
        :modalVisible="addfunds.visible"
        :hideModal="() => addfunds.visible = false"
      />
			</div>
		</div>
	</div>
</template>

<script>
import passwordMeter from 'vue-simple-password-meter';
import addFunds from '@/components/balance/addFunds.vue';
import notification from '@/mixins/notification.js';
import { countries } from '@/setup/countries.js';

export default {
	name: 'ssl-component',
  mixins: [notification],
  components: { passwordMeter, addFunds },
	data: () => ({
    countries,
    products: {},
    currentStep: 0,
    plan: null,
    service: null,
    namespace: null,
    fetchLoading: false,

    options: {
      provider: '',
      tarif: '',
      domain: '',
      period: ''
    },
    modal: {
      confirmCreate: false,
      confirmLoading: false
    },
    addfunds: { visible: false, amount: 0 },

    csr: {},
    personal: {},
    verification: {}
	}),
	methods: {
		fetch(){
      this.fetchLoading = true;
			this.$api.post(`/sp/${this.sp.uuid}/invoke`, {
        method: 'get_certificate'
      })
			.then(({ meta }) => {
        const plan = this.plans.find(({ uuid }) => uuid === this.plan);

				meta.cert.products.forEach((product) => {
          const prices = {};

          Object.keys(product.prices).forEach((period) => {
            const key = `${period} ${product.id}`;

            if (plan.products[key]) prices[period] = plan.products[key].price;
          });

          if (Object.keys(prices).length > 0) {
            if (!(product.brand in this.products)) {
              this.products[product.brand] = [];
            }
            this.products[product.brand].push({ ...product, prices });
          }
        });

				this.options.provider = Object.keys(this.products)[0];
				this.options.tarif = this.products[this.options.provider][0].product;
        this.products = Object.assign({}, this.products);
			})
			.catch(err => console.error(err))
			.finally(() => {
				this.fetchLoading = false;
			})
		},
		orderClickHandler(){
			const service = this.services.find(({ uuid }) => uuid === this.service);
      const plan = this.plans.find(({ uuid }) => uuid === this.plan);

      const instances = [{
        resources: {
          id: this.getProducts.id,
          user: this.personal,
          domain: this.options.domain,
          period: this.options.period,
          csr: this.csr.csr,
          dcv: this.verification.dcv,
          approver_email: this.verification.email
        },
        title: this.options.tarif,
        billing_plan: plan ?? {}
      }];
      const newGroup = {
        title: this.user.fullname + Date.now(),
        type: this.sp.type,
        sp: this.sp.uuid,
        instances
      };

      const info = (!this.service) ? newGroup : Object.assign(
        { instances_groups: service.instancesGroups },
        { ...service }
      );
      const group = info.instances_groups?.find(({ type }) => type === 'goget');

      if (group) group.instances = [...group.instances, ...instances];
      else if (this.service) info.instances_groups.push(newGroup);

			if (!this.user) {
				this.$store.commit('setOnloginRedirect', this.$route.name);
				this.$store.commit('setOnloginInfo', {
					type: 'SSL',
					title: 'SSL Certificate',
					cost: this.getProducts.prices[this.options.period]
				});
				this.$store.dispatch('setOnloginAction', () => {
					this.createSSL(info);
				});
				this.$router.push({name: 'login'});
				return
			}

      this.createSSL(info);
		},
		createSSL(info){
			this.modal.confirmLoading = true;
			const action = (this.service) ? 'update' : 'create';
      const orderData = (this.service) ? info : {
        namespace: this.namespace,
        service: {
          title: this.user.fullname,
          context: {},
          version: '1',
          instances_groups: [info]
        }
      };

      delete orderData.instancesGroups;
      this.$store.dispatch(`nocloud/vms/${action}Service`, orderData)
        .then(({ uuid }) => { this.deployService(uuid) })
        .catch((err) => {
          const config = { namespace: this.namespace, service: orderData };
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$api.services.testConfig(config)
            .then(({ result, errors }) => {
              if (!result) errors.forEach(({ error }) => {
                this.openNotificationWithIcon('error', { message: error });
              });
            });
          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          });
          console.error(err);
        });
		},
		orderConfirm(order = true) {
      const isValid = this.options.domain.match(/.+\..+/);

			if (!isValid) {
				this.$message.error('domain is wrong');
				return
			}
      if (!this.checkBalance()) return;
			if (order) this.modal.confirmCreate = true;

      return isValid;
		},
    checkBalance() {
      const sum = this.getProducts.prices[this.options.period];

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
    deployService(uuid) {
      this.$api.services.up(uuid)
        .then(() => {
          this.openNotificationWithIcon('success', {
            message: this.$t('SSL created successfully')
          });
          this.$router.push({ path: '/services' });
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          });
        })
        .finally(() => this.modal.confirmLoading = false);
    },
    handleClickPrev(data) {
      if (data.csr) {
        this.csr = data;
      } else if (data.firstname) {
        this.personal = data;
      } else if (data.dcv) {
        this.verification = data;
      }
      this.currentStep--;
    },
    handleClickNext(data) {
      if (data.csr) {
        this.csr = data;
      } else if (data.firstname) {
        this.personal = data;
      }

      if (this.orderConfirm(false)) {
        this.currentStep++;
      }
    }
	},
	computed: {
		getProducts() {
			if (Object.keys(this.products).length === 0) return "NAN";
      return this.products[this.options.provider]
        .find(el => el.product === this.options.tarif);
		},
    template() {
      switch (this.currentStep) {
        case 1:
          return () => import('@/components/services/ssl/csr.vue');
        case 2:
          return () => import('@/components/services/ssl/personal.vue');
        case 3:
          return () => import('@/components/services/ssl/verification.vue')
      }
    },
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    isLoggedIn() {
      return this.$store.getters['nocloud/auth/isLoggedIn'];
    },
    currency() {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency'];

      return { code: this.user.currency_code ?? defaultCurrency };
    },
    sp() {
      return this.$store.getters['nocloud/sp/getSP']
        .find(({ type }) => type === 'goget');
    },
    periods() {
      return Object.keys(this.getProducts.prices || {})
        .filter((el) => isFinite(+el));
    },
    services() {
      return this.$store.getters['nocloud/vms/getServices']
        .filter((el) => el.status !== 'DEL');
    },
    namespaces() {
      return this.$store.getters['nocloud/namespaces/getNamespaces'] ?? [];
    },
    plans() {
      return this.$store.getters['nocloud/plans/getPlans']
        .filter(({ type }) => type === 'goget');
    }
	},
	created() {
    this.$store.dispatch('nocloud/auth/fetchBillingData');
    this.$store.dispatch('nocloud/sp/fetch').then(() => this.fetch());
    this.$store.dispatch('nocloud/plans/fetch')
      .then(() => {
        if (this.plans.length === 1) this.plan = this.plans[0].uuid;
      })
      .catch((err) => {
        const message = err.response?.data?.message ?? err.message ?? err;

        this.openNotificationWithIcon('error', {
          message: this.$t(message)
        });
        console.error(err);
      });

    this.$store.dispatch('nocloud/namespaces/fetch')
      .then(({ pool }) => {
        if (pool.length === 1) this.namespace = pool[0].uuid;
      })
      .catch((err) => {
        const message = err.response?.data?.message ?? err.message ?? err;

        this.openNotificationWithIcon('error', {
          message: this.$t(message)
        });
        console.error(err);
      });

    this.$store.dispatch('nocloud/vms/fetch')
      .then(() => {
        if (this.services.length === 1) this.service = this.services[0].uuid;
      })
      .catch((err) => {
        const message = err.response?.data?.message ?? err.message ?? err;

        this.openNotificationWithIcon('error', {
          message: this.$t(message)
        });
        console.error(err);
      });

    if (this.$store.getters['nocloud/auth/currencies'].length < 1) {
      this.$store.dispatch('nocloud/auth/fetchCurrencies', { anonymously: !this.isLoggedIn });
    }
	},
	watch: {
		'options.provider'(value) {
			this.options.tarif = this.products[value][0].product;
		},
    periods(value) {
      this.options.period = value[0];
    },
    currentStep(value) {
      if (value === 1) this.csr.domain = this.options.domain;
    }
	}
}
</script>

<style>
.order_wrapper{
	position: relative;
	width: 100%;
	min-height: 100%;
}

.order{
	position: absolute;
	margin-top: 15px;
	margin-bottom: 15px;
	width: 100%;
	max-width: 1024px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
}

.order__prop:not(:first-child){
	margin-top: 15px;
}

.order__inputs{
	margin-right: 20px;
	width: 72%;
}

.order__field{
	border-radius: 20px;
	box-shadow:
		5px 8px 10px rgba(0, 0, 0, .08),
		0px 0px 12px rgba(0, 0, 0, .05);
	padding: 20px;
	background-color: #fff;
	height: max-content;
}

.order__steps > .ant-steps-item {
  flex: 1 1 auto;
}

.order__steps > .ant-steps-item:last-child {
  flex: none;
}

.order__calculate{
	width: 28%;
	font-size: 1.1rem;
	padding: 10px 15px 10px;
}

.order__field-header{
	text-align: center;
	font-size: 1.2rem;
	font-weight: bold;
	margin-bottom: 20px;
}

.order__template{
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-start;
}

.order__template.one-line{
	flex-wrap: nowrap;
	justify-content: space-between;
}

.order__template-item{
	width: 116px;
	margin-bottom: 10px;
	background-color: #fff;
	box-shadow:
		3px 2px 6px rgba(0, 0, 0, .08),
		0px 0px 8px rgba(0, 0, 0, .05);
	border-radius: 15px;
	transition: box-shadow .2s ease, transform .2s ease;
	cursor: pointer;
	text-align: center;
	overflow: hidden;

	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: max-content auto;
}

.order__template-item:not(:last-child){
	margin-right: 10px;
}

.order__template-item:hover{
	box-shadow:
		5px 8px 10px rgba(0, 0, 0, .08),
		0px 0px 12px rgba(0, 0, 0, .05);
}

.order__template-item.active{
	box-shadow:
		5px 8px 12px rgba(0, 0, 0, .08),
		0px 0px 13px rgba(0, 0, 0, .05);
	transform: scale(1.02);
}

.order__template-image{
	padding: 10px;
}

.order__template-image__rate{
	font-size: 2rem;
}

.order__template-name{
	padding: 10px;
}

.order__template-item.active .order__template-name{
	background-color: var(--main);
	color: var(--bright_font);
}

.max-width{
	width: 100%;
}

.ant-collapse-item:last-of-type .ant-collapse-content{
	border-radius: 0 0 28px 28px;
}

.slider_btn{
	cursor: pointer;
}

.removeMarginSkeleton .ant-skeleton-title{
	margin: 0;
	margin-top: 4px;
}

.removeMarginSkeleton{
	min-width: 75px;
}

.total.removeMarginSkeleton{
	width: 100%;
}

.order__slider{
	display: flex;
	overflow-x: auto;
  padding-bottom: 10px;
}

.order__slider-item:not(:last-child){
	margin-right: 10px;
}

.order__slider-item{
	flex-shrink: 0;
	/* border: 1px solid rgba(0, 0, 0, .15); */
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
	display: flex;
	justify-content: center;
	align-items: center;
	width: 150px;
	height: 70px;
	cursor: pointer;
	border-radius: 15px;
	font-size: 1.1rem;
	transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover{
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active{
	background-color: var(--main);
	color: #fff;
}


.order__slider-item--loading{
	/* background-color: #f2f2f2; */
	box-shadow: none;
	/* animation: glowing .5s ease infinite; */
	animation-name: glowing;
	animation-duration: 1s;
	animation-timing-function: ease;
	animation-iteration-count: infinite;
	animation-direction: alternate;
}

.loadingLine{
	min-width: 100px;
	width: 100%;
	height: 2rem;
	border-radius: 4px;
	animation-name: glowing;
	animation-duration: 1s;
	animation-timing-function: ease;
	animation-iteration-count: infinite;
	animation-direction: alternate;
}

.loadingLine--total{
	margin-top: 10px;
	height: 26px;
}

@keyframes glowing {
	from {
		background-color: #f2f2f2;
	}
	to {
		background-color: #e9e9e9;
		/* background-color: red; */
	}
}

@media screen and (max-width: 1024px) {
	.order{
		flex-direction: column;
		padding: 10px;
		margin-top: 0px;
		overflow: auto;
	}
	.order__inputs{
		margin: 0;
		border-radius: 20px 20px 0 0;
		width: auto;
	}
	.order__field{
		box-shadow: none;
		flex-grow: 0;
	}
	.order__calculate{
		border-radius: 0 0 20px 20px;
		width: auto;
	}
}

@media screen and (max-width: 576px) {
	.order__template{
		flex-direction: column;
		flex-wrap: nowrap;
		align-items: stretch;
	}
	.order__template-item{
		grid-template-columns: max-content auto;
		grid-template-rows: 1fr;
		width: auto;
		height: 50px;
	}
	.order__template-item:not(:last-child){
		margin-right: 0px;
	}
	.order__template-image{
		width: 50px;
		height: 50px;
		padding: 4px;
	}
	.order__template-image__rate{
		line-height: 42px;
		font-size: 1.4rem;
	}
	.order__template-image img{
		object-fit: contain;
		width: 100%;
		height: 100%;
	}
	.order__template-name{
		text-align: left;
		line-height: 30px;
		display: flex;
	}
	.order__template-type{
		width: 56px;
	}
	.order__template-name ul{
		display: flex;
		justify-content: space-around;
		list-style: none;
		flex: 1
	}
	.order__template-name ul li{
		margin-left: 20px;
	}
}

.networkApear-enter-active, .networkApear-leave-active {
	transition: opacity .5s, height .5s;
	height: 26px;
}
.networkApear-enter, .networkApear-leave-to {
	opacity: 0;
	height: 0;
}
</style>
