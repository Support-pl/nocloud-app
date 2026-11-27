import { computed, ref } from "vue";
import { defineStore } from "pinia";
import api from "@/api.js";

/**
 * The account's AI API keys from the AI driver, revoked ones included, so a report or a transaction
 * can name the key a charge was made with. Loaded once; a driver without keys leaves it empty.
 */
export const useApiKeysStore = defineStore("apiKeys", () => {
  const byId = ref({});
  let loading = null;

  // Active keys first, newest first, then the revoked ones.
  const list = computed(() =>
    Object.values(byId.value).sort(
      (a, b) =>
        Number(Boolean(a.revoked)) - Number(Boolean(b.revoked)) ||
        (b.created ?? 0) - (a.created ?? 0)
    )
  );

  function fetch() {
    loading ??= api
      .get("/api/openai/keys?revoked=1")
      .then(({ keys = [] }) => {
        byId.value = Object.fromEntries(keys.map((key) => [key.id, key]));
      })
      .catch(() => {
        byId.value = {};
        loading = null;
      });
    return loading;
  }

  /** The key's name, or the id of a key this account cannot list (a member's, or one long gone). */
  function name(id, unknownLabel) {
    return byId.value[id]?.name ?? `${unknownLabel} (${id})`;
  }

  function isDeleted(id) {
    const key = byId.value[id];
    return !key || Boolean(key.revoked);
  }

  return { byId, list, fetch, name, isDeleted };
});
