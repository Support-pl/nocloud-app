<template>
	<div class="btn">
		<a-button block @click.stop="moduleEnter">{{$t('renew') | capitalize}}</a-button>
	</div>
</template>

<script>
export default {
	props: ['service'],
	methods: {
		moduleEnter(){
			this.$confirm({
        title: this.$t("Do you want to renew server?"),
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        onOk: () => {
          const data = { uuid: this.service.orderid, action: "manual_renew" };

          return this.$store.dispatch("nocloud/vms/actionVMInvoke", data)
            .then(() => {
              this.openNotificationWithIcon("success", { message: `Done!` });
            })
            .catch((err) => {
              this.openNotificationWithIcon("error", {
                message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
              });
            });
        },
        onCancel() {},
      });
		}
	}
}
</script>

<style scoped>
.btn{
  width: fit-content;
	margin-right: 20px;
}

.btn button{
	height: 100%;
}
</style>
