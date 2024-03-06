import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

function useSlider (slider, trigger) {
  const viewport = ref(document.documentElement.offsetWidth)
  const isSlider = ref(true)

  function onResize () {
    const marks = slider.value?.$el.querySelectorAll('.ant-slider-mark-text')
    const currentViewport = document.documentElement.offsetWidth

    if (viewport.value < currentViewport) {
      isSlider.value = true
    }
    if (!marks) return
    const count = slider.value?.$el.clientWidth / (marks[0]?.clientWidth + 25)

    if (Math.ceil(count) < marks.length) {
      isSlider.value = false
      viewport.value = currentViewport
    } else {
      isSlider.value = true
    }
  }

  watch(trigger, async (value) => {
    if (!value) return
    isSlider.value = true

    await nextTick()
    onResize()
  })

  onMounted(onResize)
  window.addEventListener('resize', onResize)
  onUnmounted(() => {
    window.removeEventListener('resize', window)
  })

  return { isSlider, viewport }
}

export default useSlider
