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
    <div v-else class="chat__content">
      <div
        v-for="(reply, index) in replies"
        :key="index"
        class="chat__message"
        :class="[
          isAdminSent(reply) ? 'chat__message--in' : 'chat__message--out',
        ]"
      >
        <pre v-html="beauty(reply.message)"></pre>
        <a-icon
          v-if="reply.sending"
          type="loading"
          class="msgStatus loading"
        ></a-icon>
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
import load from "../../loading/loading.vue";

export default {
  name: "ticketChat",
  components: {
    load,
  },
  data() {
    return {
      status: null,
      subject: "SUPPORT",
      replies: null,
      messageInput: "",
      loading: true,
      chatid: this.$route.params.pathMatch,
      sendingMessagesCount: 0,
      showSendFiles: false,
    };
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
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
    newLine() {
      this.messageInput.replace(/$/, "\n");
    },
    isAdminSent(reply) {
      return reply.admin !== "";
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
        userid: this.user.id,
        sending: true,
      };
      this.sendingMessagesCount++;
      this.replies.unshift(message);

      const url = 'https://whmcs.demo.support.pl/modules/addons/nocloud/api/index.php';

      this.$api.get(url, { params: {
        run: 'answer_ticket',
        id: this.$route.params.pathMatch,
        message: this.messageInput,
      }})
        .then(() => {
          this.replies[--this.sendingMessagesCount].sending = false;
        })
        .catch((err) => {
          console.error(err);
          this.sendingMessagesCount--;
          this.replies[this.sendingMessagesCount].sending = false;
          this.replies[this.sendingMessagesCount].error = true;
        });
      this.messageInput = "";
    },
    loadMessages() {
      const url = 'https://whmcs.demo.support.pl/modules/addons/nocloud/api/index.php';

      this.loading = true;
      this.$api.get(url, { params: {
        run: 'get_ticket_full',
        ticket_id: this.chatid,
      }})
        .then((resp) => {
          this.status = resp.status;
          this.replies = resp.replies;
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
  margin-left: 10px;
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
  height: 100%;
  flex: 1 0;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-start;
  padding: 6px 15px;
  overflow: auto;
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

.msgStatus {
  position: absolute;
  bottom: 5px;
  left: 5px;
  font-size: 14px;
  height: auto;
}

.msgStatus.error {
  left: -25px;
  top: 50%;
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
