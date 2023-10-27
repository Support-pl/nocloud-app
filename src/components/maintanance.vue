<template>
  <div class="maintanance">
    <a-result title="Oops...">
      <template #icon>
        <a-icon type="tool" />
      </template>

      <template #subTitle>
        <p>Something is not working as it should.</p>
        <p>We already know about this and are taking all necessary measures right now.</p>
        <p>Thank you for your patience.</p>
        <p>Soon we will be back online.</p>
      </template>

      <template #extra>
        <router-link v-if="mainPageButton" :to="{ name: 'root' }">
          <a-button type="primary">
            Back Home
          </a-button>
        </router-link>
      </template>
    </a-result>
  </div>
</template>

<script setup>
defineProps({
  mainPageButton: { type: Boolean, default: true }
})
</script>

<script>
export default { name: 'MaintananceMode' }
</script>

<style scoped>
.maintanance {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

p {
  margin: 0 0 5px 0;
  padding: 0;
}
</style>
