<template>
	<div class="login">
		<div class="login__title login__layout">
			<div class="logo" :class="['pos_'+companyLogoPos]">
				<div class="logo__title" v-if="companyName">
					{{companyName}}
				</div>
				<div class="logo__image" v-if="companyLogo">
					<img :src="companyLogo" alt="logo">
				</div>

			</div>
			<svg class="clipPathSvg" width="0" height="0">
				<defs>
					<clipPath id="myCurve" clipPathUnits="objectBoundingBox">
					<path
						d="M0.000,0.000 L1,-0.000 L1,0.743 C1,0.7 1,0.806 0.846,0.806 C0.728,0.806 0.635,0.791 0.400,0.791 C0.130,0.791 0.022,0.976 0.000,1 L0.000,-0.000 Z"
					/>
					</clipPath>
				</defs>
			</svg>
		</div>
		<div class="login__main login__layout">
			<div class="login__UI">

				<div v-if="getOnlogin.info" class="login__action-info">
					{{getOnlogin.info}}
				</div>

				<div class="login__inputs">
					<form>
					<!-- <div v-if="loginError" class="login__error">{{loginError}}</div> -->

						<!-- <div class="inputs__log-pas">
							<input type="text" placeholder="Email" v-model="userinfo.email">
							<span class="login__horisontal-line"></span>
							<input type="password" :placeholder="$t('clientinfo.password') | capitalize"  v-model="userinfo.password">
						</div> -->

						<div class="inputs__log-pas">
							<input
								type="text"
								name="firstname"
								:placeholder="$t('clientinfo.firstname') + ' *' | capitalize"
								v-model="userinfo.firstname"
								readonly
								onfocus="this.removeAttribute('readonly')"
							>
							<span class="login__horisontal-line"></span>
							<input
								type="text"
								name="lastname"
								:placeholder="$t('clientinfo.lastname') + ' *' | capitalize"
								v-model="userinfo.lastname"
								readonly
								onfocus="this.removeAttribute('readonly')"
							>
							<span class="login__horisontal-line"></span>
							<input
								type="email"
								name="email"
								:placeholder="$t('clientinfo.email') + ' *' | capitalize"
								v-model="userinfo.email"
								readonly
								onfocus="this.removeAttribute('readonly')"
							>

              <span class="login__horisontal-line"></span>
							<a-select
                show-search
                :placeholder="$t('clientinfo.countryname') + ' *' | capitalize"
                name="country"
                id="country"
                option-filter-prop="children"
                v-model="userinfo.country"
              >
								<a-select-option v-for="country in countries" :key="country.code" :value="country.code">
                  {{country.title}}
                </a-select-option>
							</a-select>

							<span class="login__horisontal-line"></span>
							<input
                v-phone="phonecode"
								type="tel"
								name="phone"
								:placeholder="$t('clientinfo.phone number') + ' *' | capitalize"
                :disabled="!userinfo.country"
								v-model="userinfo.phonenumber"
                autocomplete="tel"
                maxlength="18"
							>
							<span class="login__horisontal-line"></span>
							<input
								type="password"
								name="password"
								:placeholder="$t('clientinfo.password') + ' *' | capitalize"
								v-model="userinfo.password"
								readonly
								onfocus="this.removeAttribute('readonly')"
							>
							<span class="login__horisontal-line"></span>
						</div>

						<div class="inputs__log-pas">
							<a-select style="width: 100%; border: none" @change="(e) => $i18n.locale = e" :value="$i18n.locale">
								<a-select-option v-for="lang in langs" :key="lang" :value="lang">
									{{$t('localeLang', lang)}}
								</a-select-option>
							</a-select>

              <span class="login__horisontal-line"></span>
							<a-select style="width: 100%; border: none" v-model="userinfo.currency">
								<a-select-option v-for="currency in currencies" :key="currency.id" :value="currency.id">
									{{currency.code}}
								</a-select-option>
							</a-select>
						</div>

						<div class="inputs__log-pas" v-if="invoiceChecked">
							<input :placeholder="$t('clientinfo.companyname') + ' *' | capitalize" v-model="userinfo.companyname">
							<span class="login__horisontal-line"></span>
							<input placeholder="VAT ID" v-model="userinfo.tax_id">
							<!-- <span class="login__horisontal-line"></span>
							<input :placeholder="$t('clientinfo.state') | capitalize" v-model="userinfo.state"> -->
							<span class="login__horisontal-line"></span>
							<input :placeholder="$t('clientinfo.city') + ' *' | capitalize" v-model="userinfo.city">
							<span class="login__horisontal-line"></span>
							<input :placeholder="$t('clientinfo.postcode') + ' *' | capitalize" v-model="userinfo.postcode">
							<span class="login__horisontal-line"></span>
							<input :placeholder="$t('clientinfo.address') + ' *' | capitalize"  v-model="userinfo.address1">
						</div>

						<template>
							<button v-if="!registerLoading" @click.prevent="submitHandler()" class="login__submit">{{$t('clientinfo.register') | capitalize}}</button>

							<div v-else class="login__loading">
								<span class="load__item"></span>
								<span class="load__item"></span>
								<span class="load__item"></span>
							</div>
						</template>

					</form>
				</div>
				<div class="register__already-has" style="margin-top: 40px">
					<router-link :to="{name: 'login'}">{{$t('clientinfo.already have account?') | capitalize}}</router-link>
				</div>
        <div class="register__already-has" style="margin: 10px 0 30px">
          <a-checkbox v-model="invoiceChecked">{{$t('Invoice is needed')}}</a-checkbox>
        </div>
			</div>
		</div>
  	</div>

