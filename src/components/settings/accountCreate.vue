<template>
  <a-form
    ref="formRef"
    layout="vertical"
    :model="form"
    :rules="rules"
  >
    <a-form-item
      v-for="key of mainKeys"
      :key="key"
      :label="`${capitalize($t(`clientinfo.${key}`))}:`"
      :name="key"
    >
      <a-input v-model:value="form[key]" :disabled="isDisabled" />
    </a-form-item>

    <a-form-item
      :label="`${capitalize($t('clientinfo.countryname'))}:`"
      name="countryname"
    >
      <a-select
        v-model:value="form.countryname"
        show-search
        :filter-option="searchCountries"
        :disabled="isDisabled"
      >
        <a-select-option v-for="country in countries" :key="country.code">
          {{ $t(`country.${country.code}`) }}
        </a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item
      :label="`${capitalize($t('clientinfo.phonenumber'))}:`"
      name="phonenumber"
    >
      <input
        v-model="form.phonenumber"
        v-phone="phonecode"
        type="tel"
        class="user__input"
        :disabled="!form.countryname || isDisabled"
      >
    </a-form-item>

    <a-form-item
      v-if="isPasswordVisible"
      :label="`${capitalize($t('clientinfo.password'))}:`"
      name="password"
    >
      <a-input v-model:value="form.password" />
    </a-form-item>

    <a-space style="margin-top: 10px">
      <a-button
        v-if="isPasswordVisible"
        type="primary"
        :loading="isCreateLoading"
        @click="createAccount"
      >
        {{ $t('Submit') }}
      </a-button>

      <a-button danger @click="emits('cancel')">
        {{ $t('Cancel') }}
      </a-button>
    </a-space>
  </a-form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useNotification } from '@/hooks/utils'
import countries from '@/assets/countries.json'

const props = defineProps({
  account: { type: Object, default: null }
})
const emits = defineEmits(['cancel'])

const i18n = useI18n()
const authStore = useAuthStore()
const namespacesStore = useNamespasesStore()
const { openNotification } = useNotification()

const mainKeys = ['firstname', 'lastname', 'email']
const formRef = ref(null)
const form = ref({})

const isDisabled = computed(() => props.account)
const isPasswordVisible = computed(() => !props.account)
const isCreateLoading = ref(false)

const reqRule = reactive({
  required: true,
  message: 'Field is required',
  trigger: 'change'
})
const rules = computed(() => ({
  email: [reqRule],
  lastname: [reqRule],
  firstname: [reqRule],
  countryname: [reqRule],
  phonenumber: [reqRule],
  password: [reqRule]
}))

const phonecode = computed(() =>
  countries.find(({ code }) => code === form.value.countryname)?.dial_code
)

function searchCountries (input, option) {
  const country = option.children(option)[0].children.toLowerCase()

  return country.includes(input.toLowerCase())
}

async function createAccount () {
  try {
    await formRef.value.validate()
  } catch {
    openNotification('error', {
      message: i18n.t('ssl_product.fields is required')
    })
    return
  }

  isCreateLoading.value = true
  try {
    const namespace = namespacesStore.namespaces.find(({ access }) =>
      access.namespace === authStore.userdata.uuid
    )

    await namespacesStore.createAccount({
      title: `${form.value.firstname} ${form.value.lastname}`,
      auth: {
        type: 'standard',
        data: [form.value.email, form.value.password]
      },
      namespace: namespace.uuid,
      accountOwner: authStore.userdata.uuid,
      currency: authStore.userdata.currency,
      data: {
        email: form.value.email,
        country: form.value.countryname,
        phone: form.value.phonenumber
      }
    })

    openNotification('success', { message: `${i18n.t('Done')}!` })
    emits('cancel')
  } catch (error) {
    openNotification('error', {
      message: error.response?.data?.message ?? error.message ?? error
    })
  } finally {
    isCreateLoading.value = false
  }
}

onMounted(() => {
  reqRule.message = `${i18n.t('ssl_product.field is required')}`

  if (props.account) {
    form.value = {
      email: props.account.data.email,
      lastname: props.account.title.split(' ').at(0),
      firstname: props.account.title.split(' ').at(-1),
      countryname: props.account.data.country,
      phonenumber: props.account.data.phone
    }
  }
})

const theme = inject('theme')
const inputColors = computed(() => (theme.value)
  ? ({ background: 'var(--bright_bg)', border: 'var(--bright_font)' })
  : ({ background: 'inherit', border: 'var(--border_color)' })
)

if (namespacesStore.namespaces.length < 1) {
  namespacesStore.fetch()
}
</script>

<style scoped>
.user__input {
  padding: 4px 11px;
  font-size: 14px;
  width: 100%;
  border: 1px solid v-bind('inputColors.border');
  border-radius: 6px;
  transition: all 0.2s;
  background: v-bind('inputColors.background');
}

.user__input:disabled {
  color: v-bind('inputColors.background');
  background-color: v-bind('inputColors.border');
  border-color: v-bind('inputColors.border');
  box-shadow: none;
  cursor: not-allowed;
}
</style>
