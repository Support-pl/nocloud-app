import { useI18n } from 'vue-i18n'

function usePeriod () {
  const i18n = useI18n()

  return {
    getPeriod (timestamp, split) {
      const hour = 3600
      const day = hour * 24
      const month = day * 30
      const year = month * 12

      let period = ''
      let count = 0

      if (timestamp === 0) return i18n.t('onetime')
      if (timestamp / hour < 24 && timestamp >= hour) {
        period = 'hour'
        count = timestamp / hour
      } else if (timestamp / day < 30 && timestamp >= day) {
        period = 'day'
        count = timestamp / day
      } else if (timestamp / month < 12 && timestamp >= month) {
        period = 'month'
        count = timestamp / month
      } else {
        period = 'year'
        count = timestamp / year
      }

      if (split) return [period, count]
      return i18n.t(period, Math.round(count))
    }
  }
}

export default usePeriod
