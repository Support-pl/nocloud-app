<template>
  <div class="cpanel">
    <iframe :src="link" width="800" height="600" frameborder="2" />
  </div>
</template>

<script>
import { ref } from 'vue'
import router from '@/router'
import api from '@/api.js'

import { useAuthStore } from '@/stores/auth.js'
import { useProductsStore } from '@/stores/products.js'

const authStore = useAuthStore()
const productsStore = useProductsStore()

const link = ref('')

async function openCpanel () {
  try {
    const { serviceid } = router.currentRoute.params
    const user = await authStore.fetchBillingData()

    const response = await api.get(
      `${productsStore.baseURL}/cpanel.createSession.php`,
      { params: { serviceid, userid: user.client_id } }
    )

    const url = `https://${response.data.serverhostname}:2083/login/?login_only=1`
    const fd = new FormData()

    fd.append('user', response.data.username)
    fd.append('pass', response.data.password)
    fd.append('goto_uri', '/')

    await fetch(url, { body: fd, method: 'post' })
    link.value = response.data.url
  } catch (error) {
    console.error(error)
  }
}

openCpanel()
</script>

<script>
export default { name: 'CpanelView' }
</script>
