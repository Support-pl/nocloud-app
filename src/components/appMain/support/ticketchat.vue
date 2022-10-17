<template>
  <div class="chat">
    <div class="chat__header">
      <div class="chat__back">
        <div class="icon__wrapper" @click="goBack()">
          <a-icon type="left" />
        </div>
      </div>
      <div class="chat__title">
        {{ titleDecoded }}
      </div>
      <div class="chat__reload">
        <div class="icon__wrapper" @click="reload()">
          <a-icon type="reload" />
        </div>
      </div>
    </div>

    <load v-if="loading" />
    <div v-else class="chat__content" ref="content">
      <template v-for="(reply, i) in replies">
        <span class="chat__date" v-if="isDateVisible(replies, i)" :key="i">
          {{ reply.date.split(' ')[0] }}
        </span>
        <div
          class="chat__message"
          :key="`${i}_message`"
          :class="[
            isAdminSent(reply) ? 'chat__message--in' : 'chat__message--out',
          ]"
        >
          <pre v-html="beauty(reply.message)" />
          <div class="chat__info">
            <span>{{ reply.name }}</span>
            <span>{{ reply.date.slice(-8, -3) }}</span>
          </div>
          <a-icon v-if="reply.sending" type="loading" class="msgStatus loading" />

          <a-popover v-if="reply.error" :title="$t('Send error')">
            <template slot="content">
              <a
                class="popover-link"
                slot="content"
                @click="messageDelete(reply)"
                >{{ $t("chat_Delete_message") }}</a
              >
              <a
                class="popover-link"
                slot="content"
                @click="messageResend(reply)"
                >{{ $t("chat_Resend_message") }}</a
              >
            </template>
            <a-icon type="exclamation-circle" class="msgStatus error"></a-icon>
          </a-popover>
        </div>
      </template>
    </div>

    <div class="chat__footer">
      <a-textarea
        :disabled="this.status == 'Closed'"
        allowClear
        :autoSize="{ minRows: 1, maxRows: 2 }"
        v-model="messageInput"
        v-on:keyup.shift.enter.exact="newLine"
        v-on:keyup.enter.exact="sendMessage"
        type="text"
        class="chat__input"
        name="message"
        id="message"
        :placeholder="$t('message') + '...'"
      >
      </a-textarea>
      <div class="chat__send" @click="sendMessage">
        <a-icon type="arrow-up" />
      </div>
      <div v-if="showSendFiles" class="chat__send">
        <a-icon type="plus" />
      </div>
    </div>
  </div>
</template>

<script>
import load from "@/components/loading/loading.vue";

