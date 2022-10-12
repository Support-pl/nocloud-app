<template>
  <div class="cloud">
    <maintanance-mode v-if="isMaintananceMode"></maintanance-mode>
    <template v-else>
      <div class="container ha">
        <create-vm />
      </div>
      <loading :ha="true" v-if="isLoading" style="margin-top:50px" />
      <empty v-else-if="getInstances.length === 0" />
      <template v-else>
        <div class="container ha">
          <loading :ha="true" v-if="isLoading" />
          <div class="cloud__wrapper" v-else>
            <div v-for="(instance, idx) in getInstances" :key="idx">
              <cloudItem :instance="instance" />
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
import cloudItem from "@/components/appMain/cloud/cloudItem.vue";
import loading from "@/components/loading/loading.vue";
import createvm from "@/components/createVM.vue";
import maintanance from "@/components/maintanance.vue";
import empty from "../components/empty/empty.vue";
import { mapGetters } from "vuex";

export default {
  name: "cloud",
  components: {
    cloudItem,
    loading,
    maintanance,
    "create-vm": createvm,
    empty,
  },
  created() {
    if (this.isLogged) {
      this.$store.dispatch("nocloud/vms/fetch");
    }
  },
  computed: {
    ...mapGetters("app", ["isMaintananceMode"]),
    getInstances() {
      return this.$store.getters["nocloud/vms/getInstances"]
        .filter(({ resources }) => !resources.domain);
    },

    // getServices() {
    //   return this.$store.getters["nocloud/vms/getServices"];
    // },

    isLoading() {
      return this.$store.getters["nocloud/vms/isLoading"];
    },
    isLogged() {
      return this.$store.getters["nocloud/auth/isLoggedIn"];
    },
  },
};
</script>

<style>
.cloud {
  height: 100%;
  overflow: auto;
  position: relative;
  padding: 20px 10px;
}

.cloud__wrapper {
  display: grid;
  grid-auto-rows: min-content;
  grid-gap: 20px;
}

.cloud_search-wrapper {
  width: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.search input {
  outline: none;
  border: none;
  width: 100%;
  border-radius: 50px;
  padding: 5px 10px;
}

.cloud_search-clear {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  cursor: pointer;
}

.ha {
  height: auto;
  min-height: auto;
}

@media screen and (min-width: 768px) {
  .cloud__wrapper {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}
</style>
