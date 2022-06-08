export default {
  methods: {
    openNotificationWithIcon(type, opts) {
      this.$notification[type]({
        description: `${opts.message}`,
      });
    },
  },
};

