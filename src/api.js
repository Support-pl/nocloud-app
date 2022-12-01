import Api from 'nocloudjsrest';
import vuex from '@/store/index.js'

const api = new Api('http://localhost/https://api.nc-crm-test.nocloud.zone/',8624);

api.axios.interceptors.response.use((response) => response, (error) => {
	if (error.response && error.response?.data?.code === 7) {
		console.log('credentials are not actual');
		vuex.dispatch("nocloud/auth/logout")
	}
	return Promise.reject(error) // this is the important part
})

export default api;
