export default {
  methods: {
    openNotificationWithIcon(type, opts) {
      this.$notification[type]({
        message: `${opts.message}`,
        duration: (type === 'error') ? 0 : 4.5
      });
    },
  },
};

