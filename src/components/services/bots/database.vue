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

    <a-row justify="space-between" style="margin-top: 15px">
      <a-button style="margin: 10px 0px" @click="router.push({ query: {} })">{{
        t("ssl_product.back")
      }}</a-button>

      <div style="display: flex; align-items: center">
        <a-tooltip placement="top">
          <template #title>
            <span>{{ t("bots_databases.tips.detach_database") }}</span>
          </template>
          <a-button
            :loading="isDetachLoading"
            :disabled="!isDatabaseAttached"
            class="button"
            @click="handleDetachDatabase(item)"
            style="margin-right: 10px"
          >
            <detach-icon style="font-size: 20" />

            {{ t("bots_databases.actions.detach_database") }}
          </a-button>
        </a-tooltip>

        <a-tooltip placement="top">
          <template #title>
            <span>{{ t("bots_databases.tips.attach_database") }}</span>
          </template>
          <a-button
            :loading="isAttachLoading"
            :disabled="isDatabaseAttached"
            class="button"
            @click="handleAttachDatabase()"
          >
            <template #icon>
              <attach-icon style="font-size: 20" />
            </template>

            {{ t("bots_databases.actions.attach_database") }}
          </a-button>
        </a-tooltip>
      </div>
    </a-row>

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
            :placeholder="t('bots_databases.fields.question')"
            compact
            :status="qaKnowledgeStatuses[index]?.['question'] ? 'error' : ''"
          />

          <a-input
            class="field"
            v-model:value="item.answer"
            :placeholder="t('bots_databases.fields.answer')"
            compact
            :status="qaKnowledgeStatuses[index]?.['answer'] ? 'error' : ''"
          />
          <a-button
            @click="handleRemoveQaKnowledge(index)"
            class="delete_btn"
            type="text"
            shape="circle"
          >
            <template #icon>
              <delete-icon two-tone-color="#ff4d4f" class="icon" />
            </template>
          </a-button>
        </div>

        <div class="actions">
          <a-button
            :disabled="isSaveQaKnoledgeLoading"
            @click="handleAddQaKnowledge"
          >
            {{ t("bots_databases.actions.add_qa_record") }}
            <add-icon />
          </a-button>

          <a-button
            :loading="isSaveQaKnoledgeLoading"
            :type="isSaveQaKnowledgePrimary ? 'primary' : 'default'"
            @click="handleSaveQaKnowledge"
          >
            {{ t("bots_databases.actions.save_qa_records") }}
            <save-icon
          /></a-button>
        </div>
      </a-collapse-panel>

      <a-collapse-panel class="knowledge_integrations" key="integrations">
        <template #header>
          <div class="header">
            <span style="margin-right: 10px">
              {{ t("bots_databases.labels.knowledge_integrations") }}
            </span>
            <a-tooltip>
              <template #title>
                <span
                  v-html="t(`bots_databases.tips.knowledge_integrations`)"
                />
              </template>
              <help-icon style="font-size: 22px" />
            </a-tooltip>
          </div>
        </template>

        <a-table
          :columns="integrationColumns"
          :data-source="database.simple_knowledge"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'actions'">
              <span style="display: flex; justify-content: space-between">
                <a-popconfirm
                  :title="t('bots_databases.tips.delete_knowledge')"
                  :ok-text="t('Yes')"
                  :cancel-text="t('Cancel')"
                  @confirm="handleRemoveSimpleKnowledge(record)"
                >
                  <a-button
                    :loading="deleteSimpleKnowledgeId === record.id"
                    :disabled="
                      !!deleteSimpleKnowledgeId &&
                      !!deleteSimpleKnowledgeId !== record.id
                    "
                    class="delete_btn"
                    type="text"
                    shape="circle"
                  >
                    <template #icon>
                      <delete-icon two-tone-color="#ff4d4f" class="icon" />
                    </template>
                  </a-button>
                </a-popconfirm>
              </span>
            </template>

            <template v-if="column.key === 'type'">
              <span>
                {{
                  knowledgeTypes.find((type) => type.value === record.type)
                    ?.label
                }}
              </span>
            </template>

            <template v-if="column.key === 'description'">
              <a-tooltip v-if="record.description.length > 20" placement="top">
                <template #title>
                  <span>
                    {{ record.description }}
                  </span>
                </template>
                {{ record.description.slice(0, 20) + "..." }}
              </a-tooltip>

              <span v-else>
                {{ record.description }}
              </span>
            </template>

            <template v-if="column.key === 'url'">
              <a :href="record.url" target="_blank">
                <template v-if="record.type !== 'user_file'">
                  {{ getRootDomain(record.url) }}
                </template>
                <template v-else>
                  {{ t("bots_databases.fields.knowledge_upload_file") }}
                </template>
              </a>
            </template>
          </template>
        </a-table>

        <div class="actions">
          <a-tooltip placement="top">
            <template #title>
              <span>{{ t("bots_databases.tips.create_knowledge") }}</span>
            </template>
            <a-button
              @click="
                isAddKnowledgeOpen = true;
                addKnowledgeType = 'simple';
              "
              >{{ t("bots_databases.actions.create_knowledge") }}</a-button
            >
          </a-tooltip>
        </div>
      </a-collapse-panel>

      <a-collapse-panel class="knowledge_file_search" key="file_search">
        <template #header>
          <div class="header">
            <span style="margin-right: 10px">
              {{ t("bots_databases.labels.knowledge_file_search") }}
            </span>
            <a-tooltip>
              <template #title>
                <span v-html="t(`bots_databases.tips.knowledge_file_search`)" />
              </template>
              <help-icon style="font-size: 22px" />
            </a-tooltip>
          </div>
        </template>

        <a-table
          :columns="fileSearchColumns"
          :data-source="database.file_search_knowledge"
          :pagination="false"
        >
          <template #headerCell="{ column }">
            <template v-if="column.key === 'enabled'">
              <div style="display: flex; align-items: center">
                <span> {{ column.title }} </span>
                <a-tooltip>
                  <template #title>
                    <span
                      v-html="
                        t(`bots_databases.tips.enabled_file_search_knowledge`)
                      "
                    />
                  </template>
                  <help-icon
                    style="margin-left: 5px; font-size: 1.2rem"
                    class="icon"
                  />
                </a-tooltip>
              </div>
            </template>
          </template>

          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'actions'">
              <span style="display: flex; justify-content: space-between">
                <a-tooltip>
                  <template #title>
                    <span
                      v-html="
                        marked(t(`bots_databases.tips.file_search_update`))
                      "
                    />
                  </template>
                  <a-button
                    class="delete_btn"
                    @click="handleEditFileSearchKnowledge(record)"
                    type="text"
                    shape="circle"
                  >
                    <template #icon>
                      <edit-icon class="icon" />
                    </template>
                  </a-button>
                </a-tooltip>

                <a-popconfirm
                  :title="t('bots_databases.tips.delete_knowledge')"
                  :ok-text="t('Yes')"
                  :cancel-text="t('Cancel')"
                  @confirm="handleRemoveFileSearchKnowledge(record)"
                >
                  <a-button
                    :loading="deleteFileSearchKnowledgeId === record.id"
                    :disabled="
                      !!deleteFileSearchKnowledgeId &&
                      !!deleteFileSearchKnowledgeId !== record.id
                    "
                    class="delete_btn"
                    type="text"
                    shape="circle"
                  >
                    <template #icon>
                      <delete-icon two-tone-color="#ff4d4f" class="icon" />
                    </template>
                  </a-button>
                </a-popconfirm>
              </span>
            </template>

            <template v-if="column.key === 'type'">
              <span>
                {{
                  knowledgeTypes.find((type) => type.value === record.type)
                    ?.label
                }}
              </span>
            </template>

            <template v-if="column.key === 'name'">
              <a-tooltip v-if="record.name.length > 20" placement="top">
                <template #title>
                  <span>
                    {{ record.name }}
                  </span>
                </template>
                {{ record.name.slice(0, 20) + "..." }}
              </a-tooltip>

              <span v-else>
                {{ record.name }}
              </span>
            </template>

            <template v-if="column.key === 'status'">
              <a-tag
                :color="
                  getFileSearchItemStatus(
                    record,
                    originalDatabase
                  ).toLowerCase() === 'ready'
                    ? 'green'
                    : 'orange'
                "
              >
                {{
                  t(
                    `bots_databases.file_search_status.${getFileSearchItemStatus(
                      record,
                      originalDatabase
                    ).toLowerCase()}`,
                    getFileSearchItemStatus(record, originalDatabase)
                  )
                }}
              </a-tag>
            </template>

            <template v-if="column.key === 'enabled'">
              <a-switch
                size="small"
                :checked="record.enabled"
                @change="handleChangeFileSearchKnowledgeEnabled(record)"
                :disabled="
                  !!changeEnabledFileSearchKnowledgeId &&
                  record.id !== changeEnabledFileSearchKnowledgeId
                "
                :loading="record.id === changeEnabledFileSearchKnowledgeId"
              />
            </template>

            <template v-if="column.key === 'url'">
              <a :href="record.url" target="_blank">
                <template v-if="record.type !== 'user_file'">
                  {{ getRootDomain(record.url) }}
                </template>
                <template v-else>
                  {{ t("bots_databases.fields.knowledge_upload_file") }}
                </template>
              </a>
            </template>
          </template>
        </a-table>

        <div class="actions">
          <a-tooltip placement="top">
            <template #title>
              <span>{{
                t("bots_databases.tips.create_file_search_knowledge")
              }}</span>
            </template>
            <a-button
              @click="
                isAddKnowledgeOpen = true;
                addKnowledgeType = 'search';
              "
              >{{
                t("bots_databases.actions.create_file_search_knowledge")
              }}</a-button
            >
          </a-tooltip>
        </div>
      </a-collapse-panel>

      <a-collapse-panel class="knowledge_site_search" key="site_search">
        <template #header>
          <div class="header">
            <span style="margin-right: 10px">
              {{ t("bots_databases.labels.knowledge_site_search") }}
            </span>
            <a-tooltip>
              <template #title>
                <span v-html="t(`bots_databases.tips.knowledge_site_search`)" />
              </template>
              <help-icon style="font-size: 22px" />
            </a-tooltip>

            <span
              v-if="countUnreadSiteKnowledge"
              class="file_search_unread_badge"
              >{{ countUnreadSiteKnowledge }}
            </span>
          </div>
        </template>

        <a-table
          :columns="siteSearchColumns"
          :data-source="database.saved_urls"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'actions'">
              <span style="display: flex; justify-content: space-between">
                <a-popconfirm
                  :title="t('bots_databases.tips.delete_knowledge')"
                  :ok-text="t('Yes')"
                  :cancel-text="t('Cancel')"
                  @confirm="handleRemoveSiteSearchKnowledge(record)"
                >
                  <a-button
                    :loading="deleteSiteSearchKnowledgeId === record.id"
                    :disabled="
                      !!deleteSiteSearchKnowledgeId &&
                      !!deleteSiteSearchKnowledgeId !== record.id
                    "
                    class="delete_btn"
                    type="text"
                    shape="circle"
                    size="large"
                  >
                    <template #icon>
                      <delete-icon two-tone-color="#ff4d4f" class="icon" />
                    </template>
                  </a-button>
                </a-popconfirm>

                <a-tooltip placement="top">
                  <template #title>
                    <span>{{
                      t("bots_databases.tips.open_site_search_result")
                    }}</span>
                  </template>
                  <a-button
                    class="delete_btn"
                    type="text"
                    shape="circle"
                    size="large"
                    v-if="getSiteSearchItemStatus(record) == 'finished'"
                    @click="handelOpenSiteSearchKnowledge(record)"
                  >
                    <template #icon>
                      <open-icon
                        :style="{
                          color:
                            savedUrlStorage[record.id] === false ? 'red' : '',
                        }"
                        class="icon"
                      />
                    </template>
                  </a-button>
                </a-tooltip>
              </span>
            </template>

            <template v-if="column.key === 'url'">
              <a :href="record.url" target="_blank">
                {{ getRootDomain(record.url) }}
              </a>
            </template>

            <template v-if="column.key === 'status'">
              <a-tag
                :color="
                  getSiteSearchItemStatus(record) === 'finished'
                    ? 'green'
                    : 'orange'
                "
              >
                {{
                  t(
                    `bots_databases.site_search_status.${getSiteSearchItemStatus(
                      record
                    )}`,
                    getSiteSearchItemStatus(record)
                  )
                }}
              </a-tag>
            </template>
          </template>
        </a-table>

        <div class="actions">
          <a-tooltip placement="top">
            <template #title>
              <span>{{
                t("bots_databases.tips.create_site_search_knowledge")
              }}</span>
            </template>
            <a-button @click="isAddSiteSearchOpen = true">{{
              t("bots_databases.actions.create_site_search_knowledge")
            }}</a-button>
          </a-tooltip>
        </div>
      </a-collapse-panel>
    </a-collapse>

    <a-modal
      v-model:open="isAddKnowledgeOpen"
      :title="
        isAddKnowledgeEdit
          ? t('bots_databases.actions.update_knowledge')
          : addKnowledgeType === 'simple'
          ? t('bots_databases.actions.create_knowledge')
          : t('bots_databases.actions.create_file_search_knowledge')
      "
    >
      <a-row class="create_knowledge_integration_modal">
        <a-col span="24" class="field">
          <a-select
            class="types"
            v-model:value="newKnowledge.type"
            :options="knowledgeTypes"
          ></a-select
        ></a-col>

        <template v-if="newKnowledge.type !== 'user_file'">
          <a-col span="24" class="field">
            <a-input
              v-model:value="newKnowledge.url"
              :placeholder="t('bots_databases.fields.knowledge_url')"
            ></a-input>
          </a-col>
        </template>

        <a-col span="24" class="field">
          <a-textarea
            v-model:value="newKnowledge.description"
            :placeholder="t('bots_databases.fields.knowledge_description')"
          ></a-textarea>
        </a-col>

        <template v-if="newKnowledge.type === 'user_file'">
          <a-col span="24" class="field">
            <span
              v-html="marked(t('bots_databases.tips.knowledge_upload_file'))"
            ></span>
          </a-col>

          <a-col span="24">
            <div class="upload">
              <a-upload
                :before-upload="handleBeforeKnowledgeFileUpload"
                :show-upload-list="false"
                accept=".txt,.csv,.docx,.xlsx,.pdf"
                :max-count="1"
              >
                <a-button type="primary"
                  >{{ t("bots_databases.actions.knowledge_upload_file") }}
                  <upload-icon />
                </a-button>
              </a-upload>
            </div>

            <div class="files_list">
              <div v-if="newKnowledge.file">
                <strong>{{ newKnowledge.file.name }}</strong>

                <a-button
                  class="delete_btn"
                  @click="handleClearKnowledgeFile(index)"
                  type="text"
                  shape="circle"
                >
                  <template #icon>
                    <delete-icon two-tone-color="#ff4d4f" class="icon" />
                  </template>
                </a-button>
              </div>
            </div>
          </a-col>
        </template>

        <span
          v-if="isAddKnowledgeEdit"
          v-html="marked(t('bots_databases.tips.file_search_update'))"
        >
        </span>
        <span
          v-else-if="addKnowledgeType === 'search'"
          v-html="marked(t('bots_databases.tips.file_search_price'))"
        >
        </span>

        <span
          v-else-if="addKnowledgeType === 'simple'"
          v-html="marked(t('bots_databases.tips.knowledge_file_size'))"
        ></span>
      </a-row>

      <template #footer>
        <a-button
          key="back"
          :disabled="isAddKnowledgeLoading"
          @click="isAddKnowledgeOpen = false"
          >{{ t("Cancel") }}</a-button
        >

        <a-button
          v-if="isAddKnowledgeEdit"
          type="primary"
          :loading="isAddKnowledgeLoading"
          @click="handleAddNewFileSearchKnowledge"
          >{{ t("bots_databases.actions.update_knowledge") }}</a-button
        >

        <a-button
          v-else-if="addKnowledgeType === 'simple'"
          type="primary"
          :loading="isAddKnowledgeLoading"
          @click="handleAddNewSimpleKnowledge"
          >{{ t("bots_databases.actions.create_knowledge") }}</a-button
        >
        <a-button
          v-else
          type="primary"
          :loading="isAddKnowledgeLoading"
          @click="handleAddNewFileSearchKnowledge"
          >{{
            t("bots_databases.actions.create_file_search_knowledge")
          }}</a-button
        >
      </template>
    </a-modal>

    <a-modal
      v-model:open="isAddSiteSearchOpen"
      :title="t('bots_databases.actions.create_site_search_knowledge')"
    >
      <a-form
        ref="addSiteFormRef"
        layout="vertical"
        autocomplete="off"
        :model="newSiteSearch"
        :rules="newSiteSearchRules"
      >
        <a-form-item
          name="url"
          :label="t('bots_databases.fields.site_search_column_url')"
        >
          <a-input
            v-model:value="newSiteSearch.url"
            :placeholder="t('bots_databases.fields.site_search_column_url')"
          ></a-input>
        </a-form-item>
      </a-form>

      <span v-html="marked(t('bots_databases.tips.site_search_add_price'))" />

      <template #footer>
        <a-button
          key="back"
          :disabled="isAddSiteSearchLoading"
          @click="isAddSiteSearchOpen = false"
          >{{ t("Cancel") }}</a-button
        >

        <a-button
          key="submit"
          type="primary"
          :loading="isAddSiteSearchLoading"
          @click="handleAddSiteSearch"
          >{{
            t("bots_databases.actions.create_site_search_knowledge")
          }}</a-button
        >
      </template>
    </a-modal>

    <a-modal
      v-model:open="isImportSiteSearchOpen"
      :title="t('bots_databases.actions.create_site_search_knowledge')"
      style="max-width: 1500px; width: 80vw"
    >
      <div
        v-for="(item, index) in currentImportSiteSearch.qa"
        :key="index"
        class="question_item"
      >
        <a-input
          style="width: 30%"
          class="field"
          v-model:value="item.question"
          :placeholder="t('bots_databases.fields.question')"
          compact
          :status="qaKnowledgeStatuses[index]?.['question'] ? 'error' : ''"
        />

        <a-input
          style="width: 70%"
          class="field"
          v-model:value="item.answer"
          :placeholder="t('bots_databases.fields.answer')"
          compact
        />
        <a-checkbox v-model:checked="item.selected"></a-checkbox>
      </div>

      <template #footer>
        <a-button
          key="back"
          :disabled="isImportSiteSearchLoading"
          @click="isImportSiteSearchOpen = false"
          >{{ t("Cancel") }}</a-button
        >

        <a-button
          key="submit"
          type="primary"
          :loading="isImportSiteSearchLoading"
          @click="handleImportSiteSearch"
          >{{
            t("bots_databases.actions.import_site_search_knowledge")
          }}</a-button
        >
      </template>
    </a-modal>
  </a-col>
  <loading v-else />
