<template>
  <div class="newCloud__option-field">
    <images-list
      v-if="provider"
      :images="images"
      :os-name="options.os.name"
      :set-o-s="setOS"
    />

    <a-row>
      <a-col :xs="24" :sm="10">
        <a-form
          ref="ioneForm"
          no-style
          autocomplete="off"
          layout="vertical"
          :rules="rules"
          :model="authData"
        >
          <a-form-item
            style="margin-top: 15px"
            class="newCloud__form-item"
            name="vmName"
            :label="`${capitalize($t('server name'))}:`"
          >
            <a-input v-model:value="authData.vmName" />
          </a-form-item>

          <a-form-item
            style="margin-top: 15px"
            class="newCloud__form-item"
            name="username"
            :label="`${capitalize($t('clientinfo.username'))}:`"
          >
            <a-input
              v-model:value="authData.username"
              @input="checkIsNameValid"
            />
          </a-form-item>

          <a-form-item
            v-if="authStore.userdata.uuid"
            name="password"
            class="newCloud__form-item"
            :label="`${capitalize($t('clientinfo.password'))}:`"
          >
            <password-meter
              :style="{
                height: authData.password.length > 0 ? '10px' : '0',
                marginTop: 0,
                marginBottom: authData.password.length > 0 ? '4px' : null,
              }"
              :password="authData.password"
              @score="(value) => (authData.score = value.score)"
            />

            <a-input-password
              v-model:value="authData.password"
              class="password"
            />
          </a-form-item>

          <a-form-item
            v-if="authStore.userdata.uuid"
            class="newCloud__form-item"
            :label="`${$t('SSH key')}:`"
          >
            <a-select
              v-model:value="authData.sshKey"
              style="width: 100%"
              :options="authStore.userdata.data?.ssh_keys"
              :field-names="{
                label: 'title',
                value: 'value',
                options: 'options',
              }"
            />
          </a-form-item>
        </a-form>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { computed, inject, onBeforeMount, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import passwordMeter from "vue-simple-password-meter";

import { useAuthStore } from "@/stores/auth.js";
import { useCloudStore } from "@/stores/cloud.js";

import imagesList from "@/components/ui/images.vue";

const i18n = useI18n();
const authStore = useAuthStore();
const cloudStore = useCloudStore();
const { authData, provider, validationPanels } = storeToRefs(cloudStore);

const [options, setOptions] = inject("useOptions")();

const ioneForm = ref(null);

const [activeKey] = inject("useActiveKey", () => [])();

const images = computed(() => {
  const { templates } = provider.value.publicData;
  const images = {};

  Object.entries(templates ?? {}).forEach(([key, value]) => {
    if (cloudStore.plan.meta.hidedOs?.includes(key)) return;
    if (value.is_public !== false) {
      images[key] = value;
    }
  });

  return images;
});

const rules = {
  vmName: {
    trigger: "change",
    required: true,
    validator: () =>
      authData.value.vmName.length < 2
        ? Promise.reject(i18n.t("ssl_product.field is required"))
        : Promise.resolve(),
  },
  username: {
    trigger: "change",
    required: true,
    validator: () => {
      if (authData.value.username.length < 2) {
        return Promise.reject(i18n.t("ssl_product.field is required"));
      }

      if (/[^a-zA-Z0-9]/.test(authData.value.username)) {
        return Promise.reject(
          i18n.t(i18n.t("The username must be without special characters"))
        );
      }

      return Promise.resolve();
    },
  },
  password: {
    trigger: "change",
    required: true,
    validator: () => {
      try {
        if (authData.value.password === "") {
          authData.value.password_valid = false;
          throw new Error(i18n.t("ssl_product.field is required"));
        }
        if (/[^a-zA-Z0-9]$/.test(authData.value.password)) {
          authData.value.password_valid = false;
          throw new Error(i18n.t("The last character must not be special"));
        }
        if (/^(?=.*\d)[\w+=._!*-]{9,32}$/.test(authData.value.password)) {
          authData.value.password_valid = true;
          return Promise.resolve();
        } else {
          authData.value.password_valid = false;
          throw new Error(`
          ${i18n.t(
            "Password must contain uppercase letters, numbers and symbols"
          )} (+-.-_!*)
        `);
        }
      } catch (error) {
        return Promise.reject(error.message);
      }
    },
  },
};

const checkIsNameValid = async () => {
  try {
    await rules.username.validator(authData.value.username);
    authData.value.is_username_valid = true;
  } catch {
    authData.value.is_username_valid = false;
  }
};

onBeforeMount(() => {
  const images = Object.entries(provider.value?.publicData.templates ?? {});

  if (images.length === 1) setOS(images[0][1], images[0][0]);
});

watch(activeKey, async () => {
  try {
    await ioneForm.value.validateFields();
    validationPanels.value["os"] = false;
  } catch (e) {
    validationPanels.value["os"] = true;
  }
});

function setOS(item, index) {
  if (item.warning) {
    message.warn(item.warning);
    return;
  }
  setOptions("os.id", +index);
  setOptions("os.name", item.name);
}
</script>

<script>
export default { name: "IoneOsPanel" };
</script>
