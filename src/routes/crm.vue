<template>
  <iframe :src="src"></iframe>
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
      const src = `${FRAME}/?a=${btoa(JSON.stringify(params))}&${this.makeid(
        6
      )}=${this.makeid(10)}`;

      return src;
    },
  },
};
</script>
