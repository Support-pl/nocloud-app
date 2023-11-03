<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <!-- Location -->
  <transition name="networkApear">
    <a-row
      type="flex"
      justify="space-between"
      style="
        font-size: 1.2rem;
        padding-bottom: 5px;
        margin-bottom: 10px;
        border-bottom: 1px solid #e8e8e8;
      "
    >
      <a-col> {{ capitalize($t("location")) }}: </a-col>
      <a-col>
        {{ locationTitle }}
      </a-col>
    </a-row>
  </transition>
  <!-- Tarif -->
  <transition name="networkApear">
    <a-row
      v-if="productSize"
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.2rem' }"
    >
      <a-col> {{ capitalize($t("tariff")) }}: </a-col>
      <a-col>
        {{ productSize }}
      </a-col>
    </a-row>
  </transition>

  <!-- CPU -->
  <transition name="networkApear">
    <a-row
      v-if="options.cpu.size && options.cpu.size !== 'loading'"
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.2rem', 'align-items': 'center' }"
    >
      <a-col> {{ $t("cpu") }}: </a-col>
      <a-col>{{ options.cpu.size }} {{ (isNaN(+options.cpu.size)) ? '' : 'vCPU' }}</a-col>
    </a-row>
  </transition>

  <!-- RAM -->
  <transition name="networkApear">
    <a-row
      v-if="options.ram.size"
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.2rem' }"
    >
      <a-col> {{ $t("ram") }}: </a-col>
      <a-col>{{ options.ram.size }} Gb</a-col>
    </a-row>
  </transition>

  <!-- GPU -->
  <transition name="networkApear">
    <a-row
      v-if="product.resources?.gpu_name"
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.2rem' }"
    >
      <a-col> {{ $t("gpu") }}: </a-col>
      <a-col>{{ product.resources.gpu_name }} (x{{ product.resources.gpu_count }})</a-col>
    </a-row>
  </transition>

  <!-- Drive -->
  <transition name="networkApear">
    <a-row
      v-if="parseFloat(diskSize)"
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.2rem', 'margin-bottom': '5px' }"
    >
      <a-col> {{ $t("Drive") }}: </a-col>
      <a-col>
        {{ options.drive ? "SSD" : "HDD" }}
        <span>{{ diskSize }}</span>
      </a-col>
    </a-row>
  </transition>

  <!-- os -->
  <transition name="networkApear">
    <a-row
      v-if="options.os.name"
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.1rem' }"
    >
      <a-col> {{ $t("os") }}: </a-col>
      <a-col>
        {{ options.os.name }}
        <template v-if="priceOVH.addons.os">
          ({{ priceOVH.addons.os }} {{ currency.code }})
        </template>
      </a-col>
    </a-row>
  </transition>

  <!-- network -->
  <transition name="networkApear">
    <a-row
      v-if="
        options.network.public.status &&
          itemSP.type !== 'ovh'
      "
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.1rem' }"
    >
      <a-col>
        <template v-if="tarification !== 'Hourly'">
          {{ $t("public") }} IPv4:
        </template>
        <template v-else>
          {{ $t("public") }} IPv4*:
        </template>
      </a-col>
      <a-col>
        {{ options.network.public.count }}
      </a-col>
    </a-row>
  </transition>

  <transition name="networkApear">
    <a-row
      v-if="options.network.private.status"
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.1rem' }"
    >
      <a-col>
        {{ $t("private") }} IPv4:
      </a-col>
      <a-col>
        {{ options.network.private.count }}
      </a-col>
    </a-row>
  </transition>

  <!-- addons -->
  <transition-group name="networkApear">
    <a-row
      v-for="(addon, key) in addons"
      :key="addon"
      type="flex"
      justify="space-between"
      :style="{ 'font-size': '1.1rem' }"
    >
      <a-col> {{ capitalize($t(key)) }} {{ getAddonsValue(key) }}: </a-col>
      <a-col>
        {{ addon }} {{ currency.code }}
      </a-col>
    </a-row>
  </transition-group>

  <a-row
    v-if="filteredPlans.length > 1 && itemSP.type !== 'ione'"
    type="flex"
    justify="space-between"
    style="width: 100%; margin-top: 10px"
  >
    <a-col style="width: 100%">
      <a-select v-model:value="plan" placeholder="Price models" style="width: 100%">
        <a-select-option v-for="item in filteredPlans" :key="item.uuid">
          {{ item.title }}
        </a-select-option>
      </a-select>
    </a-col>
  </a-row>

  <a-row
    v-if="services.length > 1"
    type="flex"
    justify="space-between"
    style="width: 100%; margin-top: 10px"
  >
    <a-col style="width: 100%">
      <a-select v-model:value="service" placeholder="Services" style="width: 100%">
        <a-select-option v-for="item in services" :key="item.uuid">
          {{ item.title }}
        </a-select-option>
      </a-select>
    </a-col>
  </a-row>

  <a-row
    v-if="namespaces.length > 1"
    type="flex"
    justify="space-between"
    style="width: 100%; margin-top: 10px"
  >
    <a-col style="width: 100%">
      <a-select v-model:value="namespace" placeholder="Namespaces" style="width: 100%">
        <a-select-option v-for="item in namespaces" :key="item.uuid">
          {{ item.title }}
        </a-select-option>
      </a-select>
    </a-col>
  </a-row>
</template>

<script setup>

</script>

<script>
export default { name: 'CloudResources' }
</script>
