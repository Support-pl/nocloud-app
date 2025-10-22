<template>
  <create-actions
    :modal-options="modalOptions"
    :create-button-options="createButtonOptions"
    :next-button-options="nextButtonOptions"
  >
    <template #before>
      <pre style="display: none">{{ nextButtonOptions }}</pre>
      <pre style="display: none">{{ createButtonOptions }}</pre>
      <pre style="display: none">{{
        [
          props.skipPasswordCheck
            ? false
            : (authData.password.length === 0 || !authData.password_valid) &&
              isLogged,
          authData.vmName === "",
          !namespaceId && isLogged,
          options.os.name === "",
          !authData.is_username_valid,
        ]
      }}</pre>
      <a-col
        v-if="isUnlogginedLinkVisible"
        class="products__unregistred"
        style="margin-top: 15px; text-align: center"
      >
        {{ capitalize($t("unregistered.will be able after")) }}
        <a href="#" @click.prevent="availableLogin('login')">
          {{ $t("unregistered.login") }} </a
        >.
        <br />
        <a href="#" @click.prevent="availableLogin('copy')">
          {{ $t("Copy link") }} <copy-icon />
        </a>
      </a-col>
    </template>

    <template #modalContent>
      <span
        v-if="
          authData.score < 4 && provider.type !== 'ovh' && !skipPasswordCheck
        "
        style="color: var(--err)"
      >
        {{ $t("Password must contain uppercase letters, numbers and symbols") }}
      </span>
      <template v-else>
        {{ $t("Virtual machine will be available after paying the invoice") }}
      </template>

      <!-- <a-row v-if="cloudStore.authData.score > 3" style="margin-top: 20px">
        <a-col>
          <a-checkbox v-model:checked="cloudStore.autoRenew" />
          {{ capitalize($t('renew automatically')) }}
        </a-col>
      </a-row> -->
    </template>

    <template #after>
      <a-col
        v-if="provider?.type !== 'ovh' && tarification === 'Hourly'"
        style="font-size: 14px; margin: 16px 16px 0"
      >
        <span style="position: absolute; left: -8px">*</span>
        {{ $t("Payment will be made immediately after purchase") }}
      </a-col>
    </template>
  </create-actions>
</template>

<script setup>
import { defineAsyncComponent, computed, reactive, inject, toRefs } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app.js";

import { useAuthStore } from "@/stores/auth.js";
import { useCloudStore } from "@/stores/cloud.js";
import { useClipboard } from "@/hooks/utils";

import createActions from "@/components/ui/createActions.vue";
import { useCurrenciesStore } from "@/stores/currencies";
import { useI18n } from "vue-i18n";
import { useSpStore } from "@/stores/sp";

const copyIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CopyOutlined")
);

const props = defineProps({
  createOrder: { type: Function, required: true },
  tarification: { type: String, required: true },
  productSize: { type: String, required: true },
  panels: { type: Array, required: true },
  skipPasswordCheck: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
});

const router = useRouter();
const authStore = useAuthStore();
const { isLogged } = toRefs(authStore);
const appStore = useAppStore();
const cloudStore = useCloudStore();
const { authData, provider, namespaceId, plan, locationId, showcaseId } =
  toRefs(cloudStore);
const currenciesStore = useCurrenciesStore();
const { addToClipboard } = useClipboard();
const { locale } = useI18n();
const spStore = useSpStore();

const [options] = inject("useOptions", () => [])();
const [activeKey, nextStep] = inject("useActiveKey", () => [])();
const modal = reactive({ confirmCreate: false, confirmLoading: false });

const modalOptions = computed(() => {
  const isWeakPass = authData.value.score < 4 && provider.value?.type !== "ovh";

  return {
    title: isWeakPass && !props.skipPasswordCheck ? "Weak pass" : "Confirm",
    visible: modal.confirmCreate,
    loading: modal.confirmLoading,
    okProps: { disabled: isWeakPass },
    onOk: async () => {
      modal.confirmLoading = true;
      await props.createOrder();
      modal.confirmLoading = false;
    },
    onCancel: () => {
      modal.confirmCreate = false;
    },
  };
});

const createButtonOptions = computed(() => {
  const result = {
    disabled: true,
    onClick: () => {
      if (isLogged.value) modal.confirmCreate = true;
      else availableLogin("login");
    },
  };

  if (provider.value?.type === "ovh") {
    result.disabled =
      authData.value.vmName === "" ||
      (!namespaceId.value && isLogged.value) ||
      options.os.name === "" ||
      (plan.value?.type === "ovh cloud" && !options.config.ssh);
  } else {
    result.disabled =
      (props.skipPasswordCheck
        ? false
        : (authData.value.password.length === 0 ||
            !authData.value.password_valid) &&
          isLogged.value) ||
      authData.value.vmName === "" ||
      (!namespaceId.value && isLogged.value) ||
      options.os.name === "" ||
      !authData.value.is_username_valid;
  }

  return result;
});

const nextButtonOptions = computed(() => ({
  visible: activeKey.value !== props.panels.at(-1),
  onClick: nextStep,
}));

const isUnlogginedLinkVisible = computed(() => {
  const { score, password, vmName } = cloudStore.authData;
  const isStrongPass = score > 3 && password.length > 0;
  const isNotOvh = provider.value?.type !== "ovh";

  if (isLogged.value) return false;
  return (isNotOvh && isStrongPass) || (options.os.name && vmName);
});

function availableLogin(mode) {
  const data = {
    path: router.currentRoute.value.path,
    query: router.currentRoute.value.query,
    titleSP: provider.value.title,
    tarification: props.tarification,
    productSize: props.productSize,
    titleVM: authData.value.vmName,
    locationId: locationId.value,
    activeKey: activeKey.value,
    resources: {
      cpu: options.cpu.size,
      ram: options.ram.size * 1024,
      drive_type: options.disk.type,
      drive_size: options.disk.size,
      ips_private: options.network.private.count,
      ips_public: options.network.public.count,
    },
    config: {
      template_id: options.os.id,
      template_name: options.os.name,
    },
    billing_plan: { uuid: plan.value.uuid },
    ovhConfig: options.config,
  };

  if (mode === "login") {
    localStorage.setItem("data", JSON.stringify(data));

    const showcase =
      spStore.showcases.find(({ uuid }) => uuid === showcaseId.value) ?? {};

    appStore.onLogin.info = {
      type: "vdc",
      title: [
        showcase.promo?.[locale.value]?.title ?? showcase.title ?? "VDS",
        props.productSize,
      ].join(" - "),
      cost: props.price,
      currency: currenciesStore.unloginedCurrency.title,
    };

    router.push({ name: "login" });
  } else if (mode === "copy") {
    const link = new URL(location.href);

    link.searchParams.set("data", JSON.stringify(data));
    addToClipboard(link.href);
  } else {
    localStorage.setItem("data", JSON.stringify(data));
  }
}
</script>

<script>
export default { name: "CloudCreateButton" };
</script>
