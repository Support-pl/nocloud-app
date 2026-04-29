<template>
  <div
    v-if="
      legal &&
      (company.name ||
        company.address ||
        company.nip ||
        company.phone ||
        company.email)
    "
    class="company-footer"
  >
    <div class="company-footer__inner">
      <div class="company-footer__info">
        <span v-if="company.name" class="company-footer__name">{{
          company.name
        }}</span>
        <span v-if="company.address" class="company-footer__detail">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          {{ company.address }}
        </span>
        <span v-if="company.nip" class="company-footer__detail">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h6" />
          </svg>
          {{ company.nip }}
        </span>
        <a
          v-if="company.phone"
          :href="`tel:${company.phone}`"
          class="company-footer__detail company-footer__link"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.58 19a19.45 19.45 0 0 1-6-6A19.79 19.79 0 0 1 3.12 4.18 2 2 0 0 1 5.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
            />
          </svg>
          {{ company.phone }}
        </a>
        <a
          v-if="company.email"
          :href="`mailto:${company.email}`"
          class="company-footer__detail company-footer__link"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          {{ company.email }}
        </a>
      </div>

      <div v-if="docs.length" class="company-footer__docs">
        <a
          v-for="doc in docs"
          :key="doc.label"
          :href="doc.file"
          target="_blank"
          rel="noopener noreferrer"
          class="company-footer__doc-link"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {{ doc.label }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import appconfig from "@/appconfig.js";

const legal = computed(() => appconfig.legal);
const company = computed(() => legal.value?.company ?? {});
const docs = computed(() =>
  (legal.value?.documents ?? []).filter((d) => d.file),
);
</script>

<script>
export default { name: "CompanyFooter" };
</script>

<style scoped>
.company-footer {
  background-color: var(--bright_bg);
  padding: 12px 24px;
  background: var(--main);
  color: var(--gloomy_font);
}

.company-footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--gloomy_font);
}

.company-footer__info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 0;
  color: var(--gloomy_font);
  justify-content: center;
  width: 100%;
}

/* Bullet separator between info items */
.company-footer__info > * + *::before {
  content: "·";
  margin: 0 8px;
  opacity: 0.5;
}

.company-footer__name {
  font-weight: 700;
}

.company-footer__detail {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  text-decoration: none;
  white-space: nowrap;
}

.company-footer__detail svg {
  flex-shrink: 0;
  opacity: 0.6;
}

.company-footer__link {
  color: var(--gloomy_font);
  transition: opacity 0.15s;
}

.company-footer__link:hover {
  opacity: 0.75;
}

.company-footer__docs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 4px;
  width: 100%;
  justify-content: center;
}

.company-footer__doc-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  text-decoration: none;
  white-space: nowrap;
  color: var(--gloomy_font);
}

.company-footer__doc-link svg {
  flex-shrink: 0;
  opacity: 0.5;
}

.company-footer__doc-link:hover {
  text-decoration: underline;
  background-color: rgba(66, 124, 247, 0.05);
}

.company-footer__doc-link:hover svg {
  opacity: 1;
}

@media (max-width: 768px) {
  .company-footer {
    padding: 10px 12px;
  }

  .company-footer__inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .company-footer__docs {
    gap: 4px;
  }
}
</style>
