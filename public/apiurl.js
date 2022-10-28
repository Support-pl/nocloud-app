globalThis.VUE_APP_BASE_URL = '';

fetch('./config.json')
  .then((res) => res.json())
  .then((res) => globalThis.globalConfig = res);