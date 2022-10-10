export default {
  methods: {
    openNotificationWithIcon(type, opts) {
      this.$notification.close(opts.message);
      this.$notification[type]({
        key: `${opts.message}`,
        message: `${opts.message}`,
        duration: (type === 'error') ? 0 : 4.5
      });

      if (type === 'error') {
        this.$store.commit('app/setNotification', true);
      }
    },
  },
};

