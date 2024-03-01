<template>
  <div v-if="authStore.isLogged" class="acts__header">
    <div class="acts__title">
      {{ capitalize($t('acts count')) }}:
      <span class="acts__count">{{ acts.length }}</span>
    </div>

    <div class="acts__control">
      <a-popover placement="bottomRight" arrow-point-at-center>
        <template #content>
          <a-radio-group v-model:value="sortBy">
            <a-radio value="number">
              {{ capitalize($t('documents.number')) }}
            </a-radio>
            <a-radio value="date">
              {{ capitalize($t('date')) }}
            </a-radio>
          </a-radio-group>
        </template>

        <template #title>
          <span style="margin-right: 5px">{{ capitalize($t('sort')) }}</span>
          <sort-ascending-icon
            v-if="sortType === 'sort-ascending'"
            @click="sortType = 'sort-descending'"
          />
          <sort-descending-icon v-else @click="sortType = 'sort-ascending'" />
        </template>
        <sort-icon class="acts__control-item" />
      </a-popover>
    </div>
  </div>

  <empty v-if="sortedActs.length === 0" style="margin: 50px 0" text="No issued acts" />
  <a-list v-else class="acts__list">
    <a-list-item v-for="(act, index) in sortedActs" :key="index">
      <act-item :act="act" />
    </a-list-item>
  </a-list>
</template>

<script setup>
import { ref, defineAsyncComponent, computed } from 'vue'
import api from '@/api.js'
import { useAuthStore } from '@/stores/auth.js'

import actItem from '@/components/invoice/actItem.vue'
import empty from '@/components/ui/empty.vue'

const sortAscendingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SortAscendingOutlined')
)
const sortDescendingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SortDescendingOutlined')
)
const sortIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SlidersOutlined')
)

const authStore = useAuthStore()
const acts = ref([])
const sortBy = ref('date')
const sortType = ref('sort-ascending')

const sortedActs = computed(() =>
  [...acts.value].sort((a, b) => {
    switch (sortBy.value) {
      case 'number':
        return sortActsByNumber(a, b)
      default:
        return sortActsByDate(a, b)
    }
  })
)

function sortActsByDate (a, b) {
  const [aDate] = a.split('/').at(-1).split('_')
  const [aDay, aMonth, aYear] = aDate.split('.')
  const aTimestamp = new Date(aYear, aMonth, aDay).getTime()

  const [bDate] = b.split('/').at(-1).split('_')
  const [bDay, bMonth, bYear] = bDate.split('.')
  const bTimestamp = new Date(bYear, bMonth, bDay).getTime()

  if (sortType.value === 'sort-descending') {
    return aTimestamp - bTimestamp
  }
  return bTimestamp - aTimestamp
}

function sortActsByNumber (a, b) {
  const [, aId] = a.split('/').at(-1).split('_')
  const [, bId] = b.split('/').at(-1).split('_')

  if (sortType.value === 'sort-descending') {
    return aId - bId
  }

  return bId - aId
}

async function fetchActs () {
  try {
    const response = await api.get(
      authStore.baseURL, { params: { run: 'list_act' } }
    )

    if (response.ERROR) throw new Error(response.ERROR)
    acts.value = response
  } catch (error) {
    console.error(error)
  }
}

fetchActs()
</script>

<style scoped>
.acts__list {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: var(--bright_font);
}

.acts__header {
  display: flex;
  justify-content: space-between;
  padding: 7px 15px;
  margin-bottom: 15px;
  background: var(--bright_font);
  border-radius: 8px;
  border: 1px solid #d9d9d9;
}

.acts__title {
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 18px;
}

.acts__control {
  flex-shrink: 0;
}

.acts__count {
  color: #aeaeae;
}

.acts__control-item {
  font-size: 1.4rem;
  transition: color 0.2s ease;
}

.acts__control-item:not(:last-child) {
  margin-right: 10px;
}

.acts__control-item:hover {
  color: var(--main);
}
</style>
