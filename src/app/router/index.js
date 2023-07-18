import Vue from 'vue'
import VueRouter from 'vue-router'
import appMain from '@/widgets/appMain/appMain.vue'
import config from '@/shared/config/appconfig'
import i18n from '@/app/i18n'

Vue.use(VueRouter)

const components = import.meta.glob('@/widgets/services/*/*.vue')
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
    component: () => import('@/pages/login.vue')
  },
  {
    path: '/register',
    name: 'register',
    meta: {
      mustBeLoggined: false,
      mustBeUnloggined: true
    },
    component: () => import('@/pages/register.vue')
  },
  {
    path: '/',
    component: appMain,
    children: [
      {
        path: '/',
        name: 'root',
        meta: {
          layoutTitle: 'services',
          mustBeLoggined: true
        },
        component: () => import('@/pages/services.vue')
      },
      {
        path: 'services',
        name: 'services',
        meta: {
          // mustBeLoggined: true,
        },
        component: () => import('@/pages/services.vue')
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
        component: () => import('@/pages/products.vue')
      },
      {
        path: 'support',
        name: 'support',
        meta: {
          mustBeLoggined: true
        },
        component: () => import('@/pages/support.vue')
      },
      {
        path: 'invoice',
        name: 'invoice',
        meta: {
          mustBeLoggined: true
        },
        component: () => import('@/pages/invoice.vue')
      },
      {
        path: 'settings',
        name: 'settings',
        meta: {
          mustBeLoggined: true
        },
        component: () => import('@/pages/settings.vue')
      },
      {
        path: 'cloud/newVM',
        name: 'newPaaS',
        meta: {
          footerTitle: 'cloud',
          isFromRoute: true
        },
        component: () => import('@/widgets/appMain/newPaaS.vue')
      },
      {
        path: 'cloud/newVDC',
        name: 'newVDC',
        meta: {
          // mustBeLoggined: true,
          footerTitle: 'cloud'
        },
        component: () => import('@/widgets/appMain/newVDC.vue')
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
        component: () => import('@/pages/userService.vue')
      },
      {
        path: 'service/:id/certificate',
        name: 'certificate',
        meta: {
          mustBeLoggined: true,
          headerTitle: i18n.t('ssl_product.certificate_configuration'),
          isNeedBackButton: true
        },
        props: true,
        component: () => import('@/pages/ssl/certificate.vue')
      },
      {
        path: 'service/:id/certificate/csr',
        name: 'csr',
        meta: {
          mustBeLoggined: true,
          headerTitle: 'CSR',
          isNeedBackButton: true
        },
        component: () => import('@/pages/ssl/csr.vue')
      },
      {
        path: 'service/:id/ssl',
        name: 'ssl',
        meta: {
          mustBeLoggined: true,
          headerTitle: 'SSL certificate',
          isNeedBackButton: true
        },
        component: () => import('@/pages/ssl/ssl.vue')
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
        component: () => import('@/pages/userSettings.vue')
      }
    ]
  },
  {
    path: '/cloud/:uuid',
    name: 'openCloud_new',
    component: () => import('@/widgets/appMain/cloud/openCloud_new.vue'),
    meta: {
      mustBeLoggined: true
    }
  },
  {
    path: '/cloud/*',
    component: () => import('@/widgets/appMain/cloud/cloudRouter.vue'),
    meta: {
      mustBeLoggined: true
    },
    children: [
      {
        path: 'vnc',
        name: 'VNC',
        component: () => import('@/widgets/appMain/cloud/vnc.vue')
      },
      {
        path: '*',
        redirect: to => `/cloud-${to.params.uuid}`
      },
      {
        path: '',
        name: 'openCloud',
        component: () => import('@/widgets/appMain/cloud/openCloud_new.vue')
      }
    ]
  },
  {
    path: '/ticket-*',
    name: 'ticket',
    meta: {
      mustBeLoggined: true
    },
    component: () => import('@/widgets/appMain/support/ticketchat.vue')
  },
  {
    path: '/invoice/:uuid',
    name: 'invoiceFS',
    meta: {
      mustBeLoggined: true
    },
    component: () => import('@/widgets/appMain/invoice/openInvoice.vue')
  },
  {
    path: '/transaction/:uuid',
    name: 'transaction',
    meta: {
      mustBeLoggined: true
    },
    component: () => import('@/widgets/appMain/invoice/openTransaction.vue')
  }
]

const router = new VueRouter({ mode: 'history', routes })

export default router
