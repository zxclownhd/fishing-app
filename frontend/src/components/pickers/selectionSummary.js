export function formatSelectionSummary(items, formatItem, maxVisible = 2) {
  const selected = Array.isArray(items) ? items : [];
  if (!selected.length) return "";

  const visible = selected.slice(0, maxVisible).map((item) => formatItem(item));
  const hiddenCount = selected.length - visible.length;

  if (hiddenCount <= 0) {
    return visible.join(", ");
  }

  return `${visible.join(", ")} +${hiddenCount}`;
}
