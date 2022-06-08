import md5 from 'md5';
import axios from '../axios';

export default {
	namespaced: true,

	state: {
		NICs: {},
		loading: false
	},
	mutations: {
		updateValue(state, field, value){
			state[field] = value;
		},
		updateNICs(state, value){
			state.NICs = value;
		},
		updateLoading(state, value){
			state.loading = value;
		}
	},
	actions: {
		silentFetchNICs(ctx){
			const user = ctx.rootGetters.getUser;
			const close_your_eyes = md5('userGetNICs' + user.id + user.secret);
			const auth = {
				userid: user.id,
				secret: close_your_eyes,
			};
			const url = `/userGetNICs.php?${URLparameter(auth)}`;
			axios.get(url)
			.then( res => {
				ctx.commit("updateNICs", res.data);
			})
			.catch( err => {
				console.error(err)
			})
			.finally( () => {
				ctx.commit("updateLoading", false);
			})
		},
		fetchNICs(ctx){
			ctx.commit("updateLoading", true);
			ctx.dispatch("silentFetchNICs");
		}
	},
	getters: {
		getNICpublic(state){
			if(Object.keys(state.NICs).length > 0){
				return state.NICs['PUBLIC']['AR'];
			} else {
				return [];
			}
		},
		getNICs(state){
			return state.NICs
		},
		getNICloading(state){
			return state.loading
		}
	}
}

function URLparameter(obj, outer = ''){
	var str = "";
	for (var key in obj) {
		if(key == "price") continue;
		if (str != "") {
				str += "&";
		}
		if(typeof obj[key] == 'object') {
			str += this.URLparameter(obj[key], outer+key);
		} else {
			str += outer + key + "=" + encodeURIComponent(obj[key]);
		}
	}
	return str;
}