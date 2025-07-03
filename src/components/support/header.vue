<template>
  <div class="chat__header">
    <div class="chat__container">
      <div class="chat__back">
        <div class="icon__wrapper" @click="goBack">
          <left-icon />
        </div>
      </div>
      <div class="chat__title">
        {{ titleDecoded }}
        {{ department ? `(${department})` : "" }}
      </div>
      <div class="chat__actions">
        <div
          class="icon__wrapper"
          :class="{ active: supportStore.isAddingTicket }"
          @click="supportStore.isAddingTicket = !supportStore.isAddingTicket"
        >
          <plus-icon />
        </div>

        <div
          class="icon__wrapper"
          :style="
            searchString.length > 0
              ? {
                  borderRadius: '50%',
                  background: 'var(--bright_bg)',
                  color: 'var(--main)',
                }
              : null
          "
        >
          <a-popover
            arrow-point-at-center
            placement="left"
            :align="{ offset: [-10, 0] }"
          >
            <template #content>
              <a-input-search
                enter-button
                placeholder="Topic"
                :value="text"
                @update:value="
                  text = $event;
                  search();
                "
              >
                <template #suffix>
                  <div style="cursor: pointer" @click="text = ''">
                    <plus-icon
                      style="color: rgba(0, 0, 0, 0.45)"
                      :rotate="45"
                    />
                  </div>
                </template>
              </a-input-search>
            </template>
            <search-icon />
          </a-popover>
        </div>

        <div class="icon__wrapper" @click="emits('reload')">
          <reload-icon />
        </div>
      </div>
    </div>
    <add-ticket
      v-if="supportStore.isAddingTicket"
      :instance-id="$route.query.from"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSupportStore } from "@/stores/support.js";
import { useChatsStore } from "@/stores/chats.js";
import { debounce } from "@/functions.js";
import addTicket from "@/components/support/addTicket.vue";

const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusOutlined")
);
const leftIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LeftOutlined")
);
const reloadIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ReloadOutlined")
);
const searchIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SearchOutlined")
);

const props = defineProps({
  chat: { type: Object, required: true, default: () => ({}) },
  title: { type: String, default: "" },
  searchString: { type: String, required: true },
});
const emits = defineEmits(["update:searchString", "reload"]);

const route = useRoute();
const router = useRouter();
const supportStore = useSupportStore();
const chatsStore = useChatsStore();

const text = ref("");
const titleDecoded = computed(() => {
  const txt = document.createElement("textarea");
  txt.innerHTML = props.title;
  return txt.value;
});

const department = computed(() => {
  const id = chatsStore.chats.get(props.chat.uuid)?.department;

  return chatsStore.getDefaults.departments.find((dep) => dep.id === id)?.name;
});

let search = () => {};
function goBack() {
  if (route.query.from) {
    router.go(-1);
  } else {
    router.push({ name: "support" });
  }
}

onMounted(() => {
  search = debounce(() => {
    emits("update:searchString", text.value);
  }, 200);
});
</script>

<script>
export default { name: "SupportHeader" };
</script>

<style scoped>
.chat__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  line-height: 64px;
  background-color: var(--main);
  color: var(--gloomy_font);
}

.chat__title {
  font-weight: bold;
  line-height: 1.1rem;
}

.chat__back {
  justify-self: start;
}

.chat__actions {
  display: flex;
  justify-self: end;
}

.chat__back,
.chat__actions > .icon__wrapper {
  font-size: 1.4rem;
  cursor: pointer;
}

.icon__wrapper.active {
  background-color: var(--gloomy_bg);
  color: var(--main);
  transform: rotate(45deg);
}
</style>
