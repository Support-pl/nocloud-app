<template>
  <a-modal
    :title="$t('ask a question')"
    :visible="addTicketStatus"
    :confirmLoading="isSending"
    @cancel="closeFields"
    @ok="sendNewTicket"
    :cancelText="$t('Cancel')"
  >
    <a-spin tip="Loading..." :spinning="ticketDepartment === -1">
      <a-form-model layout="vertical">
        <a-form-model-item :label="$t('department')">
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

export default {
  name: "addTicket",
  data() {
    return {
      ticketDepartment: -1,
      ticketTitle: "",
      ticketMessage: "",
      isSending: false,
    };
  },
  computed: {
    user() {
      return this.$store.getters.getUser;
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
        this.$message.warn("Ticket subject or message is too short");
        return;
      }

      if (this.ticketDepartment == -1) {
        this.$message.warn("Departments are loading...");
        return;
      }

      this.isSending = true;
      this.$api.get(this.baseURL, { params: {
        run: 'create_ticket',
        subject: this.ticketTitle,
        message: this.ticketMessage,
        department: this.ticketDepartment,
      }})
        .then((resp) => {
          if (resp.result == "success") {
            this.ticketTitle = "";
            this.ticketMessage = "";
            this.isSending = false;

            this.$store.dispatch("support/autoFetch");
            this.$store.commit("support/inverseAddTicketState");
          } else {
            throw resp;
          }
        })
        .catch((err) => {
          console.error(err);
          this.$message.error("Something went wrong");
        })
        .finally(() => {
          this.isSending = false;
        });
    },
  },
  created() {
    this.$store.dispatch("support/fetchDepartments").then(() => {
      this.ticketDepartment = this.departments[0].id;
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
