<template>
  <div id="app" :style="false && cssVars" :class="{ 'block-page': notification }">
    <transition name="slide">
      <router-view :style="{
        position: 'absolute',
        width: '100%',
        height: (loggedIn) ? '100%' : 'auto',
        minHeight: (loggedIn) ? 'auto' : '100vh'
      }" />
    </transition>
    <update-notification />
  </div>
</template>

<script>
import updateNotification from "./components/updateNotification/index.vue";

export default {
  name: "app",
  components: { updateNotification },
  created() {
    this.$store.dispatch("nocloud/auth/load");

    this.$router.beforeEach((to, _, next) => {
      const mustBeLoggined = to.matched.some((el) => !!el.meta?.mustBeLoggined);

      if (mustBeLoggined && !this.loggedIn) {
        next({ name: "login" });
      }
      else if (to.name == "login" && this.loggedIn) next({ name: "root" });
      else next();
    });

    const lang = localStorage.getItem("lang");
    if (lang != undefined) this.$i18n.locale = lang;
    if (this.loggedIn) {
      this.$store.dispatch("nocloud/auth/fetchUserData");
    }
  },
  mounted() {
    this.$router.onReady(() => {
      const route = this.$router.currentRoute;
      const isLogged = this.loggedIn;
      const mustBeLoggined = route.matched.some((el) => !!el.meta?.mustBeLoggined);

      if (mustBeLoggined && !isLogged) {
        this.$router.replace("login");
      }
    });

    document.title = "Cloud";
    document.body.setAttribute("style", 
      Object.entries(this.cssVars).map(([k, v]) => `${k}:${v}`).join(";")
    );
  },
  computed: {
    cssVars() {
      return Object.fromEntries(
        Object.entries(this.$config.colors).map(([key, val]) => [
          `--${key}`,
          val,
        ])
      );
    },
    loggedIn() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
    notification() {
      return this.$store.getters["app/getNotification"];
    }
  },
  watch: {
    notification(value) {
      if (!value) return;
      setTimeout(() => {
        const elements = document.querySelectorAll('.ant-notification-notice-close');
        const close = Array.from(elements);
        const open = () => {
          if (close.length > 1) close.pop();
          else this.$store.commit('app/setNotification', false);
        }

        close.forEach((el) => { el.addEventListener('click', open) });
      }, 100);
    }
  }
};
</script>

<style>
html {
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

html,
body {
  padding: 0;
  margin: 0;
  height: 100%;
}

#app {
  height: 100%;
}

.block-page::before {
  content: '';
  position: absolute;
  z-index: 1001;
  height: 100%;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
}

.slide-enter-active,
.slide-leave-active {
  /* transition: transform .5s; */
  transition: opacity 0.5s ease;
}
.slide-enter,
.slide-leave-to {
  /* transform: translateX(100%); */
  opacity: 0;
}
/* .slide-leave-to {
  transform: translateX(-100%);
} */
</style>
