import { message as openMessage } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useNotification } from '@/hooks/utils'
import { useInstancesStore } from '@/stores/instances.js'
import api from '@/api.js'

function useCreateInstance () {
  const i18n = useI18n()
  const router = useRouter()
  const store = useInstancesStore()
  const { openNotification } = useNotification()

  async function deployService (uuid, message) {
    try {
      await api.services.up(uuid)

      if (message) openMessage.success(message)
      else openNotification('success', { message: i18n.t('Done') })

      router.push({ path: '/services' })
    } catch (error) {
      const message = error.response?.data?.message ?? error.message ?? error

      openNotification('error', { message: i18n.t(message) })
    }
  }

  return {
    deployService,
    async createInstance (action, orderData, namespace, message, deployMessage) {
      try {
        const { uuid } = await store[`${action}Service`](orderData)

        if (uuid) {
          openMessage.success(message)
          deployService(uuid, deployMessage)
        } else {
          throw new Error('[Error]: Service uuid not found')
        }
      } catch (error) {
        const config = { namespace, service: orderData }
        const message = error.response?.data?.message ?? error.message ?? error

        const { result, errors } = await api.services.testConfig(config)

        openNotification('error', { message: i18n.t(message) })
        if (!result) {
          errors.forEach(({ error }) => {
            openNotification('error', { message: error })
          })
        }
      }
    }

  }
}

export default useCreateInstance
