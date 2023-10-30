export function debounce (func, ms) {
  let timeout

  return function () {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, arguments), ms)
  }
}

export function toDate (timestamp, sep = '.', withTime = true, reverse) {
  if (timestamp < 1) return '-'

  const date = new Date(timestamp * 1000)
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
  if (withTime) result += ` ${time}`

  return result
}

export function onError ({ target }) {
  target.src = '/img/OS/default.png'
}

export function getImageName (name) {
  return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0]
}