</template>

<script>
import api from '@/api.js';
import countries from '@/countries.json';
import notification from '@/mixins/notification.js';

export default {
	name: "register-view",
  mixins: [notification],
	data(){
		return {
			countries,
      currencies: [],
			registerLoading: false,
      invoiceChecked: false,
			userinfo: {
				firstname: '',
				lastname: '',
				email: '',
				password: '',
				address1: '',
				city: '',
				// state: '',
				postcode: '',
				country: undefined,
				phonenumber: '',
        currency: 1,
        companyname: '',
        tax_id: ''
			}
		}
	},
	methods: {
		submitHandler(){
			this.send(this);
		},
		send(){
      const info = (this.invoiceChecked) ? { ...this.userinfo } : {
				firstname: '',
				lastname: '',
				email: '',
				password: '',
				country: 'BY',
				phonenumber: '',
        currency: 1,
      };
      delete info.tax_id;

			if(Object.keys(info).some(key => !`${this.userinfo[key]}`.length)){
				this.$message.warn(this.$t('all fields are required'));
				return
			}

			for(let key in info){
				if(this.userinfo[key].length < 2){
					this.$message.warn(key + ' ' + this.$t('field must contain more characters'));
					return
				}
			}

			let regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,15})+$/;
			if(!this.userinfo.email.match(regexEmail)){
				this.$message.warn(this.$t('email is not valid'));
				return
			}

			const temp = JSON.parse(JSON.stringify(this.userinfo));

      temp.email = `${temp.email[0].toLowerCase()}${temp.email.slice(1)}`;
      temp.phonenumber = temp.phonenumber.replace(this.phonecode, '').replace(/[\s-]/g, '');

			this.registerLoading = true;
			api.get(this.baseURL, {
        params: {
          ...temp,
          language: this.$i18n.locale,
          run: 'create_user'
        }
      })
			.then((res) => {
        if (res.result === 'error') this.$message.error(res.message);
        else this.$message.success(this.$t('account created successfully'));
        this.$router.push({name: 'login'});
			})
			.catch(err => {
        const message = err.response?.data?.message ?? err.message;

				this.openNotificationWithIcon('error', {
          message: this.$t(message)
        });
				console.error(err);
			})
			.finally(()=>{
				this.registerLoading = false;
			});
		},
	},
  created() {
    api.get(this.baseURL, { params: { run: 'get_currencies' } })
      .then((res) => { this.currencies = res.currency })
			.catch(err => {
        const message = err.response?.data?.message ?? err.message;

				this.openNotificationWithIcon('error', {
          message: this.$t(message)
        });
				console.error(err);
			});
  },
	computed: {
		getOnlogin(){
			return this.$store.getters.getOnlogin;
		},
		companyName(){
			return this.$store.getters['getDomainInfo'].name ?? this.$config.appTitle
		},
		companyLogo(){
			const settings = this.$store.getters['getDomainInfo'];
			if(settings.logo && typeof settings.logo == 'string'){
				return settings.logo;
			}
			return this.$config.appLogo.path;
		},
		langs(){
			return this.$config.languages;
		},
		companyLogoPos(){
			return this.$config.appLogo.pos;
		},
    baseURL(){
      return this.$store.getters['support/getURL'];
    },
    phonecode(){
      return countries.find(({ code }) => code === this.userinfo.country)?.dial_code;
    }
	}
}
</script>