</template>

<script setup>
import api from "@/api";
import Loading from "@/components/ui/loading.vue";
import { useNotification } from "@/hooks/utils";
import { useAiBotsStore } from "@/stores/aiBots";
import { marked } from "marked";
import { storeToRefs } from "pinia";
import { onBeforeUnmount } from "vue";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  ref,
  toRefs,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

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

const attachIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusOutlined")
);

const detachIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/MinusOutlined")
);

const uploadIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/UploadOutlined")
);

const editIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/EditTwoTone")
);

const openIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/RightCircleOutlined")
);

const props = defineProps({
  service: { type: Object, required: true },
});
const { service } = toRefs(props);

const aiBotsStore = useAiBotsStore();
const { bots, databases } = storeToRefs(aiBotsStore);

const { openNotification } = useNotification();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const isDataLoading = ref(false);
const isDetachLoading = ref(false);
const isAttachLoading = ref(false);
const isSaveQaKnoledgeLoading = ref(false);
const collapseKey = ref();
const database = ref({ name: "" });
const editDatabaseFormRef = ref();
const qaKnowledgeStatuses = ref({});
const isAddKnowledgeOpen = ref(false);
const addKnowledgeType = ref("");
const isAddKnowledgeLoading = ref(false);
const isAddKnowledgeEdit = ref(false);
const newKnowledge = ref({ type: "google_docs", description: "", url: "" });
const deleteSimpleKnowledgeId = ref("");
const deleteFileSearchKnowledgeId = ref("");
const changeEnabledFileSearchKnowledgeId = ref("");
const isAddSiteSearchLoading = ref(false);
const isAddSiteSearchOpen = ref(false);
const isImportSiteSearchOpen = ref(false);
const deleteSiteSearchKnowledgeId = ref("");
const isImportSiteSearchLoading = ref(false);
const currentImportSiteSearch = ref(false);
const newSiteSearch = ref({ url: "" });
const addSiteFormRef = ref();
const savedUrlStorage = ref({});

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

    savedUrlStorage.value = JSON.parse(
      localStorage.getItem("savedUrlStorage") || "{}"
    );
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

