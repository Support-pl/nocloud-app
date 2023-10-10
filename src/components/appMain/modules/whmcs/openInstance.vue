<template>
  <div class="Fcloud">
    <slot name="header" />
    <div v-if="VM.resources?.STATE" class="Fcloud__buttons">
      <div
        v-if="
          !['POWEROFF', 'BOOT_POWEROFF', 'SHUTDOWN_POWEROFF'].includes(VM.resources.STATE)
        "
        class="Fcloud__button"
        :class="{ disabled: statusVM.shutdown }"
        @click="openModal('shutdown')"
      >
        <div class="Fcloud__BTN-icon">
          <div class="cloud__icon cloud__icon--stop" />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Power off") }}
        </div>

        <a-modal
          v-model="modal.shutdown"
          :title="$t('cloud_Shutdown_modal')"
          @ok="handleOk('shutdown')"
        >
          <p>{{ $t("cloud_Shutdown_invite") }}</p>
          <a-radio-group
            v-model="option.shutdown"
            name="shutdownOption"
            :default-value="1"
          >
            <a-radio :value="0">
              <a-tag color="green" :style="{ 'margin-bottom': '10px' }">
                {{ $t("cloud_Regular") }}
              </a-tag>
              {{ $t("cloud_Shutdown") }}
            </a-radio>
            <a-radio :value="1">
              <a-tag color="red">
                HARD
              </a-tag>
              {{ $t("cloud_Shutdown") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>

      <div
        v-else
        class="Fcloud__button"
        :class="{ disabled: statusVM.start }"
        @click="sendAction('on_start')"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="caret-right" />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Start") }}
        </div>
      </div>

      <div
        class="Fcloud__button"
        :class="{ disabled: statusVM.reboot }"
        @click="openModal('reboot')"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="redo" />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Reboot") }}
        </div>

        <a-modal
          v-model="modal.reboot"
          :title="$t('cloud_Reboot_modal')"
          @ok="handleOk('reboot')"
        >
          <p>{{ $t("cloud_Reboot_invite") }}</p>
          <a-radio-group
            v-model="option.reboot"
            name="rebootOption"
            :default-value="1"
          >
            <a-radio :value="0">
              <a-tag color="green" :style="{ 'margin-bottom': '10px' }">
                {{ $t("cloud_Regular") }}
              </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
            <a-radio :value="1">
              <a-tag color="red">
                HARD
              </a-tag>
              {{ $t("cloud_Reboot_modal") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>

      <div
        class="Fcloud__button"
        :class="{
          disabled: statusVM.recover,
        }"
        @click="openModal('recover')"
      >
        <div class="Fcloud__BTN-icon">
          <a-icon type="backward" />
        </div>
        <div class="Fcloud__BTN-title">
          {{ $t("Recover") }}
        </div>

        <a-modal
          v-model="modal.recover"
          :title="$t('cloud_Recover_modal')"
          @ok="handleOk('recover')"
        >
          <p>{{ $t("cloud_Recover_invite_line1") }}</p>
          <p>{{ $t("cloud_Recover_invite_line2") }}</p>
          <p>{{ $t("cloud_Recover_invite_line3") }}</p>
          <p>{{ $t("cloud_Recover_invite") }}</p>

          <a-radio-group
            v-model="option.recover"
            name="recover"
            :default-value="1"
          >
            <a-radio :value="0">
              {{ $t("yesterday") }}
            </a-radio>
            <a-radio :value="1">
              {{ $t("today") }}
            </a-radio>
          </a-radio-group>
        </a-modal>
      </div>
    </div>

    <div class="Fcloud__info">
      <div class="Fcloud__info-header">
        <div class="Fcloud__info-title">
          {{ $t("Information") }}
        </div>
      </div>

      <div v-if="VM.domain" class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="flag" theme="filled" /> IP
        </div>

        <div class="Fcloud__block-content">
          <div class="block__column" style="flex-direction: row">
            <div class="block__value" style="font-size: 18px">
              {{ VM.domain }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="environment" theme="filled" />
          {{ $t("groupname") | capitalize }}
        </div>

        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__value" style="font-size: 18px">
              {{ VM.groupname }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="info-circle" />
          {{ $t("info") | capitalize }}
        </div>

        <div class="Fcloud__block-content">
          <div v-if="VM.os" class="block__column">
            <div class="block__title">
              OS
            </div>
            <div class="block__value">
              {{ VM.os.name ?? VM.os ?? $t('No Data') }}
            </div>
          </div>

          <div v-if="VM.name" class="block__column">
            <div class="block__title">
              {{ $t('Product') }}
            </div>
            <div class="block__value">
              {{ VM.name ?? $t('No Data') }}
            </div>
          </div>

          <div v-if="VM.nextduedate" class="block__column">
            <div class="block__title">
              {{ $t("userService.next payment date") | capitalize }}
            </div>
            <div class="block__value">
              {{ VM.nextduedate }}
            </div>
          </div>
        </div>
      </div>

      <div class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="credit-card" />
          {{ $t("prices") | capitalize }}
        </div>

        <div class="Fcloud__block-content block-content_table">
          <div class="block__column block__column_table">
            <div class="block__title">
              {{ $t('tariff') | capitalize }}
            </div>
          </div>
          <div class="block__column block__column_table block__column_price">
            <div class="block__title">
              {{ VM.name ?? $t('No Data') }}:
            </div>
            <div class="block__value">
              {{ VM.recurringamount }} {{ currency.code }}
            </div>
          </div>

          <div class="block__column block__column_table block__column_total">
            <div class="block__title">
              {{ $t('Total') }}:
            </div>
            <div class="block__value">
              {{ VM.recurringamount }} {{ currency.code }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="VM.resources" class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="setting" theme="filled" />
          {{ $t("cloud_system") | capitalize }}
        </div>

        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              CPU
            </div>
            <div class="block__value">
              {{ VM.resources.CPU }}
            </div>
          </div>

          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Memory") }}
            </div>
            <div class="block__value">
              {{ mbToGb(VM.resources.RAM) }} GB
            </div>
          </div>
        </div>
      </div>

      <div v-if="VM.resources" class="Fcloud__info-block block">
        <div class="Fcloud__block-header">
          <a-icon type="database" theme="filled" />
          {{ $t("cloud_Storage") }}
        </div>

        <div class="Fcloud__block-content">
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Type") }}
            </div>
            <div class="block__value">
              {{ VM.resources.DS_TYPE }}
            </div>
          </div>
          <div class="block__column">
            <div class="block__title">
              {{ $t("cloud_Size") }}
            </div>
            <div class="block__value">
              {{ mbToGb(VM.resources.DRIVE) }} GB
            </div>
          </div>
        </div>
      </div>

      <a-row :gutter="[15, 15]" style="margin-top: 20px">
        <a-col :span="24" :md="12">
          <div class="button">
            <a-button
              type="primary"
              shape="round"
              block
              size="large"
              @click="openModal('snapshot')"
            >
              {{ $t("Snapshots") }}
            </a-button>

            <a-modal
              v-model="snapshots.modal"
              :title="$t('Snapshots')"
              :footer="null"
            >
              <a-spin
                v-if="snapshots.loading"
                style="display: block; margin: 0 auto"
                :tip="$t('loading')"
                :spinning="snapshots.loading"
              />

              <div
                v-for="item of snapshots.data"
                v-else
                :key="item.SNAPSHOT_ID"
                style="display: flex; align-items: center; margin-bottom: 10px"
              >
                <a-col style="width: 100%">
                  <div style="display: flex; font-size: 16px">
                    <div style="margin-right: 30px; width: 30%">
                      {{ item.NAME }}
                    </div>
                    <div style="width: 70%">
                      {{ (item.TIME * 1000) | dateFormat }}
                    </div>
                  </div>
                </a-col>
                <a-col style="margin-left: auto; display: flex">
                  <a-button
                    type="primary"
                    style="margin-right: 10px"
                    :loading="snapshots.addSnap.loading"
                    @click="revSnapshot(item.SNAPSHOT_ID)"
                  >
                    <a-icon type="caret-right" />
                  </a-button>
                  <a-button
                    type="danger"
                    :loading="snapshots.deleteLoading"
                    @click="deleteSnapshot(item.SNAPSHOT_ID)"
                  >
                    <a-icon type="close" />
                  </a-button>
                </a-col>
              </div>

              <div class="modal__buttons">
                <a-button
                  icon="plus"
                  type="primary"
                  shape="round"
                  size="large"
                  @click="openModal('createSnapshot')"
                >
                  {{ $t("Take snapshot") }}
                </a-button>
              </div>
              <a-modal
                v-model="snapshots.addSnap.modal"
                :footer="null"
                :title="$t('Create snapshot')"
              >
                <p>{{ $t("You can only have 3 snapshots at a time.") }}</p>
                <p>{{ $t("Each snapshot exists for 24 hours and is then deleted.") }}</p>
                <p>{{ $t("Choose a name for the new snapshot:") }}</p>
                <a-input
                  ref="snapNameInput"
                  v-model="snapshots.addSnap.snapname"
                  :placeholder="$t('Snapshot name')"
                />
                <div class="modal__buttons">
                  <a-button
                    shape="round"
                    :style="{ 'margin-right': '10px' }"
                    @click="snapshots.addSnap.modal = false"
                  >
                    {{ $t("Cancel") }}
                  </a-button>
                  <a-button
                    icon="plus"
                    type="primary"
                    shape="round"
                    :disabled="snapshots.addSnap.snapname.length < 1"
                    :loading="snapshots.addSnap.loading"
                    @click="createSnapshot()"
                  >
                    {{ $t("Take snapshot") }}
                  </a-button>
                </div>
              </a-modal>
            </a-modal>
          </div>
        </a-col>

        <a-col :span="24" :md="12">
          <div class="button">
            <a-button
              block
              type="primary"
              shape="round"
              size="large"
              :disabled="VM.resources.STATE !== 'RUNNING'"
              @click="startVNC"
            >
              VNC
            </a-button>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="jsx">
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import notification from '@/mixins/notification.js'

export default {
  name: 'OpenInstance',
  mixins: [notification],
  props: {
    // eslint-disable-next-line vue/prop-name-casing
    VM: { type: Object, required: true }
  },
  data: () => ({
    modal: {
      reboot: false,
      shutdown: false,
      recover: false,
      snapshot: false
    },
    snapshots: {
      modal: false,
      loading: false,
      deleteLoading: false,
      data: [],
      addSnap: {
        modal: false,
        snapname: 'Snapshot',
        loading: false
      }
    },
    option: {
      reboot: 0,
      shutdown: 0,
      recover: 0
    }
  }),
  computed: {
    ...mapState(useAuthStore, ['billingUser', 'baseURL']),
    ...mapState(useCurrenciesStore, ['defaultCurrency']),
    currency () {
      return { code: this.billingUser.currency_code ?? this.defaultCurrency }
    },
    statusVM () {
      if (!this.VM?.resources?.STATE) return {}
      const state = this.VM.resources.STATE.toLowerCase()

      return {
        shutdown: ['poweroff', 'boot_poweroff', 'shutdown_poweroff'].includes(state),
        reboot: ['poweroff', 'boot_poweroff', 'shutdown_poweroff'].includes(state),
        start: ['running', 'boot_poweroff', 'shutdown_poweroff'].includes(state),
        recover: ['boot_poweroff', 'shutdown_poweroff'].includes(state)
      }
    }
  },
  created () {
    this.sendAction('on_get_hash').then((password) => {
      this.$emit('update:password', password)
    })

    this.sendAction('on_get_vnc').then(({ response: { token, connectURL } }) => {
      this.$emit('update:vnc', { url: connectURL, token })
    })
  },
  methods: {
    startVNC () {
      this.$router.push({
        path: `${this.$route.params.uuid}/vnc`,
        query: { url: this.VM.resources.vnc?.url }
      })
    },
    mbToGb (mb) {
      return +(mb / 1024).toFixed(2)
    },
    handleOk (from) {
      switch (from) {
        case 'reboot':
          this.sendAction('on_reboot', { hard: !!this.option.reboot })
          this.modal.reboot = false
          break
        case 'shutdown':
          if (this.option.shutdown) this.sendAction('on_stop_hard')
          else this.sendAction('on_stop')
          this.modal.shutdown = false
          break
        case 'recover':
          this.$confirm({
            title: this.$t('Do you want to download a backup?'),
            maskClosable: true,
            content: this.$t('All unsaved progress will be lost, are you sure?'),
            okText: this.$t('Yes'),
            cancelText: this.$t('Cancel'),
            onOk: () => {
              if (this.option.recover) this.sendAction('on_recover_today')
              else this.sendAction('on_recover_yesterday')
              this.modal.recover = false
            },
            onCancel () {}
          })
          break
      }
    },
    createSnapshot () {
      if (this.snapshots.data.lenght >= 3) {
        this.$error({
          title: this.$t("You can't have more than 3 snaps at the same time"),
          content: this.$t('remove or commit old ones to create new')
        })
      }

      this.snapshots.addSnap.loading = true
      this.sendAction('on_snapshot_create', {
        snap_name: this.snapshots.addSnap.snapname
      })
        .then(({ response }) => {
          if (response?.error) throw response?.error

          this.openNotificationWithIcon('success', {
            message: this.$t('Create snapshot')
          })
          this.snapshots.addSnap.modal = false
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? err ?? 'Unknown'}.`
          }
          this.openNotificationWithIcon('error', opts)
        })
        .finally(() => {
          this.snapshots.addSnap.loading = false
        })
    },
    deleteSnapshot (snap_id) {
      this.snapshots.deleteLoading = true
      this.sendAction('on_snapshot_delete', { snap_id })
        .then(({ response }) => {
          if (response?.error) throw response?.error
          const i = this.snapshots.data.find(({ SNAPSHOT_ID }) => SNAPSHOT_ID === snap_id)

          this.snapshots.data.splice(i, 1)
          this.openNotificationWithIcon('success', {
            message: this.$t('Delete snapshot')
          })
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? err ?? 'Unknown'}.`
          }
          this.openNotificationWithIcon('error', opts)
        })
        .finally(() => {
          this.snapshots.deleteLoading = false
        })
    },
    revSnapshot (snap_id) {
      this.snapshots.addSnap.loading = true
      this.sendAction('on_snapshot_setup', { snap_id })
        .then(() => {
          this.openNotificationWithIcon('success', {
            message: this.$t('Revert snapshot')
          })
        })
        .catch((err) => {
          const opts = {
            message: `Error: ${err?.response?.data?.message ?? err ?? 'Unknown'}.`
          }
          this.openNotificationWithIcon('error', opts)
        })
        .finally(() => {
          this.snapshots.addSnap.loading = false
        })
    },
    openModal (name) {
      switch (name) {
        case 'start':
          if (this.statusVM.start) return
          break
        case 'shutdown':
          if (this.statusVM.shutdown) return
          break
        case 'reboot':
          if (this.statusVM.reboot) return
          break
        case 'delete':
          if (this.statusVM.delete) return
          break
        case 'recover':
          if (this.statusVM.recover) return
          break
        case 'snapshot':
          this.snapshots.modal = true
          this.snapshots.loading = true
          this.sendAction('on_snapshot_list')
            .then(({ response }) => {
              const snapshots = response.snapshots ?? response

              if (snapshots.some((el) => el === null)) return
              if (Array.isArray(snapshots)) {
                this.snapshots.data = snapshots
              }
            })
            .finally(() => {
              this.snapshots.loading = false
            })
          break
        case 'createSnapshot':
          this.snapshots.addSnap.modal = true
      }
      this.modal[name] = true
    },
    async sendAction (action, params) {
      return this.$api.get(this.baseURL, {
        params: {
          ...params,
          run: action,
          server_id: this.$route.params.uuid
        }
      })
        .then((response) => {
          if (!response) throw response
          return response
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.openNotificationWithIcon('error', { message: this.$t(message) })
          console.error(err)
        })
    },
    date (timestamp) {
      if (timestamp < 1) return '-'

      const date = new Date(timestamp * 1000)
      const time = date.toTimeString().split(' ')[0]

      const year = date.getFullYear()
      let month = date.getMonth() + 1
      let day = date.getDate()

      if (`${month}`.length < 2) month = `0${month}`
      if (`${day}`.length < 2) day = `0${day}`

      return `${day}.${month}.${year} ${time}`
    }
  }
}
</script>

<style scoped>
.block-content_table {
  position: relative;
  display: grid;
  padding: 10px 15px;
}

.block-content_table::before {
  content: '';
  position: absolute;
  bottom: 40px;
  left: 15px;
  height: 1px;
  width: calc(100% - 30px);
  background: var(--gray);
}

.block__column_table {
  flex-direction: row;
  justify-content: start;
  gap: 7px;
}

.block__column_price {
  grid-column: 2 / 3;
  justify-content: end;
  overflow: hidden;
}

.block__column_price .block__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.block__column_price .block__value {
  white-space: nowrap;
}

.block__column_total {
  grid-column: 1 / 3;
  justify-content: end;
  margin-top: 5px;
}

@media (max-width: 575px) {
  .block-content_table {
    justify-content: initial;
  }
}
</style>
