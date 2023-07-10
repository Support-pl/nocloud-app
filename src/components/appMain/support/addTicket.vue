<template>
  <a-modal
    :title="$t('ask a question')"
    :visible="addTicketStatus"
    :confirmLoading="isSending"
    @cancel="closeFields"
    @ok="sendNewTicket"
    :cancelText="$t('Cancel')"
  >
    <a-spin tip="Loading..." :spinning="isLoading">
      <a-form-model layout="vertical">
        <a-form-model-item :label="$t('department')" v-if="false">
          <a-select v-model="ticketDepartment" placeholder="department">
            <a-select-option v-for="dep in departments" :key="dep.id" :value="dep.id" >
              {{ dep.name }}
            </a-select-option>
          </a-select>
        </a-form-model-item>

        <a-form-model-item :label="$t('subject')">
          <a-input v-model="ticketTitle" placeholder="" />
        </a-form-model-item>

        <a-form-model-item :label="$t('question')">
          <a-textarea v-model="ticketMessage" rows="10" />
        </a-form-model-item>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import { mapGetters } from "vuex";
import Markdown from "markdown-it";
import emoji from "markdown-it-emoji"

const md = new Markdown({
  html: true,
  linkify: true,
  typographer: true
});

md.use(emoji);

export default {
  name: "addTicket",
  data() {
    return {
      ticketDepartment: -1,
      ticketTitle: "",
      ticketMessage: "",
      isSending: false,
      isLoading: false
    };
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    ...mapGetters("support", {
      addTicketStatus: "isAddTicketState",
      departments: "getDepartments",
      baseURL: "getURL",
    }),
  },
  methods: {
    closeFields() {
      this.$store.commit("support/inverseAddTicketState");
    },
    sendNewTicket() {
      if (this.ticketTitle.length < 3 || this.ticketMessage.length < 3) {
        this.$message.warn(this.$t("ticket subject or message is too short"));
        return;
      }

      // if (this.ticketDepartment == -1) {
      //   this.$message.warn(this.$t("departments are loading"));
      //   return;
      // }

      this.isSending = true;
      // this.$api.get(this.baseURL, { params: {
      //   run: 'create_ticket',
      //   subject: this.ticketTitle,
      //   message: this.ticketMessage,
      //   department: this.ticketDepartment,
      // }})
      this.$store.dispatch('nocloud/chats/createChat', {
        subject: this.ticketTitle,
        message: md.render(this.ticketMessage).trim()
      })
        .then(async (resp) => {
          if (resp.result === "success") {
            this.ticketTitle = "";
            this.ticketMessage = "";
            this.isSending = false;

            this.$store.dispatch("support/autoFetch");
            this.$store.commit("support/inverseAddTicketState");
          } else if (resp.uuid) {
            if (!resp.meta.lastMessage?.uuid) {
              await this.$store.dispatch('nocloud/chats/sendMessage', {
                uuid: resp.uuid,
                content: md.render(this.ticketMessage).trim(),
                account: this.user.uuid,
                date: BigInt(Date.now())
              });
            }
            this.$router.push(`ticket-${resp.uuid}`);
          } else {
            throw resp;
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err;

          this.$message.error(this.$t(message));
          console.error(err);
        })
        .finally(() => {
          this.isSending = false;
        });
    },
  },
  created() {
    this.isLoading = true;
    this.$store.dispatch("support/fetchDepartments")
      .then(() => {
        if (this.departments.length < 1) return;
        this.ticketDepartment = this.departments[0].id;
      })
      .catch(() => {
        // this.$message.error(this.$t("departments not found"));
      })
      .finally(() => {
        this.isLoading = false;
      });
  },
};
</script>

<style>
.addTicket__wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.2);
}

.addTicket {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 768px;
  height: 90%;
  background: #fff;
  border-radius: 35px 35px 0 0;
  box-shadow: 5px 2px 15px rgba(0, 0, 0, 0.2);
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
}

.addTicket__header {
  text-align: center;
  font-size: 1.3rem;
  font-weight: 600;
}

.addTicket__title {
  margin-top: 20px;
}

.addTicket__message {
  flex: 1 0;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
}

.addTicket__title-input,
.addTicket__message-input {
  width: 100%;
  border: none;
  outline: none;
  background-color: var(--bright_bg);
  border-radius: 25px;
  padding: 10px 15px;
}

.row__name {
  padding-left: 20px;
  margin-bottom: 5px;
}

.addTicket__message-input {
  border-radius: 25px 25px 0 0;
  flex: 1 0;
  resize: none;
}

.addTicket__buttons {
  display: flex;
  width: 100%;
}

.addTicket__button {
  flex-grow: 1;
  padding: 10px 15px;
  border: none;
  outline: none;
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
}

.addTicket__button--cancel {
  background-color: var(--err);
  border-radius: 0 0 0 25px;
}

.addTicket__button--send {
  background-color: var(--success);
  border-radius: 0 0 25px 0;
}
</style>
