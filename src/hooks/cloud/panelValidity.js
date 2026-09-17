import { watch } from "vue";
import { storeToRefs } from "pinia";
import { useCloudStore } from "@/stores/cloud.js";

// Panel validity is produced by running the form's own rules directly, not by
// awaiting validateFields(). That call raced with itself on every model mutation
// and threw before the form was mounted, and either outcome latched the panel as
// permanently invalid — which hides the order button with no visible field error
// to explain it. The form still renders per-field messages via its own triggers.
//
// activeRules() returns the rules that apply right now, since some fields are
// only rendered for logged in users and an unrendered field must not be checked.
function usePanelValidity(panel, activeRules, sources) {
  const { validationPanels } = storeToRefs(useCloudStore());
  let lastRun = 0;

  watch(
    sources,
    async () => {
      const run = ++lastRun;
      const results = await Promise.allSettled(
        Object.values(activeRules()).map((rule) => rule.validator()),
      );

      // a newer run started while this one was pending — its result wins
      if (run !== lastRun) return;

      validationPanels.value[panel] = results.some(
        ({ status }) => status === "rejected",
      );
    },
    { deep: true, immediate: true },
  );
}

export default usePanelValidity;
