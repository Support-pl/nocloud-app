<template>
	<div class="btn">
		<a-button block @click.stop="logIntoCpanel">{{$t('enter') | capitalize}}</a-button>
	</div>
</template>

<script>
import api from "@/api.js"
import notification from "@/mixins/notification.js"

export default {
	props: ['service'],
  mixins: [notification],
	methods: {
		logIntoCpanel(){
			this.loginLoading = true;
      this.$store.dispatch('nocloud/auth/fetchBillingData')
        .then((user) => {
          api.get(`${this.baseURL}/cpanel.createSession.php`, { params: {
            serviceid: this.service.hostingid, userid: user.client_id
          }})
            .then(res => {
              if(res.result == 'error')
                throw res;
              if(res?.cpanelresult?.error){
                throw res;
              }
              window.open(res.data.url);
            })
            .catch(err => {
              const message = err.response?.data?.message ?? err.message ?? err;

              this.openNotificationWithIcon('error', {
                message: this.$t(message)
              });
              console.error(err);
            })
            .finally(() => {
              this.loginLoading = false;
            });
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          });
          console.error(err);
        });
		}
	},
  computed: {
    baseURL() {
      return this.$store.getters['products/getURL'];
    }
  }
}
</script>

<style scoped>
.btn{
  width: fit-content;
	margin: 0 20px 0 auto;
}

.btn button{
	height: 100%;
}
</style>
