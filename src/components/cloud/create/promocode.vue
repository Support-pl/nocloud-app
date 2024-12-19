<template>
  <a-row
    v-if="!isFlavorsLoading"
    justify="center"
    :style="{ 'font-size': '1.4rem', 'margin-top': '10px' }"
  >
    <a-col style="margin-right: 4px">
      <a-input
        :readonly="isPromocodeAlreadyApply || isPromocodeLoading"
        :disabled="isPromocodeAlreadyApply"
        :status="isFailedPromocode ? 'error' : ''"
        :value="promocode"
        @change="onPromocodeChange"
        :placeholder="t('promocode.placeholder')"
        :maxlength="6"
        style="width: 100px"
      />
    </a-col>
    <a-col>
      <a-button
        :disabled="isPromocodeApplyDisabled"
        :loading="isPromocodeLoading"
        @click="!isPromocodeAlreadyApply ? applyPromocode() : resetPromocode()"
      >
        {{
          $t(
            `promocode.actions.${isPromocodeAlreadyApply ? "delete" : "apply"}`
          )
        }}
      </a-button>
    </a-col>
  </a-row>
</template>

<script setup>
import { usePromocodesStore } from "@/stores/promocodes";
import { computed, ref, toRefs, watch } from "vue";
import { GetPromocodeByCodeRequest } from "nocloud-proto/proto/es/billing/promocodes/promocodes_pb";
import { useCloudStore } from "@/stores/cloud";
import { storeToRefs } from "pinia";
import { Code } from "@connectrpc/connect";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";

const props = defineProps({
  isFlavorsLoading: { type: Boolean, default: false },
});

const { isFlavorsLoading } = toRefs(props);

const { promocode: storePromocode, planId } = storeToRefs(useCloudStore());
const promocodesStore = usePromocodesStore();
const { openNotification } = useNotification();
const { t } = useI18n();

const promocode = ref("");
const isPromocodeLoading = ref(false);
const isPromocodeError = ref(false);
const lastApplyPromocode = ref("");

const isPromocodeApplyDisabled = computed(
  () => promocode.value.length !== 6 || isFailedPromocode.value
);

const isFailedPromocode = computed(
  () => isPromocodeError.value && promocode.value == lastApplyPromocode.value
);

const isPromocodeAlreadyApply = computed(() => !!storePromocode.value);

const onPromocodeChange = (v) => {
  promocode.value = v.target.value.toUpperCase().replaceAll(" ", "");
};

const applyPromocode = async () => {
  isPromocodeLoading.value = true;
  isPromocodeError.value - false;

  try {
    const response = await promocodesStore.promocodesApi.getByCode(
      GetPromocodeByCodeRequest.fromJson({
        code: promocode.value,
        billingPlan: planId.value,
      })
    );

    storePromocode.value = response;
  } catch (e) {
    let msg = "promocode.errors.";

    switch (e.code || 5) {
      case Code.FailedPrecondition: {
        msg += "wrong_plan";
        break;
      }
      case Code.ResourceExhausted:
      case Code.OutOfRange: {
        msg += "expired";
        break;
      }
      case Code.Internal: {
        msg += "internal";
        break;
      }
      case Code.AlreadyExists: {
        msg += "already_used";
        break;
      }
      case Code.NotFound:
      default: {
        msg += "not_found";
        break;
      }
    }

    openNotification("error", { message: t(msg) });

    storePromocode.value = null;

    isPromocodeError.value = true;
    lastApplyPromocode.value = promocode.value;
  } finally {
    isPromocodeLoading.value = false;
  }
};

const resetPromocode = async () => {
  storePromocode.value = null;
};

watch(isFlavorsLoading, () => {
  isPromocodeError.value = false;
  promocode.value = "";
});
</script>
