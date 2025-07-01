<template>
  <a-col class="databases" v-if="!isDataLoading" span="24">
    <a-row justify="end">
      <a-tooltip placement="top">
        <template #title>
          <span>{{ t("bots_databases.tips.create_database") }}</span>
        </template>
        <a-button @click="isAddDatabaseOpen = true">{{
          t("bots_databases.actions.create_database")
        }}</a-button>
      </a-tooltip>
    </a-row>

    <databases-list
      :bot="bot"
      title="enabled_databases"
      :databases="disabledDatabases"
    />

    <databases-list
      :bot="bot"
      title="disabled_databases"
      :databases="enabledDatabases"
    />

    <a-modal @ok="handleOk"> </a-modal>

    <a-modal
      v-model:open="isAddDatabaseOpen"
      :title="t('bots_databases.actions.create_database')"
    >
      <a-form
        ref="addDatabaseFormRef"
        layout="vertical"
        autocomplete="off"
        :model="newDatabase"
        :rules="addDatabaseFormRules"
      >
        <a-form-item name="name" :label="t('bots_databases.fields.name')">
          <a-input
            v-model:value="newDatabase.name"
            :placeholder="t('bots_databases.fields.name')"
          ></a-input>
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button
          key="back"
          :disabled="isAddDatabaseLoading"
          @click="isAddDatabaseOpen = false"
          >{{ t("Cancel") }}</a-button
        >

        <a-button
          key="submit"
          type="primary"
          :loading="isAddDatabaseLoading"
          @click="handleAddDatabase"
          >{{ t("bots_databases.actions.create_database") }}</a-button
        >
      </template>
    </a-modal>
  </a-col>
  <loading v-else />
</template>

<script setup>
import Loading from "@/components/ui/loading.vue";
import { useNotification } from "@/hooks/utils";
import { useAiBotsStore } from "@/stores/aiBots";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import DatabasesList from "./databasesList.vue";

const props = defineProps({
  service: { type: Object, required: true },
});

const aiBotsStore = useAiBotsStore();
const { databases, bots } = storeToRefs(aiBotsStore);

const { openNotification } = useNotification();
const { t } = useI18n();

const isDataLoading = ref(false);
const isAddDatabaseOpen = ref(false);
const newDatabase = ref({ name: "" });
const isAddDatabaseLoading = ref(false);
const addDatabaseFormRef = ref();

onMounted(async () => {
  try {
    isDataLoading.value = true;

    await aiBotsStore.getDatabases();
    await aiBotsStore.getBot(props.service.data.bot_uuid);
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isDataLoading.value = false;
  }
});

const bot = computed(() => bots.value.get(props.service.data.bot_uuid));

const enabledDatabases = computed(() =>
  databases.value
    .filter((database) =>
      (bot.value?.databases || []).find((db) => db.id === database.id)
    )
    .map((d) => ({ ...d, enabled: true }))
);

const disabledDatabases = computed(() =>
  databases.value
    .filter(
      (database) =>
        !(bot.value?.databases || []).find((db) => db.id === database.id)
    )
    .map((d) => ({ ...d, enabled: false }))
);

const addDatabaseFormRules = computed(() => ({
  name: [{ required: true, message: t("ssl_product.field is required") }],
}));

const handleAddDatabase = async () => {
  await addDatabaseFormRef.value.validate();
  isAddDatabaseLoading.value = true;
  try {
    await aiBotsStore.addDatabase(newDatabase.value);

    isAddDatabaseOpen.value = false;
    newDatabase.value = { name: "" };

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
    isAddDatabaseLoading.value = false;
  }
};
</script>

<script>
export default { name: "AiBotDatabases" };
</script>

<style scoped></style>
