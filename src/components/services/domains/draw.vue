<!-- <template>
  <a-row class="module" :gutter="[10, 10]">
    <a-col span="24">
      <a-table
        :columns="columns"
        :data-source="domainData"
        :pagination="false"
      >
        <template #actions="{ value }">
          <span style="display: flex; justify-content: space-between">
            <edit-icon
              style="font-size: 20px"
              @click="openModal('edit', value)"
            />
            <delete-icon
              style="font-size: 20px"
              @click="deleteDomain(value)"
            />
          </span>
        </template>
      </a-table>
    </a-col>

    <a-col span="24" style="display: flex; gap: 10px">
      <a-button type="primary" @click="openModal">
        {{ $t('Add') }}
      </a-button>
      <a-button type="primary" @click="saveDNS">
        {{ $t('Save') }}
      </a-button>
    </a-col>

    <a-modal
      v-model:open="isVisible"
      :confirm-loading="isLoading"
      @ok="changeDomain"
    >
      <a-form ref="form" :model="newData">
        <a-form-item
          v-if="!newData.key"
          name="type"
          :label="capitalize($t('type'))"
          :rules="rules.req"
        >
          <a-select v-model:value="newData.type">
            <a-select-option v-for="item of dnsTypes" :key="item">
              {{ item }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          v-for="value of dnsKeys"
          :key="value"
          :name="value"
          :label="capitalize($t(value))"
          :rules="rules.req"
        >
          <a-input v-model:value="newData[value]" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-row>
</template>

<script>
import { defineAsyncComponent } from 'vue'

const editIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/EditOutlined')
)
const deleteIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/DeleteOutlined')
)

export default {
  name: 'DomainsDraw',
  components: { editIcon, deleteIcon },
  props: {
    service: { type: Object, required: true }
  },
  data () {
    return {
      isVisible: false,
      isLoading: false,
      domainData: [],
      newData: {},
      columns: [
        {
          title: this.capitalize(this.$t('type')),
          dataIndex: 'type',
          key: 'type'
        },
        {
          title: this.capitalize(this.$t('subdomain')),
          dataIndex: 'subdomain',
          key: 'subdomain'
        },
        {
          title: this.$t('Actions'),
          key: 'actions',
          scopedSlots: { customRender: 'actions' },
          width: 95
        }
      ],
      dnsTypes: ['AAAA', 'A', 'CNAME', 'MX', 'SRV', 'TXT'],
      rules: { req: [{ required: true, message: this.$t('ssl_product.field is required') }] }
    }
  },
  computed: {
    dnsKeys () {
      const data = { ...this.newData }

      delete data.key
      delete data.type
      return Object.keys(data)
    }
  },
  watch: {
    isVisible (value) {
      if (!value) this.newData = {}
    },
    'newData.type' (type) {
      if (this.newData.key) return
      const dict = {
        A: { ip_adress: '' },
        AAAA: { ipv6_adress: '' },
        CNAME: { hostname: '' },
        MX: { hostname: '', priority: '' },
        TXT: { text: '' },
        SRV: { hostname: '', priority: '', weight: '', port: '' }
      }

      this.newData = { ...dict[type], type, subdomain: '' }
    }
  },
  mounted () {
    this.$api.instances
      .action({ action: 'get_dns', uuid: this.service.uuid })
      .then(({ meta: { records } }) => {
        Object.entries(records).forEach(([type, dns]) => {
          dns.forEach((value) => {
            const key = Math.random().toString(16).slice(2)

            this.domainData.push({ ...value, type, key })
          })
        })
      })
      .catch((err) => console.error(err))
  },
  methods: {
    openModal (type, value) {
      if (type === 'edit') this.newData = value

      this.isVisible = true
    },
    changeDomain () {
      const i = this.domainData.findIndex((el) => el.key === this.newData.key)
      const key = Math.random().toString(16).slice(2)

      if (i !== -1) this.domainData[i] = this.newData
      else this.domainData.push({ ...this.newData, key })

      this.isVisible = false
    },
    deleteDomain ({ key }) {
      this.domainData = this.domainData.filter((el) => el.key !== key)
    },
    saveDNS () {
      const dns = {}

      this.isLoading = true
      this.domainData.forEach((el) => {
        if (!dns[el.type]) dns[el.type] = []
        dns[el.type].push(el)
      })

      this.$api.instances
        .action({ action: 'set_dns', uuid: this.service.uuid, params: { dns } })
        .then(() => this.$message.success(this.$t('Done')))
        .catch((err) => console.error(err))
        .finally(() => { this.isLoading = false })
    }
  }
}
</script> -->

