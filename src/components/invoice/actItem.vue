<template>
  <a style="display: block" :href="url" :download="`${title}.pdf`">
    {{ title }}
  </a>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import config from '@/appconfig.js'
// import api from '@/api.js'

const props = defineProps({
  act: { type: String, required: true }
})
const i18n = useI18n()

const title = computed(() => {
  const [date, id] = props.act.split('/').at(-1).split('_')

  return `${i18n.t('Act')} №${id} ${i18n.t('from')} ${date}`
})

const url = computed(() => {
  const baseUrl = (config.whmcsSiteUrl.endsWith('/'))
    ? config.whmcsSiteUrl.slice(0, -1)
    : config.whmcsSiteUrl

  const actUrl = (props.act.startsWith('/'))
    ? props.act.slice(1)
    : props.act

  return `${baseUrl}/${actUrl}`
})

// async function download () {
//   const response = await api.get(url.value, {
//     headers: {
//       accept: 'application/pdf',
//       'Access-Control-Allow-Origin': '*',
//       'content-type': 'application/pdf'
//     }
//   })
//   const blob = await response.blob()

//   const link = URL.createObjectURL(blob)
//   const element = document.createElement('a')

//   element.href = link
//   element.download = title.value
//   element.click()
// }
</script>

<script>
export default { name: 'ActItem' }
</script>
