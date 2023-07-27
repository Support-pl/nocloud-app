<template>
	<div class="service__item" @click="onClick">
		<div class="service__icon">
			<a-icon :type="service.icon"></a-icon>
		</div>
		<div class="service__title">{{ translatedName }}</div>
	</div>
</template>

<script>
export default {
	name: 'service-item',
	props: {
    service: { type: Object, required: true },
    productsCount: { type: Function, required: true }
  },
	computed: {
		translatedName(){
			if(this.service.translatable){
				return this.$t(this.service.title);
			}
			return this.service.title
		},
    isLogged() {
      return this.$store.getters['nocloud/auth/isLoggedIn'];
    }
	},
  methods: {
    onClick(e) {
      const type = this.service.onclick.paramsArr[0].query.service;
      const isCountZero = this.productsCount(type, true) === 0;

      if (this.isLogged && !isCountZero) e.stopPropagation();
      else return;

      this.service.onclick.function(...this.service.onclick.paramsArr)
    }
  }
}
</script>

<style>
.service__item{
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	border-radius: 10px;
	transition: background-color .2s ease, color .2s ease;
	padding: 10px;
	cursor: pointer;
}

/* .service__item:not(:last-of-type){
	margin-right: 10px;
} */

.service__item:hover{
	background-color: #fff;
	color: var(--main);
}

.service__icon{
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 2rem;
	margin-bottom: 3px;
	position: relative;
}

.service__title{
  text-align: center;
}

/* .service__icon::after{
	color: var(--main);
	font-size: 2.3rem;
	content: '+';
	display: block;
	position: absolute;
	right: 0;
	bottom: 0;
	width: 1rem;
	height: 1rem;
	transform: translate(5px, -14px);
} */

</style>
