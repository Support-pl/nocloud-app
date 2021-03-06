 import Api from 'nocloudjsrest';
import vuex from '@/store/index.js'

// const api = new Api(
// 	"http://localhost/https://api.nocloud.ione-cloud.net/",
// 	8000
// );

const api = new Api(
	VUE_APP_BASE_URL
);


api.axios.interceptors.response.use(function (response) {
	return response;
}, function (error) {
	if (error.response && error.response?.data?.code === 7) {
		console.log('credentials are not actual');
		vuex.dispatch("nocloud/auth/logout")
	}
	return Promise.reject(error) // this is the important part
})

export default api;
