<template>
  <empty v-if="acts.length === 0" style="margin: 50px 0" />
  <a-list v-else class="acts-list">
    <a-list-item v-for="(act, index) in acts" :key="index">
      <act-item :act="act" />
    </a-list-item>
  </a-list>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api.js'

import { useAuthStore } from '@/stores/auth.js'
import { useNotification } from '@/hooks/utils'

import actItem from '@/components/invoice/actItem.vue'
import empty from '@/components/ui/empty.vue'

const authStore = useAuthStore()
const { openNotification } = useNotification()
const acts = ref([])

async function fetchActs () {
  try {
    const response = await api.get(
      authStore.baseURL, { params: { run: 'list_act' } }
    )

    if (response.ERROR) throw new Error(response.ERROR)
    acts.value = response
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    openNotification('error', { message })
    console.error(error)
  }
}

fetchActs()
</script>

<style scoped>
.acts-list {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: var(--bright_font);
}
</style>
