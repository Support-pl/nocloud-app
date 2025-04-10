<template>
  <a-modal
    :open="open"
    @update:open="emit('update:open', $event)"
    :title="$t('phone_verification.labels.verify')"
  >
    <div class="verification_form">
      <div class="description">
        <span>{{
          $t("phone_verification.labels.description", {
            phone_number: `${phonecode}${billingUser.phonenumber}`,
          })
        }}</span>
      </div>

      <a-input
        :disabled="!lastGetCodeTs || timeToBlockCode < 0"
        :placeholder="$t('phone_verification.labels.code')"
        v-model:value="secureCode"
      />

      <div class="time_to_new_code" v-if="timeToNewCode > 0">
        <span>{{
          $t("phone_verification.labels.code_again", {
            seconds: timeToNewCode,
          })
        }}</span>
      </div>
    </div>

    <template #footer>
      <div class="verification_actions">
        <a-button
          :disabled="timeToNewCode > 0"
          @click="getCode"
          :loading="isGetCodeLoading"
          >{{ $t("phone_verification.actions.get_code") }}
        </a-button>
        <a-button
          :disabled="
            !lastGetCodeTs ||
            timeToBlockCode < 0 ||
            !/^\d+$/.test(secureCode) ||
            secureCode.length != 6 ||
            secureCode == lastSecureCode
          "
          @click="confirmCode"
          :loading="isConfirmCodeLoading"
          >{{ $t("phone_verification.actions.confirm_code") }}</a-button
        >
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import api from "@/api";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";
import { onMounted, ref, watch } from "vue";
import countries from "@/assets/countries.json";
import { notification } from "ant-design-vue";
import { useI18n } from "vue-i18n";

const props = defineProps({ open: { type: Boolean, default: false } });

const emit = defineEmits(["update:open", "confirm"]);

const i18n = useI18n();

const isGetCodeLoading = ref(false);
const isConfirmCodeLoading = ref(false);
const secureCode = ref("");
const lastSecureCode = ref("");
const lastGetCodeTs = ref();
const timeToNewCode = ref();
const timeToBlockCode = ref();
let intervalTimer;

const authStore = useAuthStore();
const { billingUser, userdata } = storeToRefs(authStore);
const phonecode = ref();

onMounted(() => {
  phonecode.value = countries.find(
    ({ code }) => code === billingUser.value.countrycode
  )?.dial_code;

  lastGetCodeTs.value =
    +localStorage.getItem("phone_number_verification_ts") || "";
});

async function getCode() {
  isGetCodeLoading.value = true;

  try {
    await api.post("/accounts/verify", {
      action: "BEGIN",
      type: "PHONE",
      account: userdata.value.uuid,
    });

    lastGetCodeTs.value = Math.floor(Date.now() / 1000);
    localStorage.setItem(
      "phone_number_verification_ts",
      lastGetCodeTs.value.toString()
    );
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.error({ message: i18n.t(message) });
  } finally {
    isGetCodeLoading.value = false;
  }
}

async function confirmCode() {
  isConfirmCodeLoading.value = true;

  try {
    lastSecureCode.value = secureCode.value;

    await api.post("/accounts/verify", {
      action: "APPROVE",
      type: "PHONE",
      account: userdata.value.uuid,
      secure_code: secureCode.value,
    });

    lastGetCodeTs.value = "";
    localStorage.removeItem("phone_number_verification_ts");

    emit("confirm");
    emit("update:open", false);
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    notification.error({ message: i18n.t(message) });
  } finally {
    isConfirmCodeLoading.value = false;
  }
}

watch(lastGetCodeTs, () => {
  clearInterval(intervalTimer);

  intervalTimer = setInterval(() => {
    timeToNewCode.value = lastGetCodeTs.value
      ? lastGetCodeTs.value + 60 * 3 - Math.floor(Date.now() / 1000)
      : -1;

    timeToBlockCode.value = lastGetCodeTs.value
      ? lastGetCodeTs.value + 60 * 10 - Math.floor(Date.now() / 1000)
      : -1;
  }, 1000);
});

watch(billingUser, () => {
  phonecode.value = countries.find(
    ({ code }) => code === billingUser.value.countrycode
  )?.dial_code;
});
</script>
