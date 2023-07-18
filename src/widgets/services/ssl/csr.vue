<template>
  <div>
    <a-alert
      style="margin: 10px"
      :message="$t('ssl_product.csr_warning')"
      type="warning"
      show-icon
    />
    <a-form-model
      ref="csrFormField"
      :model="fieldCSR"
      :rules="rules"
    >
      <a-form-model-item
        label="CSR"
        prop="csr"
      >
        <a-spin
          :tip="$t('loading')"
          :spinning="areaLoading"
        >
          <a-textarea
            v-model="fieldCSR.csr"
            style="height: 150px"
          />
        </a-spin>
      </a-form-model-item>
      <a-form-model-item>
        <a-button
          type="primary"
          @click="$emit('handleClickPrev', { ...fieldCSR})"
        >
          {{ $t("ssl_product.back") }} <a-icon type="left" />
        </a-button>
        <a-button
          type="primary"
          style="margin-left: 10px"
          @click="handleClickNext"
        >
          {{ $t("ssl_product.continue") }} <a-icon type="right" />
        </a-button>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import api from '@/shared/api/api.js'

const keys = {
  firstname: 'tech_firstname',
  lastname: 'tech_lastname',
  email: 'tech_email',
  address1: 'tech_addressline1',
  city: 'tech_city',
  state: 'tech_region',
  phonenumber: 'tech_phone',
  country: 'tech_country',
  companyname: 'tech_organization',
  org_name: 'org_name',
  org_division: 'org_division',
  org_duns: 'org_duns',
  org_addressline1: 'org_addressline1',
  org_city: 'org_city',
  org_region: 'org_region',
  org_lei: 'org_lei',
  org_postalcode: 'org_postalcode',
  org_phone: 'org_phone'
}

export default {
  name: 'Certificate',
  props: {
    csr: { type: Object, default: () => {} }
  },
  data () {
    return {
      fieldCSR: { csr: '' },
      areaLoading: false,
      rules: {
        csr: [
          {
            required: true,
            message: `${this.$t('ssl_product.field is required')}`,
            min: 40
          }
        ]
      }
    }
  },
  mounted () {
    this.fieldCSR.csr = this.$route.params.csr || this.csr.csr
  },
  methods: {
    handleClickNext () {
      this.$refs.csrFormField.validate(async (valid) => {
        const params = ('domain' in this.csr) ? this.csr : await this.decodeCSR(this.fieldCSR.csr)

        if (valid) {
          this.$emit('handleClickNext', { ...this.fieldCSR, ...params })
        } else {
          this.$message.error(`${this.$t('ssl_product.fields is required')}`)
          return false
        }
      })
    },
    decodeCSR (csr) {
      const data = {
        csr
      }
      return new Promise((resolve) => {
        api
          .sendAsUser(
            'moduleTouch',
            { ...data, ...{ path: 'ssl/decodeCSR' } },
            'moduleTouch.phpssl'
          )
          .then((resp) => {
            let result
            if (resp.error) {
              throw resp
            }
            if ('csrResult' in resp && resp.success) {
              result = {
                domain: resp.csrResult.CN,
                org_name: resp.csrResult.O,
                org_division: resp.csrResult.OU,
                org_city: resp.csrResult.L,
                org_country: resp.csrResult.C,
                org_region: resp.csrResult.S
              }
            }
            resolve(result)
          })
          .catch((err) => {
            console.error(err)
            this.$message.error(err.description)
            resolve(err)
          })
      })
    }
  }
}
</script>
