<template>
  <div id="app" :style="false && cssVars">
    <transition name="slide">
      <router-view :style="{
        position: 'absolute',
        width: '100%',
        height: (loggedIn) ? '100%' : 'auto'
      }" />
    </transition>
    <update-notification />
  </div>
</template>

<script>
import login from "./routes/login.vue";
import appMain from "./components/appMain/appMain.vue";
import updateNotification from "./components/updateNotification/index.vue";

export default {
  name: "app",
  components: {
    login,
    appMain,
    updateNotification,
  },
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
  },
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
