<template>
  <div v-if="images.length > 0 || !isLoading" class="newCloud__option-field">
    <a-row>
      <a-col :xs="24" :sm="10">
        <a-form no-style autocomplete="off" layout="vertical">
          <a-form-item :label="`${capitalize($t('server name'))}:`">
            <a-input
              v-model:value="authData.vmName"
              :style="{
                boxShadow: `0 0 2px 2px var(${
                  authData.vmName.length > 1 ? '--main' : '--err'
                })`,
              }"
            />
            <div
              v-if="authData.vmName.length < 2"
              style="line-height: 1.5; color: var(--err)"
            >
              {{ $t("ssl_product.field is required") }}
            </div>
          </a-form-item>

          <a-form-item v-if="false" :label="`${$t('clientinfo.password')}:`">
            <password-meter
              :style="{
                height: authData.password.length > 0 ? '10px' : '0',
                marginTop: authData.password.length < 1 ? '0' : null,
              }"
              :password="authData.password"
              @score="(value) => (authData.score = value.score)"
            />

            <a-input-password
              v-model:value="authData.password"
              class="password"
            />
          </a-form-item>
        </a-form>
      </a-col>
    </a-row>

    <images-list
      v-if="cloudStore.provider"
      :os-name="options.os.name"
      :images="images"
      :set-o-s="setOS"
    />
  </div>

  <a-alert
    v-else-if="!(isFlavorsLoading || isLoading)"
    show-icon
    type="warning"
    :message="$t('No OS. Choose another plan')"
  />
  <a-spin v-else style="display: block; margin: 0 auto" :tip="$t('loading')" />
</template>

<script setup>
import { inject, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import passwordMeter from "vue-simple-password-meter";

import { useCloudStore } from "@/stores/cloud.js";
import imagesList from "@/components/ui/images.vue";
import { useAddonsStore } from "@/stores/addons";

const props = defineProps({
  mode: { type: String, required: true },
  productSize: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false },
});

const cloudStore = useCloudStore();
const { addons, loading } = storeToRefs(useAddonsStore());

const images = ref([]);
const isLoading = ref(false);

const { authData } = storeToRefs(useCloudStore());
const [options, setOptions] = inject("useOptions", () => [])();
const [price, setPrice] = inject("usePriceOVH", () => [])();

watch([() => props.productSize, loading], setImages);
if (props.productSize) setImages();

async function setImages() {
  const planProducts = Object.entries(cloudStore.plan.products ?? {}).filter(
    ([, { title }]) => title === props.productSize
  );

  if (!planProducts[0]) return;
  const product = planProducts[0][1];

  images.value = addons.value
    .filter((a) => product.addons.includes(a.uuid) && a.meta?.type == "os")
    .map((os) => ({
      name: os.title,
      prices: [+os.periods[product.period]],
      desc: os.title,
      uuid: os.uuid,
    }));

  setOptions("addons", []);
  if (images.value[0]) {
    setOS(images.value[0]);
  }
}

function setOS(item, index) {
  if (item.warning) return;
  setOptions("os.id", +index);
  setOptions("os.name", item.name);

  if (item.prices) {
    setPrice("addons.os", item.prices[0]);
  } else if (price.addons.os !== 0) {
    setPrice("addons.os", 0);
  }

  setOptions("config.configuration.vps_os", item.name);
  setOptions("addons", [
    ...options.addons.filter(
      (uuid) =>
        addons.value.find((addon) => addon.uuid == uuid)?.meta?.type !== "os"
    ),
    item.uuid,
  ]);
}
</script>

<script>
export default { name: "OvhVpsOsPanel" };
</script>
