// Helpers shared by the Mondoo order page and results block.

const domainPattern =
  /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export const isDomain = (value) => domainPattern.test(value);

// Accepts what people paste: URLs, mixed case, duplicates.
export function cleanDomains(values) {
  return [
    ...new Set(
      (values ?? [])
        .map((value) =>
          String(value)
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/[/?#].*$/, "")
        )
        .filter(Boolean)
    ),
  ];
}

export function periodLabel(seconds, t) {
  const day = 86400;

  if (!seconds) return "";
  if (seconds % (365 * day) === 0) return t("year", seconds / (365 * day));
  if (seconds % (30 * day) === 0) return t("month", seconds / (30 * day));
  return t("day", Math.round(seconds / day));
}

export const ratings = [
  { key: "CRITICAL", color: "#b71c1c" },
  { key: "HIGH", color: "#e65100" },
  { key: "MEDIUM", color: "#f9a825" },
  { key: "LOW", color: "#1565c0" },
  { key: "NONE", color: "#757575" },
];

export const ratingColor = (rating) =>
  ratings.find(({ key }) => key === rating)?.color ?? "#757575";

export const gradeColor = (grade) =>
  ({ A: "#2e7d32", B: "#689f38", C: "#f9a825", D: "#e65100", F: "#b71c1c" })[
    String(grade ?? "").charAt(0).toUpperCase()
  ] ?? "#757575";

// Mondoo dates come as RFC 3339 strings, the driver's own as unix seconds.
export function shortDate(value) {
  if (!value) return "-";
  const date = new Date(typeof value === "number" ? value * 1000 : value);

  return isNaN(date) ? "-" : date.toLocaleDateString();
}
