<template>
  <div class="handsfree-wrapper">
    <a-card title="Code">
      <template #extra>
        <a-button type="primary" @click="sendCode">
          {{ $t('Send') | capitalize }}
        </a-button>
      </template>

      <a-list size="small" :data-source="data">
        <template #renderItem="item, index">
          <a-list-item style="padding: 12px 0 0" v-if="item === 'input'">
            <a-input :value="code" :max-length="6" @input="formatText" />
          </a-list-item>

          <a-list-item v-else>
            {{ `${index + 1}. ${$t(item)}` }}

            <template v-if="index === 0">
              <a :href="link" target="_blank">link</a>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script>
import { createPromiseClient } from "@bufbuild/connect";
import { HandsfreeService } from "infinimesh-proto/build/es/handsfree/handsfree_connect";
import { ControlPacket } from "infinimesh-proto/build/es/handsfree/handsfree_pb";

export default {
  name: 'handsfree-view',
  data: () => ({
    code: '',
    link: 'https://t.me/nocloud_telegram_bot',
    data: [
      'Go to the telegram bot using the',
      'Press the start button or type /start',
      'Enter the code received by the bot',
      'Click on send button',
      'input'
    ]
  }),
  methods: {
    async sendCode() {
      const { token } = this.$store.state.nocloud.auth;
      const { transport } = this.$store.state.nocloud.chats;
      const handsfree = createPromiseClient(HandsfreeService, transport);

      try {
        const { appId } = await handsfree.send(new ControlPacket({ payload: [this.code, token] }));

        if (appId !== 'core-chatting.telegram-bot') {
          throw new Error('[Error]: Failed to connect');
        }
        window.open(this.link, '_blank');
      } catch (error) {
        this.$notification.error({
          message: this.$t(error.response?.data?.message ?? error.message ?? error)
        });
        console.debug(error);
      }
    },
    formatText({ target }) {
      target.value = target.value.replace(/[^a-f0-9]/gm, '');
      this.code = target.value;
    }
  },
  mounted() {
    if (this.$route.query.code) {
      this.code = +this.$route.query.code;
    }
  }
}
</script>

<style scoped>
.handsfree-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--main);
}
</style>