onBeforeUnmount(() => {
  localStorage.setItem(
    "savedUrlStorage",
    JSON.stringify(savedUrlStorage.value)
  );
});

const bot = computed(() => bots.value.get(service.value.data.bot_uuid));
const originalDatabase = computed(() =>
  databases.value.find((database) => database.id === route.query.database)
);

const isDatabaseAttached = computed(
  () => !!(bot.value.databases || []).find((db) => db.id === database.value.id)
);

const knowledgeTypes = computed(() => [
  { value: "google_docs", label: "Google Docs" },
  { value: "google_sheets", label: "Google Sheets" },
  {
    value: "user_file",
    label: t("bots_databases.fields.knowledge_upload_file"),
  },
]);

const integrationColumns = computed(() => [
  {
    title: t("bots_databases.fields.integration_column_name"),
    dataIndex: "description",
    key: "description",
    scopedSlots: { customRender: "description" },
  },
  {
    title: t("bots_databases.fields.integration_column_type"),
    dataIndex: "type",
    key: "type",
    scopedSlots: { customRender: "type" },
  },
  {
    title: t("bots_databases.fields.integration_column_url"),
    dataIndex: "url",
    key: "url",
    scopedSlots: { customRender: "url" },
  },
  {
    title: "",
    dataIndex: "actions",
    key: "actions",
    scopedSlots: { customRender: "actions" },
    width: 50,
  },
]);

