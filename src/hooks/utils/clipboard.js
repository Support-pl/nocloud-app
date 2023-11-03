import { useI18n } from 'vue-i18n'
import useNotification from './notification.js'

function useClipboard () {
  const i18n = useI18n()
  const { openNotification } = useNotification()

  return {
    async addToClipboard (text) {
      if (navigator?.clipboard) {
        try {
          await navigator.clipboard.writeText(text)

          openNotification('success', { message: i18n.t('Text copied') })
        } catch (error) {
          console.error(error)
        }
      } else {
        openNotification('error', {
          message: i18n.t('Clipboard is not supported')
        })
      }
    }
  }
}

export default useClipboard
