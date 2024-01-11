import { createRouter, createWebHistory } from 'vue-router'
import i18n from '@/i18n'
import config from '@/appconfig.js'
import appMain from '@/components/layout/appMain.vue'

const components = import.meta.glob('@/components/services/*/*.vue')
const servicesArray = config.services
const services = []

for (const service in servicesArray) {
  const component = Object.keys(components).find((key) =>
    key.includes(`/${service}/index.vue`)
  )

  const temp = {
    path: service,
    name: `service-${service}`,
    meta: {
      footerTitle: 'services',
      isNeedBackButton: true,
      isNeedBalance: true,
      headerTitle: service,
      componentName: service,
      productsGroupName: servicesArray[service].groupname
    },
    component: () => components[component]()
  }
  if (config.services[service].additionalRoutes) {
    for (const additionalRoute of config.services[service].additionalRoutes) {
      const component = Object.keys(components).find((key) =>
        key.includes(`/${additionalRoute.componentName}.vue`)
      )

      const route = {
        path: additionalRoute.path,
        name: additionalRoute.name,
        meta: additionalRoute.meta,
        component: () => components[component]()
      }
      services.push(route)
    }
  }
  services.push(temp)
}

const routes = [
  {
    path: '/login',
    name: 'login',
    meta: {
      mustBeLoggined: false,
      mustBeUnloggined: true
    },
    component: () => import('@/routes/authorization/login.vue')
  },
  {
    path: '/register',
    name: 'register',
    meta: {
      mustBeLoggined: false,
      mustBeUnloggined: true
    },
    component: () => import('@/routes/authorization/register.vue')
  },
  {
    path: '/handsfree',
    name: 'handsfree',
    meta: {
      mustBeLoggined: true
    },
    component: () => import('@/routes/support/handsfree.vue')
  },
  {
    path: '/',
    component: appMain,
    children: [
      {
        path: '/',
        name: 'root',
        meta: {
          // mustBeLoggined: true
        },
        component: () => import('@/routes/services/services.vue')
      },
      {
        path: 'services',
        name: 'services',
        meta: {
          // mustBeLoggined: true,
        },
        component: () => import('@/routes/services/services.vue')
      },
      ...services,
      {
        path: 'products',
        name: 'products',
        meta: {
          // mustBeLoggined: true,
          layoutTitle: 'services',
          isNeedBackButton: true
        },
        component: () => import('@/routes/services/products.vue')
      },
      {
        path: 'support',
        name: 'support',
        meta: {
          mustBeLoggined: true
        },
        component: () => import('@/routes/support/support.vue')
      },
      {
        path: 'billing',
        name: 'billing',
        meta: {
          mustBeLoggined: true
        },
        component: () => import('@/routes/invoices/invoice.vue')
      },
      {
        path: 'settings',
        name: 'settings',
        meta: {
          mustBeLoggined: true
        },
        component: () => import('@/routes/settings/settings.vue')
      },
      {
        path: 'cloud/newVM',
        name: 'newPaaS',
        meta: {
          footerTitle: 'cloud',
          isFromRoute: true
        },
        component: () => import('@/routes/cloud/createPaas.vue')
      },
      {
        path: 'cloud/newVDC',
        name: 'newVDC',
        meta: {
          // mustBeLoggined: true,
          footerTitle: 'cloud'
        },
        component: () => import('@/routes/cloud/createVdc.vue')
      },
      {
        path: 'service/:id',
        name: 'service',
        meta: {
          mustBeLoggined: true,
          footerTitle: 'services',
          headerTitle: 'service',
          isNeedBackButton: true
        },
        component: () => import('@/routes/services/servicePage.vue')
      },
      {
        path: 'service/:id/certificate',
        name: 'certificate',
        meta: {
          mustBeLoggined: true,
          headerTitle: i18n.global.t('ssl_product.certificate_configuration'),
          isNeedBackButton: true
        },
        props: true,
        component: () => import('@/routes/services/certificate.vue')
      },
      {
        path: 'service/:id/certificate/csr',
        name: 'csr',
        meta: {
          mustBeLoggined: true,
          headerTitle: 'CSR',
          isNeedBackButton: true
        },
        component: () => import('@/components/services/ssl/generator.vue')
      },
      {
        path: 'service/:id/ssl',
        name: 'ssl',
        meta: {
          mustBeLoggined: true,
          headerTitle: 'SSL certificate',
          isNeedBackButton: true
        },
        component: () => import('@/routes/services/ssl.vue')
      }, {
        path: 'vdc/:uuid',
        name: 'openVDC',
        component: () => import('@/routes/cloud/vdcPage.vue'),
        meta: {
          mustBeLoggined: true,
          footerTitle: 'services',
          isNeedBackButton: true,
          isNeedBalance: true,
          headerTitle: 'VDC'
        }
      },
      {
        path: 'cabinet',
        name: 'cabinet',
        meta: {
          mustBeLoggined: true,
          footerTitle: 'settings',
          headerTitle: 'settings',
          isNeedBackButton: true
        },
        component: () => import('@/routes/settings/userPage.vue')
      }
    ]
  },

  {
    path: '/cloud/:uuid',
    name: 'openCloud',
    component: () => import('@/routes/cloud/cloudPage.vue'),
    meta: {
      mustBeLoggined: true
    }
  },
  {
    path: '/cloud/:uuid/vnc',
    name: 'VNC',
    component: () => import('@/routes/cloud/vnc.vue')
  },
  {
    path: '/ticket/:id',
    name: 'ticket',
    meta: {
      mustBeLoggined: true
    },
    component: () => import('@/routes/support/chatPage.vue')
  },
  {
    path: '/invoice/:uuid',
    name: 'invoiceFS',
    meta: {
      mustBeLoggined: true
    },
    component: () => import('@/routes/invoices/invoicePage.vue')
  },
  {
    path: '/transaction/:uuid',
    name: 'transaction',
    meta: {
      mustBeLoggined: true
    },
    component: () => import('@/routes/invoices/transactionPage.vue')
  }
]

export default createRouter({
  routes, history: createWebHistory(import.meta.env.BASE_URL)
})