const fileSearchColumns = computed(() => [
  {
    title: t("bots_databases.fields.file_search_column_name"),
    dataIndex: "name",
    key: "name",
    scopedSlots: { customRender: "description" },
  },
  {
    title: t("bots_databases.fields.file_search_column_type"),
    dataIndex: "type",
    key: "type",
    scopedSlots: { customRender: "type" },
  },
  {
    title: t("bots_databases.fields.file_search_column_url"),
    dataIndex: "url",
    key: "url",
    scopedSlots: { customRender: "url" },
  },
  {
    title: t("bots_databases.fields.file_search_column_status"),
    dataIndex: "status",
    key: "status",
    scopedSlots: { customRender: "status" },
  },
  {
    title: t("bots_databases.fields.file_search_column_enabled"),
    dataIndex: "enabled",
    key: "enabled",
    scopedSlots: { customRender: "enabled" },
  },
  {
    title: "",
    dataIndex: "actions",
    key: "actions",
    scopedSlots: { customRender: "actions" },
    width: 50,
  },
]);

const siteSearchColumns = computed(() => [
  {
    title: t("bots_databases.fields.site_search_column_url"),
    dataIndex: "url",
    key: "url",
    scopedSlots: { customRender: "url" },
  },
  {
    title: t("bots_databases.fields.site_search_column_status"),
    dataIndex: "status",
    key: "status",
    scopedSlots: { customRender: "status" },
  },

  {
    title: "",
    dataIndex: "actions",
    key: "actions",
    scopedSlots: { customRender: "actions" },
    width: 50,
  },
]);

