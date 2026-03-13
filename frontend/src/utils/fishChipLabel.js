export function toCompactFishChipLabel(label) {
  const raw = String(label || "").trim();
  if (!raw) return "";

  const parts = raw.split(/\s+/).filter(Boolean);
  if (!parts.length) return raw;
  if (parts.length === 1) return parts[0];

  // Cyrillic fish labels read naturally with the first word; Latin labels with the last.
  const hasCyrillic = /[\u0400-\u04FF\u0500-\u052F]/.test(raw);
  const compact = hasCyrillic ? parts[0] : parts[parts.length - 1];
  return capitalizeFirstLetter(compact);
}

function capitalizeFirstLetter(value) {
  const text = String(value || "");
  if (!text) return "";
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}
