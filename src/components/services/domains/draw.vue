<template>
  <a-row class="module" :gutter="[10, 10]">
    <a-col>
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

    <a-col style="display: flex; gap: 10px">
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
</script>
