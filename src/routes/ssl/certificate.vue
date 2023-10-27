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
            :personal_back="personal_back || {}"
            :csr="csr"
            :product_info="product_info"
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
<script>
import csr from '@/components/services/ssl/csr.vue'
import personal from '@/components/services/ssl/personal.vue'
import verification from '@/components/services/ssl/verification.vue'
const steps = [
  {
    title: 'CSR',
    content: csr
  },
  {
    title: 'personal data',
    content: personal
  },
  {
    title: 'verification',
    content: verification
  }
]
export default {
  name: 'Certificare',
  components: { csr, personal, verification },
  data () {
    return {
      current: 0,
      personal: '',
      personal_back: '',
      product_info: {},
      csr: {},
      steps
    }
  },
  methods: {
    handleClickPrev (data) {
      if (data) {
        this.personal_back = data
      }
      this.current--
    },
    handleClickNext (data) {
      if (data.csr) {
        this.csr = data
        this.current++
        return
      }
      if (data.firstname) {
        this.personal = data
        this.current++
      }
    },
    saveProductInfo (data) {
      if (data) {
        this.product_info = data
      }
    },
    saveReissueInfo (data) {
      if (data) {
        this.personal_back = data
      }
    }
  }
}
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
