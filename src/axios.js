import axios from 'axios';
import config from './appconfig.js'
import https from 'https';

import store from '@/store';

const axiosConfig = {
	baseURL: config.WHMCSsiteurl + config.appFolder,
};

if(config.dangerModeNoSSLCheck){
	axiosConfig.httpsAgent = new https.Agent
	({
		rejectUnauthorized: false
	})
}

const ax = axios.create(axiosConfig);

ax.interceptors.response.use(response => {
	if (response.data.maintenance) {
		console.log(response, 'maintanance mode');
		store.commit('app/setMaintananceMode', response.data.maintenance);
	}
	
	return response
}, error => {
	return Promise.reject(error);
});
export default ax;