<template>
	<div class="order_wrapper">
		<div class="order">
			<div class="order__inputs order__field">

				<div class="order_option">

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
								{{$t(`${provider}`)}}
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
								<a-select-option v-for="kind of products[options.provider]" :value="kind.tarif" :key="kind.tarif">{{kind.tarif}}</a-select-option>
							</a-select>
							<div v-else class="loadingLine"></div>
						</a-col>
					</a-row>

					<a-row class="order__prop">
						<a-col span="8" :xs="6">{{$t('ssl.domain') }}:</a-col>
						<a-col span="16" :xs="18">
							<a-input v-if="!fetchLoading" v-model="options.domain" placeholder="example.com"></a-input>
							<div v-else class="loadingLine"></div>
						</a-col>
					</a-row>

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
								{{$t(period)}}
							</a-select-option>
						</a-select>
						<div v-else class="loadingLine"></div>
					</a-col>
				</a-row>
				
				<a-divider orientation="left" :style="{'margin-bottom': '0'}">
					{{$t('Total')}}:
				</a-divider>

				<a-row type="flex" justify="space-around" :style="{'font-size': '1.5rem'}">
					<a-col>
						<template v-if="!fetchLoading">
							{{getProducts.pricing[options.period]}} {{getProducts.pricing.suffix}}
						</template>
						<div v-else class="loadingLine loadingLine--total"></div>
					</a-col>
				</a-row>

				<a-row type="flex" justify="space-around" style="margin-top: 24px; margin-bottom: 10px">
					<a-col :span="22">
						<a-button type="primary" block shape="round" @click="orderConfirm">
							{{$t("order") | capitalize}}
						</a-button>
						<a-modal
							:title="$t('Confirm')"
							:visible="modal.confirmCreate"
							:confirm-loading="sendloading"
							:cancel-text="$t('Cancel')"
							@ok="orderClickHandler"
							@cancel="() => {modal.confirmCreate = false}"
						>
							<p>{{$t('Do you want to order')}}: {{getProducts['name']}}</p>

							<a-row style="margin-top: 20px">
								<a-col>
									<a-checkbox :checked="modal.goToInvoice" @change="(e) => modal.goToInvoice = e.target.checked"/> {{$t('go to invoice') | capitalize}}
								</a-col>
							</a-row>
						</a-modal>
					</a-col>
				</a-row>

			</div>
		</div>
	</div>
</template>

<script>
import api from "@/api.js";

export default {
	name: 'ssl-component',
	data(){
		return {
			products: [],
			fetchLoading: false,
			sendloading: false,
			options: {
				provider: '',
				tarif: '',
				domain: '',
				period: 'annually'
			},
			modal: {
				confirmCreate: false,
				confirmLoading: false,
				goToInvoice: true
			},
			periods: ['annually', 'biennially']
		}
	},
	methods: {
		fetch(){
			this.fetchLoading = true;
			api.getWithParams('products.get.SSL', {})
			.then(res => {
				this.products = res;
				this.options.provider = Object.keys(res)[0];
				this.options.tarif = res[this.options.provider][0].tarif;
			})
			.catch(err => console.error(err))
			.finally(() => {
				this.fetchLoading = false;
			})
		},
		orderClickHandler(){
			this.sendloading = true;
			const info = {
				domain: this.options.domain,
				billingcycle: 'annually',
				pid: this.getProducts.pid
			}

			if(!this.$store.getters.getUser){
				this.$store.commit('setOnloginRedirect', this.$route.name);
				this.$store.commit('setOnloginInfo', {
					type: 'SSL',
					title: 'SSL Certificate',
					cost: this.getProducts.pricing[this.options.period]
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
			api.sendAsUser('createOrderSSL', info)
			.then(result => {
				if(this.modal.goToInvoice){
					this.$router.push({name: 'invoiceFS', params: {pathMatch: result.invoiceid}});
				} else {
					this.$router.push({name: 'services'});
				}
			})
			.catch(err => console.error(err))
			.finally(()=>{
				this.sendloading = false;
			})
		},
		orderConfirm(){
			if(!this.options.domain.match(/.+\..+/)){
				this.$message.error('domain is wrong');
				return
			}
			this.modal.confirmCreate = true;
		}
	},
	computed: {
		productName(){
			return 'test'
		},
		getProducts(){
			if(Object.keys(this.products).length == 0) return "NAN"
			return this.products[this.options.provider].find(el => el.tarif == this.options.tarif)
		}
	},
	created(){
		// console.log(this.data);
		this.fetch();
	},
	watch: {
		'options.provider': function() {
			this.options.tarif = this.products[this.options.provider][0].tarif;
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

.networkApear-enter-active, .networkApear-leave-active {
	transition: opacity .5s, height .5s;
	height: 26px;
}
.networkApear-enter, .networkApear-leave-to {
	opacity: 0;
	height: 0;
}
</style>