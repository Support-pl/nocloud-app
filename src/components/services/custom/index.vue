<template>
	<div class="order_wrapper">
		<div class="order">
			<div class="order__inputs order__field">
				<div class="order__option">
					<div class="order__slider" v-if="sizes.length < 5 && !fetchLoading">
            <div
              class="order__slider-item"
              v-for="size of sizes"
              :key="size.key"
              :class="{ 'order__slider-item--active': options.size === size.key }"
              @click="options.size = size.key"
            >
              <span class="order__slider-name" :title="size.label">
                <img class="img_prod" :src="products[size.key].meta.image ?? '/'" :alt="size.key" @error="onError">
                {{ size.label }}
              </span>
            </div>
          </div>

					<a-carousel
            v-else
            arrows
            draggable
            :dots="false"
            :slides-to-show="3"
            :slides-to-scroll="1"
          >
            <template v-if="!fetchLoading">
              <div
                class="order__slider-item"
                v-for="size of sizes"
                :key="size.key"
                :class="{ 'order__slider-item--active': options.size === size.key }"
                @click="options.size = size.key"
              >
                <span class="order__slider-name" :title="size.label">
                  <img class="img_prod" :src="products[size.key].meta.image ?? '/'" :alt="size.key" @error="onError">
                  {{ size.label }}
                </span>
              </div>
            </template>

            <template v-else>
              <div class="order__slider-item">
                <div class="loadingLine loadingLine--image"></div>
                <div class="loadingLine"></div>
              </div>
              <div class="order__slider-item">
                <div class="loadingLine loadingLine--image"></div>
                <div class="loadingLine"></div>
              </div>
              <div class="order__slider-item">
                <div class="loadingLine loadingLine--image"></div>
                <div class="loadingLine"></div>
              </div>
            </template>

            <template #prevArrow>
              <div class="custom-slick-arrow" style="left: -35px;">
                <a-icon type="left-circle" />
              </div>
            </template>

            <template #nextArrow>
              <div class="custom-slick-arrow" style="right: -35px">
                <a-icon type="right-circle" />
              </div>
            </template>
          </a-carousel>

          <transition name="specs" mode="out-in">
            <div
              v-if="typeof getProducts.meta?.description === 'string'"
              v-html="getProducts.meta?.description"
            ></div>
            <table v-else-if="getProducts.meta?.description" class="product__specs">
              <tr v-for="resource in getProducts.meta?.description" :key="resource.name">
                <td>{{ resource.name }}</td>
                <td>{{ resource.value }}</td>
              </tr>
            </table>
          </transition>
				</div>
			</div>

			<div class="order__calculate order__field">
				<a-row type="flex" justify="space-around" style="margin-top: 20px">
					<a-col :xs="10" :sm="6" :lg='12' style="font-size: 1rem">
						{{ $t('Pay period') }}:
					</a-col>

					<a-col :xs="12" :sm="18" :lg='12'>
						<a-select v-if="!fetchLoading" v-model="options.period"  style="width: 100%">
							<a-select-option v-for="period in periods" :key="period" :value="period">
								{{ $tc('month', period / 3600 / 24 / 30) }}
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
              v-model="service"
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
              v-model="namespace"
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
              v-model="plan"
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
							{{ $t("order") | capitalize }}
						</a-button>
						<a-modal
							:title="$t('Confirm')"
							:visible="modal.confirmCreate"
							:confirm-loading="sendloading"
							:cancel-text="$t('Cancel')"
							@ok="orderClickHandler"
							@cancel="() => {modal.confirmCreate = false}"
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
import addFunds from '@/components/balance/addFunds.vue';

