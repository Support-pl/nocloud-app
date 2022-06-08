<template>
  <div class="src-page">
        <generator/>
      </div>
</template>


<script>
import loading from "@/components/loading/loading";
import generator from "@/components/services/ssl/generator.vue";
export default {
  name: "certificate",
  components: {
    generator,
    loading,
  }
}
</script>