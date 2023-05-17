<template>
  <div class="order_wrapper">
		<div class="order">
			<div class="order__inputs order__field">
        <a-collapse style="border-radius: 20px" v-model="activeKey">
          <a-collapse-panel key="base" :header="`${$t('Base')}:`">
            <div class="order_option">
              <a-row class="order__prop" v-for="(value, key) in getProducts.base" :key="key">
                <a-col span="18">{{ (value.meta.edition || value.title) | capitalize }}:</a-col>
                <a-col span="6" style="text-align: right">
                  <a-input-number v-if="!fetchLoading" v-model="config[key]" :min="0" />
                  <div v-else class="loadingLine"></div>
                </a-col>
              </a-row>
            </div>
          </a-collapse-panel>

          <a-collapse-panel key="adv" :header="`${$t('Advanced')}:`">
            <div class="order_option">
              <a-row class="order__prop" v-for="(value, key) in getProducts.adv" :key="key">
                <a-col span="6">{{ value.meta.edition || value.title | capitalize }}:</a-col>
                <a-col span="18" style="text-align: right">
                  <a-input-number v-if="!fetchLoading" v-model="config[key]" :min="0" />
                  <div v-else class="loadingLine"></div>
                </a-col>
              </a-row>
            </div>
          </a-collapse-panel>

          <a-collapse-panel key="personal" style="border-bottom: 0" :header="`${$t('Data')}:`">
            <a-form-item :label="$t('login')">
              <a-input
                v-model="options.login"
                :style="{ boxShadow: (options.login.length < 2) ? '0 0 2px 2px var(--err)' : null }"
              />
              <div style="line-height: 1.5; color: var(--err)" v-if="options.login.length < 2">
                {{ $t('ssl_product.field is required') }}
              </div>
            </a-form-item>

            <a-form-item v-if="user.uuid" :label="$t('clientinfo.password')">
              <password-meter
                :style="{
                  height: (password.length > 0) ? '10px' : '0',
                  marginTop: (password.length < 1) ? '0' : null
                }"
                :password="password"
                @score="(value) => score = value.score"
              />
              <a-input-password class="password" v-model="options.password" />
            </a-form-item>
          </a-collapse-panel>
        </a-collapse>
			</div>

			<div class="order__calculate order__field">
				<a-row type="flex" justify="space-around" style="margin-top: 20px">
					<a-col :xs="10" :sm="6" :lg='12' style="font-size: 1rem">
						{{ $t('Pay period') }}:
					</a-col>

					<a-col :xs="12" :sm="18" :lg='12'>
						<a-select style="width: 100%" v-if="!fetchLoading" v-model="options.period">
							<a-select-option v-for="period in periods" :key="period" :value="period">
								{{ $tc('month', period / 3600 / 24 / 30) }}
							</a-select-option>
						</a-select>
						<div v-else class="loadingLine"></div>
					</a-col>
				</a-row>

        <a-row style="margin-top: 10px" :gutter="[10, 10]">
          <a-col v-if="services.length > 1">
            <a-select style="width: 100%" placeholder="services" v-model="service">
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
            <a-select style="width: 100%" placeholder="namespaces" v-model="namespace">
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
            <a-select style="width: 100%" placeholder="plans" v-model="plan">
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

				<a-divider orientation="left" style="margin-bottom: 0">
					{{ $t('Total') }}:
				</a-divider>

				<a-row type="flex" justify="space-around" style="font-size: 1.5rem">
					<a-col>
						<transition name="textchange" mode="out-in">
							<div v-if="!fetchLoading">
								{{ getProducts.price }} {{ currency.code }}
							</div>
							<div v-else class="loadingLine loadingLine--total"></div>
						</transition>
					</a-col>
				</a-row>

				<a-row type="flex" justify="space-around" style="margin: 10px 0">
					<a-col :span="22">
						<a-button type="primary" block shape="round" @click="orderConfirm">
							{{ $t('order') | capitalize }}
						</a-button>
						<a-modal
							:title="$t('Confirm')"
							:visible="modal.confirmCreate"
							:confirm-loading="sendloading"
							:cancel-text="$t('Cancel')"
							@ok="orderClickHandler"
							@cancel="modal.confirmCreate = false"
						>
							<p>{{ $t('order_services.Do you want to order') }}: {{ getProducts.title }}</p>
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
import passwordMeter from "vue-simple-password-meter";
import addFunds from '@/components/balance/addFunds.vue';

