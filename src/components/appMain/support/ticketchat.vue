<template>
  <div class="chat">
    <div class="chat__header">
      <div class="chat__container">
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
    </div>

    <load v-if="loading" />
    <div v-else class="chat__content" ref="content">
      <template v-for="(reply, i) in replies">
        <span class="chat__date" v-if="isDateVisible(replies, i)" :key="i">
          {{ reply.date.split(' ')[0] }}
        </span>
        <a-popover
          overlayClassName="chat__tooltip"
          :placement="(isAdminSent(reply)) ? 'rightBottom' : 'leftBottom'"
        >
          <template #content>
            <a-icon type="copy" @click="addToClipboard(reply.message)" />
          </template>

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
        </a-popover>
      </template>
    </div>

    <div class="chat__footer">
      <a-textarea
        allowClear
        type="text"
        class="chat__input"
        name="message"
        id="message"
        v-model="messageInput"
        :disabled="status == 'Closed'"
        :autoSize="{ minRows: 2, maxRows: 100 }"
        :placeholder="$t('message') + '...'"
        @keyup.shift.enter.exact="newLine"
        @keydown.enter.exact.prevent="sendMessage"
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
import Markdown from "markdown-it";
import emoji from "markdown-it-emoji"
import load from "@/components/loading/loading.vue";

const md = new Markdown({
  html: true,
  linkify: true,
  typographer: true
});

md.use(emoji);

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
    messages() {
      const chatMessages = this.$store.getters['nocloud/chats/getMessages'];
      const tickets = this.replies.filter(({ uuid }) =>
        !chatMessages.find((message) => message.uuid === uuid)
      );

      return [...tickets, ...chatMessages];
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
      if (this.messageInput.trim().length < 1) return;
      if (this.status == "Closed") return;
      const message = {
        admin: "",
        attachment: "",
        contactid: "0",
        date: new Date(),
        email: this.user.data?.email ?? 'none',
        message: md.render(this.messageInput).trim(),
        name: this.user.title,
        userid: this.user.uuid,
        sending: true,
      };
      const requestor_type = 'Owner';
      const date = this.date(message.date);
      const { content } = this.$refs;

      this.replies.push({ ...message, date, requestor_type });
      setTimeout(() => { content.scrollTo(0, content.scrollHeight) }, 100);

      if (this.replies[0].gateways) {
        this.$store.dispatch('nocloud/chats/sendMessage', {
          uuid: this.$route.params.pathMatch,
          content: message.message,
          account: message.userid,
          date: BigInt(message.date.getTime())
        })
          .then(({ uuid }) => {
            this.replies.at(-1).uuid = uuid;
          })
          .catch((err) => {
            this.replies.at(-1).error = true;
            console.error(err);
          })
          .finally(() => {
            this.replies.at(-1).sending = false;
          });
        this.messageInput = '';
        return;
      }

      this.$api.get(this.baseURL, { params: {
        run: 'answer_ticket',
        id: this.$route.params.pathMatch,
        message: this.messageInput,
      }})
        .catch((err) => {
          this.replies.at(-1).error = true;
          console.error(err);
        })
        .finally(() => {
          this.replies.at(-1).sending = false;
        });
      this.messageInput = "";
    },
    loadMessages() {
      this.loading = true;
      this.$api.get(this.baseURL, { params: {
        run: 'get_ticket_full',
        ticket_id: this.chatid,
      }})
        .then(async (resp) => {
          if (resp.replies) return resp;
          else {
            await this.$store.dispatch('nocloud/chats/fetchChats');
            return this.$store.dispatch('nocloud/chats/fetchMessages', this.chatid);
          }
        })
        .then((resp) => {
          this.status = resp.status;
          this.replies = resp.replies ?? [];
          this.subject = resp.subject;
        })
        .finally(() => {
          setTimeout(() => {
            this.$refs.content.scrollTo(0, this.$refs.content.scrollHeight);
          });
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
    addToClipboard(text) {
      if (navigator?.clipboard) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            this.$notification.success({
              message: this.$t('Text copied')
            });
          })
          .catch((res) => {
            console.error(res);
          });
      } else {
        this.$notification.error({
          message: this.$t('Clipboard is not supported')
        });
      }
    }
  },
  mounted() {
    this.$store.dispatch('nocloud/chats/startStream');
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
}

.chat__container {
  padding: 0;
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
  max-width: 768px;
  height: 100%;
  margin: 0 auto;
}

.chat__title {
  font-weight: bold;
  line-height: 1.1rem;
}

.chat__back {
  justify-self: start;
}

.chat__reload {
  justify-self: end;
}

.chat__back,
.chat__reload {
  font-size: 1.4rem;
  cursor: pointer;
}

.chat__footer {
  display: flex;
  justify-content: center;
  align-items: end;
  background-color: var(--bright_bg);
  padding: 10px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.chat__input {
  max-width: 725px;
  border: 0;
  outline: 0;
  border-radius: 40px;
  flex: 1 0;
  padding: 7px 0;
}

.chat__input textarea {
  max-height: calc(50vh - 34px) !important;
}

.chat__input .ant-input-textarea-clear-icon {
  margin: 9px 2px 0 0;
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
  margin-bottom: 15px;
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

.chat__tooltip .ant-popover-inner-content {
  padding: 6px 8px;
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
  background: var(--bright_bg);
}

.chat__message--in::after {
  left: 0;
  transform: translateX(-50%);
  border-bottom-color: var(--bright_bg);
}

.popover-link {
  display: block;
}
</style>
