<template>
  <a-col class="databases" v-if="!isDataLoading" span="24">
    <a-form
      ref="editDatabaseFormRef"
      autocomplete="off"
      :model="database"
      :rules="databaseRules"
    >
      <a-form-item name="name" :label="t('bots_databases.fields.name')">
        <a-input
          readonly
          v-model:value="database.name"
          :placeholder="t('bots_databases.fields.name')"
          autocomplete="off"
        />
      </a-form-item>
    </a-form>

    <a-collapse v-model:activeKey="collapseKey">
      <a-collapse-panel class="knowledge_questions" key="questions">
        <template #header>
          <div class="header">
            <span style="margin-right: 10px">
              {{ t("bots_databases.labels.qa_knowledge_base") }}
            </span>
            <a-tooltip>
              <template #title>
                <span v-html="t(`bots_databases.tips.qa_knowledge_base`)" />
              </template>
              <help-icon style="font-size: 22px" />
            </a-tooltip>
          </div>
        </template>

        <div
          v-for="(item, index) in database.qa_knowledge.records"
          :key="index"
          class="question_item"
        >
          <a-input
            class="field"
            v-model:value="item.question"
            placeholder="Вопрос"
            compact
            :status="qaKnowledgeStatuses[index]?.['question'] ? 'error' : ''"
          />

          <a-input
            class="field"
            v-model:value="item.answer"
            placeholder="Ответ"
            compact
            :status="qaKnowledgeStatuses[index]?.['answer'] ? 'error' : ''"
          />
          <a-button
            class="delete_btn"
            @click="removeQaKnowledge(index)"
            type="text"
            shape="circle"
          >
            <template #icon>
              <delete-icon two-tone-color="#ff4d4f" class="icon" />
            </template>
          </a-button>
        </div>

        <div class="actions">
          <a-button :disabled="isSaveQaKnoledgeLoading" @click="addQaKnowledge">
            Добавить запись
            <add-icon />
          </a-button>

          <a-button
            :loading="isSaveQaKnoledgeLoading"
            :type="isSaveQaKnowledgePrimary ? 'primary' : 'default'"
            @click="saveQaKnowledge"
          >
            Сохранить <save-icon
          /></a-button>
        </div>
      </a-collapse-panel>

      <a-collapse-panel
        v-for="knowledge in database.simple_knowledge"
        class="custom_knowledge"
        :key="knowledge.url"
        :header="`${t(
          'bots_databases.labels.custom_knowledge_base'
        )}  ${getRootDomain(knowledge.url)}`"
      >
        <a-row>
          <a-col span="24">
            <span style="margin-right: 10px"
              >{{ t("bots_databases.labels.link_knowledge") }} ({{
                newKnowledgeTypes.find((k) => k.value === knowledge.type).label
              }}):</span
            >
            <a :href="knowledge.url">{{ getRootDomain(knowledge.url) }}</a>
          </a-col>

          <a-col span="24">
            <span style="margin-right: 10px"
              >{{ t("bots_databases.labels.description_knowledge") }}:
              {{ knowledge.description }}</span
            >
          </a-col>
        </a-row>
      </a-collapse-panel>
    </a-collapse>

    <a-row justify="end" style="margin-top: 15px">
      <a-button
        style="margin-right: 10px"
        @click="router.push({ query: {} })"
        >{{ t("ssl_product.back") }}</a-button
      >

      <a-tooltip placement="top">
        <template #title>
          <span>{{ t("bots_databases.tips.create_knowledge") }}</span>
        </template>
        <a-button @click="isAddKnowledgeOpen = true">{{
          t("bots_databases.actions.create_knowledge")
        }}</a-button>
      </a-tooltip>

      <a-modal
        v-model:open="isAddKnowledgeOpen"
        :title="t('bots_databases.actions.create_knowledge')"
      >
        <a-row class="create_knowledge_modal">
          <a-col span="24" class="field">
            <a-select
              class="types"
              v-model:value="newKnowledge.type"
              :options="newKnowledgeTypes"
            ></a-select
          ></a-col>

          <a-col span="24" class="field">
            <a-input
              v-model:value="newKnowledge.url"
              :placeholder="t('bots_databases.fields.knowledge_url')"
            ></a-input>
          </a-col>

          <a-col span="24" class="field">
            <a-textarea
              v-model:value="newKnowledge.description"
              :placeholder="t('bots_databases.fields.knowledge_description')"
            ></a-textarea>
          </a-col>
        </a-row>

        <template #footer>
          <a-button
            key="back"
            :disabled="isAddKnowledgeLoading"
            @click="isAddKnowledgeOpen = false"
            >{{ t("Cancel") }}</a-button
          >

          <a-button
            key="submit"
            type="primary"
            :loading="isAddKnowledgeLoading"
            @click="addNewKnowledge"
            >{{ t("bots_databases.actions.create_knowledge") }}</a-button
          >
        </template>
      </a-modal>
    </a-row>
  </a-col>
  <loading v-else />
</template>

<script setup>
import api from "@/api";
import Loading from "@/components/ui/loading.vue";
import { useNotification } from "@/hooks/utils";
import { useAiBotsStore } from "@/stores/aiBots";
import { storeToRefs } from "pinia";
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  service: { type: Object, required: true },
});

const deleteIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DeleteTwoTone")
);

const addIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusOutlined")
);

const helpIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/QuestionCircleOutlined")
);

const saveIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SaveOutlined")
);

const aiBotsStore = useAiBotsStore();
const { bots, databases } = storeToRefs(aiBotsStore);

const { openNotification } = useNotification();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const newKnowledgeTypes = [{ value: "google_docs", label: "Google Docs" }];

const isDataLoading = ref(false);
const isSaveQaKnoledgeLoading = ref(false);
const collapseKey = ref();
const database = ref({ name: "" });
const editDatabaseFormRef = ref();
const qaKnowledgeStatuses = ref({});
const isAddKnowledgeOpen = ref(false);
const isAddKnowledgeLoading = ref(false);
const newKnowledge = ref({ type: "google_docs", description: "", url: "" });

onMounted(async () => {
  try {
    isDataLoading.value = true;

    await aiBotsStore.getDatabases();
    await aiBotsStore.getBot(props.service.data.bot_uuid);

    database.value = JSON.parse(JSON.stringify(originalDatabase.value));

    if (
      !database.value.qa_knowledge.records ||
      !database.value.qa_knowledge.records.length
    ) {
      database.value.qa_knowledge.records = [{ question: "", answer: "" }];
    }
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
const originalDatabase = computed(() =>
  databases.value.find((database) => database.id === route.query.database)
);

const isSaveQaKnowledgePrimary = computed(
  () =>
    JSON.stringify(originalDatabase.value.qa_knowledge) !==
    JSON.stringify(database.value.qa_knowledge)
);

const databaseRules = computed(() => ({
  name: [{ required: true, message: t("ssl_product.field is required") }],
}));

function addQaKnowledge() {
  database.value.qa_knowledge.records.push({ question: "", answer: "" });
}

function removeQaKnowledge(index) {
  database.value.qa_knowledge.records.splice(index, 1);
}

function getRootDomain(url) {
  const hostname = new URL(url).hostname;
  const parts = hostname.split(".");
  return parts.slice(-2).join(".");
}

const saveQaKnowledge = async () => {
  let isValidationFailed = false;
  qaKnowledgeStatuses.value = database.value.qa_knowledge.records.map(
    (entry) => {
      const result = {
        question: !Boolean(entry.question?.trim()),
        answer: !Boolean(entry.answer?.trim()),
      };
      isValidationFailed = result.question || result.answer;
      return result;
    }
  );

  if (isValidationFailed) {
    return openNotification("error", {
      message: t(`bots_databases.tips.not_valid_form`),
    });
  }

  try {
    isSaveQaKnoledgeLoading.value = true;

    await api.post("/agents/api/update_knowledge", {
      data: {
        qa_knowledge: database.value.qa_knowledge,
      },
      database: database.value.id,
      type: "question_answer",
    });

    originalDatabase.value.qa_knowledge = JSON.parse(
      JSON.stringify(database.value.qa_knowledge)
    );

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
    isSaveQaKnoledgeLoading.value = false;
  }
};

const addNewKnowledge = async () => {
  const urlRegex =
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
  console.log(
    urlRegex.test(newKnowledge.value.url),
    newKnowledge.value.description.trim()
  );

  if (
    !urlRegex.test(newKnowledge.value.url) ||
    !newKnowledge.value.description.trim()
  ) {
    return openNotification("error", {
      message: t(`bots_databases.tips.not_valid_form`),
    });
  }
  isAddKnowledgeLoading.value = true;

  try {
    await api.post("/agents/api/add_knowledge", {
      data: {
        simple_knowledge: {
          database: database.value.id,
          description: newKnowledge.value.description,
          type: newKnowledge.value.type,
          url: newKnowledge.value.url,
        },
      },
      database: database.value.id,
      type: "simple",
    });

    if (!database.value.simple_knowledge) {
      database.value.simple_knowledge = [];
    }
    database.value.simple_knowledge.push({
      database: database.value.id,
      description: newKnowledge.value.description,
      type: newKnowledge.value.type,
      url: newKnowledge.value.url,
    });
    console.log(database.value.simple_knowledge.length);

    newKnowledge.value = { url: "", description: "", type: "google_docs" };
    isAddKnowledgeOpen.value = false;

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
    isAddKnowledgeLoading.value = false;
  }
};
</script>

<script>
export default { name: "AiBotDatabase" };
</script>

<style scoped>
.knowledge_questions .question_item {
  display: flex;
  padding: 5px;
  margin-top: 5px;
  align-items: center;
}

.knowledge_questions .header {
  display: flex;
  align-items: center;
}

.create_knowledge_modal .field {
  margin-bottom: 15px;
}

.create_knowledge_modal .field .types {
  width: 100%;
}

.knowledge_questions .actions {
  display: flex;
  justify-content: end;
}

.knowledge_questions .actions button {
  width: unset;
  margin-left: 10px;
  margin-top: 10px;
}

.knowledge_questions .question_item .field {
  margin-right: 5px;
}
</style>
