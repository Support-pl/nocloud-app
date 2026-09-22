export function metaValue(meta, key) {
  if (!meta || !key) return undefined;
  const field = meta[key];
  if (field == null) return undefined;
  if (typeof field === "object" && field.kind) {
    return field.kind.value;
  }
  if (typeof field === "object" && "value" in field) {
    return field.value;
  }
  return field;
}

export function isHiddenReply(reply) {
  const mode = metaValue(reply?.meta, "mode");
  return (
    metaValue(reply?.meta, "hidden") === true ||
    mode === "stop" ||
    mode === "regenerate"
  );
}

export function publicTextModels(list = []) {
  return list.filter(
    (model) =>
      (model.types || []).includes("text") &&
      ["public"].includes(model.visibility) &&
      model.state?.state !== "broken" &&
      !model.disabled
  );
}

export function modelOutputPrice(model) {
  return model?.billing?.tokens?.text_output?.price?.amount || 0;
}

export function pickCheaperModel(list = []) {
  const models = publicTextModels(list);
  if (!models.length) return "";
  return [...models].sort((a, b) => modelOutputPrice(a) - modelOutputPrice(b))[0]
    ?.key;
}

export function pickSmarterModel(list = []) {
  const models = publicTextModels(list);
  if (!models.length) return "";
  return [...models].sort((a, b) => modelOutputPrice(b) - modelOutputPrice(a))[0]
    ?.key;
}

export function buildMessageMeta(options = {}, extra = []) {
  const meta = [{ key: "mode", value: options.checked || "default" }];

  if (options.checked === "generate") {
    meta.push(
      { key: "size", value: options.size },
      { key: "quality", value: options.quality }
    );
  }

  if (options.checked === "video") {
    meta.push(
      { key: "duration", value: options.duration },
      { key: "with_audio", value: options.with_audio },
      { key: "aspect_ratio", value: options.aspect_ratio }
    );
  }

  if (options.checked && options.checked !== "default" && options.model) {
    meta.push({ key: "model", value: options.model });
  }

  extra.forEach((item) => {
    const index = meta.findIndex((entry) => entry.key === item.key);
    if (index >= 0) meta[index] = item;
    else meta.push(item);
  });

  return meta.filter((item) => item.value !== undefined && item.value !== null);
}

export function formatTokens(value) {
  const tokens = Number(value || 0);
  if (!tokens) return "";
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}k`;
  }
  return String(Math.round(tokens));
}
