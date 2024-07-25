import { computed } from 'vue'
import { useInstancesStore } from '@/stores/instances.js'

function useVdcOptions () {
  const instancesStore = useInstancesStore()

  const instances = computed(() => {
    const result = []

    instancesStore.services.forEach((service) => {
      service.instancesGroups.forEach((group) => {
        group.instances.forEach((inst) => {
          if (group.type !== 'ione') return

          result.push({
            ...inst,
            type: group.type,
            serviceTitle: service.title,
            serviceUuid: service.uuid,
            groupUuid: group.uuid
          })
        })
      })
    })

    return result
  })

  const options = computed(() => {
    const result = []

    instances.value.forEach((inst) => {
      const item = result.find(({ uuid, location }) =>
        uuid === inst.groupUuid && location === inst.config.location
      )
      const title = inst.serviceTitle.replace('SRV_', '')
      const { networking, lcm_state_str: status } = inst.state?.meta ?? {}
      const { location } = inst.config

      if (item) {
        item.vm++

        item.networking[inst.uuid] = {
          title: inst.title, ...networking
        }

        item.status[inst.uuid] = status ?? inst.state?.state ?? 'UNKNOWN'
      } else {
        result.push({
          uuid: inst.groupUuid,
          vm: 1,
          title,
          location,
          networking: {
            [inst.uuid]: { title: inst.title, ...networking }
          },
          status: { [inst.uuid]: status ?? inst.state?.state },
          selectorLabel: (location) ? `${title}, ${location}` : title
        })
      }
    })

    return result
  })

  return { instances, options }
}

export default useVdcOptions
