export function getErrorMessage(err, fallback = "Something went wrong") {
  // axios style
  const data = err?.response?.data;

  if (data?.error?.message) return data.error.message;
  if (typeof data?.error === "string") return data.error; // backward compatibility
  if (err?.message) return err.message;

  return fallback;
}