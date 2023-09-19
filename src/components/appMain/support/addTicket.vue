<template>
  <a-modal
    :title="(instanceId) ? $t('new chat') : $t('ask a question') | capitalize"
    :visible="addTicketStatus"
    :confirm-loading="isSending"
    :footer="null"
    @cancel="closeFields"
  >
    <a-spin tip="Loading..." :spinning="isLoading">
      <a-form-model layout="vertical">
        <a-form-model-item v-if="!instanceId" :label="$t('department')">
          <a-select v-model="ticketDepartment" placeholder="department">
            <a-select-option
              v-for="dep of filteredDepartments"
              :key="dep.id"
              :value="dep.id"
            >
              {{ dep.name }}
            </a-select-option>
          </a-select>
        </a-form-model-item>

        <a-form-model-item :label="$t('subject')">
          <a-input v-model="ticketTitle" placeholder="" />
        </a-form-model-item>

        <a-form-model-item :label="(instanceId) ? null : $t('question')">
          <a-textarea
            v-model="ticketMessage"
            rows="10"
            :placeholder="(instanceId) ? $t('input text') : null"
          />
        </a-form-model-item>

        <a-form-model-item :label="$t('gateways')">
          <div class="order__grid">
            <div
              v-for="gate of gateways"
              :key="gate.id"
              class="order__slider-item"
              :value="gate.id"
              :class="{ 'order__slider-item--active': gateway === gate.id }"
              @click="sendNewTicket(gate.id)"
            >
              <span class="order__slider-name" :title="gate.name">
                <img class="img_prod" :src="`/img/icons/${gate.id}.png`" :alt="gate.id" @error="onError">
                {{ gate.name }}
              </span>
            </div>
          </div>
        </a-form-model-item>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import Markdown from 'markdown-it'
import emoji from 'markdown-it-emoji'

const md = new Markdown({
  html: true,
  linkify: true,
  typographer: true
})

md.use(emoji)

export default {
  name: 'AddTicket',
  props: {
    instanceId: { type: String, default: null }
  },
  data () {
    return {
      gateway: '',
      ticketDepartment: -1,
      ticketTitle: '',
      ticketMessage: '',
      isSending: false,
      isLoading: false
    }
  },
  computed: {
    user () {
      return this.$store.getters['nocloud/auth/billingData']
    },
    userdata () {
      return this.$store.getters['nocloud/auth/userdata']
    },
    filteredDepartments () {
      const { departments } = this.$store.getters['nocloud/chats/getDefaults']

      if (this.user.only_tickets) return this.departments
      else return [...this.departments, ...departments]
    },
    gateways () {
      const { gateways = [] } = this.$store.getters['nocloud/chats/getDefaults'] ?? {}
      const result = gateways.map((gateway) => ({
        id: gateway,
        name: `${gateway[0].toUpperCase()}${gateway.slice(1)}`
      }))
      const i = result.findIndex(({ id }) => id.includes('email'))

      if (this.instanceId) result.splice(i, 1)
      return result
    },
    ...mapGetters('support', {
      addTicketStatus: 'isAddTicketState',
      departments: 'getDepartments',
      baseURL: 'getURL'
    })
  },
  watch: {
    filteredDepartments (value) {
      if (value.length < 1) return
      if (this.instanceId) {
        const result = value.find(({ id }) => `${id}`.includes('openai'))

        this.ticketDepartment = result?.id ?? value[0]?.id ?? -1
        return
      }
      this.ticketDepartment = value[0]?.id ?? -1
    }
  },
  created () {
    this.isLoading = true
    Promise.all([
      this.$store.dispatch('nocloud/chats/fetchDefaults'),
      this.$store.dispatch('support/fetchDepartments')
    ])
      .catch(() => {
        this.$message.error(this.$t('departments not found'))
      })
      .finally(() => {
        this.isLoading = false
      })
  },
  methods: {
    closeFields () {
      this.$store.commit('support/inverseAddTicketState')
    },
    sendNewTicket () {
      if (this.ticketTitle.length < 3 || this.ticketMessage.length < 3) {
        this.$message.warn(this.$t('ticket subject or message is too short'))
        return
      }

      if (this.ticketDepartment === -1) {
        this.$message.warn(this.$t('departments are loading'))
        return
      }

      const { departments } = this.$store.getters['nocloud/chats/getDefaults']
      const ids = departments.map(({ id }) => id)
      const { admins, id: key } = departments.find(({ id }) => id === this.ticketDepartment) ?? {}

      const request = (ids.includes(this.ticketDepartment))
        ? this.$store.dispatch('nocloud/chats/createChat', {
          admins,
          department: key,
          gateways: [this.gateway],
          chat: {
            subject: this.ticketTitle,
            message: md.render(this.ticketMessage).trim().replace(/^<p>/, '').replace(/<\/p>$/, ''),
            instanceId: this.instanceId
          }
        })
        : this.$api.get(this.baseURL, {
          params: {
            run: 'create_ticket',
            subject: this.ticketTitle,
            message: this.ticketMessage,
            department: this.ticketDepartment
          }
        })

      this.isSending = true
      request
        .then(async (resp) => {
          if (resp.result === 'success') {
            this.ticketTitle = ''
            this.ticketMessage = ''
            this.isSending = false

            this.$store.dispatch('support/autoFetch')
            this.$store.commit('support/inverseAddTicketState')
          } else if (resp.uuid) {
            if (!resp.meta.lastMessage?.uuid) {
              await this.$store.dispatch('nocloud/chats/sendMessage', {
                uuid: resp.uuid,
                content: md.render(this.ticketMessage).trim(),
                account: this.userdata.uuid,
                date: BigInt(Date.now())
              })
            }

            const query = { from: this.instanceId }

            this.$router.push({ path: `/ticket-${resp.uuid}`, query })
          } else {
            throw resp
          }
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.$message.error(this.$t(message))
          console.error(err)
        })
        .finally(() => {
          this.isSending = false
        })
    },
    changeGateway (value) {
      if (this.gateway === value) {
        this.gateway = ''
      } else {
        this.gateway = value
      }
    },
    onError ({ target }) {
      target.src = '/img/OS/default.png'
    }
  }
}
</script>

<style scoped>
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

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 10px;
  overflow-x: auto;
}

.order__slider-item {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  height: 100%;
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1rem;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active {
  background-color: #1045b4;
  color: #fff;
}

.order__grid .order__slider-name > .img_prod {
  display: block;
  max-height: 20px;
}

.order__grid .order__slider-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

@media screen and (max-width: 576px) {
.order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
