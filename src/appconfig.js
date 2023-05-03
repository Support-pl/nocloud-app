const config = localStorage.getItem('globalConfig');

if (config) globalThis.globalConfig = JSON.parse(config);

export default {
	colors: globalConfig.app?.colors,

	autoTicketDepartment: 9,

	languages: globalConfig.languages ?? ['en'],
  sharedEnabled: globalConfig.sharedEnabled ?? false,
	dangerModeNoSSLCheck: globalConfig.dangerModeNoSSLCheck ?? false,
	WHMCSsiteurl: globalConfig.whmcs?.site_url ?? '',
	sharedFolder: globalConfig.app?.shared_folder ?? 'virtualHosting',
	appTitle: globalConfig.app?.title ?? '',
	appLogo: {
		path: globalConfig.app?.logo ?? '',
		pos: globalConfig.app?.logo_position.toLowerCase() || 'top'
	},
	currency: {
		prefix: globalConfig?.currency?.prefix ?? '',
		suffix: globalConfig?.currency?.suffix ?? 'USD',
		code: globalConfig?.currency?.code ?? 'USD',
	},
	services: {
    virtual: {
      groupname: ['Виртуальный хостинг', 'Shared Hosting'],
      creationRouteName: 'service-virtual',
      icon: 'solution',
    },
    domains: {
      groupname: ['Domains'],
      creationRouteName: 'service-domains',
      icon: 'solution',
    },
    ssl: {
      groupname: ['GoGet SSL 2.5.6', 'SSL', 'SSL сертификаты'],
      creationRouteName: 'service-ssl',
      icon: 'lock',
      additionalRoutes: [
        {
          path: 'SSL/generator/:id',
          name: `generator-SSL`,
          meta: {
            footerTitle: 'services',
            isNeedBackButton: true,
            headerTitle: 'CSR generator',
          },
          componentName: 'generator'
        }
      ]
    },
    vm: {
      groupname: ['Self-Service VDS (2018)', 'Self-Service VDS SSD HC', 'Self-Service VDS SSD (2018)'],
      creationRouteName: 'newPaaS',
      icon: 'database',
    },
    iaas: {
      groupname: ['VDS SSD', 'VDC IaaS'],
      creationRouteName: 'service-iaas',
      icon: 'shopping',
    }
  },
	getServiceType(groupname){
		const services = this.services;
		for(let service in services){
			const serviceGroup = services[service].groupname;
			if(typeof serviceGroup == 'object'){
				const indexOf = serviceGroup.map(el=>el.toLowerCase()).indexOf(groupname?.toLowerCase())
				if(indexOf != -1) return service;
			} else {
				if(serviceGroup.toLowerCase() == groupname?.toLowerCase()) return service;
			}
		}
		return null;
	}
}
