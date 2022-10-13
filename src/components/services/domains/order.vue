<template>
  <div class="order_wrapper">
    <div class="order-cart">
      <div class="order__inputs order__field-cart">

        <div class="order_option">
          <a-row
            class="order_option__steps"
            type="flex"
            justify="center"
          >
            <a-col :span="16"><!--TODO: add finish status if cart (watch to cart)-->
              <a-steps>
                <a-step
                  class="search"
                  status="start"
                  title="Search"
                  @click="search"
                >
                  <template #icon><!---->
                    <a-icon type="search"/>
                  </template>
                </a-step>
                <a-step
                  class="cart"
                  status="finish"
                  title="Cart"
                ><!--@click="cart"-->
                  <template #icon>
                    <a-icon type="shopping-cart"/>
                  </template>
                </a-step>
              </a-steps>
            </a-col>
            <a-col :span="2" class="badge-wrapper">
              <a-badge
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
          <a-row :gutter="[10, 10]">
            <a-col :xs="24" :sm="12">
              <a-input
                placeholder="username"
                v-model="resources.reg_username"
              />
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-input-password
                placeholder="password"
                v-model="resources.reg_password"
              />
            </a-col>
          </a-row>
          <a-row justify="space-between" :gutter="[10, 10]">
            <a-col :xs="24" :sm="8">
              <a-switch v-model="resources.auto_renew" />
              auto renew
            </a-col>
            <a-col :xs="24" :sm="8">
              <a-switch v-model="resources.who_is_privacy" />
              who is privacy
            </a-col>
            <a-col :xs="24" :sm="8">
              <a-switch v-model="resources.lock_domain" />
              lock domain
            </a-col>
          </a-row>
          <a-row class="order__prop" style="margin-bottom: 5px">
            <a-col span="8" :xs="6">Domain in your cart:</a-col><!--{{$t('provider') | capitalize}}-->
          </a-row>
          <div class="description">
            <div v-if="!onCart.length" class="description-header">
              <a-icon type="question-circle" />
              <p>YOUR CART IS EMPTY</p>
            </div>
              <a-descriptions
                bordered
                class="description-body"
                v-for="(domain,index) in onCart"
                :key="index"
                :column="6"
              >
                <a-descriptions-item :span="1">
                  <span class="description-body__domain-name">
                    {{ domain.name }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item :span="3">
                  <span class="description-body__domain-cost">
                    {{ products[domain.name] && products[domain.name][resources.period] }}
                    {{ user.currency_code }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item :span="2">
                  <a-button
                      class="description-body__btn-order"
                      :key="index"
                      @click="removeFromCart(domain, index)"
                  >
                    Delete
                  </a-button>
                </a-descriptions-item>
              </a-descriptions>
            </div>
          <!--<div class="order__slider">
            <template v-if="!fetchLoading">
              <div
                  class="order__slider-item"
                  v-for="provider of Object.keys(products)"
                  :key="provider"
                  :class="{'order__slider-item&#45;&#45;active': options.provider == provider}"
                  @click="() => options.provider = provider"
              >
                {{provider}}
              </div>
            </template>
            <template v-else>
              <div
                  class="order__slider-item order__slider-item&#45;&#45;loading"
                  v-for="(provider, index) of Array(4)"
                  :key="index"
              >
              </div>
            </template>
          </div>

          <a-row class="order__prop">
            <a-col span="8" :xs="6">{{$t('tarif') | capitalize}}:</a-col>
            <a-col span="16" :xs="18">
              <a-select v-if="!fetchLoading" v-model="options.tarif" style="width: 100%">
                <a-select-option v-for="kind of products[options.provider]" :value="kind.tarif" :key="kind.tarif">{{kind.tarif}}</a-select-option>
              </a-select>
              <div v-else class="loadingLine"></div>
            </a-col>
          </a-row>

          <a-row class="order__prop">
            <a-col span="8" :xs="6">777&lt;!&ndash;{{$t('domain') | capitalize}}&ndash;&gt;:</a-col>
            <a-col span="16" :xs="18">
              <a-input v-if="!fetchLoading" v-model="options.domain" placeholder="example.com"></a-input>
              <div v-else class="loadingLine"></div>
            </a-col>
          </a-row>-->

        </div>
      </div>

      <div class="order__calculate order__field-cart">

        <a-row type="flex" justify="space-around" style="margin-top: 20px">
          <a-col :xs="10" :sm="6" :lg='12' style="font-size: 1rem">
            {{ $t('Pay period') }}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg='12'>
            <a-select v-model="resources.period" style="width: 100%"><!--v-if="!fetchLoading"-->
              <a-select-option
                v-for="period in periods"
                :key="period"
                :value="period"
              >
                {{ `${period} ${$t('year')}` }}
              </a-select-option>
            </a-select>
            <!--<div v-else class="loadingLine"></div>-->
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

        <a-divider orientation="left" :style="{ marginBottom: 0 }">
          {{ $t('Total') }}:
        </a-divider>

        <a-row type="flex" justify="space-around" :style="{ fontSize: '1.5rem' }">
          <a-col v-if="!fetchLoading">
            {{ getProducts.pricing[resources.period] }}
            {{ getProducts.pricing.suffix }}
          </a-col>
          <a-col v-else><div class="loadingLine loadingLine--total" /></a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin-top: 24px; margin-bottom: 10px">
          <a-col :span="22">
            <a-button
              block
              type="primary"
              shape="round"
              :disabled="!service || !namespace || !plan"
              @click="orderConfirm"
            >
              {{ $t("order") | capitalize }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :visible="modal.confirmCreate"
              :confirm-loading="sendloading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="modal.confirmCreate = false"
            >
              <p>{{ $t('Do you want to order') }}: {{ getProducts['name'] }}</p>
            </a-modal>
          </a-col>
        </a-row>

      </div>
    </div>
  </div>
</template>

<script>
import notification from '@/mixins/notification.js';

export default {
  name: 'domain-order',
  mixins: [notification],
  props: {
    onCart: Array,
    itemsInCart: Number,
    removeFromCart: Function,
    search: Function,
    sp: Object
  },
  data(){
    return {
      products: {},
      plan: null,
      service: null,
      namespace: null,
      fetchLoading: false,
      sendloading: false,

      options: { provider: '', tarif: '', domain: '' },
      modal: {
        confirmCreate: false,
        confirmLoading: false
      },
      resources: {
        registrant_ip: '',
        reg_username: '',
        reg_password: '',
        period: 1,
        auto_renew: true,
        who_is_privacy: false,
        lock_domain: true
      },
      periods: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // 'annually biennially triennial quadrennial quinquennial'
    }
  },
  methods: {
    fetch() {
      this.fetchLoading = true;
      const promises = this.onCart.map(({ name }) => 
        this.$api.servicesProviders.action({
          uuid: this.sp.uuid,
          action: 'get_domain_price',
          params: { domain: name },
        })
      );

      Promise.all(promises)
        .then((res) => {
          res.forEach(({ meta }, i) => {
            const { name } = this.onCart[i];

            this.products[name] = meta.prices;
          });
          // this.options.provider = Object.keys(res)[0];
          // this.options.tarif = res[this.options.provider][0].tarif;
        })
        .catch((err) => {
          this.openNotificationWithIcon('error', {
            message: err.response.data.message
          })
          console.error(err);
        })
        .finally(() => this.fetchLoading = false);
    },
    orderClickHandler() {
      this.sendloading = true;
      const service = this.services.find(({ uuid }) => uuid === this.service);
      const plan = this.plans.find(({ uuid }) => uuid === this.plan);

      const instances = Object.keys(this.products).map((domain) => ({
        resources: { ...this.resources, user: this.user, domain },
        title: `Domain - ${domain}`,
        billing_plan: plan ?? {}
      }));
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
      const group = info.instances_groups?.find(({ type }) => type === 'opensrs');

      if (group) group.instances = [...group.instances, ...instances];
      else if (this.service) info.instances_groups.push(newGroup);

      if (!this.user) {
        this.$store.commit('setOnloginRedirect', this.$route.name);
        this.$store.commit('setOnloginInfo', {
          type: 'SSL',
          title: 'SSL Certificate',
          cost: this.getProducts.pricing[this.resources.period]
        });
        this.$store.dispatch('setOnloginAction', () => {
          this.createDomains(info);
        });
        this.$router.push({ name: 'login' });
        return;
      }

      this.createDomains(info);
    },
    createDomains(info) {
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

          this.$api.services.testConfig(config)
            .then(({ result, errors }) => {
              if (!result) errors.forEach(({ error }) => {
                this.openNotificationWithIcon('error', { message: error });
              });
            });
          this.openNotificationWithIcon('error', {
            message: err.response.data?.message
          });
          console.error(err);
        })
    },
    orderConfirm() {
      const domains = Object.keys(this.products);

      if (!domains.every((el) => el.match(/.+\..+/))){
        this.$message.error('domain is wrong');
        return;
      }
      this.modal.confirmCreate = true;
    },
    deployService(uuid) {
      this.$api.services.up(uuid)
        .then(() => {
          this.openNotificationWithIcon('success', {
            message: 'Domain created successfully'
          });
          this.$router.push({ path: '/services' });
        })
        .catch((err) => {
          this.openNotificationWithIcon('error', {
            message: err.response.data?.message ?? 'Unknown'
          });
        })
        .finally(() => this.sendloading = false);
    }
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
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
        .filter(({ type }) => type === 'opensrs');
    },
    getProducts() {
      const prices = { suffix: this.user.currency_code };

      if (this.onCart.length === 0) return {
        pricing: this.periods.reduce((res, curr) => {
          res[curr] = 0;
          return res;
        }, { ...prices })
      };
      this.onCart.forEach(({ name }) => {
        const domain = this.products[name];

        Object.entries(domain).forEach(([key, value]) => {
          if (!prices[key]) prices[key] = 0;
          prices[key] = +(prices[key] + +value).toFixed(2);
        });
      });
      return {
        name: `domains - ${this.onCart.length}`,
        pricing: { ...prices }
      };
      // return this.products[this.options.provider].find(el => el.tarif == this.options.tarif);
    }
  },
  created() {
    this.$store.dispatch('nocloud/plans/fetch')
      .then(({ pool }) => {
        if (pool.length === 1) this.plan = pool[0].uuid;
      })
      .catch((err) => {
        this.openNotificationWithIcon('error', {
          message: err.response.data.message
        })
        console.error(err);
      });

    this.$store.dispatch('nocloud/namespaces/fetch')
      .then(({ pool }) => {
        if (pool.length === 1) this.namespace = pool[0].uuid;
      })
      .catch((err) => {
        this.openNotificationWithIcon('error', {
          message: err.response.data.message
        })
        console.error(err);
      });

    this.$store.dispatch('nocloud/vms/fetch')
      .then(({ pool }) => {
        if (pool.length === 1) this.service = pool[0].uuid;
      })
      .catch((err) => {
        this.openNotificationWithIcon('error', {
          message: err.response.data.message
        })
        console.error(err);
      });

    this.fetch();
  },
  // watch: {
  //   'options.provider'() {
  //     this.options.tarif = this.products[this.options.provider][0].tarif;
  //   }
  // }
}
</script>

<style scoped>

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

.anticon-like,
.anticon-question-circle{
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
  background-color: #f5222d;
  color: white;
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: #f5222d;
}
.description-body__btn-order:hover{
  color: #fff;
  background-color: rgba(245, 34, 45, 0.65) !important;
  border-color: rgba(245, 34, 45, 0.65) !important;
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

/* order*/
.order_wrapper{
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order-cart{
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

.order__field-cart{
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

/*order-template*/
/*.order__template{
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
}*/

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
  .order-cart{
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
  .order__field-cart{
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