const newSiteSearchRules = computed(() => ({
  url: [
    {
      trigger: "blur",
      required: true,
      message: t("ssl_product.field is required"),
      validator: (d) => {
        const value = newSiteSearch.value[d.field];

        if (
          !!value &&
          value.length > 1 &&
          /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i.test(
            value
          )
        ) {
          return Promise.resolve();
        }

        return Promise.reject();
      },
    },
  ],
}));

const isSaveQaKnowledgePrimary = computed(
  () =>
    JSON.stringify(originalDatabase.value.qa_knowledge) !==
    JSON.stringify(database.value.qa_knowledge)
);

const countUnreadSiteKnowledge = computed(() => {
  return Object.keys(savedUrlStorage.value || {}).reduce((acc, key) => {
    if (
      database.value.saved_urls.find((url) => url.id === key) &&
      savedUrlStorage.value[key] === false
    ) {
      const d = database.value.saved_urls.find((url) => url.id === key);
      if (getSiteSearchItemStatus(d) === "finished") {
        acc += 1;
      }

      return acc;
    }
  }, 0);
});

const databaseRules = computed(() => ({
  name: [{ required: true, message: t("ssl_product.field is required") }],
}));

function handleAddQaKnowledge() {
  database.value.qa_knowledge.records.push({ question: "", answer: "" });
}