export default {
  name: "ticketChat",
  components: { load },
  data() {
    return {
      status: null,
      subject: "SUPPORT",
      replies: null,
      messageInput: "",
      loading: true,
      chatid: this.$route.params.pathMatch,
      showSendFiles: false,
    };
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    baseURL() {
      return this.$store.getters['support/getURL'];
    },
    titleDecoded() {
      var txt = document.createElement("textarea");
      txt.innerHTML = this.subject;
      return txt.value;
    },
  },
  methods: {
    goBack() {
      this.$router.push("support");
    },
    beauty(message) {
      message = message.replace(/\n/g, "<br>");
      message = message.replace(/[\s\uFEFF\xA0]{2,}/g, " ");
      return message.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    },
    isDateVisible(replies, i) {
      if (i === 0) return true;
      return replies[i - 1].date.split(' ')[0] !== replies[i].date.split(' ')[0];
    },
    date(date) {
      const time =  date.toTimeString().split(' ')[0];
      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      return `${year}-${month}-${day} ${time}`;
    },
    newLine() {
      this.messageInput.replace(/$/, "\n");
    },
    isAdminSent(reply) {
      return reply.requestor_type !== 'Owner';
    },
    sendMessage() {
      if (this.messageInput.length < 1) return;
      if (this.status == "Closed") return;
      const message = {
        admin: "",
        attachment: "",
        contactid: "0",
        date: new Date(),
        email: this.user?.email || 'none',
        message: this.messageInput.trim(),
        name: this.user.title,
        userid: this.user.uuid,
        sending: true,
      };
      const requestor_type = 'Owner';
      const date = this.date(message.date);
      const { content } = this.$refs;

      this.replies.push({ ...message, date, requestor_type });

      setTimeout(() => { content.scrollTo(0, content.scrollHeight) }, 100);
      this.$api.get(this.baseURL, { params: {
        run: 'answer_ticket',
        id: this.$route.params.pathMatch,
        message: this.messageInput,
      }})
        .then(() => {
          this.replies.at(-1).sending = false;
        })
        .catch((err) => {
          console.error(err);
          this.replies.at(-1).sending = false;
          this.replies.at(-1).error = true;
        });
      this.messageInput = "";
    },
    loadMessages() {
      this.loading = true;
      this.$api.get(this.baseURL, { params: {
        run: 'get_ticket_full',
        ticket_id: this.chatid,
      }})
        .then((resp) => {
          this.status = resp.status;
          this.replies = resp.replies ?? [];
          this.subject = resp.subject;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    reload() {
      this.loading = true;
      this.loadMessages();
    },
    objectToParams(object) {
      return Object.entries(object)
        .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
        .join("&");
    },
    messageDelete(message) {
      this.replies.splice(this.replies.indexOf(message), 1);
    },
    messageResend(message) {
      this.messageDelete(message);
      this.messageInput = message.message;
      this.sendMessage();
    },
  },
  mounted() {
    this.loadMessages();
  },
  beforeRouteUpdate(to, from, next) {
    this.chatid = to.params.pathMatch;
    this.loadMessages();
  },
};
</script>

<style>
.chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-top: 64px;
  padding-bottom: 55px;
  background: var(--bright_bg);
}

.chat__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  line-height: 64px;
  background-color: var(--main);
  color: var(--bright_font);
  padding: 0;
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
}

.chat__title {
  font-weight: bold;
  line-height: 1.1rem;
}

.chat__back,
.chat__reload {
  font-size: 1.4rem;
  cursor: pointer;
}

.chat__footer {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bright_bg);
  padding: 10px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.chat__input {
  max-width: 768px;
  margin-left: auto;
  border: 0;
  outline: 0;
  border-radius: 40px;
  flex: 1 0;
  padding: 7px 10px;
}

.chat__send {
  background-color: var(--main);
  color: var(--bright_font);
  border-radius: 50%;
  height: 35px;
  width: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 0 10px;
  font-size: 1.2rem;
  transition: filter 0.2s ease;
  cursor: pointer;
}

.chat__send:hover {
  filter: brightness(1.05);
}

.chat__send:active {
  filter: brightness(0.95);
}

.chat__content {
  max-width: 768px;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  flex: 1 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 6px 15px;
  overflow: auto;
  background: var(--bright_font);
}

.chat__message {
  background: #dcfdbe;
  font-weight: 500;
  padding: 5px 7px;
  border-radius: 5px;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.07);
  position: relative;
  width: max-content;
  max-width: 80%;
  word-wrap: wrap;
  margin-bottom: 10px;
}

.chat__message pre {
  white-space: pre-wrap;
}

.chat__date {
  padding: 7px 15px;
  margin: 10px auto 15px;
  text-align: center;
  border-radius: 7px;
  line-height: 1;
  color: var(--bright_font);
  background: var(--main);
}

.chat__info {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 12px;
  color: var(--gray);
}

.msgStatus {
  position: absolute;
  bottom: 5px;
  left: -20px;
  font-size: 14px;
  height: auto;
}

.msgStatus.error {
  left: -20px;
  bottom: 5px;
  transform: translateY(-50%);
  background: var(--err);
  border-radius: 50%;
  color: #fff;
  width: 20px;
  height: 20px;
  line-height: 22px;
  cursor: pointer;
}

.chat__message::after {
  content: "";
  display: block;
  position: absolute;
  bottom: 0;
  border: 9px solid transparent;
  border-bottom: 10px solid #dcfdbe;
}

.chat__message--out {
  align-self: flex-end;
}

.chat__message--out::after {
  right: 0;
  transform: translateX(50%);
}

.chat__message--in {
  align-self: flex-start;
}

.chat__message--in::after {
  left: 0;
  transform: translateX(-50%);
}

.popover-link {
  display: block;
}
</style>
