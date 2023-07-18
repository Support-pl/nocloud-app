<template>
	<div class="application">
		<a-layout>
			<a-layout-header :style="{'background-color': 'var(--main)', color: 'var(--bright_font)', padding: 0}">
				<appHeader />
			</a-layout-header>

			<a-layout-content :style="{'background-color': 'var(--bright_bg)', 'position': 'relative'}">
				<transition name="main-frame-anim">
					<router-view class="frame"></router-view>
				</transition>
			</a-layout-content>

			<a-layout-footer v-if="user" :style="{padding: 0}">
				<appFooter />
			</a-layout-footer>

		</a-layout>
	</div>
</template>

<script>
import appFooter from './appFooter.vue';
import appHeader from './appHeader.vue';

export default {
	name:"appMain",
	components: {
		appFooter,
		appHeader,
	},
	computed: {
		user(){
			// return this.$store.getters.getUser;
			return this.$store.getters['nocloud/auth/isLoggedIn'];
		}
	},
	created(){
		this.$router.onReady(() => {
			this.$store.dispatch('app/setTabByNameNoRoute', this.$router.currentRoute.name)
		});
		this.$router.beforeEach((to, from, next) => {
			this.$store.dispatch('app/setTabByNameNoRoute', to.name)
			next();
		})
	}
}
</script>

<style>
	.application{
		height: 100%;
		overflow: hidden;
	}

	.ant-layout{
		height: 100%;
	}

	.container {
		max-width: 768px;
		min-height: 100%;
		margin: 0 auto;
		position: relative;
	}

	.frame{
		position: absolute;
		height: 100%;
		width: 100%;
		overflow-y: auto;
	}
	
.main-frame-anim-enter-active,
.main-frame-anim-leave-active {
  transition: all .25s ease;
}

.main-frame-anim-enter{
  transform: translateY(-0.5em);
  opacity: 0;
}

.main-frame-anim-leave-to{
  transform: translateY(0.5em);
  opacity: 0;
}
</style>