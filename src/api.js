import Api from 'nocloudjsrest';
import vuex from '@/store/index.js'

const api = new Api('https://api.nc-crm-test.nocloud.zone/api');

api.axios.interceptors.response.use((response) => response, (error) => {
	if (error.response && error.response?.data?.code === 7) {
		console.log('credentials are not actual');
		vuex.dispatch("nocloud/auth/logout")
	}
	return Promise.reject(error) // this is the important part
})

export default api;
