import { message as openMessage } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useNotification } from '@/hooks/utils'
import { useInstancesStore } from '@/stores/instances.js'
import api from '@/api.js'

function useCreateInstance () {
  const i18n = useI18n()
  const store = useInstancesStore()
  const { openNotification } = useNotification()

  async function deployService (uuid, message) {
    try {
      await api.services.up(uuid)

      if (message) openMessage.success(message)
      else openNotification('success', { message: i18n.t('Done') })
    } catch (error) {
      const message = error.response?.data?.message ?? error.message ?? error

      openNotification('error', { message: i18n.t(message) })
    }
  }

  return {
    deployService,
    async createInstance (action, service, namespace, message, deployMessage) {
      try {
        const response = await store[`${action}Service`](service)

        if (response.uuid) {
          if (message) openMessage.success(message)
          await deployService(response.uuid, deployMessage)

          return response
        } else {
          throw new Error('[Error]: Service uuid not found')
        }
      } catch (error) {
        const matched = (error.response?.data?.message ?? error.message ?? '').split(/error:"|error: "/)
        const message = matched.at(-1).split('" ').at(0)

        if (message) {
          openNotification('error', { message })
        } else {
          const message = error.response?.data?.message ?? error.message ?? error

          openNotification('error', { message })
        }
      }
    }
  }
}

export default useCreateInstance