export default {
  name: 'custom-component',
  components: { addFunds },
	data:() => ({
    plan: null,
    service: null,
    namespace: null,

    fetchLoading: false,
    sendloading: false,

    options: { size: '', period: '' },
    modal: { confirmCreate: false, confirmLoading: false },
    addfunds: { visible: false, amount: 0 },

    products: {},
    sizes: [],
    periods: []
	}),
	methods: {
    changeProducts(plan) {
      this.products = plan.products ?? {};
      this.plan = plan?.uuid;

      this.sizes = Object.entries(plan.products ?? {}).map(
        ([key, value]) => ({ key, label: value.title })
      );
      this.options.size = this.sizes[0]?.key ?? '';
      this.periods = [];

      Object.values(this.products).forEach(({ period }) => {
        if (this.periods.includes(period)) return;
        this.periods.push(period);
      });
      this.options.period = this.periods[0];
    },
		orderClickHandler() {
      const service = this.services.find(({ uuid }) => uuid === this.service);
      const plan = this.plans.find(({ uuid }) => uuid === this.plan);

      const instances = [{
        config: {},
        title: this.getProducts.title,
        billing_plan: plan ?? {}
      }];
      const newGroup = {
        title: this.user.fullname + Date.now(),
        type: this.sp.type,
        sp: this.sp.uuid,
        instances
      };

      if (plan.kind === 'STATIC') instances[0].product = this.options.size;
      else instances[0].config = {
        product: this.options.size,
        period: +this.options.period
      };

      const info = (!this.service) ? newGroup : Object.assign(
        { instances_groups: service.instancesGroups },
        { ...service }
      );
      const group = info.instances_groups?.find(({ type }) => type === 'virtual');

      if (group) group.instances = [...group.instances, ...instances];
      else if (this.service) info.instances_groups.push(newGroup);

			if (!this.user) {
				this.$store.commit('setOnloginRedirect', this.$route.name);
				this.$store.commit('setOnloginInfo', {
					type: 'Custom',
					title: 'Custom',
					cost: this.getProducts.price
				});
				this.$store.dispatch('setOnloginAction', () => {
					this.createVirtual(info);
				});
				this.$router.push({name: 'login'});
				return
			}

			this.createVirtual(info);
		},
		createVirtual(info) {
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
    onError({ target }) {
      target.src = '/img/OS/default.png';
    }
	},
	computed: {
		getProducts() {
			if (Object.keys(this.products).length === 0) return "NAN";
      const product = this.products[this.options.size];

			return product;
		},
    isLogged() {
      return this.$store.getters['nocloud/auth/isLoggedIn'];
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
        .filter(({ type }) => type === 'virtual');
    },
    sp() {
      return this.$store.getters['nocloud/sp/getSP']
        .find((sp) => sp.type === 'virtual');
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
    namespaces(value) { this.namespace = value[0]?.uuid },
    services(value) { this.service = value[0]?.uuid },
		plans(value) { this.plan = value[0]?.uuid },
    plan(value) {
      const plan = this.plans.find(({ uuid }) => uuid === value);

      this.changeProducts(plan);
    }
  },
	created() {
    this.fetchLoading = true;
    const promises = [
      this.$store.dispatch('nocloud/auth/fetchBillingData'),
      this.$store.dispatch('nocloud/sp/fetch', !this.isLogged),
      this.$store.dispatch('nocloud/plans/fetch', { anonimously: !this.isLogged }),
      this.$store.dispatch('nocloud/namespaces/fetch'),
      this.$store.dispatch('nocloud/vms/fetch')
    ];

    Promise.all(promises).catch((err) => {
      const message = err.response?.data?.message ?? err.message ?? err;

      this.$notification.error({ message: this.$t(message) });
      console.error(err);
    })
    .finally(() => {
      this.fetchLoading = false;
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

.order__option div > .img_prod {
  display: block;
  max-width: 200px;
  margin: 0 auto 10px;
}

.order__option .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.order__option .order__slider-name img {
  max-height: 65px;
}

.order__option .ant-carousel {
  width: calc(100% - 50px);
  margin: 0 auto 5px;
}

.order__option .ant-carousel .slick-track {
  display: flex;
  align-items: center;
}

.order__option .ant-carousel .slick-slide > div {
  height: 137px;
  margin: 0 5px;
}

.order__option .ant-carousel .custom-slick-arrow {
  width: 25px;
  height: 25px;
  font-size: 25px;
  color: var(--main);
  opacity: 0.5;
  transition: 0.3s;
}
.order__option .ant-carousel .custom-slick-arrow::before {
  display: none;
}
.order__option .ant-carousel .custom-slick-arrow:hover {
  opacity: 1;
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
  justify-content: space-evenly;
  margin-bottom: 10px;
	overflow-x: auto;
}

.order__slider-item:not(:last-child){
	margin-right: 10px;
}

.order__slider-item{
	flex-shrink: 0;
	/* border: 1px solid rgba(0, 0, 0, .15); */
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
	height: 100%;
  padding: 7px 10px;
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

.loadingLine--image{
  min-width: 60px;
  width: 60px;
  height: 60px;
  margin: auto;
  margin-bottom: 15px;
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