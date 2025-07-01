<template>
  <a-list
    class="databases_list"
    size="large"
    bordered
    :data-source="databases"
    :locale="{ emptyText: t('bots_databases.labels.empty_databases') }"
  >
    <template #header>
      <div class="header">
        {{ t(`bots_databases.labels.${title}`) }}

        <a-tooltip>
          <template #title>
            <span v-html="t(`bots_databases.tips.${title}`)" />
          </template>
          <help-icon class="icon" />
        </a-tooltip>
      </div>
    </template>

    <template #renderItem="{ item }">
      <a-list-item style="padding: 5px 15px;">
        <div class="database_item">
          <a @click="handleOpenDatabase(item)">{{ item.name }}</a>

          <div>
            <a-popconfirm
              :title="t('bots_databases.tips.delete_database')"
              :ok-text="t('Yes')"
              :cancel-text="t('Cancel')"
              @confirm="handleDeleteDatabase(item)"
            >
              <a-button
                :disabled="selectedDatabase !== item.id && isDeleteLoading"
                :loading="selectedDatabase === item.id && isDeleteLoading"
                class="button"
                size="large"
                type="text"
                shape="circle"
              >
                <template #icon>
                  <delete-icon two-tone-color="#ff4d4f" class="icon" />
                </template>
              </a-button>
            </a-popconfirm>

            <a-tooltip v-if="!item.enabled" placement="top">
              <template #title>
                <span>{{ t("bots_databases.tips.attach_database") }}</span>
              </template>
              <a-button
                :disabled="selectedDatabase !== item.id && isAttachLoading"
                :loading="selectedDatabase === item.id && isAttachLoading"
                class="button"
                size="large"
                type="text"
                shape="circle"
                @click="handleAttachDatabase(item)"
              >
                <template #icon>
                  <attach-icon two-tone-color="#faad14" class="icon" />
                </template>
              </a-button>
            </a-tooltip>

            <a-tooltip v-else placement="top">
              <template #title>
                <span>{{ t("bots_databases.tips.detach_database") }}</span>
              </template>
              <a-button
                class="button"
                :loading="selectedDatabase === item.id && isDetachLoading"
                :disabled="selectedDatabase !== item.id && isDetachLoading"
                size="large"
                type="text"
                shape="circle"
                @click="handleDetachDatabase(item)"
              >
                <template #icon>
                  <detach-icon two-tone-color="#faad14" class="icon" />
                </template>
              </a-button>
            </a-tooltip>

            <a-tooltip placement="top">
              <template #title>
                <span>{{ t("bots_databases.tips.open_database") }}</span>
              </template>
              <a-button
                :disabled="!!selectedDatabase"
                @click="handleOpenDatabase(item)"
                class="button"
                size="large"
                type="text"
                shape="circle"
              >
                <template #icon>
                  <open-icon class="icon" />
                </template>
              </a-button>
            </a-tooltip>
          </div>
        </div>
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup>
import { useNotification } from "@/hooks/utils";
import { useAiBotsStore } from "@/stores/aiBots";
import { defineAsyncComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const helpIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/QuestionCircleOutlined")
);

const openIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/RightCircleTwoTone")
);

const deleteIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DeleteTwoTone")
);

const attachIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusCircleTwoTone")
);

const detachIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/MinusCircleTwoTone")
);

const props = defineProps({
  databases: { type: Array, required: true },
  bot: { type: Object, required: true },
  title: { type: String, required: true },
});

const aiBotsStore = useAiBotsStore();

const { t } = useI18n();
const { openNotification } = useNotification();
const router = useRouter();

const isDeleteLoading = ref(false);
const isDetachLoading = ref(false);
const isAttachLoading = ref(false);
const selectedDatabase = ref("");

const handleDeleteDatabase = async (database) => {
  isDeleteLoading.value = true;
  selectedDatabase.value = database.id;
  try {
    await aiBotsStore.deleteDatabase(database);

    openNotification("success", {
      message: `${t("Done")}!`,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isDeleteLoading.value = false;
    selectedDatabase.value = "";
  }
};

const handleAttachDatabase = async (database) => {
  isAttachLoading.value = true;
  selectedDatabase.value = database.id;
  try {
    await aiBotsStore.attachDatabase(database, props.bot);

    openNotification("success", {
      message: `${t("Done")}!`,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isAttachLoading.value = false;
    selectedDatabase.value = "";
  }
};

const handleDetachDatabase = async (database) => {
  isDetachLoading.value = true;
  selectedDatabase.value = database.id;
  try {
    await aiBotsStore.detachDatabase(database, props.bot);

    openNotification("success", {
      message: `${t("Done")}!`,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isDetachLoading.value = false;
    selectedDatabase.value = "";
  }
};

const handleOpenDatabase = (database) => {
  router.replace({ query: { database: database.id } });
};
</script>

<style scoped>
.databases_list {
  margin-top: 15px;
}

.databases_list .database_item .icon {
  font-size: 22px;
}

.databases_list .database_item .button {
  margin: 0px 2px;
}

.databases_list .header {
  display: flex;
  align-items: center;
}

.databases_list .header .icon {
  margin-left: 5px;
  font-size: 20px;
}

.databases_list .database_item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
