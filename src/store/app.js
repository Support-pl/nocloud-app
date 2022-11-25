import router from "../router/index.js";
/*
ROUTER WORKS THERE!
*/
export default {
  namespaced: true,

  state: {
    notification: false,
    activeTabName: "",
    activeTabNum: -1,
    buttons: [
      // {
      // 	icon: 'database',
      // 	title: 'cloud',
      // 	theme: 'filled'
      // },
      // {
      // 	icon: 'appstore',
      // 	title: 'services',
      // 	theme: 'outlined'
      // },
      // {
      // 	icon: 'message',
      // 	title: 'support',
      // 	theme: 'outlined'
      // },
      // {
      // 	icon: 'credit-card',
      // 	title: 'invoice',
      // 	theme: 'outlined'
      // },
      // {
      // 	icon: 'setting',
      // 	title: 'settings',
      // 	theme: 'filled'
      // },
      {
        icon: "message",
        title: "crm",
        theme: "filled",
      },
    ],
    update: {
      worker: null,
      status: false,
    },
    currencyPostfix: "",
    maintananceMode: false,
  },
  mutations: {
    setActiveTabName(state, value) {
      state.activeTabName = value;
    },
    setActiveTabNum(state, value) {
      state.activeTabNum = value;
    },
    setUpdate(state, value) {
      state.update = value;
    },
    setCurrencyPostfix(state, value) {
      state.currencyPostfix = value;
    },
    setMaintananceMode(state, value) {
      state.maintananceMode = value;
    },
    setNotification(state, value) {
      state.notification = value;
    },
  },
  actions: {
    setTabByName(ctx, value) {
      if (value == "root") value = "services";
      ctx.commit("setActiveTabName", value);
      ctx.commit(
        "setActiveTabNum",
        ctx.getters.getButtons.findIndex((el) => el.title == value)
      );
      if (
        router.currentRoute.name != ctx.getters.getActiveTab.title ||
        Object.keys(router.currentRoute.query).length > 0
      )
        router.push({
          name: ctx.getters.getActiveTab.title,
        });
      console.log(ctx.getters.getActiveTab.title);
    },
    setTabByNum(ctx, value) {
      ctx.commit("setActiveTabNum", value);
      ctx.commit("setActiveTabName", ctx.getters.getButtons[value].title);
      if (router.currentRoute.name != ctx.getters.getActiveTab.title)
        router.push({
          name: ctx.getters.getActiveTab.title,
        });
    },
    setTabByNameNoRoute(ctx, value) {
      console.log(value);
      if (value == "root") value = "services";
      ctx.commit("setActiveTabName", value);
      ctx.commit(
        "setActiveTabNum",
        ctx.getters.getButtons.findIndex((el) => el.title == value)
      );
    },
  },
  getters: {
    getButtons(state) {
      return state.buttons;
    },
    isNeedReloadToBeUpdated(state) {
      return state.update;
    },
    getActiveTab(state) {
      return {
        title: state.activeTabName,
        index: state.activeTabNum,
      };
    },
    currencyPostfix(state) {
      return state.currencyPostfix;
    },
    isMaintananceMode(state) {
      return state.maintananceMode;
    },
    getNotification(state) {
      return state.notification;
    },
  },
};
