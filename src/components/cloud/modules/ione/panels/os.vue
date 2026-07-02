<template>
  <div class="newCloud__option-field">
    <images-list
      v-if="provider"
      :images="images"
      :os-name="options.os.name"
      :set-o-s="setOS"
    />

    <a-row>
      <a-col :xs="24" :sm="24">
        <a-form
          ref="ioneForm"
          no-style
          autocomplete="off"
          layout="vertical"
          :rules="rules"
          :model="authData"
        >
          <a-row :gutter="15">
            <a-col :xs="24" :sm="12">
              <a-form-item
                style="margin-top: 15px"
                class="newCloud__form-item"
                name="vmName"
                :label="`${capitalize($t('server name'))}:`"
              >
                <a-input v-model:value="authData.vmName" />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :sm="12">
              <a-form-item
                style="margin-top: 15px"
                class="newCloud__form-item"
                name="username"
                :label="`${capitalize($t('clientinfo.username'))}:`"
              >
                <a-input
                  disabled
                  v-model:value="authData.username"
                  @input="checkIsNameValid"
                />
              </a-form-item>
            </a-col>

            <a-col v-if="authStore.userdata.uuid" :xs="24" :sm="12">
              <a-form-item
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
                  v-model:visible="passwordVisible"
                  :value="authData.password"
                  class="password"
                  autocomplete="new-password"
                  @update:value="authData.password = $event"
                  @input="(e) => (authData.password = e.target.value)"
                >
                  <template #iconRender="visible">
                    <span
                      style="
                        display: inline-flex;
                        align-items: center;
                        gap: 2px;
                      "
                    >
                      <EyeTwoTone v-if="visible" />
                      <EyeInvisibleOutlined v-else />

                      <a-tooltip
                        :title="`${$t('ssl_product.generate')} ${$t('clientinfo.password')}`"
                      >
                        <a-button
                          type="text"
                          shape="circle"
                          style="
                            width: 28px;
                            height: 28px;
                            min-width: 28px;
                            margin-left: 4px;
                            padding: 0;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                          "
                          @click.stop="generatePassword"
                        >
                          <template #icon>
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style="width: 18px; height: 18px; display: block"
                            >
                              <rect
                                x="4"
                                y="4"
                                width="16"
                                height="16"
                                rx="3"
                                stroke="currentColor"
                                stroke-width="1.8"
                              />
                              <circle
                                cx="8.5"
                                cy="8.5"
                                r="1.2"
                                fill="currentColor"
                              />
                              <circle
                                cx="15.5"
                                cy="8.5"
                                r="1.2"
                                fill="currentColor"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="1.2"
                                fill="currentColor"
                              />
                              <circle
                                cx="8.5"
                                cy="15.5"
                                r="1.2"
                                fill="currentColor"
                              />
                              <circle
                                cx="15.5"
                                cy="15.5"
                                r="1.2"
                                fill="currentColor"
                              />
                            </svg>
                          </template>
                        </a-button>
                      </a-tooltip>

                      <a-tooltip
                        :title="`${capitalize($t('copy'))} ${$t('clientinfo.password')}`"
                      >
                        <a-button
                          type="text"
                          shape="circle"
                          :disabled="!authData.password"
                          style="
                            width: 28px;
                            height: 28px;
                            min-width: 28px;
                            padding: 0;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                          "
                          @click.stop="copyPassword"
                        >
                          <template #icon>
                            <CopyOutlined style="font-size: 18px" />
                          </template>
                        </a-button>
                      </a-tooltip>
                    </span>
                  </template>
                </a-input-password>
              </a-form-item>
            </a-col>

            <a-col v-if="authStore.userdata.uuid" :xs="24" :sm="12">
              <a-form-item
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
            </a-col>
          </a-row>
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
import {
  CopyOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
} from "@ant-design/icons-vue";
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
const passwordVisible = ref(false);

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
          i18n.t(i18n.t("The username must be without special characters")),
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
            "Password must contain uppercase letters, numbers and symbols",
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

watch(
  [activeKey, authData],
  async () => {
    try {
      await ioneForm.value.validateFields();
      validationPanels.value["os"] = false;
    } catch (e) {
      validationPanels.value["os"] = true;
    }
  },
  { deep: true },
);

watch(
  () => options.os?.name,
  (osName) => {
    if (!osName) return;

    authData.value.username = getUsernameByOs(osName);
    checkIsNameValid();
  },
  { immediate: true },
);

function setOS(item, index) {
  if (item.warning) {
    message.warn(item.warning);
    return;
  }
  setOptions("os.id", +index);
  setOptions("os.name", item.name);
}

function getUsernameByOs(osName = "") {
  return /windows/i.test(String(osName)) ? "Administrator" : "root";
}

const PASSWORD_SPECIALS = "+=._!*-";

function randomChar(chars) {
  return chars[Math.floor(Math.random() * chars.length)];
}

function shuffle(chars) {
  const list = [...chars];

  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  return list;
}

function isPasswordValid(password) {
  return (
    /^(?=.*\d)[\w+=._!*-]{9,32}$/.test(password) &&
    !/[^a-zA-Z0-9]$/.test(password)
  );
}

function generatePassword() {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const allowed = `${lowercase}${uppercase}${digits}${PASSWORD_SPECIALS}`;
  const length = 14;

  let password = "";

  while (!password || !isPasswordValid(password)) {
    const required = [
      randomChar(lowercase),
      randomChar(uppercase),
      randomChar(digits),
      randomChar(PASSWORD_SPECIALS),
    ];

    while (required.length < length - 1) {
      required.push(randomChar(allowed));
    }

    const body = shuffle(required).join("");
    const lastChar = randomChar(`${lowercase}${uppercase}${digits}`);
    password = `${body}${lastChar}`;
  }

  authData.value.password = password;
}

async function copyPassword() {
  if (!authData.value.password) return;

  try {
    await navigator.clipboard.writeText(authData.value.password);
  } catch (e) {
    const field = document.createElement("textarea");
    field.value = authData.value.password;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";

    document.body.appendChild(field);
    field.focus();
    field.select();
    document.execCommand("copy");
    document.body.removeChild(field);
  }
}
</script>

<script>
export default { name: "IoneOsPanel" };
</script>
