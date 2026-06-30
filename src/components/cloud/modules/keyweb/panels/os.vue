<template>
  <div v-if="images.length > 0" class="newCloud__option-field">
    <a-form
      no-style
      autocomplete="off"
      layout="vertical"
      style="margin-bottom: 10px"
      :rules="rules"
      ref="keywebForm"
      :model="authData"
    >
      <a-row :gutter="15">
        <a-col :xs="24" :sm="12">
          <a-form-item
            name="vmName"
            :label="`${capitalize($t('server name'))}:`"
          >
            <a-input v-model:value="authData.vmName" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="12" style="display: none;">
          <a-form-item
            name="username"
            class="newCloud__form-item"
            :label="`${capitalize($t('clientinfo.username'))}:`"
          >
            <a-input
              :value="authData.username"
              @update:value="
                authData.username = $event;
                setOptions('config.username', $event);
              "
            />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="12">
          <a-form-item
            name="password"
            :label="`${capitalize($t('clientinfo.password'))}:`"
          >
            <password-meter
              :style="{
                height: authData.password.length > 0 ? '10px' : '0',
                marginTop: authData.password.length < 1 ? '0' : '-8px',
              }"
              :password="authData.password"
              @score="(value) => (authData.score = value.score)"
            />

            <a-input-password
              v-model:visible="passwordVisible"
              :value="authData.password"
              @update:value="
                authData.password = $event;
                setOptions('config.password', $event);
              "
              class="password"
              autocomplete="new-password"
              @input="
                authData.password = $event.target.value;
                setOptions('config.password', $event.target.value);
              "
            >
              <template #iconRender="visible">
                <span style="display: inline-flex; align-items: center; gap: 2px">
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
                          <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
                          <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
                          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                          <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" />
                          <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
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
      </a-row>

      <a-form-item name="hostname" style="display: none">
        <a-input v-model:value="authData.hostname" />
      </a-form-item>
    </a-form>

    <images-list
      v-if="cloudStore.provider"
      :images="images"
      :os-name="options.os.name"
      :os-price="osPrice"
      :set-o-s="setOS"
    />
  </div>

  <a-alert
    v-else
    show-icon
    type="warning"
    :message="$t('No OS. Choose another plan')"
  />
</template>

<script setup>
import { inject, ref, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import {
  CopyOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
} from "@ant-design/icons-vue";
import passwordMeter from "vue-simple-password-meter";
import { useCloudStore } from "@/stores/cloud.js";
import { useAddonsStore } from "@/stores/addons.js";
import imagesList from "@/components/ui/images.vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  mode: { type: String, default: "" },
  productSize: { type: String, required: true },
  plans: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  isFlavorsLoading: { type: Boolean, default: false },
});

const i18n = useI18n();

const cloudStore = useCloudStore();
const { authData, validationPanels } = storeToRefs(cloudStore);
const addonsStore = useAddonsStore();
const images = ref([]);

const keywebForm = ref(null);
const passwordVisible = ref(false);
const rules = {
  vmName: {
    trigger: "change",
    required: true,
    validator: () =>
      authData.value.vmName.length < 2
        ? Promise.reject(i18n.t("ssl_product.field is required"))
        : Promise.resolve(),
  },
  hostname: {
    trigger: "change",
    required: true,
    validator: () => {
      if (authData.value.hostname.length < 3) {
        return Promise.reject(i18n.t("ssl_product.field is required"));
      }

      if (/[^a-zA-Z0-9]/.test(authData.value.hostname)) {
        return Promise.reject(
          i18n.t("The hostname must be without special characters"),
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
          throw new Error(i18n.t("ssl_product.field is required"));
        }

        if (/[^a-zA-Z0-9]$/.test(authData.value.password)) {
          throw new Error(i18n.t("The last character must not be special"));
        }

        if (/^(?=.*\d)[\w+=._!*-]{9,32}$/.test(authData.value.password)) {
          return Promise.resolve();
        } else {
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
};

const [product] = inject("useProduct", () => [])();
const [options, setOptions] = inject("useOptions", () => [])();
const [price, setPrice] = inject("usePriceOVH", () => [])();
const [activeKey] = inject("useActiveKey", () => [])();

const HOSTNAME_FILLER = "srv";
const PASSWORD_SPECIALS = "+=._!*-";

watch(
  () => authData.value.vmName,
  (vmName) => {
    const hostname = generateHostname(vmName);
    authData.value.hostname = hostname;
    setOptions("config.hostname", hostname);
  },
  { immediate: true },
);

watch(
  () => options.os?.name,
  (osName) => {
    if (!osName) return;

    const username = getUsernameByOs(osName);
    authData.value.username = username;
    setOptions("config.username", username);
  },
  { immediate: true },
);

watch(
  [activeKey, authData],
  async () => {
    try {
      await keywebForm.value.validateFields();
      validationPanels.value["os"] = false;
    } catch (e) {
      validationPanels.value["os"] = true;
    }
  },
  { deep: true },
);

watch(() => addonsStore.addons, setImages);
watch(() => props.productSize, setImages);
if (props.productSize) setImages();

async function setImages() {
  await nextTick();

  if (!product.value) return;
  const filtered = addonsStore.addons.filter(
    ({ uuid }) =>
      cloudStore.plan.addons.includes(uuid) ||
      product.value.addons?.includes(uuid),
  );
  const list = [];

  filtered.forEach((item) => {
    const { uuid, title, periods, meta, system, group, public: enabled } = item;
    const isEqualGroup = group === cloudStore.plan.uuid;
    const isIncluded = meta.type?.includes("OS");

    if (title.toLowerCase().includes("disabled")) return;
    if (!system || !isIncluded) return;
    if (!enabled || !isEqualGroup) return;

    list.push({
      key: uuid,
      name: title,
      desc: title,
      type: meta.type,
      price: periods[product.value.period],
    });
  });

  images.value = list;
}

function setOS(item, index) {
  if (item.warning) return;
  setOptions("os.id", +index);
  setOptions("os.name", item.name);

  if (item.price) {
    setPrice("addons.os", item.price);
  } else if (price.addons.os !== 0) {
    setPrice("addons.os", 0);
  }

  const addonsKeys = [...options.addons].filter(
    (uuid) => !images.value.find((image) => image.key === uuid),
  );

  addonsKeys.push(item.key);

  setOptions("addons", addonsKeys);
}

function generateHostname(serverName = "") {
  const normalized = String(serverName).replace(/[^a-zA-Z0-9]/g, "");

  if (normalized.length >= 3) {
    return normalized;
  }

  const requiredChars = 3 - normalized.length;
  return `${normalized}${HOSTNAME_FILLER.slice(0, requiredChars)}`;
}

function getUsernameByOs(osName = "") {
  return /windows/i.test(String(osName)) ? "Administrator" : "root";
}

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
  setOptions("config.password", password);
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

function osPrice(item) {
  return item.price;
}
</script>

<script>
export default { name: "KeywebOsPanel" };
</script>
