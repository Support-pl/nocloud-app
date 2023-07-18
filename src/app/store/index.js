import Vue from 'vue'
import vuex from 'vuex'
import app from './app'
import user from './user'
import cloud from './cloud'
import support from './support'
import invoices from './invoices'
import newVDC from './newVDC'
import newPaaS from './newPaaS'
import network from './network'
import products from './products'
import utils from './utils'
import nocloud from './nocloud'
import chats from './nocloud/chats'

nocloud.modules.chats = chats;
Vue.use(vuex)

export default new vuex.Store({
	modules: {
		app,
		user,
		cloud,
		support,
		invoices,
		newVDC,
		newPaaS,
		network,
		products,
		utils,
		nocloud
	}
})
