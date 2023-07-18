<template>
  <div class="cloud">
    <maintanance-mode v-if="isMaintananceMode" />
    <template v-else>
      <div class="container ha">
        <create-vm />
      </div>
      <loading
        v-if="isLoading"
        :ha="true"
        style="margin-top:50px"
      />
      <empty v-else-if="getInstances.length === 0" />
      <template v-else>
        <div class="container ha">
          <loading
            v-if="isLoading"
            :ha="true"
          />
          <div
            v-else
            class="cloud__wrapper"
          >
            <div
              v-for="(instance, idx) in getInstances"
              :key="idx"
            >
              <cloudItem :instance="instance" />
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import empty from '../widgets/empty/empty.vue'
import cloudItem from '@/widgets/appMain/cloud/cloudItem.vue'
import loading from '@/widgets/loading/loading.vue'
import createvm from '@/widgets/createVM.vue'
import maintanance from '@/widgets/maintanance.vue'

export default {
  name: 'Cloud',
  components: {
    cloudItem,
    loading,
    maintanance,
    'create-vm': createvm,
    empty
  },
  created () {
    if (this.isLogged) {
      this.$store.dispatch('nocloud/vms/fetch')
    }
  },
  computed: {
    ...mapGetters('app', ['isMaintananceMode']),
    getInstances () {
      return this.$store.getters['nocloud/vms/getInstances']
        .filter(({ resources }) => !resources.domain)
    },

    // getServices() {
    //   return this.$store.getters["nocloud/vms/getServices"];
    // },

    isLoading () {
      return this.$store.getters['nocloud/vms/isLoading']
    },
    isLogged () {
      return this.$store.getters['nocloud/auth/isLoggedIn']
    }
  }
}
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
