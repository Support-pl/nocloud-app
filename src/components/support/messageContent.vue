<template>
  <span
    v-html="content()"
    :style="{
      wordBreak: 'break-word',
    }"
    :id="messageContentId"
  />
</template>

<script setup>
import { toRefs } from "vue";
import { computed } from "vue";
import { onMounted } from "vue";
import DOMPurify from "dompurify";

import hljs from "highlight.js";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";

import { marked, Renderer } from "marked";
import { mangle } from "marked-mangle";

const props = defineProps(["message", "uuid"]);
const { message, uuid } = toRefs(props);

{
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("css", css);
  hljs.registerLanguage("xml", xml);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("markdown", markdown);
}

marked.use({
  async: false,
  gfm: true,
  breaks: true,
  mangle: false,
  headerIds: false,
  headerPrefix: "",
});
// @ts-ignore
marked.use(mangle);
const renderer = new Renderer();
renderer.code = (code, language) => {
  if (!language) language = "plaintext";

  return `<div class="code"><code>${
    hljs.highlight(code, { language }).value
  }</code></div>`;
};
marked.setOptions({ renderer });

onMounted(() => {
  addLinkTarget();
});

const messageContentId = computed(() => `message_content-${uuid.value}`);

function content() {
  const parsed = marked.parse(message.value);
  const sanitized = DOMPurify.sanitize(parsed);

  return sanitized.replace(/^<p>/, "").replace(/<\/p>$/, "");
}

function addLinkTarget() {
  const contentElement = document.getElementById(messageContentId.value);
  if (contentElement) {
    contentElement.querySelectorAll("a").forEach((link) => {
      link.target = "_blanc";
    });
  }
}
</script>

<style>
span.code {
  padding: 8px;
  background-color: black;
  border-radius: 6px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
