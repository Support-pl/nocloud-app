<template>
  <a-pagination
    v-if="visible"
    show-size-changer
    style="width: fit-content; margin: 0 0 0 auto"
    :page-size-options="pageSizeOptions"
    :page-size="options.size"
    :total="options.total"
    :current="options.page"
    @show-size-change="onShowSizeChange"
    @change="onShowSizeChange"
  />
</template>

<script setup>
import { onMounted } from 'vue'

const props = defineProps({
  name: { type: String, default: null },
  visible: { type: Boolean, required: true },
  options: { type: Object, required: true }
})
const emits = defineEmits(['update:options'])
const pageSizeOptions = ['5', '10', '25', '50', '100']

function onShowSizeChange (page, limit) {
  if (page !== props.options.page) {
    emits('update:options', 'page', page)
  }
  if (limit !== props.options.size) {
    emits('update:options', 'size', limit)
  }

  if (!props.name) return
  localStorage.setItem(props.name, JSON.stringify({ page, limit }))
}

onMounted(() => {
  const pagination = localStorage.getItem(props.name)

  if (!pagination) return
  const { page, limit } = JSON.parse(pagination)

  onShowSizeChange(page, limit)
})
</script>

<script>
export default { name: 'CustomPagination' }
</script>
