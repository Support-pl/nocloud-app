<template>
  <iframe allow="clipboard-read; clipboard-write" :src="src"></iframe>
</template>

<script>
export default {
  name: "crm-view",
  methods: {
    makeid(length) {
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    },
    logoutFormChild() {
      this.$store.commit("logout");
      this.$store.dispatch("nocloud/auth/logout");
      this.$router.push({ name: "login" });
      localStorage.removeItem("data");
    },
  },
  mounted() {
    window.document.addEventListener("logoutChild", this.logoutFormChild);
  },
  computed: {
    src() {
      const params = {
        token: this.$store.state.nocloud.auth.token,
        // title: as.me.title,
        // namespace: nss.selected,
        // theme: as.theme,
        // api: baseURL,
        // vars: plugin.value.vars,
      };
      const src = `https://crm.nc-crm-test.nocloud.zone/?a=${btoa(
        JSON.stringify(params)
      )}&${this.makeid(6)}=${this.makeid(10)}`;

      return src;
    },
  },
};
</script>
