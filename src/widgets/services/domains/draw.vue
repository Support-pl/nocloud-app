<template>
  <a-row
    class="module"
    :gutter="[10, 10]"
  >
    <a-col>
      <a-table
        :columns="columns"
        :data-source="domainData"
        :pagination="false"
      >
        <span
          slot="actions"
          slot-scope="value"
          style="display: flex; justify-content: space-between"
        >
          <a-icon
            type="edit"
            style="font-size: 20px"
            @click="openModal('edit', value)"
          />
          <a-icon
            type="delete"
            style="font-size: 20px"
            @click="deleteDomain(value)"
          />
        </span>
      </a-table>
    </a-col>
    <a-col style="display: flex; gap: 10px">
      <a-button
        type="primary"
        @click="openModal"
      >
        {{ $t('Add') }}
      </a-button>
      <a-button
        type="primary"
        @click="saveDNS"
      >
        {{ $t('Save') }}
      </a-button>
    </a-col>
    <a-modal
      v-model="isVisible"
      :confirm-loading="isLoading"
      @ok="changeDomain"
    >
      <a-form-model
        ref="form"
        :model="newData"
      >
        <a-form-model-item
          v-if="!newData.key"
          prop="type"
          :label="$t('type') | capitalize"
          :rules="rules.req"
        >
          <a-select v-model="newData.type">
            <a-select-option
              v-for="type of dnsTypes"
              :key="type"
              :value="type"
            >
              {{ type }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item
          v-for="value of dnsKeys"
          :key="value"
          :prop="value"
          :label="$t(value) | capitalize"
          :rules="rules.req"
        >
          <a-input v-model="newData[value]" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </a-row>
</template>

<script>
export default {
  name: 'DomainsDraw',
  props: { service: { type: Object, required: true } },
  data () {
    return {
      isVisible: false,
      isLoading: false,
      domainData: [],
      newData: {},
      columns: [
        {
          title: this.$options.filters.capitalize(this.$t('type')),
          dataIndex: 'type',
          key: 'type'
        },
        {
          title: this.$options.filters.capitalize(this.$t('subdomain')),
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
      .catch((err) => { console.error(err) })
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
        .catch((err) => { console.error(err) })
        .finally(() => { this.isLoading = false })
    }
  }
}
</script>
