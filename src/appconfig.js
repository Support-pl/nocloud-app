import * as icons from "@ant-design/icons-vue";

const config = localStorage.getItem("globalConfig");

if (config) globalThis.globalConfig = JSON.parse(config);
const { globalConfig } = globalThis;

export default {
  colors: globalConfig.app?.colors,
  department: globalConfig.department,

  languages: globalConfig.languages ?? ["en"],
  vdcEnabled: globalConfig.vdc_enabled ?? false,
  sharedEnabled: globalConfig.shared_enabled ?? false,
  cloudEnabled: globalConfig.cloud_enabled ?? false,

  whmcsSiteUrl: globalConfig.whmcs?.site_url ?? "",
  whmcsRegistration: globalConfig.whmcs?.registration ?? false,
  dnsEditor: globalConfig.dnsEditor?.enabled ?? false,
  whmcsActs: globalConfig.whmcs?.acts ?? false,
  sharedFolder: globalConfig.app?.shared_folder ?? "virtualHosting",

  appTitle: globalConfig.app?.title ?? "",
  appLogo: {
    path: globalConfig.app?.logo ?? "",
    pos: globalConfig.app?.logo_position.toLowerCase() || "top",
  },

  services: {
    virtual: {
      groupname: ["Виртуальный хостинг", "Shared Hosting"],
      creationRouteName: "service-virtual",
      icon: icons.SolutionOutlined,
    },
    domains: {
      groupname: ["Domains"],
      creationRouteName: "service-domains",
      icon: icons.SolutionOutlined,
    },
    ssl: {
      groupname: ["GoGet SSL 2.5.6", "SSL", "SSL сертификаты"],
      creationRouteName: "service-ssl",
      icon: icons.LockOutlined,
      additionalRoutes: [
        {
          path: "SSL/generator/:id",
          name: "generator-SSL",
          meta: {
            footerTitle: "services",
            isNeedBackButton: true,
            headerTitle: "CSR generator",
          },
          componentName: "generator",
        },
      ],
    },
    vm: {
      groupname: [
        "Self-Service VDS (2018)",
        "Self-Service VDS SSD HC",
        "Self-Service VDS SSD (2018)",
      ],
      creationRouteName: "newPaaS",
      icon: icons.DatabaseOutlined,
    },
    iaas: {
      groupname: ["VDS SSD", "VDC IaaS"],
      creationRouteName: "service-iaas",
      icon: icons.ShoppingOutlined,
    },
    acronis: {
      groupname: ["Acronis"],
      creationRouteName: "service-acronis",
      icon: icons.RollbackOutlined,
    },
    custom: {
      groupname: ["Custom"],
      creationRouteName: "service-custom",
      icon: icons.AppstoreOutlined,
    },
    vpn: {
      groupname: ["VPN"],
      creationRouteName: "service-vpn",
      icon: icons.AppstoreOutlined,
    },
    openai: {
      groupname: ["OpenAI"],
      creationRouteName: "service-openai",
      icon: icons.RobotOutlined,
    },
    vdc: {
      groupname: ["VDC"],
      creationRouteName: "newVDC",
      icon: icons.ClusterOutlined,
    },
  },
  getServiceType(groupname) {
    const services = this.services;
    for (const service in services) {
      const serviceGroup = services[service].groupname;
      if (typeof serviceGroup === "object") {
        const indexOf = serviceGroup
          .map((el) => el.toLowerCase())
          .indexOf(groupname?.toLowerCase());
        if (indexOf !== -1) return service;
      } else {
        if (serviceGroup.toLowerCase() === groupname?.toLowerCase())
          return service;
      }
    }
    return null;
  },
};
