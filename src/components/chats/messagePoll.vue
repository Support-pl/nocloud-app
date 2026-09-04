<template>
  <div class="poll">
    <div v-if="poll.question" class="poll__question">{{ poll.question }}</div>

    <!-- One answer: the option is the button. Several: tick and send, or every
         tick would be an answer of its own. -->
    <template v-if="poll.multiple">
      <a-checkbox
        v-for="option of poll.options"
        :key="option.id"
        class="poll__option"
        :checked="picked.includes(option.id)"
        :disabled="Boolean(busy)"
        @change="toggle(option.id, $event.target.checked)"
      >
        {{ option.label }}
      </a-checkbox>

      <a-button
        class="poll__send"
        size="small"
        type="primary"
        :loading="Boolean(busy)"
        :disabled="Boolean(busy) || !picked.length || sameAsAnswered"
        @click="answer(picked)"
      >
        {{ answered.length ? $t("Change answer") : $t("Answer") }}
      </a-button>
    </template>

    <template v-else>
      <a-button
        v-for="option of poll.options"
        :key="option.id"
        class="poll__option poll__option--button"
        :type="answered.includes(option.id) ? 'primary' : 'default'"
        :loading="busy === option.id"
        :disabled="Boolean(busy) && busy !== option.id"
        @click="answer([option.id])"
      >
        {{ option.label }}
      </a-button>
    </template>

    <!-- No way to take an answer back: picking another one replaces it, which
         is the only thing anybody wanted from that. -->
    <div class="poll__hint">
      {{ answered.length ? $t("Your answer is saved, you can change it") : $t("Pick an answer") }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { message as notify } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { useChatsStore } from "@/stores/chats.js";
import { useAuthStore } from "@/stores/auth.js";

const props = defineProps({
  messageUuid: { type: String, required: true },
  poll: { type: Object, required: true },
});

const { t } = useI18n();
const chatsStore = useChatsStore();
const authStore = useAuthStore();

const busy = ref("");

const me = computed(() => authStore.billingUser?.uuid ?? authStore.userdata?.uuid);

/** answered is what I picked, as the ticket service has it. */
const answered = computed(() => props.poll.votes?.[me.value]?.options ?? []);

/** picked is what is ticked but not sent yet; it starts from my answer. */
const picked = ref([...answered.value]);

const sameAsAnswered = computed(
  () =>
    picked.value.length === answered.value.length &&
    picked.value.every((id) => answered.value.includes(id))
);

function toggle(id, on) {
  picked.value = on
    ? [...picked.value, id]
    : picked.value.filter((existing) => existing !== id);
}

async function answer(options) {
  busy.value = props.poll.multiple ? "multi" : options[0];
  try {
    await chatsStore.vote(props.messageUuid, options);
    picked.value = [...options];
  } catch (error) {
    notify.error(error.message ?? String(error));
  } finally {
    busy.value = "";
  }
}
</script>

<style scoped>
.poll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border_color, #d9d9d9);
  border-radius: 8px;
  max-width: 420px;
  white-space: normal;
}
.poll__question {
  font-weight: 600;
}
/* Answers read as a list, so they are left-aligned rather than centred like an
   ordinary button, and they wrap instead of being cut off. */
.poll__option--button {
  height: auto;
  min-height: 30px;
  padding: 6px 10px;
  text-align: left;
  white-space: normal;
}
.poll__send {
  align-self: flex-start;
}
.poll__hint {
  font-size: 12px;
  opacity: 0.6;
}
</style>
