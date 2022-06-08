<template>
	<transition name='notification-appear'>
		<div
			v-if="needToBeUpdated.status"
			class="update-notification"	
		>
			<span class='update-notification__message update-notification__element'>
				{{$t('New content is avaliable')}}
			</span>

			<a-button
				class='update-notification__button update-notification__element'
				ghost
				@click="skipWaiting"
			>
				Reload
			</a-button>

			<a-icon
				class='update-notification__cross update-notification__element'
				type="close"
				@click="hideNotification"
			/>

		</div>
	</transition>
</template>

<script>
export default {
	name: 'updateNotification',
	computed: {
		needToBeUpdated(){
			let worker = this.$store.getters['app/isNeedReloadToBeUpdated'];
			return worker;
		}
	},
	methods: {
		skipWaiting(){
			let worker = this.needToBeUpdated.worker;
			worker.active.postMessage({ type: 'SKIP_WAITING'});
			this.hideNotification();
			location.reload();
		},
		hideNotification(){
			this.$store.commit('app/setUpdate', {worker: this.needToBeUpdated.worker, status: false})
		}
	},
}
</script>

<style>
.update-notification{
	position: absolute;
	right: 50px;
	bottom: 52px;
	background-color: #565656;
	color: #fff;
	padding: 10px 30px 10px 20px;
	font-size: .95rem;
	border-radius: 4px;
}
.update-notification__element:not(:last-child){
	margin-right: 25px;
}
.update-notification__cross{
	font-size: 1.2rem;
	position: absolute;
	top: 50%;
	right: 16px;
	transform: translateY(-50%);
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}
.update-notification__cross:hover{
	color: #40a9ff;
	transform: translateY(-50%) scale(1.2);
}
.update-notification__cross:active{
	color: #096dd9;
}
@media screen and (max-width: 425px) {
	.update-notification{
		right: 5px;
		left: 5px;
	}
}
@media screen and (max-width: 375px) {
	.update-notification{
		right: 5px;
		left: 5px;
		text-align: center;
		display: flex;
		flex-direction: column;
		padding: 10px 20px 10px 20px;
	}
	.update-notification__message{
		margin-bottom: 10px;
	}
	.update-notification__cross{
		right: 12px;
	}
}
/* animations */
.notification-appear-enter-active, .notification-appear-leave-active {
  transition: transform .5s ease, opacity .42s ease;
}
.notification-appear-enter, .notification-appear-leave-to {
  transform: translateY(50px);
	opacity: 0;
}
</style> 