<style>

.logo{
	display: flex;
	grid-gap: 15px
}

.logo__image {
  max-width: 70%;
}

.logo__image img {
  max-width: 100%;
}

.pos_top{
	flex-direction: column-reverse;
}

.pos_bottom{
	flex-direction: column;
}

.pos_left{
	flex-direction: row-reverse;
}

.pos_right{
	flex-direction: row;
}

.logo__title{
	text-align: center;
}

.clipPathSvg{
	height: 0;
	width: 0;
}

.login{
	height: 100%;
	display: flex;
	flex-direction: column;
}

.login__layout{
	flex: 1 0;
}

.login__title{
	display: flex;
	justify-content: center;
	align-items: center;
	background: var(--main);
	clip-path: url(#myCurve);
	color: var(--bright_font);
	font-size: 36px;
	font-weight: bold;
	flex-shrink: 0;
	min-height: 50%;
}

.login__title::selection{
	color: var(--main);
	background: var(--bright_font);
}
.login__title::moz-selection{
	color: var(--main);
	background: var(--bright_font);
}

.login__UI{
	position: relative;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-around;
	overflow-y: auto;
}

.login__inputs{
	display: flex;
	flex-direction: column;
	width: 80%;
	max-width: 500px;
	position: relative;
}

.login__horisontal-line{
	display: block;
	width: 95%;
	height: 1px;
	margin: auto;
	background: #f4f4f4;
}

.inputs__log-pas{
	display: flex;
	flex-direction: column;
	border-radius: 10px;
	overflow: hidden;
	box-shadow: 3px 8px 20px rgba(164, 180, 244, .5);
	margin-bottom: 25px;
}

.login__submit{
	border: none;
	outline: none;
	color: #fff;
	font-weight: 600;
	border-radius: 10px;
	padding: 7px 20px;
	background: linear-gradient(90deg, #427cf7, #8baef2);
	background-size: 150% 200%;
	background-position: 0 0;
	/* animation: AnimationName 1s ease infinite; */
	cursor: pointer;
	width: 100%;
}
#qrcode{
	display: none;
}

.login__submit:hover{
	animation: gradient 2s ease infinite;
}

@keyframes gradient {
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
}

.inputs__log-pas input,
.inputs__log-pas select{
	border: none;
	outline: none;
	padding: 10px 15px;
}

.inputs__log-pas .ant-select-search__field {
  padding-left: 0;
}

.inputs__log-pas input::placeholder{
	opacity: .5;
}

.register__already-has a{
	text-decoration: none;
}

.register__already-has a:hover{
	text-decoration: underline;
}

.inputs__log-pas
.ant-select-selection--single
.ant-select-selection__rendered {
  margin-left: 15px;
}

.login__loading{
	display: flex;
	justify-content: center;
	align-items: center;
	height: 35px;
}

.load__item:not(:first-child){
	margin-left: 10px;
}

.load__item{
	display: block;
	width: 25px;
	height: 25px;
	background: #437dfb;
	border-radius: 50%;
}

.load__item:nth-child(1){
	animation: loading 1.4s .2s ease infinite;
}
.load__item:nth-child(2){
	animation: loading 1.4s .4s ease infinite;
}
.load__item:nth-child(3){
	animation: loading 1.4s .6s ease infinite;
}

.inputs__log-pas .ant-select-selection{
	border: none;
}

@keyframes loading {
	from, to {transform: scale(1)}
	50% {transform: scale(.2);}
}

.login__error{
	color: tomato;
	text-align: center;
	position: absolute;
	top: -35px;
	left: 50%;
	transform: translateX(-50%);
	width: 90%;
}


@media screen and (min-width: 1024px){
	.login{
		flex-direction: row;
	}

	.login__title{
		clip-path: none;
	}

	.login__UI{
		justify-content: center;
	}

	#qrcode{
		display: inline-block;
	}
}

</style>
