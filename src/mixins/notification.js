export default {
  methods: {
    openNotificationWithIcon(type, opts) {
      this.$notification[type]({
        message: `${opts.message}`,
      });
    },
  },
};

