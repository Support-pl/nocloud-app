<template>
  <a-spin
    v-if="isLoading"
    style="display: block; margin: 0 auto"
    :spinning="isLoading"
    :tip="$t('loading')"
  />

  <a-flex v-else vertical gap="small" class="addons">
    <a-card
      v-for="(group, name) in groups"
      :key="name"
      :title="capitalize(name)"
      style="width: 100%"
    >
      <a-card-grid
        v-for="addon of group"
        :key="addon.uuid"
        class="card-item"
        @click="changeAddons(addon)"
      >
        <div
          class="order__slider-name"
          style="
            grid-template-columns: 1fr auto auto;
            gap: 10px;
            align-items: center;
          "
        >
          <span style="font-weight: 700; font-size: 16px">
            {{ addon.title }}
          </span>

          <span style="font-weight: 700">
            {{ $t("enable_addon") }}
          </span>

          <a-checkbox :checked="options.addons.includes(addon.uuid)" />
          <span style="grid-column: 1 / 4" v-html="addon.description ?? ''" />
        </div>
      </a-card-grid>
    </a-card>
  </a-flex>
</template>

<script setup>
import { computed, inject, ref } from "vue";
import { useAddonsStore } from "@/stores/addons.js";
import { useCloudStore } from "@/stores/cloud.js";

const addonsStore = useAddonsStore();
const cloudStore = useCloudStore();

const [product] = inject("useProduct")();
const [options, setOptions] = inject("useOptions")();
const [price, setPrice] = inject("usePriceOVH")();

const addons = computed(() =>
  addonsStore.addons.filter(
    ({ uuid }) =>
      cloudStore.plan.addons.includes(uuid) ||
      product.value.addons?.includes(uuid)
  )
);

const groups = computed(() =>
  Object.groupBy(addons.value, ({ group }) => group)
);

function getSelectedAddonTag(uuid) {
  const addon = addonsStore.addons.find((a) => a.uuid === uuid);
  return addon?.meta?.tag || '';
}

function changeAddons({ uuid, periods }) {
  if (options.addons.includes(uuid)) {
    const value = { ...price.addons };

    delete value[uuid];
    setOptions(
      "addons",
      options.addons.filter((addon) => addon !== uuid)
    );
    setPrice("addons", value);
  } else {
    const newAddonTag = getSelectedAddonTag(uuid);

    let newAddons = [...options.addons, uuid];
    const newPriceAddons = { ...price.addons, [uuid]: periods[product.value.period] };

    if (newAddonTag) {
      newAddons = newAddons.filter((selectedUuid) => {
        const selectedTag = getSelectedAddonTag(selectedUuid);
        if (selectedTag === newAddonTag && selectedUuid !== uuid) {
          delete newPriceAddons[selectedUuid];
          return false;
        }
        return true;
      });
    }

    setOptions("addons", newAddons);
    setPrice("addons", newPriceAddons);
  }
}

const isLoading = ref(false);

const theme = inject("theme");
const backgroundStyle = computed(() =>
  theme.value ? "var(--bright_font)" : "var(--bright_bg)"
);
</script>

<script>
export default { name: "CustomAddons" };
</script>

<style scoped>
.addons :deep(.ant-card-head) {
  padding: 0 16px;
  background: v-bind("backgroundStyle");
}

.addons :deep(.ant-card-body) {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.addons :deep(.ant-card-loading-content) {
  width: 100%;
}

.addons .card-item {
  width: 100%;
  padding: 12px 16px;
  cursor: pointer;
  border: 0 solid transparent;
  background: v-bind("backgroundStyle");
}

.addons .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.addons .order__slider-name :deep(.ant-checkbox) {
  box-shadow: 0 0 5px var(--main);
}

.addons .order__slider-name img {
  max-height: 65px;
}

.card-item .order__slider-name {
  justify-items: start;
}

.card-item--active {
  padding: 19px;
  border: 5px solid var(--main);
}
</style>
