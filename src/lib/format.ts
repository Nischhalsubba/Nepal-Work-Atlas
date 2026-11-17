const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const percentFormatters = {
  1: new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
  2: new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
} as const;

export function formatInteger(value: number) {
  return integerFormatter.format(value);
}

export function formatPeople(value: number) {
  return `${formatInteger(value)} people`;
}

export function formatPercent(value: number, fractionDigits: 1 | 2 = 1) {
  return `${percentFormatters[fractionDigits].format(value)}%`;
}

export function formatNepalRupees(value: number | null) {
  return value === null ? "Unknown" : `Rs ${formatInteger(value)}`;
}

export function formatDate(value: string | null) {
  if (!value) return "Unknown";
  const parts = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(value);
  if (!parts) return value;

  const date = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(parts[1]) ||
    date.getUTCMonth() + 1 !== Number(parts[2]) ||
    date.getUTCDate() !== Number(parts[3])
  ) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
