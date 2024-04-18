<template>
  <a-upload
    multiple
    list-type="picture"
    :file-list="fileList"
    :before-upload="beforeUpload"
    :show-upload-list="false"
    @remove="removeFile"
  >
    <slot>
      <div class="upload__button">
        <upload-icon />
      </div>
    </slot>
  </a-upload>

  <div v-if="fileList.length > 0" class="files" :style="fileListStyle">
    <div
      v-for="file of fileList"
      :key="file.uid"
      :class="{ files__preview: true, active: (hovered === file.uid) }"
      @mouseenter="hovered = (file.uuid) ? '' : file.uid"
      @mouseleave="hovered = ''"
      @click="removeFile(file)"
    >
      <img :src="file.preview" :alt="file.name">
      <plus-icon v-if="!file.uuid" style="color: var(--gloomy_font)" :rotate="45" />
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api.js'

const uploadIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/UploadOutlined')
)
const plusIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/PlusOutlined')
)

const props = defineProps({
  editing: { type: String, default: null },
  replies: { type: Array, default: () => [] },
  fileListStyle: { type: [String, Array, Object], default: null }
})
const route = useRoute()

const fileList = ref([])
const hovered = ref('')

watch(() => props.editing, (value) => {
  if (value) {
    const { message, attachments } = props.replies?.find(
      (reply) => reply.uuid === value
    ) ?? {}
    const template = message.match(/<div class="chat__files">[\s\S]{1,}<\/div>$/g)[0]
    const urls = template.match(/https:\/\/[\s\S]{1,}\.\w{1,}/g)

    urls.forEach((url) => {
      const [preview, name] = url.split('" alt="')
      const uuid = attachments.find((id) => preview.includes(id))

      fileList.value.push({ preview, name, uuid })
    })
  } else {
    fileList.value = []
  }
})

async function beforeUpload (file) {
  await setPreview(file)
  fileList.value.push(file)
  return false
}

function removeFile (file) {
  if (file.uuid) return
  const i = fileList.value.indexOf(file)

  fileList.value.splice(i, 1)
}

async function setPreview (file) {
  file.preview = await getBase64(file.originFileObj ?? file)
}

function getBase64 (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

async function sendFiles () {
  for await (const file of fileList.value) {
    if (file.uuid) continue

    const { uuid, object_id: objectId } = await api.put('/attachments', {
      title: file.name, chat: route.params.id
    })
    await fetch(objectId, { method: 'PUT', body: file })

    const { url } = await api.get(`/attachments/${uuid}`)
    file.url = `https://${url}`
    file.uuid = uuid
  }

  return fileList.value
}

defineExpose({ fileList, sendFiles })
</script>

<script>
export default { name: 'UploadFiles' }
</script>

<style scoped>
.upload__button {
  background-color: var(--main);
  color: var(--gloomy_font);
  border-radius: 50%;
  height: 35px;
  width: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  margin-bottom: 10px;
  font-size: 1.2rem;
  transition: filter 0.2s ease;
  cursor: pointer;
}

.upload__button:hover {
  filter: brightness(1.05);
}

.upload__button:active {
  filter: brightness(0.95);
}

.files {
  display: flex;
  gap: 5px;
  justify-self: start;
  flex-wrap: wrap;
}

.files__preview {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  width: 100px;
  height: 100px;
  border: 1px solid var(--border_color);
  border-radius: 10px;
  overflow: hidden;
}

.files__preview::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  transition: background 0.3s;
}

.files__preview.active::before {
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.files__preview > img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: cover;
}

.files__preview :deep(.anticon-plus) {
  position: absolute;
  font-size: 28px;
  cursor: pointer;
  opacity: 0;
  transition: 0.3s;
}

.files__preview.active :deep(.anticon-plus) {
  opacity: 1;
}
</style>
