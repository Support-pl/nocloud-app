<template>
  <div class="certificate-page">
    <div class="container">
      <div class="certificate-page-card">
        <a-steps :current="current" style="margin-top: 10px">
          <a-step
            v-for="item in steps"
            :key="item.title"
            :title="$t('ssl' + '.' + item.title)"
          />
        </a-steps>
        <div class="steps__content">
          <component
            :is="steps[current].content"
            :personal="personal"
            :personal-back="personalBack ?? {}"
            :csr="csr"
            :product-info="productInfo"
            @handleClickNext="handleClickNext"
            @handleClickPrev="handleClickPrev"
            @saveProductInfo="saveProductInfo"
            @saveReissueInfo="saveReissueInfo"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import csrComp from '@/components/services/ssl/csr.vue'
import personalComp from '@/components/services/ssl/personal.vue'
import verificationComp from '@/components/services/ssl/verification.vue'

const steps = [
  {
    title: 'CSR',
    content: csrComp
  },
  {
    title: 'personal data',
    content: personalComp
  },
  {
    title: 'verification',
    content: verificationComp
  }
]

const current = ref(0)
const personal = ref('')
const personalBack = ref({})
const productInfo = ref({})
const csr = ref({})

function handleClickPrev (data) {
  if (data) personalBack.value = data

  current.value--
}

function handleClickNext (data) {
  if (data.csr) {
    csr.value = data
    current.value++
    return
  }

  if (data.firstname) {
    personal.value = data
    current.value++
  }
}

function saveProductInfo (data) {
  if (data) productInfo.value = data
}

function saveReissueInfo (data) {
  if (data) personalBack.value = data
}
</script>

<script>
export default { name: 'CertificateView' }
</script>

<style>
.ant-form-item {
  margin-bottom: 10px;
}
.ant-form-item-label {
  line-height: 21px;
}
.certificate-page {
  padding-top: 20px;
}
.certificate-page-card {
  background: var(--bright_font);
  border-radius: 10px;
  padding: 10px 15px 15px;
  margin-bottom: 20px;
}

.steps__content {
  margin-top: 30px;
}

@media screen and (max-width: 768px) {
  .certificate-page {
    padding-left: 10px;
    padding-right: 10px;
  }
}
@media screen and (max-width: 480px) {
  .ant-steps-horizontal.ant-steps-label-horizontal {
    display: flex;
  }
  .ant-steps-horizontal.ant-steps-label-horizontal .ant-steps-item-content {
    display: none;
  }
  .ant-steps-horizontal.ant-steps-label-horizontal
    > .ant-steps-item:not(:last-child)
    > .ant-steps-item-container
    > .ant-steps-item-tail {
    display: block;
    width: 100%;
    padding: 0;
    top: 16px;
  }
  .ant-steps-horizontal.ant-steps-label-horizontal
    > .ant-steps-item
    > .ant-steps-item-container
    > .ant-steps-item-tail::after {
    width: 100%;
    height: 1px;
  }
  .ant-steps-horizontal.ant-steps-label-horizontal .ant-steps-item-icon {
    margin-right: 0;
    position: relative;
    z-index: 99;
  }
}
</style>
