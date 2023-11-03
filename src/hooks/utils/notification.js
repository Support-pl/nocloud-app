import { notification } from 'ant-design-vue'
import { useAppStore } from '@/stores/app.js'

function useNotification () {
  return {
    openNotification (type, options) {
      notification.close(options.message)
      notification[type]({
        ...options,
        key: `${options.message}`,
        duration: (type === 'error') ? 0 : 4.5
      })

      if (type === 'error') {
        useAppStore().notification = true
      }
    }
  }
}

export default useNotification
