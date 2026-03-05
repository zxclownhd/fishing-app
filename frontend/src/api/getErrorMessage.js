// src/api/getErrorMessage.js
export function getErrorMessage(err, fallback = "Something went wrong", t) {
  const data = err?.response?.data;

  const code = data?.error?.code || data?.code;
  const message = data?.error?.message || data?.message;
  const details = data?.error?.details || data?.details;

  // 1) If we have i18n and code - try translate by code
  if (t && code) {
    const key = `errors.${String(code)}`;
    const translated = t(key, "");
    if (translated) return translated;

    // optional: if you store codes under "apiErrors.CODE"
    // const alt = t(`apiErrors.${String(code)}`, "");
    // if (alt) return alt;
  }

  // 2) If backend provided structured field errors (recommended)
  // Example details:
  // details: { fields: { email: "required", password: "required" } }
  if (details?.fields && typeof details.fields === "object") {
    // take first field error and show it (simple UX)
    const firstKey = Object.keys(details.fields)[0];
    const fieldVal = details.fields[firstKey];

    // if i18n exists: errors.fields.<field>.<reason>
    if (t && firstKey) {
      const reason = String(fieldVal || "");
      const translatedField = t(`errors.fields.${firstKey}.${reason}`, "");
      if (translatedField) return translatedField;
    }

    // fallback for field errors if no translation
    if (firstKey) return `${firstKey}: ${String(fieldVal)}`;
  }

  // 3) If message exists (but DO NOT prefix with code)
  if (typeof message === "string" && message.trim()) return message;

  // 4) Backward compatibility (error is string)
  if (typeof data?.error === "string") return data.error;

  // 5) Generic JS error message
  if (typeof err?.message === "string" && err.message.trim()) return err.message;

  return fallback;
}