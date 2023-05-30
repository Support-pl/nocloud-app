<template>
	<div class="services">
		<div class="container">
			<services-wrapper class="services__block" />
      <user-products class="services__block" :min="false" />

      <a-pagination
        show-size-changer
        style="width: fit-content; margin: 0 0 20px auto"
        v-if="products.length > 0"
        :page-size-options="pageSizeOptions"
        :page-size="pageSize"
        :total="totalSize"
        :current="currentPage"
        @showSizeChange="onShowSizeChange"
        @change="onShowSizeChange"
      />
		</div>
	</div>
</template>

<script>
import servicesWrapper from '@/components/services/services_wrapper.vue';
import userProducts from '@/components/userProducts/userProducts.vue';

export default {
	name: "page-services",
	components: { servicesWrapper, userProducts },
  data: () => ({
    pageSizeOptions: ['5', '10', '25', '50', '100']
  }),
  computed: {
    products() {
      const products = this.$store.getters["products/getProducts"] ?? [];
      const instances = this.$store.getters["nocloud/vms/getInstances"] ?? [];

      if (this.$route.query.service) {
        return [...products, ...instances].filter(({ sp }) => {
          const { title } = this.sp.find(({ uuid }) => uuid === sp) ?? {};

          return this.checkedTypes.some((service) => service === title);
        });
      }
      return [...products, ...instances];
    },
    sp() {
      return this.$store.getters["nocloud/sp/getSP"];
    },
    checkedTypes() {
      return (
        this.$route.query?.service?.split(",").filter((el) => el.length > 0) ?? []
      );
    },

    currentPage() {
      return this.$store.getters["products/page"];
    },
    pageSize() {
      return this.$store.getters["products/size"];
    },
    totalSize() {
      return this.$store.getters["products/total"];
    }
  },
  methods: {
    onShowSizeChange(page, limit) {
      if (page !== this.currentPage) {
        this.$store.commit("products/setPage", page);
      }
      if (limit !== this.pageSize) {
        this.$store.commit("products/setSize", limit);
      }

      localStorage.setItem("servicesPagination", JSON.stringify({ page, limit }));
    }
  },
  mounted() {
    const pagination = localStorage.getItem("servicesPagination");

    if (!pagination) return;
    const { page, limit } = JSON.parse(pagination);

    this.onShowSizeChange(page, limit);
  },
  watch: {
    products(value) {
      this.$store.commit("products/setTotal", value.length);
    }
  }
}
</script>

<style>
.services {
	padding-top: 15px;
}

.services__block {
	margin-bottom: 10px;
}

@media screen and (max-width: 768px) {
	.services{
		padding-left: 10px;
		padding-right: 10px;
	}
}
</style>