function handleRemoveQaKnowledge(index) {
  database.value.qa_knowledge.records.splice(index, 1);
}

function getRootDomain(url) {
  const hostname = new URL(url).hostname;
  return hostname;
}

function getFileSearchItemStatus(record, originalDatabase) {
  const og = (originalDatabase?.file_search_knowledge || []).find(
    ({ id }) => id === record.id
  );

  return og?.status || record.status;
}

function getSiteSearchItemStatus(record) {
  return (
    record.scrapes[(record.scrapes || []).length - 1].status || ""
  ).toLowerCase();
}

const handleBeforeKnowledgeFileUpload = async (newFile) => {
  try {
    const base64 = await toBase64(newFile);
    newKnowledge.value.file = {
      name: newFile.name,
      type: newFile.type,
      base64,
    };
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  }

  return false;
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const handleClearKnowledgeFile = () => {
  newKnowledge.value.file = null;
};

const handleSaveQaKnowledge = async () => {
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

const handleAddNewSimpleKnowledge = async () => {
  const urlRegex =
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;

  const isFile = newKnowledge.value.type === "user_file";

  if (
    (!isFile
      ? !urlRegex.test(newKnowledge.value.url)
      : !newKnowledge.value.file) ||
    !newKnowledge.value.description.trim()
  ) {
    return openNotification("error", {
      message: t(`bots_databases.tips.not_valid_form`),
    });
  }
  isAddKnowledgeLoading.value = true;

  try {
    const data = await api.post("/agents/api/add_knowledge", {
      data: {
        simple_knowledge: {
          database: database.value.id,
          description: newKnowledge.value.description,
          type: newKnowledge.value.type,
          url: isFile ? "" : newKnowledge.value.url,
          file: isFile
            ? {
                content_type: newKnowledge.value.file.type,
                data: newKnowledge.value.file.base64,
                filename: newKnowledge.value.file.name,
              }
            : undefined,
        },
      },
      database: database.value.id,
      type: "simple",
    });

    if (!database.value.simple_knowledge) {
      database.value.simple_knowledge = [];
    }
    database.value.simple_knowledge.push(data);

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

const handleRemoveSimpleKnowledge = async (knowledge) => {
  deleteSimpleKnowledgeId.value = knowledge.id;

  try {
    await api.post("/agents/api/delete_knowledge", {
      data: {
        simple_knowledge: knowledge,
      },
      database: database.value.id,
      type: "simple",
    });

    database.value.simple_knowledge = database.value.simple_knowledge.filter(
      (k) => k.id !== knowledge.id
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
    deleteSimpleKnowledgeId.value = "";
  }
};

const handleAddNewFileSearchKnowledge = async () => {
  const urlRegex =
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;

  const isFile = newKnowledge.value.type === "user_file";

  if (
    (!isFile
      ? !urlRegex.test(newKnowledge.value.url)
      : !newKnowledge.value.file) ||
    !newKnowledge.value.description.trim()
  ) {
    return openNotification("error", {
      message: t(`bots_databases.tips.not_valid_form`),
    });
  }
  isAddKnowledgeLoading.value = true;

  try {
    const file_search_knowledge = {
      database: database.value.id,
      name: newKnowledge.value.description,
      type: newKnowledge.value.type,
      url: isFile ? "" : newKnowledge.value.url,
      file: isFile
        ? {
            content_type: newKnowledge.value.file.type,
            data: newKnowledge.value.file.base64,
            filename: newKnowledge.value.file.name,
          }
        : undefined,
    };

    if (newKnowledge.value.id) {
      file_search_knowledge.enabled = newKnowledge.value.enabled;
      const data = await api.post("/agents/api/update_knowledge", {
        data: {
          file_search_knowledge: {
            ...file_search_knowledge,
            id: newKnowledge.value.id,
          },
        },
        database: database.value.id,
        type: "file_search",
      });
      data.id = newKnowledge.value.id;

      data.status = "synchronizing";
      const index = originalDatabase.value.file_search_knowledge.findIndex(
        (k) => k.id == data.id
      );

      originalDatabase.value.file_search_knowledge[index] = data;
    } else {
      const data = await api.post("/agents/api/add_knowledge", {
        data: {
          file_search_knowledge: file_search_knowledge,
        },
        database: originalDatabase.value.id,
        type: "file_search",
      });

      data.status = "synchronizing";

      if (!originalDatabase.value.file_search_knowledge) {
        originalDatabase.value.file_search_knowledge = [];
      }
      originalDatabase.value.file_search_knowledge.push(data);
    }

    newKnowledge.value = { url: "", description: "", type: "google_docs" };
    isAddKnowledgeOpen.value = false;
    isAddKnowledgeEdit.value = false;

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

const handleRemoveFileSearchKnowledge = async (knowledge) => {
  deleteFileSearchKnowledgeId.value = knowledge.id;

  try {
    await api.post("/agents/api/delete_knowledge", {
      data: {
        file_search_knowledge: knowledge,
      },
      database: database.value.id,
      type: "file_search",
    });

    originalDatabase.value.file_search_knowledge =
      originalDatabase.value.file_search_knowledge.filter(
        (k) => k.id !== knowledge.id
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
    deleteFileSearchKnowledgeId.value = "";
  }
};

const handleEditFileSearchKnowledge = async (record) => {
  addKnowledgeType.value = "search";
  isAddKnowledgeOpen.value = true;
  isAddKnowledgeEdit.value = true;
  newKnowledge.value = { ...record, description: record.name };
};

const handleChangeFileSearchKnowledgeEnabled = async (knowledge) => {
  changeEnabledFileSearchKnowledgeId.value = knowledge.id;

  try {
    knowledge.enabled = !knowledge.enabled;
    await api.post("/agents/api/update_knowledge", {
      data: {
        file_search_knowledge: knowledge,
      },
      database: database.value.id,
      type: "file_search",
    });

    originalDatabase.value.file_search_knowledge =
      originalDatabase.value.file_search_knowledge.map((k) =>
        k.id === knowledge.id ? knowledge : k
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
    changeEnabledFileSearchKnowledgeId.value = "";
  }
};

const handleAddSiteSearch = async () => {
  await addSiteFormRef.value.validate();

  isAddSiteSearchLoading.value = true;

  try {
    const dto = {
      database_id: database.value.id,
      url: newSiteSearch.value.url,
    };

    const data = await api.post("/agents/api/create_saved_url", dto);
    savedUrlStorage.value[data.id] = false;

    newSiteSearch.value = { url: "" };
    isAddSiteSearchOpen.value = false;

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
    isAddSiteSearchLoading.value = false;
  }
};

const handleRemoveSiteSearchKnowledge = async (record) => {
  deleteSiteSearchKnowledgeId.value = record.id;

  try {
    await api.post("/agents/api/delete_saved_url", record);

    database.value.saved_urls = database.value.saved_urls.filter(
      (k) => k.id !== record.id
    );

    originalDatabase.value.saved_urls =
      originalDatabase.value.saved_urls.filter((k) => k.id !== record.id);

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
    deleteSiteSearchKnowledgeId.value = "";
  }
};

const handelOpenSiteSearchKnowledge = (record) => {
  const data = JSON.parse(JSON.stringify(record));
  const result = { url: data, qa: [] };

  data.scrapes[(data.scrapes || []).length - 1].data.qna.forEach((item) => {
    item.selected = true;
    result.qa.push(item);
  });

  currentImportSiteSearch.value = result;
  isImportSiteSearchOpen.value = true;

  savedUrlStorage.value = record.id;
};

const handleImportSiteSearch = async () => {
  isImportSiteSearchLoading.value = true;

  try {
    const qa_knowledge = JSON.parse(
      JSON.stringify(originalDatabase.value.qa_knowledge.records)
    );

    currentImportSiteSearch.value.qa
      .filter((qa) => qa.selected)
      .map((qa) => {
        qa_knowledge.push({ answer: qa.answer, question: qa.question });
      });

    const data = await api.post("/agents/api/update_knowledge", {
      database: database.value.id,
      type: "question_answer",
      data: {
        qa_knowledge: {
          id: originalDatabase.value.qa_knowledge.id,
          records: qa_knowledge,
        },
      },
    });

    database.value.qa_knowledge.records = JSON.parse(
      JSON.stringify(data.records)
    );

    originalDatabase.value.qa_knowledge.records = JSON.parse(
      JSON.stringify(data.records)
    );

    isImportSiteSearchOpen.value = false;

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
    isImportSiteSearchLoading.value = false;
  }
};

const handleAttachDatabase = async () => {
  isAttachLoading.value = true;
  try {
    await aiBotsStore.attachDatabase(database.value, bot.value);

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
  }
};

const handleDetachDatabase = async () => {
  isDetachLoading.value = true;
  try {
    await aiBotsStore.detachDatabase(database.value, bot.value);

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
  }
};

watch(isAddKnowledgeOpen, (curr, prev) => {
  if (prev && !curr) {
    newKnowledge.value = { url: "", description: "", type: "google_docs" };
    isAddKnowledgeEdit.value = false;
  }
});

watch(
  () => originalDatabase.value.file_search_knowledge,
  (value) => {
    database.value.file_search_knowledge = JSON.parse(JSON.stringify(value));
  },
  { deep: true }
);

watch(
  () => originalDatabase.value.saved_urls,
  (value) => {
    database.value.saved_urls = JSON.parse(JSON.stringify(value));
  },
  { deep: true }
);
</script>

<script>
export default { name: "AiBotDatabase" };
</script>

<style scoped>
.question_item {
  display: flex;
  padding: 5px;
  margin-top: 5px;
  align-items: center;
}

.knowledge_questions .header {
  display: flex;
  align-items: center;
}

.knowledge_integrations .header {
  display: flex;
  align-items: center;
}

.knowledge_integrations .actions {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}

.knowledge_integrations .integration_item {
  display: flex;
  padding: 5px;
  margin-top: 5px;
  align-items: center;
}

.knowledge_file_search .header {
  display: flex;
  align-items: center;
}

.knowledge_file_search .actions {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}

.knowledge_file_search .integration_item {
  display: flex;
  padding: 5px;
  margin-top: 5px;
  align-items: center;
}

.knowledge_site_search .header {
  display: flex;
  align-items: center;
}

.knowledge_site_search .actions {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}

.knowledge_site_search .integration_item {
  display: flex;
  padding: 5px;
  margin-top: 5px;
  align-items: center;
}

.create_knowledge_integration_modal .field {
  margin-bottom: 15px;
}

.create_knowledge_integration_modal .field .types {
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

.question_item .field {
  margin-right: 5px;
}

.upload {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

.files_list {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  margin-top: 5px;
  margin-bottom: 20px;
}

.file_search_unread_badge {
  height: 25px;
  width: 25px;
  padding: 4px 8px;
  margin-left: 10px;
  background-color: rgb(219, 46, 46);
  color: white;
  font-size: 12px;
  font-weight: bold;
  border-radius: 15px;
  box-shadow: 0 0 0 2px white;
}
</style>
