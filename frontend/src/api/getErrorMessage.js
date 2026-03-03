export function getErrorMessage(err, fallback = "Something went wrong") {
  const data = err?.response?.data;

  const code = data?.error?.code;
  const message = data?.error?.message;

  // New standardized format
  if (code && message) return `${code}: ${message}`;
  if (message) return message;

  // Backward compatibility
  if (typeof data?.error === "string") return data.error;

  // Generic
  if (err?.message) return err.message;

  return fallback;
}