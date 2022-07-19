<template>
  <div class="wrapper" style="margin: 0; padding: 0">
    <div class="order_wrapper" v-if="!cartVisibility">
      <div class="order">
        <div class="order__inputs order__field">
          <div class="order_option">
            <a-row class="order_option__steps"
                   type="flex"
                   justify="center"
            >
              <a-col :span="16"><!--TODO: add finish status if cart (watch to cart)-->
                <a-steps>
                  <a-step class="search"
                          status="start"
                          title="Search">
                    <template #icon><!-- @click="search"-->
                      <a-icon type="search"/>
                    </template>
                  </a-step>
                  <a-step class="cart"
                          @click="cart"
                          status="finish"
                          title="Cart">
                    <template #icon>
                      <a-icon type="shopping-cart"/>
                    </template>
                  </a-step>
                </a-steps>
              </a-col>
              <a-col :span="2" class="badge-wrapper">
                <a-badge class="badge"
                         :count="itemsInCart"
                         :offset=[-25,-2]
                         show-zero
                         :number-style="{
                  backgroundColor: '#fff',
                  color: '#999',
                  boxShadow: '0 0 0 1px #d9d9d9 inset', }"
                />
              </a-col>
            </a-row>
            <a-row class="order_option__card">
              <a-col :span="24">
                <a-card title="HOW TO CHOOSE THE RIGHT DOMAIN">
                  <div>
                    <a-icon type="check"/>
                    <p>Keep your name easy to remember</p></div>
                  <div>
                    <a-icon type="check"/>
                    <p>Choose a name that fit your brand</p></div>
                </a-card>
              </a-col>
            </a-row>
            <a-input-search
                v-model="domain"
                placeholder="input search text"
                enter-button="Search"
                @search="searchDomain"
            />
            <div class="description" v-if="!cartVisibility && results.length">
              <div class="description-header">
                <a-icon type="like"/>
                <p>CONGTATS, YOUR DOMAIN IS AVAILABLE!</p>
              </div>
              <a-descriptions class="description-body"
                              v-for="(result, i) in results"
                              :key="i"
                              :column=6
                              bordered
              >
                <a-descriptions-item :span="1">
                <span class="description-body__domain-name">
                  {{ result.name }}
                </span>
                </a-descriptions-item>
                <a-descriptions-item :span="3">
                <span class="description-body__domain-cost">
                  {{ result.cost }}
                </span>
                </a-descriptions-item>
                <a-descriptions-item :span="2">
                  <a-button :class="result.btnClass"
                            @click="addToCart(result)"
                            :key="key"
                  >
                    {{ result.btnText }}
                  </a-button>
                </a-descriptions-item>
              </a-descriptions>
              <a-button class="description-btn-more"
                        v-if="moreBtnVisibility"
                        type="primary"
                        @click="moreDomains"
                        :key="key"
              >
                MORE DOMAINS...
              </a-button>
            </div>

            <!--<div class="description" v-if="cartVisibility && onCart.length" >
              <div class="description-header">
                <a-icon type="like" />
                <p>ORDER YOUR DOMAIN NOW!</p>
              </div>
              <a-descriptions class="description-body"
                              v-for="domain in onCart"
                              :column=6
                              bordered
              >
                <a-descriptions-item :span="1">
                  <span class="description-body__domain-name">
                    {{ domain.name }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item :span="3">
                  <span class="description-body__domain-cost">
                    {{ domain.cost }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item :span="2">
                  <a-button :class="domain.btnClass"
                      :key="key"
                      @click="order"
                  >
                    {{ domain.btnText }}
                  </a-button>
                </a-descriptions-item>
              </a-descriptions>
            </div>-->
          </div>
        </div>
      </div>
    </div>
    <order
        v-if="cartVisibility"
        :on-cart="onCart"
        :items-in-cart="itemsInCart"
        :remove-from-cart="removeFromCart"
        :search="search"
    />
  </div>
</template>

<script>
/*import api from "@/api.js";*/
import order from "@/components/services/domains/order";
export default {
  name: 'domains-component',
  components: {
    order,
  },
  data(){
    return {
      itemsInCart: 0, //в корзине
      domain: '',
      zones: ['.com', '.info', '.net', '.org', '.biz',],
      zonesMore: ['.pro', '.tv', '.ru', '.uk', '.fr', '.by', '.li', '.lt',],
      results: [],
      cartVisibility: false,
      onCart: [],
      key: 0,
      isZone: false,
      moreBtnVisibility: true,
      /*products: [],
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
      periods: ['annually', 'biennially']*/
    }
  },
  methods: {
    searchDomain() {
      const regexWithZone = /^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i;
      const regexWithoutZone = /^[a-z0-9][a-z0-9-]*$/i;

      this.moreBtnVisibility = true
      if (regexWithZone.test(this.domain)) {
        this.isZone = true
        this.results = []
        this.results.push(
            {
              name: this.domain,
              cost: '$6',
              btnText: 'Add To Cart',
              btnClass: 'description-body__btn-add',
            })
        this.zones.forEach((zone) => {
          if (this.domain !== this.domain.split('.')[0] + zone) {
            this.results.push(
                {
                  name: this.domain.split('.')[0] + zone,
                  cost: '$6',
                  btnText: 'Add To Cart',
                  btnClass: 'description-body__btn-add',
                })
          }
        })
      }
      else if (regexWithoutZone.test(this.domain)) {
        this.results = []
        this.zones.forEach((zone) => {
          this.results.push(
              {
                name: this.domain + zone,
                cost: '$6',
                btnText: 'Add To Cart',
                btnClass: 'description-body__btn-add',
              })
        })
      }
      else {
        this.results = []
        console.log('*******-alert-*******')
      }
    },
    moreDomains() {
      if(this.isZone){
        this.zonesMore.forEach((zone) => {
          if (this.domain !== this.domain.split('.')[0] + zone) {
            this.results.push(
                {
                  name: this.domain.split('.')[0] + zone,
                  cost: '$6',
                  btnText: 'Add To Cart',
                  btnClass: 'description-body__btn-add',
                })
          }
        })
      }
      else {
        this.zonesMore.forEach((zone) => {
          this.results.push(
              {
                name: this.domain + zone,
                cost: '$6',
                btnText: 'Add To Cart',
                btnClass: 'description-body__btn-add',
              })
        })
      }
      this.moreBtnVisibility = false
    },
    addToCart(result){
      if(result.btnClass === 'description-body__btn-add'){

        result.btnText = 'Order Now'
        result.btnClass = 'description-body__btn-order'
        if( !this.onCart.some((item) => item.name === result.name) ) {
          this.onCart.push(result)
          this.itemsInCart += 1
        }
      }
      else {
        this.cartVisibility = true
      }
      this.key += 1;
    },
    removeFromCart(domain, index){
      this.onCart.splice(index,1)
      this.results.splice( this.results.findIndex((result) => result.name === domain.name), 1 )
      this.itemsInCart -=1
    },
    cart(){
      this.cartVisibility = true
    },
    search(){
      this.cartVisibility = false
    },
    order(){
      this.key += 1
    }


    /*fetch(){
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
    },*/
    /*orderClickHandler(){
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
    },*/
    /*createSSL(info){
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
    },*/
   /* orderConfirm(){
      if(!this.options.domain.match(/.+\..+/)){
        this.$message.error('domain is wrong');
        return
      }
      this.modal.confirmCreate = true;
    }*/
  },
  computed: {
    /*productName(){
      return 'test'
    },*/
    /*getProducts(){
      if(Object.keys(this.products).length === 0) return "NAN"
      return this.products[this.options.provider].find(el => el.tarif === this.options.tarif)
    }*/
  },
  created(){
    // console.log(this.data);
    /*this.fetch();*/
  },
  watch: {
    /*'options.provider': function() {
      this.options.tarif = this.products[this.options.provider][0].tarif;
    }*/
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
  margin-top: 20px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 768px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.order__inputs{
  width: 100%;
}

.order__field{
  border-radius: 10px;
  padding: 23px 78px;
  background-color: #fff;
  height: max-content;
}


/*--steps--*/
.order_option__steps{
  margin-left: 70px;
}

.search{
  font-weight: 600;
  font-size: 18px;
  padding-left: 10px;
  margin-right: 12px;
}

.search div.ant-steps-item-icon,
.search div.ant-steps-item-content{
  cursor: pointer!important;
}

.cart{
  font-weight: 600;
  font-size: 18px;
  margin-right: 0;
  padding-right: 28px;
  cursor: pointer;
}

.anticon-shopping-cart{
  font-size: 28px;
}


/*--card--*/
.order_option__card{
  margin: 20px 0 27px;
}

.ant-card-head{
  border-bottom: none;
}

.ant-card-head-title{
  padding-bottom: 0;
  font-size: 11px;
  font-family: sans-serif;
  font-weight: bold;
  padding-left: 7px;
}

.ant-card-body{
  padding: 0 35px 13px;
  margin-top: -8px;
}

.anticon-check{
  margin: 0 5px;
}

.ant-card-body p{
  display: inline;
  font-size: 13px;
  color: black;
}


/*--input--*/
.ant-input-group .ant-input{
  width: 100%;
}

input.ant-input:focus{
  box-shadow: none;
}

.ant-input-group-addon{
  width: 22%;
}

.ant-input-search-button{
  width: 100%;
  background-color: #427cf7!important;
}


/*--description--*/
.description{
  padding: 11px 0 11px 32px;
  margin-top: 18px;
  background-color: #f7f7f7;
}

.description-header{
  display: flex;
  margin-bottom: 2px;
}

.anticon-like {
  font-size: 27px;
  color: grey;
  display: inline-block
}

.description-header p{
  margin-top: 4px;
  margin-left: 10px;
  font-size: 12px;
  font-weight: 400;
  color: #0fd058;
  background-color: #f7f7f7;
  display: inline;
}

.description-body{
  background-color: #f7f7f7;
}

.description-body__domain-name{
  margin-left: 15px;
  color: black;
}

.description-body__domain-cost{
  color: black;
}

.description-body__btn-add{
  background-color: #427cf7;
  color: white;
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: #427cf7;
}
.description-body__btn-add:hover{
  color: #fff;
  background-color: #40a9ff!important;
  border-color: #40a9ff!important;
}

.description-body__btn-order{
  background-color: #5CB85B;
  color: white;
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: #5CB85B;
}
.description-body__btn-order:hover{
  color: #fff;
  background-color: rgba(92,184,91,0.65)!important;
  border-color: rgba(92,184,91,0.65)!important;
}

div.ant-descriptions-view{
  border-color: #f7f7f7!important;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
}

th.ant-descriptions-item-label.ant-descriptions-item-colon.ant-descriptions-item-no-label{
  border: none;
  margin: 0;
  padding: 0;
}

td.ant-descriptions-item-content{
  padding-top: 5px!important;
  padding-bottom: 2px!important;
  font-weight: 400;/*!important*/
  font-size: 12px;
  text-align: center;
}
td.ant-descriptions-item-content:nth-child(2){
  padding: 7px 0 2px;
  width: 150px;
  text-align: start;
  border: none;
}
td.ant-descriptions-item-content:nth-child(4){
  padding: 7px 0 2px;
  width: 184px;
  background-color: white;
}
td.ant-descriptions-item-content:nth-child(6){
  background-color: white;
}

.description-btn-more{
  display: flex;
  width: 150px;
  background-color: #427cf7;
  color: white;
  padding: 7px;
  font-size: 12px;
  margin: 30px 2px 5px 0;
  border-color: #427cf7;
  align-items: center;
  justify-content: center;
}

.description-btn-more:hover{
  color: #fff;
  background-color: #40a9ff!important;
  border-color: #40a9ff!important;
}
/*media*/
/*@media screen and (max-width: 1024px) {
  .order{
    flex-direction: column;
    padding: 10px;
    margin-top: 0;
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
}*/

/*@media screen and (max-width: 576px) {
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
}*/
</style>




<!--//  VERSION WITH SELECT  //-->

<!--body-->
<!--
 <a-input-group class="input-group"
              compact
          >
            <a-input class="input-group__input"
                v-model="domain"
                :placeholder="$t('domain.Pick a domain name')"
            >
              <template #addonAfter>
                <a-icon type="setting" @click="selectZone" />
              </template>
            </a-input>
            <a-button class="input-group__search-btn"
                type="primary"
                @click="searchDomain"
            >
              SEARCH
            </a-button>
            <a-select class="input-group__select"
                v-if="multiZone"
                v-model="values"
                :options="options"
                mode="multiple"
                :placeholder="$t('domain.Please select domain zone')"
            />
          </a-input-group>


-->

<!--script-->
<!--
values: [], //выбранные зоны
multiZone: false,
options: ['.com', '.info', '.net', '.org', '.pro', '.tv', '.ru', '.uk', '.fr', '.by', '.li', '.lt'].map(item => {
return {value: item, label: item}
      }),
-->
<!--
 selectZone(){
      this.multiZone = !this.multiZone;
    },
 searchDomain() {
      const regexWithZone = /^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i;
      const regexWithoutZone = /^[a-z0-9][a-z0-9-]*$/i;

      if (regexWithZone.test(this.domain)) {
        if (this.values.length) {
          this.results = []
          this.results.push(
              {
                name: this.domain,
                cost: '$6',
                btnText: 'Add To Cart',
                btnClass: 'description-body__btn-add',
              })
          this.values.forEach((zone) => {
            if(this.domain !== this.domain.split('.')[0] + zone){
              this.results.push(
                  {
                    name: this.domain.split('.')[0] + zone,
                    cost: '$6',
                    btnText: 'Add To Cart',
                    btnClass: 'description-body__btn-add',
                  })
            }
          })
        }
        else {
          this.results = []
          this.results.push(
              {
                name: this.domain,
                cost: '$6',
                btnText: 'Add To Cart',
                btnClass: 'description-body__btn-add',
              })
        }
      }
      else if (regexWithoutZone.test(this.domain)) {
        if (this.values.length) {
          this.results = []
          this.values.forEach((zone) => {
            this.results.push(
                {
                  name: this.domain + zone,
                  cost: '$6',
                  btnText: 'Add To Cart',
                  btnClass: 'description-body__btn-add',
                })
          })
        }
        else {
          this.results = []
          console.log('*******-alert-*******')
        }
      }
      else {
        this.results = []
        console.log('*******-alert-*******')
      }
    },
-->

<!--style-->
<!--
.input-group__input{
  width: 78%;
}

input.ant-input {
  margin-right: 10px;
  border-top-left-radius: 3px!important;
  border-bottom-left-radius: 3px!important;
}

span.ant-input-group-addon{
  padding-left: 14px;
  padding-right: 13px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.anticon-setting{
  cursor: pointer; font-size: 20px;
}

.input-group__search-btn{
  width: 22%;
  border-bottom-right-radius: 3px!important;
  border-top-right-radius: 3px!important;
  font-size: 12px;
  background-color: #427cf7;
}

.input-group__select{
  width: 100%;
  margin-top: 10px;
}

div.ant-select-selection{
  border-radius: 3px!important;
}
-->
















