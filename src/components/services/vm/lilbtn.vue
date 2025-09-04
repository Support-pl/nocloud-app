<template>
  <a-tooltip placement="bottom" :title="`${price} ${currency.title}`">
    <div class="btn">
      <a-button
        block
        size="small"
        :disabled="service.data?.blocked"
        @click.stop="isVisible = !isVisible"
      >
        {{ capitalize($t("renew")) }}
        <span v-if="currency" style="margin-left: 4px">
          {{ currency.code === "USD" ? `$${slicedPrice}` : priceWithoutPrefix }}
        </span>
      </a-button>
      <renewal-modal v-bind="renewalProps" v-model:visible="isVisible" />

      <a-button
        block
        size="small"
        style="width: auto; padding: 2px 6px; font-size: 12px"
        :icon="h(settingsIcon)"
        @click.stop="isAccessManagerVisible = true"
      />
      <a-modal
        v-model:open="isAccessManagerVisible"
        destroy-on-close
        :title="$t('Access manager')"
        :footer="null"
      >
        <access-manager :instance="service" />
      </a-modal>
    </div>
  </a-tooltip>
</template>

<script setup>
import { computed, ref, defineAsyncComponent, h } from "vue";
import { useI18n } from "vue-i18n";
import renewalModal from "@/components/ui/renewalModal.vue";
import accessManager from "@/components/cloud/options/accessManager.vue";
import { useAddonsStore } from "@/stores/addons";
import { storeToRefs } from "pinia";
import { useCurrency } from "@/hooks/utils";

const settingsIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SettingFilled")
);

const props = defineProps({
  service: { type: Object, required: true },
  currency: { type: Object, required: true },
});

const addonsStore = useAddonsStore();
const { cachedAddons } = storeToRefs(addonsStore);

const i18n = useI18n();
const { formatPrice } = useCurrency();

const isVisible = ref(false);
const isAccessManagerVisible = ref(false);

const price = computed(() =>
  formatPrice(
    Object.keys(addonsPrice.value).reduce(
      (acc, curr) => acc + addonsPrice.value[curr],
      renewalProps.value.price
    )
  )
);

const slicedPrice = computed(() => {
  if (`${price.value}`.replace(".").length > 6) {
    return `${price.value}`[2] === "."
      ? `${price.value.toString().slice(0, 7)}...`
      : `${price.value.toString().slice(0, 6)}...`;
  } else {
    return `${price.value}`;
  }
});

const priceWithoutPrefix = computed(() => {
  const code =
    `${price.value}`.replace(".").length > 3 ? "" : props.currency.title;

  return `${slicedPrice.value} ${code}`;
});

const addonsPrice = computed(() => {
  let addons = {};
  if (props.service.type === "ione") {
    addons = props.service.billingPlan.resources.reduce((prev, curr) => {
      if (
        curr.key === `drive_${props.service.resources.drive_type.toLowerCase()}`
      ) {
        const key = i18n.t("Drive");

        return {
          ...prev,
          [key]: +(
            (curr.price * props.service.resources.drive_size) /
            1024
          ).toFixed(2),
        };
      } else if (curr.key === "ram") {
        const key = i18n.t("ram");

        return {
          ...prev,
          [key]: +((curr.price * props.service.resources.ram) / 1024).toFixed(
            2
          ),
        };
      } else if (props.service.resources[curr.key]) {
        const key = i18n.t(curr.key.replace("_", " "));

        return {
          ...prev,
          [key]: +(curr.price * props.service.resources[curr.key]).toFixed(2),
        };
      }
      return prev;
    }, {});
  }

  (props.service.addons || []).forEach((uuid) => {
    if (cachedAddons.value[uuid]) {
      const addon = cachedAddons.value[uuid];

      addons[addon.title] =
        addon.periods[
          props.service.billingPlan.products[props.service.product].period
        ] ?? 0;
    }
  });

  return addons;
});

const renewalProps = computed(() => {
  const key = !props.service.product
    ? `${props.service.config?.duration} ${props.service.config?.planCode}`
    : props.service.product;
  if (!props.service.config) {
    return {};
  }

  const { period, price } = props.service.billingPlan.products[key];

  const currentPeriod = props.service.data.expiration
    ? toDate(props.service.data.expiration)
    : toDate(props.service.data.next_payment_date);

  const newPeriod = props.service.data.expiration
    ? toDate(props.service.data.expiration + +period)
    : toDate(props.service.data.next_payment_date + +period);

  return {
    service: props.service,
    currentPeriod,
    newPeriod,
    price: price,
    addonsPrice: addonsPrice.value,
    currentAutoRenew: props.service.config.auto_renew,
    blocked: props.service.data.blocked,
  };
});

function toDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const time = date
    .toTimeString()
    .split(" ")[0]
    .split(":")
    .slice(0, 2)
    .join(":");

  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (`${month}`.length < 2) month = `0${month}`;
  if (`${day}`.length < 2) day = `0${day}`;

  return `${day}.${month}.${year} ${time}`;
}
</script>

<script>
export default { name: "LittleButton" };
</script>

<style scoped>
.btn {
  display: flex;
  align-items: center;
  gap: 5px;
  grid-column: 2 / 4;
  justify-self: end;
  width: fit-content;
}

.btn button {
  height: 100%;
}
</style>
