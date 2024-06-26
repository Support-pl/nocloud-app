import api from '@/api.js'

export function debounce (func, ms) {
  let timeout

  return function () {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, arguments), ms)
  }
}

export function getDisk (key) {
  const keys = key?.match(/[0-9]{1,}x[0-9]{1,}/g) ?? []

  return keys.reduce((sum, key) => {
    const [count, size] = key.split('x')

    return sum + count * size
  }, 0)
}

export function toDate (timestamp, sep = '.', timeFormat = true, reverse) {
  if (timestamp < 1) return '-'

  const date = new Date((isNaN(+timestamp)) ? timestamp : timestamp * 1000)
  const time = date.toTimeString().split(' ')[0]

  const year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()

  if (`${month}`.length < 2) month = `0${month}`
  if (`${day}`.length < 2) day = `0${day}`

  let result = `${day}${sep}${month}${sep}${year}`

  if (reverse) {
    result = `${year}${sep}${month}${sep}${day}`
  }
  if (timeFormat === true) result += ` ${time}`
  else if (typeof timeFormat !== 'string') {
    result += ''
  } else if (timeFormat.split(':').length === 2) {
    result += ` ${time.slice(0, 5)}`
  } else if (timeFormat.split(':').length === 3) {
    result += ` ${time}`
  }

  return result
}

export function setValue (path, value, result) {
  if (!path || typeof path !== 'string') {
    console.error('[Error]: Path is not valid - ', path)
    return
  }

  path.split('.').forEach((key, i, array) => {
    if (i === array.length - 1) result[key] = value
    else result = result[key]
  })
}

export function getTarification (timestamp) {
  const day = 3600 * 24
  const month = day * 30
  const year = day * 365

  switch (+timestamp) {
    case 3600:
      return 'Hourly'
    case day:
      return 'Daily'
    case month:
      return 'Monthly'
    case year:
      return 'Annually'
    case year * 2:
      return 'Biennially'
  }
}

export function getPeriods (productSize, plans) {
  const value = []
  const types = new Set()
  const day = 3600 * 24
  const month = day * 30
  const year = day * 365

  plans.forEach((plan) => {
    types.add(plan.type)

    if (plan.kind === 'DYNAMIC') {
      value.push(
        { value: 'Hourly', label: 'ssl_product.Hourly' }
      )
    }

    if (plan.kind !== 'STATIC') return
    const periods = Object.values(plan.products)
      .filter(({ title }) => title === productSize)
      .map((el) => +el.period)

    if (value.find(({ period }) => periods.includes(period))) return
    if (periods.includes(day)) {
      value.push(
        { value: 'Daily', label: 'daily', period: day }
      )
    }

    if (periods.includes(month)) {
      value.push(
        { value: 'Monthly', label: 'ssl_product.Monthly', period: month }
      )
    }

    if (periods.includes(year)) {
      value.push(
        { value: 'Annually', label: 'annually', period: year }
      )
    }

    if (periods.includes(year * 2)) {
      value.push(
        { value: 'Biennially', label: 'biennially', period: year * 2 }
      )
    }
  })

  if (types.size > 1) return
  value.sort((a, b) => (a.value === 'Hourly') ? 1 : a.period - b.period)

  return value
}

export async function createInvoice (instance, service, account, baseURL) {
  if (checkPayg(instance)) return
  try {
    const response = await api.get(baseURL, {
      params: {
        run: 'invoice_instans',
        uuid_instans: instance.uuid,
        uuid_service: service,
        uuid_account: account
      }
    })
    const url = response.redirect_url ?? response

    setTimeout(() => { window.open(url, '_blank') }, 300)
    return url
  } catch (error) {
    const url = error.response?.data.redirect_url ?? error.response?.data[0] ?? error[0]

    if (url.startsWith && url.startsWith('http')) {
      window.open(url, '_blank')
    }
    return url
  }
}

export async function createRenewInvoice (instance, service, account, baseURL) {
  try {
    const response = await api.get(baseURL, {
      params: {
        run: 'invoice_instans_renew',
        uuid_instans: instance.uuid,
        uuid_service: service,
        uuid_account: account
      }
    })
    const url = response.redirect_url ?? response

    setTimeout(() => { window.open(url, '_blank') }, 300)
    return url
  } catch (error) {
    const url = error.response?.data.redirect_url ?? error.response?.data[0] ?? error[0]

    if (url.startsWith && url.startsWith('http')) {
      window.open(url, '_blank')
    }
    return url
  }
}

export function checkPayg (instance) {
  const { config } = instance ?? {}
  const { type, kind } = instance.billingPlan ?? instance.billing_plan ?? {}

  if (type === 'openai') return true
  if (config.duration === 'P1H') return true
  return type === 'ione' && kind === 'DYNAMIC'
}

export function generateUuid () {
  const result = []

  for (let i = 0; i < 4; i++) {
    result.push(
      window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16)
    )
  }

  return result.join('-')
}

export function setChartsTheme (charts, isDark = true) {
  for (const chart of charts) {
    const rect = chart.querySelector('svg[aria-label] > rect')
    const texts = chart.querySelectorAll('svg[aria-label] > g text[text-anchor]')

    rect.setAttribute('fill', 'var(--bright_bg)')
    for (const text of texts) {
      const color = (isDark) ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.65)'

      text.setAttribute('fill', color)
    }
  }
}

export function onError ({ target }) {
  target.src = '/img/OS/default.png'
}

export function getImageName (name) {
  return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0]
}

export function toKebabCase (text) {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function toPascalCase (text) {
  return text.replace(/(^\w|-\w)/g, (text) =>
    text.replace(/-/, '').toUpperCase()
  )
}
