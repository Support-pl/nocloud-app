import { computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import countries from '@/assets/countries.json'

function useResourceRegFields (type, setInfoByType) {
  const i18n = useI18n()

  const phonecode = computed(() =>
    countries.find(({ code }) => code === 'BY')?.dial_code
  )
  const reqRule = reactive({
    required: true,
    message: 'Field is required',
    trigger: 'change'
  })

  const domainRules = computed(() => {
    const rule = {
      message: i18n.t('domain is wrong'),
      validator (_, value) {
        if (value === '') return Promise.resolve()
        if (/.+\..+/.test(value)) {
          return Promise.resolve()
        }
        return Promise.reject(this?.message)
      }
    }

    return [reqRule, rule]
  })

  const emailRules = computed(() => {
    const regexEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/
    const rule = {
      message: i18n.t('email is not valid'),
      validator (_, value) {
        if (value === '') return Promise.resolve()
        if (regexEmail.test(value)) {
          return Promise.resolve()
        }
        return Promise.reject(this?.message)
      }
    }

    return [reqRule, rule]
  })

  onMounted(() => {
    reqRule.message = `${i18n.t('ssl_product.field is required')}`
    setInfoByType('fiz')
  })

  const fields = computed(() => {
    const result = new Map([
      ['fullname', { rules: [reqRule] }],
      ['address1', { title: 'clientinfo.address', rules: [reqRule] }],
      ['email', { rules: emailRules.value }],
      ['phonenumber', {
        class: 'user__input',
        phonecode: phonecode.value,
        rules: [reqRule]
      }]
    ])

    if (type.value === 'fiz') {
      setDocumentData(result)
    }

    if (type.value === 'ur') {
      result.set('companyname', {
        placeholder: 'ОАО "Компания"',
        visible: true,
        rules: [reqRule]
      })
      setRegInfo(result)
      result.set('account_number', {
        title: 'documents.payer account number',
        placeholder: '445081569',
        rules: [reqRule]
      })
    }

    if (type.value === 'ip') {
      setDocumentData(result)
      setRegInfo(result)
      result.set('account_number', {
        title: 'documents.payer account number',
        placeholder: '445081569',
        rules: [reqRule]
      })
    }

    result.set('resource info', { title: 'documents.resource info', divider: true })
      .set('description', {
        title: 'description', rules: [reqRule], group: true
      })
      .set('domain', {
        title: 'ssl_product.domain',
        placeholder: 'example.by',
        rules: domainRules.value,
        group: true
      })

    return result
  })

  function setDocumentData (target = new Map()) {
    target.set('document', { title: 'documents.document data', divider: true })
      .set(['document', 'type'], {
        title: 'documents.type',
        rules: [reqRule],
        group: true
      })
      .set(['document', 'series'], {
        title: 'documents.series',
        placeholder: 'MC',
        rules: [reqRule],
        group: true
      })
      .set(['document', 'number'], {
        title: 'documents.number',
        placeholder: '058712',
        rules: [reqRule],
        group: true
      })
      .set(['document', 'id_number'], {
        title: 'documents.id number',
        placeholder: '7766008A002PB0',
        rules: [reqRule],
        group: true
      })
      .set(['document', 'issued_by'], {
        title: 'documents.issued by',
        placeholder: 'Ленинское РУВД г. Минска',
        rules: [reqRule],
        group: true
      })
      .set(['document', 'date'], {
        title: 'documents.date of issue',
        rules: [reqRule],
        group: true,
        date: true
      })
  }

  function setRegInfo (target = new Map()) {
    target.set('reg_info', { title: 'documents.registration info', divider: true })
      .set(['reg_info', 'type'], {
        title: 'documents.type', rules: [reqRule], group: true
      })
      .set(['reg_info', 'issued_by'], {
        title: 'documents.carried out reg',
        placeholder: 'Светлогорский райсполком Гомельской области',
        rules: [reqRule],
        group: true
      })
      .set(['reg_info', 'date'], {
        title: 'documents.date of reg',
        rules: [reqRule],
        group: true,
        date: true
      })
      .set(['reg_info', 'number'], {
        title: 'documents.number decisions',
        placeholder: '178',
        group: true
      })
  }

  return { fields }
}

export default useResourceRegFields
