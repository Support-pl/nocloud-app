<template>
  <div class="newCloud__option-field">
    <a-row :gutter="[10, 10]">
      <a-col :sm="12" :span="24">
        <a-row :style="{ display: 'flex', alignItems: 'center' }">
          <a-col :sm="10" :span="12">
            {{ $t('Public network') }}:
          </a-col>
          <a-col :sm="12" :span="12">
            <a-switch
              :checked="options.network.public.status"
              @update:checked="changeNetwork('public', $event)"
            />
            <a-input-number
              style="margin-left: 10px"
              :value="options.network.public.count"
              :min="(options.network.public.status) ? 1 : 0"
              :max="10"
              :disabled="!options.network.public.status"
              @update:value="setOptions('network.public.count', $event)"
            />
          </a-col>
        </a-row>
      </a-col>

      <a-col :sm="12" :span="24">
        <a-row :style="{ display: 'flex', alignItems: 'center' }">
          <a-col :sm="10" :span="12">
            {{ $t('Private network') }}:
          </a-col>
          <a-col :sm="12" :span="12">
            <a-switch
              :checked="options.network.private.status"
              @update:checked="changeNetwork('private', $event)"
            />
            <a-input-number
              style="margin-left: 10px"
              :value="options.network.private.count"
              :min="(options.network.private.status) ? 1 : 0"
              :max="10"
              :disabled="!options.network.private.status"
              @update:value="setOptions('network.private.count', $event)"
            />
          </a-col>
        </a-row>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const [options, setOptions] = inject('useOptions')()

function changeNetwork (type, value) {
  switch (type) {
    case 'public':
      console.log(options)
      if (!options.network.public.status) {
        setOptions('network.private.status', true)
        setOptions('network.public.count', 0)
      }
      break
    case 'private':
      if (!options.network.private.status) {
        setOptions('network.public.status', true)
        setOptions('network.private.count', 0)
      }
      break
  }

  setOptions(`network.${type}.status`, value)
}
</script>

<script>
export default { name: 'IoneNetworkPanel' }
</script>
