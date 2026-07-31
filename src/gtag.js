import VueGtag from "vue-gtag";

let app = null;
let router = null;
let initialized = false;

export function registerGtagTargets(vueApp, vueRouter) {
  app = vueApp;
  router = vueRouter;
}

export function initGtag() {
  if (initialized || !app) return;
  initialized = true;
  app.use(VueGtag, { config: { id: VUE_APP_GA_ID } }, router);
}

export function isGtagInitialized() {
  return initialized;
}
