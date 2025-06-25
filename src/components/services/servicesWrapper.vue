<template>
  <div
    class="services__wrapper"
    :style="{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }"
  >
    <a-badge
      v-for="service in avaliableServices"
      :key="service.title"
      count="+"
      style="width: 100%"
      :number-style="{
        width: 'auto',
        fontSize: '20px',
        transform:
          hovered === service.title
            ? 'none'
            : 'scale(0) translate(-20px, -20px)',
        backgroundColor: 'var(--bright_font)',
        boxShadow: '0 0 0 1px var(--main)',
        color: 'var(--main)',
        cursor: 'pointer',
        transition: '0.3s',
      }"
      @click="newProductHandler(service)"
      @mouseover="hovered = service.title"
      @mouseleave="hovered = null"
    >
      <service-item
        v-if="!service.needLogin || isLogged"
        :key="service.title"
        :service="service"
        :products-count="productsCount"
        @mouseover="hovered = service.title"
        @mouseleave="hovered = null"
      />
    </a-badge>
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue";
import * as icons from "@ant-design/icons-vue";
import { mapState } from "pinia";
import config from "@/appconfig.js";

import { useSpStore } from "@/stores/sp.js";
import { useAuthStore } from "@/stores/auth.js";
import { useProductsStore } from "@/stores/products.js";

import serviceItem from "@/components/services/serviceItem.vue";

const solutionIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SolutionOutlined")
);
const clusterIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ClusterOutlined")
);
const shoppingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ShoppingOutlined")
);
const formIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FormOutlined")
);

const dnsEditorIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/UnorderedListOutlined")
);

export default {
  name: "ServicesWrapper",
  components: { serviceItem },
  props: {
    productsCount: { type: Function, required: true },
  },
  data() {
    return {
      hovered: null,
      srvs: [
        {
          title: "Servers",
          translatable: true,
          icon: "database",
          type: "vm",
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: "cloud" }],
          },
        },
        {
          title: "Cloud",
          translatable: true,
          icon: "cloud-server",
          type: "cloud",
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: "cloud", query: { type: "iaas" } }],
          },
        },
        {
          title: "SSL",
          icon: "lock",
          type: "ssl",
          onclick: {
            // function: this.openNotification,
            // paramsArr: [{name: 'services'}],
            function: this.routeTo,
            paramsArr: [{ name: "products", query: { type: "ssl" } }],
          },
        },
        {
          title: "Domains",
          translatable: true,
          icon: "global",
          type: "domains",
          onclick: {
            // function: this.openNotification,
            // paramsArr: [{name: 'services'}],
            function: this.routeTo,
            paramsArr: [{ name: "products", query: { type: "domains" } }],
          },
        },
      ],
    };
  },
  computed: {
    ...mapState(useAuthStore, ["isLogged", "baseURL"]),
    ...mapState(useProductsStore, ["services"]),
    ...mapState(useSpStore, ["servicesProviders", "showcases"]),

    avaliableServices() {
      const services = [];

      if (config.sharedEnabled) {
        services.push({
          title: "Virtual",
          translatable: true,
          icon: solutionIcon,
          type: "virtual",
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: "products", query: { service: "Virtual" } }],
          },
        });
      }

      if (config.vdcEnabled) {
        services.push({
          title: "VDC",
          translatable: false,
          icon: clusterIcon,
          type: "VDC",
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: "products", query: { service: "VDC" } }],
          },
        });
      }

      Object.keys(this.services).forEach((service) => {
        services.push({
          title: service,
          icon: shoppingIcon,
          type: service,
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: "products", query: { service } }],
          },
        });
      });

      this.showcases
        .filter((showcase) => showcase?.meta?.type !== "ione-vpn")
        .forEach((showcase) => {
          services.push({
            ...showcase,
            icon: icons[showcase.icon] ?? showcase.icon,
            onclick: {
              function: this.routeTo,
              paramsArr: [
                { name: "products", query: { service: showcase.uuid } },
              ],
            },
          });
        });

      if (config.whmcsRegistration) {
        services.push({
          title: "registration in BelGIE",
          translatable: true,
          icon: formIcon,
          type: "BelGIE",
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: "registration form", query: {} }],
          },
        });
      }

      if (config.dnsEditor) {
        services.push({
          title: "DNS Editor",
          translatable: true,
          icon: dnsEditorIcon,
          type: "DNSEditor",
          onclick: {
            function: this.routeTo,
            paramsArr: [{ name: "dns editor", query: {} }],
          },
        });
      }

      services.sort((a, b) => {
        if (a.icon === "shopping" && b.icon !== "shopping") return -1;
        if (b.icon === "shopping" && a.icon !== "shopping") return 1;
        if (a.icon === "shopping" && b.icon === "shopping") return 0;
        return a.sorter - b.sorter;
      });

      return services;
    },
    columnsCount() {
      let count = 5;
      if (document.documentElement.clientWidth < 575) count = 3;

      return this.avaliableServices.length < count
        ? this.avaliableServices.length
        : count;
    },
  },
  methods: {
    routeTo(param) {
      this.$router.push(param);
    },
    openNotification() {
      this.$notification.info({
        key: "coming soon",
        message: "Coming soon",
        // description:
        //   'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
        onClick: () => {
          // console.log('Notification Clicked!');
        },
      });
    },
    newProductHandler(service) {
      const provider = service.onclick.paramsArr[0].query.service;
      let showcase = null;

      const { type } =
        this.servicesProviders.find(({ uuid }) => {
          showcase = this.showcases.find(({ uuid }) => uuid === provider);

          return showcase?.items?.find(
            ({ servicesProvider }) => servicesProvider === uuid
          );
        }) ?? {};

      let name = "service-virtual";
      const query = { service: provider };

      switch (type) {
        case "opensrs":
          name = "service-domains";
          break;
        case "goget":
          name = "service-ssl";
          break;
        case "acronis":
          name = "service-acronis";
          break;
        case "empty":
        case "virtual":
          if (showcase.title.toLowerCase().includes("vpn")) {
            name = "service-vpn";
          } else {
            name = "service-custom";
          }
          query.headerTitle =
            showcase.promo?.[this.$i18n.locale]?.title ?? showcase.title;
          break;
        case "openai":
          name = "service-openai";
          query.headerTitle =
            showcase.promo?.[this.$i18n.locale]?.title ||
            showcase.title ||
            "ChatGPT";
          break;
        case "bots":
          name = "service-bots";
          query.headerTitle =
            showcase.promo?.[this.$i18n.locale]?.title ||
            showcase.title ||
            "AIBot";
          break;
        case "ione":
        case "ovh":
        case "keyweb":
          name = "newPaaS";
      }

      if (!type && this.services[provider]) {
        name = "service-iaas";
      }
      if (service.type === "VDC") {
        name = "newVDC";
      }
      if (service.type === "BelGIE") {
        name = "registration form";
      }
      if (service.type === "DNSEditor") {
        name = "dns editor";
      }

      this.$router.push({ name, query });
    },
  },
};
</script>

<style>
.services__wrapper {
  /* background-color: red; */
  display: grid;
  grid-gap: 5px;
  grid-template-columns: repeat(5, 1fr);
}
</style>