export default {
  name: 'acronis-component',
  components: { addFunds, passwordMeter },
	data:() => ({
    plan: undefined,
    service: undefined,
    namespace: undefined,

    fetchLoading: false,
    sendloading: false,

    options: { login: '', password: '', period: '' },
    modal: { confirmCreate: false, confirmLoading: false },
    addfunds: { visible: false, amount: 0 },

    config: {},
    products: [],
    periods: [],
    activeKey: 'base',
    score: 0
	}),
	methods: {
    changeProducts(plan) {
      const products = [];

      Object.entries(plan.products).forEach(([key, value]) => {
        this.$set(this.config, key, 0);
        products.push(value);
      });

      this.products = plan.products;
      this.plan = plan?.uuid;

      this.periods = [];
      products.forEach(({ period }) => {
        if (this.periods.includes(period)) return;
        this.periods.push(period);
      });
      this.options.period = this.periods[0];
    },
		orderClickHandler() {
      const service = this.services.find(({ uuid }) => uuid === this.service);
      const plan = this.plans.find(({ uuid }) => uuid === this.plan);

      const instances = [{
        config: {
          items,
          first_name: this.user.firstname,
          last_name: this.user.lastname,
          mail: this.user.email,
          login: this.options.login,
          password: this.options.password
        },
        title: this.getProducts.title,
        billing_plan: plan ?? {}
      }];
      const items = { local_storage: 1 };

      Object.entries(this.config).forEach(([key, value]) => {
        const isNA = this.products[key].meta.measurement_unit === 'n/a';

        if (isNA && value > 0) items[key] = 0;
        else if (value > 0) items[key] = value;
      });

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
      const group = info.instances_groups?.find(({ type }) => type === 'acronis');

      if (group) group.instances = [...group.instances, ...instances];
      else if (this.service) info.instances_groups.push(newGroup);

			if (!this.user) {
				this.$store.commit('setOnloginRedirect', this.$route.name);
				this.$store.commit('setOnloginInfo', {
					type: 'Acronis',
					title: 'Acronis',
					cost: this.getProducts.price
				});
				this.$store.dispatch('setOnloginAction', () => {
					this.createAcronis(info);
				});
				this.$router.push({name: 'login'});
				return
			}

			this.createAcronis(info);
		},
		createAcronis(info) {
			this.sendloading = true;
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
                this.$notification.error({ message: error });
              });
            });
          this.$notification.error({ message: this.$t(message) });
          console.error(err);
        });
		},
		orderConfirm() {
			if (Object.values(this.config).every((value) => value === 0)) {
				this.$message.error(this.$t('Please select at least one option'));
				return;
			}
      if (this.score < 4) {
        this.$message.error(this.$t('Weak pass'));
      }

      if (!this.checkBalance()) return;
			this.modal.confirmCreate = true;
		},
    checkBalance() {
      const sum = this.getProducts.price;

      if (this.user.balance < parseFloat(sum)) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance'),
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
          this.$notification.success({ message: this.$t('Done') });
          this.$router.push({ path: '/services' });
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$notification.error({ message: this.$t(message) });
        })
        .finally(() => this.sendloading = false);
    },
	},
	computed: {
		getProducts() {
			if (Object.keys(this.products).length === 0) return "NAN";
      const title = [];
      const base = {};
      const adv = {};
      let price = 0;

      Object.entries(this.config).forEach(([key, value]) => {
        const product = this.products[key];

        if (key.includes('_adv_') && key !== 'local_storage') adv[key] = product;
        else if (key !== 'local_storage') base[key] = product;

        if (value === 0) return;
        title.push(`${product.meta.edition ?? product.title}: ${value}`);
        price += product.price * value;
      });

      return { title: title.join(', '), price, base, adv };
		},
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    currency() {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency'];

      return { code: this.user.currency_code ?? defaultCurrency };
    },
    services() {
      return this.$store.getters['nocloud/vms/getServices']
        .filter((el) => el.status !== 'DEL');
    },
    namespaces() {
      return this.$store.getters['nocloud/namespaces/getNameSpaces'] ?? [];
    },
    plans() {
      return this.$store.getters['nocloud/plans/getPlans']
        .filter(({ type }) => type === 'acronis');
    },
    sp() {
      return this.$store.getters['nocloud/sp/getSP']
        .find((sp) => sp.type === 'acronis');
    },
    isLoading() {
      return this.$store.getters['nocloud/plans/isLoading'];
    },
    rules() {
      const message = this.$t('ssl_product.field is required');

      return { req: [{ required: true, message }] };
    }
	},
  watch: {
    services(value) {
      if (value.length === 1) this.service = value[0]?.uuid;
    },
    namespaces(value) { this.namespace = value[0]?.uuid },
		plans(value) { this.plan = value[0]?.uuid },
    plan(value) {
      const plan = this.plans.find(({ uuid }) => uuid === value);

      this.config = {};
      this.changeProducts(plan);
    }
  },
	created() {
    const promises = [
      this.$store.dispatch('nocloud/auth/fetchBillingData'),
      this.$store.dispatch('nocloud/sp/fetch'),
      this.$store.dispatch('nocloud/plans/fetch'),
      this.$store.dispatch('nocloud/namespaces/fetch'),
      this.$store.dispatch('nocloud/vms/fetch')
    ];

    Promise.all(promises).catch((err) => {
      const message = err.response?.data?.message ?? err.message ?? err;

      this.$notification.error({ message: this.$t(message) });
      console.error(err);
    });

    if (this.$store.getters['nocloud/auth/currencies'].length < 1) {
      this.$store.dispatch('nocloud/auth/fetchCurrencies');
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

.order .ant-slider-mark-text {
  white-space: nowrap;
}

.order .ant-slider-mark-text:first-of-type {
  transform: translateX(-10px) !important;
}

.order .ant-slider-mark-text:last-of-type {
  transform: translateX(calc(-100% + 10px)) !important;
}

.product__specs{
	--color: rgb(126, 126, 126);
	color: var(--color);
	margin: 0 auto;
	--border-color: #dbdbdb;
	--border-line-weight: 1px;
	--border-line-type: solid;
	width: 80%;
	font-size: 1.2rem;
}

.product__specs td{
	padding: 10px 20px;
	position: relative;
}

.product__specs td:nth-child(1){
	font-weight: 500;
}

.product__specs td:nth-child(2){
	text-align: right;
	color: rgba(0, 0, 0, .7)
}

.product__specs tr{
	border-bottom: var(--border-line-weight) var(--border-line-type) var(--border-color);
}

.product__specs td:last-child::before{
	content: '';
	width: 2px;
	height: 50%;
	background: #f5f5f5;
	display: block;
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
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
	background-color: #fff;
	height: max-content;
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

.specs-enter-active,
.specs-leave-active {
  transition: all .15s ease;
}

.specs-enter{
  transform: translateX(-1em);
  opacity: 0;
}

.specs-leave-to{
  transform: translateX(1em);
  opacity: 0;
}


.textchange-enter-active,
.textchange-leave-active {
  transition: all .15s ease;
}

.textchange-enter{
  transform: translateY(-0.5em);
  opacity: 0;
}

.textchange-leave-to{
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
