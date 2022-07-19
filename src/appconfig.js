export default {
	colors: {
		main: '#427cf7',
		success: '#0fd058',
		warn: '#f9f038',
		err: '#f9383b',
		gray: '#919191',
		bright_font: '#fff',
		bright_bg: '#f7f7f7',
	},

	autoTicketDepartment: 9,

	languages: ['en', 'ru', 'vi'],
	dangerModeNoSSLCheck: globalConfig.dangerModeNoSSLCheck ?? false,
	WHMCSsiteurl: globalConfig.WHMCSsiteurl,
	appFolder: globalConfig.appFolder ?? 'app_backend/v1',
	appTitle: globalConfig.appTitle ?? '',
	appLogo: {
		path: globalConfig.appLogo ?? '',
		pos: globalConfig.appLogoPosition.toLowerCase() || 'top'
	},
	currency: {
		prefix: globalConfig?.currency?.prefix ?? "",
		suffix: globalConfig?.currency?.suffix ?? "USD",
		code: globalConfig?.currency?.code ?? "USD",
	},
	services: {
		virtual: {
			groupname: ['Виртуальный хостинг'],
			creationRouteName: "service-virtual",
			icon: 'solution',
		},
		domains: {
			groupname: ['Domains'],
			creationRouteName: "service-domains",
			icon: 'solution',
		},
		SSL: {
			groupname: ['GoGet SSL 2.5.6', 'SSL', 'SSL сертификаты'],
			creationRouteName: "service-SSL",
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
		VM: {
			groupname: ['Self-Service VDS (2018)', 'Self-Service VDS SSD HC', 'Self-Service VDS SSD (2018)'],
			creationRouteName: "newPaaS",
			icon: 'database',
		},
		IaaS: {
			groupname: ['IaaS'],
			creationRouteName: "newVDC",
			icon: 'cloud-server',
		},
	},
	getServiceType(groupname){
		const services = this.services;
		for(let service in services){
			const serviceGroup = services[service].groupname;
			if(typeof serviceGroup == 'object'){
				const indexOf = serviceGroup.map(el=>el.toLowerCase()).indexOf(groupname.toLowerCase())
				if(indexOf != -1) return service;
			} else {
				if(serviceGroup.toLowerCase() == groupname.toLowerCase()) return service;
			}
		}
		return null;
	}
}