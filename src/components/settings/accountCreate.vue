<template>
  <a-form ref="formRef" layout="vertical" :model="form" :rules="rules">
    <a-form-item
      v-for="key of mainKeys"
      :key="key"
      :label="`${capitalize($t(`clientinfo.${key}`))}:`"
      :name="key"
    >
      <a-input v-model:value="form[key]" :disabled="isDisabled" />
    </a-form-item>

    <a-form-item :label="`${capitalize($t('clientinfo.phonenumber'))}:`">
      <a-row :gutter="8">
        <a-col :span="24">
          <phone-input
            :number="form.phone_number"
            @update:number="form.phone_number = $event"
            :code="form.phone_cc"
            @update:code="form.phone_cc = $event"
          />
        </a-col>
      </a-row>
    </a-form-item>

    <a-form-item
      v-if="isPasswordVisible"
      :label="`${capitalize($t('clientinfo.password'))}:`"
      name="password"
    >
      <a-input v-model:value="form.password" />
    </a-form-item>

    <a-form-item
      v-if="isPasswordVisible"
      :label="`${capitalize($t('clientinfo.password again'))}:`"
      name="passwordAgain"
    >
      <a-input v-model:value="form.passwordAgain" />
    </a-form-item>

    <a-space style="margin-top: 10px">
      <a-button
        v-if="isPasswordVisible"
        type="primary"
        :loading="isCreateLoading"
        @click="createAccount"
      >
        {{ $t("Submit") }}
      </a-button>

      <a-button danger @click="emits('cancel')">
        {{ $t("Cancel") }}
      </a-button>
    </a-space>
  </a-form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useNotification } from "@/hooks/utils";
import PhoneInput from "../ui/phoneInput.vue";

const props = defineProps({
  account: { type: Object, default: null },
});
const emits = defineEmits(["cancel"]);

const i18n = useI18n();
const authStore = useAuthStore();
const namespacesStore = useNamespasesStore();
const { openNotification } = useNotification();

const mainKeys = ["firstname", "lastname", "email"];
const formRef = ref(null);
const form = ref({});

const isDisabled = computed(() => props.account);
const isPasswordVisible = computed(() => !props.account);
const isCreateLoading = ref(false);

const reqRule = reactive({
  required: true,
  message: "Field is required",
  trigger: "change",
});
const rules = computed(() => ({
  email: [reqRule],
  lastname: [reqRule],
  firstname: [reqRule],
  phone_cc: [reqRule],
  phone_number: [reqRule],
  password: [reqRule],
  passwordAgain: [
    {
      required: true,
      trigger: "change",
      validator(_, value) {
        if (value !== form.value.password) {
          return Promise.reject(i18n.t("Password mismatch"));
        }
        return Promise.resolve();
      },
    },
  ],
}));

async function createAccount() {
  try {
    await formRef.value.validate();
  } catch {
    openNotification("error", {
      message: i18n.t("ssl_product.fields is required"),
    });
    return;
  }

  isCreateLoading.value = true;
  try {
    const namespace = namespacesStore.namespaces.find(
      ({ access }) => access.namespace === authStore.userdata.uuid
    );

    await namespacesStore.createAccount({
      title: `${form.value.firstname} ${form.value.lastname}`,
      auth: {
        type: "standard",
        data: [form.value.email, form.value.password],
      },
      namespace: namespace.uuid,
      accountOwner: authStore.userdata.uuid,
      currency: authStore.userdata.currency,
      data: {
        email: form.value.email,
        phone_new: {
          phone_cc: form.value.phone_cc,
          phone_number: form.value.phone_number,
        },
      },
    });

    openNotification("success", { message: `${i18n.t("Done")}!` });
    emits("cancel");
  } catch (error) {
    openNotification("error", {
      message: error.response?.data?.message ?? error.message ?? error,
    });
  } finally {
    isCreateLoading.value = false;
  }
}

onMounted(() => {
  reqRule.message = `${i18n.t("ssl_product.field is required")}`;

  if (props.account) {
    form.value = {
      email: props.account.data.email,
      lastname: props.account.title.split(" ").at(0),
      firstname: props.account.title.split(" ").at(-1),
      phone_number: props.account.data.phone,
    };
  }
});

const theme = inject("theme");
const inputColors = computed(() =>
  theme.value
    ? { background: "var(--bright_bg)", border: "var(--bright_font)" }
    : { background: "inherit", border: "var(--border_color)" }
);

if (namespacesStore.namespaces.length < 1) {
  namespacesStore.fetch();
}
</script>

<style scoped>
.user__input {
  padding: 4px 11px;
  font-size: 14px;
  width: 100%;
  border: 1px solid v-bind("inputColors.border");
  border-radius: 6px;
  transition: all 0.2s;
  background: v-bind("inputColors.background");
}

.user__input:disabled {
  color: v-bind("inputColors.background");
  background-color: v-bind("inputColors.border");
  border-color: v-bind("inputColors.border");
  box-shadow: none;
  cursor: not-allowed;
}
</style>
