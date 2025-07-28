<template>
  <span
    :class="{ message_content: true, full: isTyping }"
    v-html="content"
    :style="{
      wordBreak: 'break-word',
      gridColumn: '2 / 3',
    }"
    :id="messageContentId"
  />
</template>

<script setup lang="ts">
import { nextTick, toRefs, watch } from "vue";
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
import { ref } from "vue";

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

const content = computed(() => {
  const parsed = marked.parse(visibleMessage.value);
  const sanitized = DOMPurify.sanitize(parsed);
  return sanitized.replace(/^<p>/, "").replace(/<\/p>$/, "");
});

function addLinkTarget() {
  const contentElement = document.getElementById(messageContentId.value);
  if (contentElement) {
    contentElement.querySelectorAll("a").forEach((link) => {
      link.target = "_blanc";
    });
  }
}

const visibleMessage = ref(message.value);
const fullMessage = ref(message.value);

let typingInterval = null;
let isTyping = ref(false);

watch(message, (newVal) => {
  if (newVal.length < fullMessage.value.length) {
    return;
  }
  if (newVal === fullMessage.value) return;

  fullMessage.value = newVal;

  if (newVal.startsWith(visibleMessage.value)) {
    startTyping();
  } else {
    visibleMessage.value = newVal;
  }
});

watch(content, () => {
  nextTick(() => addLinkTarget());
});

function startTyping() {
  if (typingInterval) return;
  isTyping.value = true;

  typingInterval = setInterval(() => {
    if (visibleMessage.value === fullMessage.value) {
      clearInterval(typingInterval!);
      typingInterval = null;
      isTyping.value = false;

      return;
    }

    const nextChar = fullMessage.value[visibleMessage.value.length];
    if (nextChar) {
      visibleMessage.value += nextChar;
    }
  }, 18);
}
</script>

<style>
div.code {
  padding: 8px;
  border-radius: 6px;
  background-color: white;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

span.message_content h3,
h1,
h2,
p,
pre,
span {
  all: revert;
  transition: all 0.2s ease;
}

span.message_content.full {
  display: block;
  width: 650px !important;
  opacity: 0.8;
}
</style>
