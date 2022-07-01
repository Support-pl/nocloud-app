<template>
  <div class="publicNetwork">
    <!-- <a-table
      :row-selection="rowSelection"
      row-key="AR_ID"
      :pagination="NICpublic.length > 10 ? '' : false"
      :loading="NICloading"
      :columns="NICsColumns"
      :data-source="NICpublic"
    >
      <div slot="buttons" slot-scope="value, row">
        <span
          v-if="value.NIC_ID != 0"
          class="modal_table_action_btn"
          :title="!row.LEASES.LEASE ? 'Release' : ''"
          @click="ReleaseNIC(row)"
        >
          <a-icon type="close" />
        </span>
      </div> -->
      <!-- <div slot="ip" slot-scope="value, row">
        {{ value }}
        <template v-if="!Array.isArray(row.LEASES)">
          <span
            class="link--clickable"
            v-if="row.LEASES.LEASE['VM'] != $route.params.pathMatch"
            @click="GoToVM(row.LEASES.LEASE['VM'])"
          >
            {{ `(used at VM#${row.LEASES.LEASE["VM"]})` }}
          </span>
          <span v-else>
              {{ `(${$t("used for this VM")})` }}
          </span>
        </template>
      </div> -->
    <!-- </a-table> -->
    <!-- <a-button style="margin-top: 15px" v-if="!NICloading" @click="ReserveNIC">{{
      $t("reserve public NIC")
    }}</a-button> -->
  </div>
</template>

<script>
import md5 from "md5";
import { mapGetters } from "vuex";

export default {
  name: "publicNetworks",

};
</script>

<style>
.link--clickable {
  color: #1890ff;
  cursor: pointer;
}
</style>
