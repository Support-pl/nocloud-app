<template>
  <div v-if="images.length > 0 || !isLoading" class="newCloud__option-field">
    <a-row>
      <a-col :xs="24" :sm="10">
        <a-form
          ref="ovhVpsForm"
          :model="authData"
          no-style
          autocomplete="off"
          layout="vertical"
          :rules="rules"
        >
          <a-form-item
            name="vmName"
            :label="`${capitalize($t('server name'))}:`"
          >
            <a-input v-model:value="authData.vmName" />
          </a-form-item>

          <a-form-item
            name="password"
            v-if="false"
            :label="`${$t('clientinfo.password')}:`"
          >
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
import { useCurrency } from "@/hooks/utils";
import { useI18n } from "vue-i18n";

const props = defineProps({
  mode: { type: String, required: true },
  productSize: { type: String, required: true },
  isFlavorsLoading: { type: Boolean, default: false },
});

const i18n = useI18n();

const cloudStore = useCloudStore();
const { validationPanels, authData } = storeToRefs(cloudStore);
const { currency, formatPrice } = useCurrency();
const { addons, loading } = storeToRefs(useAddonsStore());

const ovhVpsForm = ref(null);
const images = ref([]);
const isLoading = ref(false);

const rules = {
  vmName: {
    trigger: "change",
    required: true,
    validator: () =>
      authData.value.vmName.length < 2
        ? Promise.reject(i18n.t("ssl_product.field is required"))
        : Promise.resolve(),
  },
};

const [options, setOptions] = inject("useOptions", () => [])();
const [price, setPrice] = inject("usePriceOVH", () => [])();
const [activeKey] = inject("useActiveKey", () => [])();

watch([() => props.productSize, loading, currency], setImages);
if (props.productSize) setImages();

watch(activeKey, async () => {
  try {
    await ovhVpsForm.value.validateFields();
    validationPanels.value["os"] = false;
  } catch (e) {
    validationPanels.value["os"] = true;
  }
});

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
      prices: [formatPrice(os.periods[product.period])],
      desc: os.title,
      uuid: os.uuid,
    }));
  images.value.sort((a, b) => a.name.localeCompare(b.name));

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
