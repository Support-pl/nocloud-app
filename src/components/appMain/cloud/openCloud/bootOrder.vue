<template>
	<div class="bootOrder">
		<div v-for="(item, key) in order" :key="key">
			<a-row type="flex" justify="space-around" align="middle" :gutter="[0, 10]">
				<a-col :span='1'>
					<a-checkbox v-model="order[key].inBoot" @click="changeInBoot(key)"/>
				</a-col>
				<a-col :span='4'>
					{{item.shortname}}
				</a-col>
				<a-col :span='10'>
					<a-icon :type="item.IMAGE ? 'container': 'global'"></a-icon>
					{{item.IMAGE || item.NETWORK}}
				</a-col>
				<a-col :span='4'>
					<a-button-group>
						<a-button icon="arrow-up" @click="moveUp(key)"></a-button>
						<a-button icon="arrow-down" @click="moveDown(key)"></a-button>
					</a-button-group>
				</a-col>
			</a-row>
		</div>
		<a-row type="flex" justify="end">
			<a-col>
				<div class="footer" style="margin-top: 20px">
					<a-button @click="discardChanges" :loading="loading">
            {{ $t('Discard') }}
          </a-button>
					<a-button type="primary" style="margin-left: 10px" @click="sendNewBootOrder" :loading="loading">
            {{ $t('Accept') }}
          </a-button>
				</div>

			</a-col>
		</a-row>
	</div>
</template>

<script>
export default {
	name: 'BootOrder',
	data(){
		return {
			order: [],
			orderBuffer: [],
			loading: false,
		}
	},
	methods: {
		URLparameter(obj, outer = ''){
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
		},
		moveUp(index){
			if(index <= 0){
				return;
			}
			let newarr = Object.assign([], this.order);
			let temp = newarr[index - 1];
			newarr[index - 1] = newarr[index];
			newarr[index] = temp;
			this.order = newarr;
		},
		moveDown(index){
			if(index >= this.order.length - 1){
				return;
			}
			let newarr = Object.assign([], this.order);
			let temp = newarr[index + 1];
			newarr[index + 1] = newarr[index];
			newarr[index] = temp;
			this.order = newarr;
		},
		discardChanges(){
			this.order = JSON.parse(JSON.stringify(this.orderBuffer));
		},
		sendNewBootOrder(){
			let newOrder = this.order.filter( el => el.inBoot ).map( el => el.shortname )
			newOrder = newOrder.join(',');

			
			const user = this.user;
			const vmid = this.SingleCloud.ID;

			const close_your_eyes = btoa('VMChangeBootOrder' + user.id + user.secret);
			const auth = {
				userid: user.id,
				vmid,
				secret: close_your_eyes,
			};
			const actionParams = {
				newOrder
			}
			const query = Object.assign(auth, actionParams);
			const url = `/VMChangeBootOrder.php?${this.URLparameter(query)}`;
			this.loading = true;
			this.$axios.get(url)
			.then( res => {
				if(res.data.result == 'success')
					this.$message.success(`Boot order changed`);
				else{
					this.$message.error(`Boot order failed`);
					console.error(res.data);
				}
			})
			.catch( err => {
				console.error(err)
			})
			.finally( () => {
				this.$store.dispatch('cloud/silentUpdate', this.$route.params.pathMatch);
				this.$emit("onEnd", true)
				this.loading = false;
			})
		},
		changeInBoot(index){
			let temp = JSON.parse(JSON.stringify(this.order));
			temp[index]['inBoot'] = !temp[index]['inBoot'];
			this.order = JSON.parse(JSON.stringify(temp));
		}
	},
	mounted() {
		for(let key in this.getBootDevisesShortnameList){
			this.order.push(this.getBootDevisesShortnameList[key]);
			this.order[this.order.length-1]['inBoot'] = !!~this.getCurrentBootOrder.indexOf(key);
			this.order[this.order.length-1]['shortname'] = key;
		}
		this.order = this.order.sort( (a,b) => b.inBoot - a.inBoot );
		this.orderBuffer = JSON.parse(JSON.stringify(this.order));
	},
	computed: {
    SingleCloud() {
      return this.$store.getters['getOpenedCloud'];
    },
		user() {
      return this.$store.getters['getUser'];
    },
		getDisksShortnameList(){
			return this.SingleCloud.DISKS.reduce( (prev, next) => {
				// prev.push(`disk${next.DISK_ID}`);
				prev[`disk${next.DISK_ID}`] = next;
				return prev
			}, {});
		},
		getNICsShortnameList(){
			return this.SingleCloud.NIC.reduce( (prev, next) => {
				// prev.push(`nic${next.NIC_ID}`);
				prev[`nic${next.NIC_ID}`] = next;
				return prev
			}, {});
		},
		getBootDevisesShortnameList(){
			return Object.assign(this.getDisksShortnameList, this.getNICsShortnameList);
		},
		getCurrentBootOrder(){
			return this.SingleCloud.OS.BOOT.split(',')
		}
	}
}
</script>

<style>

</style>