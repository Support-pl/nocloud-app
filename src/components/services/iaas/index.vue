<template>
	<div class="order_wrapper">
		<div class="order">
			<div class="order__inputs order__field">
				<div class="order_option">
					<a-slider
            v-if="sizes.length < 6"
						:marks="{...sizes}"
						:value="sizes.indexOf(options.size)"
						:tip-formatter="null"
						:max="sizes.length-1"
						:min="0"
						@change="(value) => options.size = sizes[value]"
					/>

          <div v-else class="order__slider">
            <div
              class="order__slider-item"
              v-for="size of sizes"
              :key="size"
              :class="{ 'order__slider-item--active': options.size === size }"
              @click="options.size = size"
            >
              {{ size }}
            </div>
          </div>

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
				</div>
			</div>

			<div class="order__calculate order__field">
				<a-row style="margin-top: 20px" type="flex" justify="space-around" align="middle">
					<a-col :xs="10" :sm="6" :lg='12' style="font-size: 1rem">
						{{ $t('Pay period') }}:
					</a-col>

					<a-col :xs="12" :sm="18" :lg='12'>
						<a-select style="width: 100%" v-if="!fetchLoading" v-model="options.period">
							<a-select-option v-for="period in periods" :key="period" :value='period'>
								{{ $t(period) }}
							</a-select-option>
						</a-select>
						<div v-else class="loadingLine"></div>
					</a-col>
				</a-row>

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

				<a-divider orientation="left" style="margin-bottom: 0">
					{{ $t('Total') }}:
				</a-divider>

				<a-row type="flex" justify="space-around" style="font-size: 1.5rem">
					<a-col>
						<transition name="textchange" mode="out-in">
							<div v-if="!fetchLoading">
								{{ getProducts.price[options.period] }} {{ getProducts.price.currency }}
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
							@cancel="() => {modal.confirmCreate = false}"
						>
							<p>{{ $t('order_services.Do you want to order') }}: {{ getProducts['name'] }}</p>

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
    sendloading: false,
    options: { size: '', payment: '', period: '' },
    modal: {
      confirmCreate: false,
      confirmLoading: false,
      goToInvoice: true
    },
    addfunds: { visible: false, amount: 0 },
    periods: []
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
		orderClickHandler(){
			const info = {
        run: 'add_product',
				billingcycle: this.options.period,
				product: this.getProducts.id,
        paymentmethod: this.options.payment
			}

			if(!this.user){
				this.$store.commit('setOnloginRedirect', this.$route.name);
				this.$store.commit('setOnloginInfo', {
					type: 'IaaS',
					title: this.$route.query.service,
					cost: this.getProducts.price[this.options.period]
				});
				this.$store.dispatch('setOnloginAction', () => {
					this.createService(info);
				});
				this.$router.push({name: 'login'});
				return
			}

			this.createService(info);
		},
		createService(info){
			this.sendloading = true;
			this.$api.get(this.baseURL, { params: info })
        .then((result) => {
          if (this.modal.goToInvoice){
            this.$router.push({ name: 'invoiceFS', params: { uuid: result.invoiceid } });
          } else {
            this.$router.push({ name: 'services' });
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          this.sendloading = false;
        });
		},
		orderConfirm(){
			if (this.options.payment === '') {
				this.$message.error(this.$t('Choose your payment method'));
				return
			}
      if (!this.checkBalance()) return;
			this.modal.confirmCreate = true;
		},
    checkBalance() {
      const sum = this.getProducts.price[this.options.period];

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
    }
	},
	computed: {
		getProducts() {
			if(Object.keys(this.products).length == 0) return "NAN"
      const product = this.products[this.sizes.indexOf(this.options.size)]

      if (typeof product.description !== 'string') return product
      if (/<\/?[a-z][\s\S]*>/i.test(product.description)) {
        return product
      } else {
        product.description = product.description.split('\r\n').map(
          (res) => ({ name: res.split(': ')[0], value: res.split(': ')[1] })
        )
        product.description.pop()

        product.price = product.price.find(({ currency }) => currency === this.user.currency)
        product.price.currency = this.user.currency_code
      }

			return product
		},
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    baseURL() {
      return this.$store.getters['nocloud/auth/getURL'];
    }
	},
	created() {
    this.$api.get(this.baseURL, { params: { run: 'get_payment' } })
      .then((res) => {
        this.payMethods = res.paymentmethod;
        this.options.payment = res.paymentmethod[0].module;
      });

		this.$store.dispatch('nocloud/auth/fetchBillingData');
		this.fetch();
	},
  watch: {
    'options.size'() {
      this.periods = Object.entries(this.getProducts.price).filter(
        ([key, value]) => key.match(/ly/) && value > -1
      ).map((el) => el[0]);

      this.options.period = this.periods[0];
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
	display: flex;
	justify-content: center;
	align-items: center;
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