<template>
  <a-row class="module" :gutter="[10, 10]">
    <a-col span="24">
      <a-table
        :columns="columns"
        :data-source="nameServers"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <span style="display: flex; justify-content: space-between">
              <edit-icon
                style="font-size: 20px"
                @click="openModal('edit', record)"
              />
              <delete-icon
                style="font-size: 20px"
                @click="deleteNameServer(record)"
              />
            </span>
          </template>
        </template>
      </a-table>
    </a-col>

    <a-col span="24" style="display: flex; gap: 10px">
      <a-button type="primary" @click="openModal">
        {{ $t("domains_view.nameservers.actions.add") }}
      </a-button>

      <a-button
        type="primary"
        :disabled="defaultNameServers.length == 0"
        @click="syncWithDefaults"
        :loading="isSyncDefaultLoading"
      >
        {{ $t("domains_view.nameservers.actions.sync") }}
      </a-button>
    </a-col>

    <a-modal
      v-model:open="isVisible"
      :confirm-loading="isLoading"
      @ok="changeNameServer"
      :ok-text="t('Save')"
      :cancel-text="t('Cancel')"
    >
      <a-form
        ref="form"
        layout="vertical"
        :model="newData"
        validate-on-rule-change
      >
        <a-form-item
          key="ns_new_name"
          name="ns_new_name"
          :label="t('domains_view.nameservers.labels.name')"
          :rules="[rules.req]"
        >
          <a-input v-model:value="newData.ns_new_name" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-row>
</template>

<script setup>
import api from "@/api";
import { Modal, notification } from "ant-design-vue";
import {
  defineAsyncComponent,
  onMounted,
  toRefs,
  ref,
  watch,
  computed,
} from "vue";
import { useI18n } from "vue-i18n";

const editIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/EditOutlined")
);
const deleteIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DeleteOutlined")
);

const props = defineProps({
  service: { type: Object, required: true },
});
const { service } = toRefs(props);

const { t } = useI18n();
const form = ref();

const isVisible = ref(false);
const isLoading = ref(false);
const isSyncDefaultLoading = ref(false);
const nameServers = ref([]);
const defaultNameServers = ref([]);
const newData = ref({
  ns_name: "",
  ns_new_name: "",
});

onMounted(async () => {
  try {
    const { meta } = await api.instances.action({
      action: "list_ns",
      uuid: service.value.uuid,
    });

    Object.keys(meta).forEach((key) => {
      nameServers.value.push({ ns_name: key });
    });

    const {
      meta: { nameservers },
    } = await api.servicesProviders.action({
      action: "get_default_nameservers",
      uuid: service.value.sp,
    });

    defaultNameServers.value = nameservers;
  } catch (err) {
    console.error(err);
  }
});

const rules = computed(() => ({
  req: {
    trigger: "blur",
    required: true,
    message: t("domains_view.nameservers.labels.notValidNameServer"),
    validator: (d) => {
      const value = newData.value[d.field];

      if (
        !!value &&
        value.length > 1 &&
        /^((?:(?:(?:\w[\.\-\+]?)*)\w)+)((?:(?:(?:\w[\.\-\+]?){0,62})\w)+)\.(\w{2,6})$/.test(
          value
        )
      ) {
        return Promise.resolve();
      }

      return Promise.reject();
    },
  },
}));

const columns = computed(() => [
  {
    title: t("domains_view.nameservers.labels.name"),
    dataIndex: "ns_name",
    key: "ns_name",
  },
  {
    title: t("domains_view.nameservers.labels.actions"),
    key: "actions",
    scopedSlots: { customRender: "actions" },
    width: 95,
  },
]);

const openModal = (type, value) => {
  if (type === "edit") newData.value = { ...value, ns_new_name: value.ns_name };

  isVisible.value = true;
};

const changeNameServer = async () => {
  try {
    await form.value.validate();
    isLoading.value = true;

    const newNameservers = [...nameServers.value];

    if (newData.value.ns_name) {
      const index = newNameservers.findIndex(
        (ns) => ns.ns_name === newData.value.ns_name
      );

      newNameservers[index].ns_name = newData.value.ns_new_name;
    } else {
      newNameservers.push({ ns_name: newData.value.ns_new_name });
    }

    await syncNameservers(newNameservers);

    isVisible.value = false;
  } finally {
    isLoading.value = false;
  }
};

const deleteNameServer = async (nameserver) => {
  Modal.confirm({
    title: t("domains_view.nameservers.labels.confirm_delete"),
    okText: t("domains_view.nameservers.actions.delete"),
    cancelText: t("Cancel"),
    onOk: async () => {
      try {
        await syncNameservers(
          nameServers.value.filter((n) => n.ns_name !== nameserver.ns_name)
        );
      } catch (e) {
        console.log(e);
      }
    },
  });
};

const syncNameservers = async (nameservers) => {
  try {
    await api.instances.action({
      action: "update_nameservers",
      uuid: service.value.uuid,
      params: {
        op: "assign_ns",
        nameservers: nameservers.map((ns) => ns.ns_name),
      },
    });

    nameServers.value = nameservers;
  } catch (e) {
    notification.error({
      message: e.response?.data?.message ?? e.message,
    });

    throw e;
  }
};

const syncWithDefaults = async () => {
  try {
    isSyncDefaultLoading.value = true;

    const newNameservers = [...nameServers.value];

    defaultNameServers.value.forEach((ns) => {
      if (!newNameservers.find((n) => n.ns_name === ns)) {
        newNameservers.push({ ns_name: ns });
      }
    });

    await syncNameservers(newNameservers);
  } finally {
    isSyncDefaultLoading.value = false;
  }
};

watch(isVisible, (value) => {
  if (!value)
    newData.value = {
      ns_name: "",
      ns_new_name: "",
    };
});
</script>

<script>
export default {
  name: "DomainsDraw",
};
</script>
