<template>
	<div class="order_wrapper">
		<div class="order">
			<div class="order__inputs order__field">
				<div class="order__option">
          <div class="order__product" v-if="$route.query.product">
            <div class="order__product-name" v-html="getProducts.name" />
          </div>

          <div v-else class="order__grid">
            <template v-if="!fetchLoading">
              <div
                class="order__slider-item"
                v-for="size of sizes"
                :key="size"
                :class="{ 'order__slider-item--active': options.size === size }"
                @click="options.size = size"
              >
                <span class="order__slider-name" v-html="size" :title="size.split('> ').at(-1)"></span>
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
          </div>

          <template v-if="$route.query.product">
            <transition name="specs" mode="out-in">
              <div
                v-if="typeof getProducts.description === 'string'"
                v-html="getProducts.description"
              ></div>
              <table v-else-if="getProducts.description" class="product__specs">
                <tr v-for="resource in getProducts.description" :key="resource.name">
                  <td>{{ resource.name }}</td>
                  <td>{{ resource.value }}</td>
                </tr>
              </table>
            </transition>

            <a-card
              style="margin-top: 15px"
              v-if="fetchLoading || addons[getProducts.id] && addons[getProducts.id].length > 0"
              :title="`${$t('Addons')} (${$t('choose addons you want')})`"
              :loading="fetchLoading"
            >
              <div v-if="fetchLoading">Loading...</div>
              <a-card-grid
                v-else
                class="card-item"
                v-for="addon of addons[getProducts.id]"
                :key="addon.id"
                @click="changeAddons(addon.id)"
              >
                <div class="order__slider-name" style="grid-template-columns: 1fr auto">
                  <span style="font-weight: 700; font-size: 16px" v-html="addon.name"></span>
                  <a-checkbox :checked="options.addons.includes(addon.id)" />
                  <span style="grid-column: 1 / 3" v-html="addon.description"></span>
                </div>
              </a-card-grid>
            </a-card>
          </template>
				</div>
			</div>

			<div class="order__calculate order__field">
        <a-row style="margin-top: 20px" type="flex" justify="space-around" align="middle">
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t('Payment method') | capitalize }}:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12">
            <a-select style="width: 100%" v-if="!fetchLoading" v-model="options.payment">
              <a-select-option
                v-for="method of payMethods"
                :key="method.module"
                :value="method.module"
              >
                {{ method.displayname }}
              </a-select-option>
            </a-select>
            <div v-else class="loadingLine"></div>
          </a-col>
        </a-row>

				<a-row
          style="margin-top: 20px"
          type="flex"
          justify="space-around"
          align="middle"
          v-if="fetchLoading || periods.length > 0"
        >
					<a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
						{{ $t('Pay period') }}:
					</a-col>

					<a-col :xs="12" :sm="18" :lg="12">
						<a-select style="width: 100%" v-if="!fetchLoading && periods.length > 1" v-model="options.period">
							<a-select-option v-for="period in periods" :key="period" :value='period'>
								{{ $t(period) }}
							</a-select-option>
						</a-select>
            <div style="text-align: right" v-else-if="periods.length === 1">
              {{ $t(periods[0]) }}
            </div>
						<div v-else class="loadingLine"></div>
					</a-col>
				</a-row>

        <a-row
          style="margin-top: 20px"
          type="flex"
          justify="space-around"
          align="middle"
          v-if="addonsPrice.onetime > 0 || getProducts.paytype === 'onetype'"
        >
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t('one time payment') | capitalize }}:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12">
            <div v-if="!fetchLoading" style="text-align: right">
              {{ addonsPrice.onetime + (+getProducts.price.value || 0) }}
              {{ getProducts.price.currency }}
            </div>
            <div v-else class="loadingLine"></div>
          </a-col>
        </a-row>

        <a-row
          style="margin-top: 20px"
          type="flex"
          justify="space-around"
          align="middle"
          v-if="addonsPrice.value > 0 || getProducts.paytype === 'recurring'"
        >
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t('recurring payment') | capitalize }}:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12">
            <div v-if="!fetchLoading" style="text-align: right">
              {{ addonsPrice.value + (+getProducts.price[options.period] || 0) }}
              {{ getProducts.price.currency }}
            </div>
            <div v-else class="loadingLine"></div>
          </a-col>
        </a-row>

				<a-divider orientation="left" style="margin-bottom: 0">
					{{ $t('Total') }}:
				</a-divider>

				<a-row type="flex" justify="space-around" style="font-size: 1.5rem">
					<a-col>
						<transition name="textchange" mode="out-in">
							<div v-if="!fetchLoading">
								{{ (+getProducts.price[options.period] || getProducts.price.value) + addonsPrice.total }}
                {{ getProducts.price.currency }}
							</div>
							<div v-else class="loadingLine loadingLine--total"></div>
						</transition>
					</a-col>
				</a-row>

				<a-row type="flex" justify="space-around" style="margin: 10px 0">
					<a-col :span="22">
						<a-button type="primary" block shape="round" @click="orderConfirm">
							{{ $t(($route.query.product) ? 'order' : 'next') | capitalize }}
						</a-button>
						<a-modal
							:title="$t('Confirm')"
							:visible="modal.confirmCreate"
							:confirm-loading="modal.confirmLoading"
							:cancel-text="$t('Cancel')"
							@ok="orderClickHandler"
							@cancel="() => {modal.confirmCreate = false}"
						>
							<p>{{ $t('order_services.Do you want to order') }}: {{ getProducts['name']?.split('"> ').at(-1) }}</p>

							<a-row style="margin-top: 20px">
								<a-col>
									<a-checkbox :checked="modal.goToInvoice" @change="(e) => modal.goToInvoice = e.target.checked" />
                  {{ $t('go to invoice') | capitalize }}
								</a-col>
							</a-row>
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
  name: 'iaas-component',
  components: { addFunds },
	data:() => ({
    sizes: [],
    products: [],
    payMethods: [],
    fetchLoading: false,
    options: { size: '', payment: '', period: '', addons: [] },
    modal: {
      confirmCreate: false,
      confirmLoading: false,
      goToInvoice: true
    },
    addfunds: { visible: false, amount: 0 },
    addons: {},
    periods: [],
    currencies: []
	}),
	methods: {
		fetch(){
			this.fetchLoading = true;
			this.$store.dispatch('products/fetchServices')
        .then((res) => {
          const { prod } = Object.values(res).find(({ group_name }) =>
            group_name === this.$route.query.service
          );

          this.products = prod.sort((a, b) => b.name - a.name);
          this.products.forEach(({ description }, i) => {
            const desc = description.replace('/templates', `${this.$config.WHMCSsiteurl}$&`);
            const start = desc.indexOf('<img');
            const end = desc.indexOf('">', start);
            const image = desc.slice(start, end + 2);

            this.products[i].description = desc.replace(image, '');
            this.products[i].name = `${image} ${this.products[i].name}`;
          });

          this.sizes = this.products.map((el) => el.name);
          this.options.size = this.sizes[0];

          this.periods = Object.entries(this.products[0].price[0]).filter(
            ([key, value]) => key.match(/ly/) && value > -1
          ).map((el) => el[0]);
          this.options.period = this.periods[0];
        })
        .catch(err => console.error(err))
        .finally(() => {
          this.fetchLoading = false;
        });
		},
    changeAddons(id) {
      if (this.options.addons.includes(id)) {
        this.options.addons = this.options.addons.filter((addon) => addon !== id);
      } else {
        this.options.addons.push(id);
      }
    },
		orderClickHandler(){
			const info = {
        run: 'add_product',
				billingcycle: (this.getProducts.paytype === ['free', 'onetime']) ? 'monthly' : this.options.period,
				product: this.getProducts.id,
        paymentmethod: this.options.payment,
        addons: this.options.addons
			}

			if (!this.userdata.uuid) {
				this.$store.commit('setOnloginRedirect', this.$route.name);
				this.$store.commit('setOnloginInfo', {
					type: 'iaas',
					title: this.$route.query.service,
					cost: this.getProducts.price[this.options.period] ?? 0,
          currency: this.currency.code,
          goToInvoice: this.modal.goToInvoice
				});
				this.$store.dispatch('setOnloginAction', () => {
					this.createService(info);
				});
				this.$router.push({ name: 'login' });
				return;
			}

			this.createService(info);
		},
		createService(info){
			this.modal.confirmLoading = true;
			this.$api.get(this.baseURL, { params: info })
        .then((result) => {
          if (this.modal.goToInvoice){
            this.getPaytoken(result.invoiceid);
          } else {
            this.$router.push({ name: 'services' });
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          this.modal.confirmLoading = false;
        });
		},
		orderConfirm(){
      if (!this.$route.query.product) {
        this.$router.push({ query: {
          ...this.$route.query,
          product: this.getProducts.id
        } });
        return;
      }

			if (this.options.payment === '') {
				this.$message.error(this.$t('Choose your payment method'));
				return;
			}
      if (!this.checkBalance()) return;
			this.modal.confirmCreate = true;
		},
    checkBalance() {
      const sum = this.getProducts.price[this.options.period];

      if (this.userdata.balance < parseFloat(sum)) {
        this.$confirm({
          title: this.$t('You do not have enough funds on your balance'),
          content: () => (
            <div>{ this.$t('Click OK to replenish the account with the missing amount') }</div>
          ),
          onOk: () => {
            this.addfunds.amount = Math.ceil(parseFloat(sum) - this.userdata.balance);
            this.addfunds.visible = true;
          }
        });
        return false;
      }
      return true;
    },
    getPaytoken(invoice_id) {
      this.$api.get(this.baseURL, { params: {
        run: 'get_pay_token', invoice_id
      }})
        .then((res) => { window.location.href = res });
    }
	},
	computed: {
		getProducts() {
			if (Object.keys(this.products).length == 0) return "NAN"
      const findedProduct = this.products.find(({ id }) => id === +this.$route.query.product) ??
        this.products[this.sizes.indexOf(this.options.size)]
      const product = JSON.parse(JSON.stringify(findedProduct))

      if (typeof product.description !== 'string') return product
      if (/<\/?[a-z][\s\S]*>/i.test(product.description)) {
        if (typeof product.price?.currency === 'string') return product

        if (product.paytype === 'free' || !product.price) {
          product.price = { value: 0, currency: '' }
        } else if (product.paytype === 'onetime') {
          product.price = { value: product.price.monthly, currency: '' }
        } else {
          product.price = product.price.find(({ currency }) => currency === this.currency.id) ?? {}
        }
        product.price.currency = this.currency.code

        return product
      } else {
        product.description = product.description.split('\r\n').map(
          (res) => ({ name: res.split(': ')[0], value: res.split(': ')[1] })
        )
        product.description.pop()

        if (product.paytype === 'free') {
          product.price = { value: 0, currency: '' }
        } else if (product.paytype === 'onetime') {
          product.price = { value: product.price.monthly, currency: '' }
        } else {
          product.price = product.price.find(({ currency }) => currency === this.currency.id)
        }
        product.price.currency = this.currency.code
      }

			return { ...product, price: +product.price }
		},
    slides() {
      return 3;
    },
    addonsPrice() {
      return this.options.addons.reduce((prev, curr) => {
        const { prices = [], billingcycle } = this.addons[this.getProducts.id]
          ?.find(({ id }) => id === curr) ?? {};

        const price = prices.find((el) => el.currency === this.currency.id);
        const value = (+price[this.options.period] !== -1)
          ? +price[this.options.period]
          : 0;

        const result = {
          value: (billingcycle !== 'free') ? prev.value + (value || 0) : prev.value,
          onetime: (billingcycle === 'onetime') ? prev.onetime + +price.monthly : prev.onetime
        };

        return { ...result, total: result.value + result.onetime };
      }, { value: 0, onetime: 0, total: 0 });
    },
    userdata() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    isLogged() {
      return this.$store.getters['nocloud/auth/isLoggedIn'];
    },
    currency() {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency'];

      const code = (this.isLogged)
        ? this.user.currency_code ?? defaultCurrency
        : this.$store.getters['nocloud/auth/unloginedCurrency'];
      const { id = -1 } = this.currencies?.find((currency) => currency.code === code) ?? {};

      return { code, id };
    },
    baseURL() {
      return this.$store.getters['nocloud/auth/getURL'];
    }
	},
	created() {
    if (this.currencies.length < 1) {
      this.$store.dispatch('nocloud/auth/fetchCurrencies');
    }

    this.$api.get(this.baseURL, { params: { run: 'get_currencies' } })
      .then((res) => { this.currencies = res.currency })
			.catch(err => {
        const message = err.response?.data?.message ?? err.message;

				this.$notification.error({ message: this.$t(message) });
				console.error(err);
			});

    this.$api.get(this.baseURL, { params: { run: 'get_payment' } })
      .then((res) => {
        this.payMethods = res.paymentmethod;
        this.options.payment = res.paymentmethod[0].module;
      });

		this.$store.dispatch('nocloud/auth/fetchBillingData');
		this.fetch();
	},
  mounted() {
    const { action, info } = this.$store.getters['getOnlogin'];

    if (typeof action !== 'function') return;
    this.modal.goToInvoice = info.goToInvoice;
    this.modal.confirmCreate = true;
    this.modal.confirmLoading = true;
    action();
  },
  watch: {
    'options.size'() {
      this.periods = Object.entries(this.getProducts.price ?? {}).filter(
        ([key, value]) => key.match(/ly/) && value > -1
      ).map((el) => el[0]);

      this.options.period = this.periods[0];

      if (this.addons[this.getProducts.id]) {
        this.options.addons = [];
        return;
      }

      this.$api.get(this.baseURL, { params: {
        run: 'get_addons',
        productid: this.getProducts.id
      }})
        .then((res) => {
          this.$set(this.addons, this.getProducts.id, res);
          this.options.addons = [];
        })
        .catch((err) => console.error(err));
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

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__product-name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: 700;
}

.order__product .order__product-name .img_prod {
  max-height: 75px;
  margin: 0;
}

.order__option div > .img_prod {
  display: block;
  max-width: 200px;
  margin: 0 auto 10px;
}

.order__option .ant-slider-mark {
  display: none;
}

.order__option .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.order__option .order__slider-name .ant-checkbox {
  box-shadow: 0 0 5px var(--main);
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

.order__option .ant-card-head {
  background: var(--bright_bg);
}

.order__option .ant-card-body {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.order__option .ant-card-loading-content {
  width: 100%;
}

.card-item {
  width: 100%;
  cursor: pointer;
  border: 0 solid transparent;
  background: var(--bright_bg);
}

.card-item .order__slider-name {
  justify-items: start;
}

.card-item--active {
  padding: 19px;
  border: 5px solid var(--main);
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
  gap: 10px;
	overflow-x: auto;
  padding-bottom: 10px;
}

.order__slider-item{
	flex-shrink: 0;
	/* border: 1px solid rgba(0, 0, 0, .15); */
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
	height: 100%;
	padding: 7px 10px;
  text-align: center;
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
  .product__specs {
    width: 100%;
  }
  .product__specs td {
    padding: 3px 7px;
  }
  .product__specs td:last-child::before {
    transform: translate(-10px, -50%);
  }
  .order__grid {
    grid-template-columns: 1fr 1fr;
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
